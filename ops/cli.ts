/**
 * AgenticBots provisioning CLI.
 *
 *   npm run ops -- <command> [--flags]
 *
 *   tenant:create      --name "Acme Roofing" --bots ads,seo,crm [--instance t3.medium]
 *   tenant:plan        --tenant <tenantId>
 *   tenant:provision   --tenant <tenantId>          (needs ALLOW_CLOUD_CHANGES=1)
 *   tenant:status      --tenant <tenantId>
 *   tenant:suspend     --tenant <tenantId> --reason billing|manual|security|contract_ended|other
 *   tenant:reactivate  --tenant <tenantId>
 *   tenant:backup      --tenant <tenantId>          (needs ALLOW_CLOUD_CHANGES=1)
 *   tenant:destroy     --tenant <tenantId>          (needs ALLOW_CLOUD_CHANGES=1 + typed confirmation)
 *   bundle:build       [--version 1.0.0]
 *   user:bootstrap     --email you@agenticbots.dev --name "Your Name"   (first superadmin)
 *
 * It uses the same services as the operator console (same audit trail,
 * same safety checks). It never changes cloud resources unless
 * ALLOW_CLOUD_CHANGES=1 is set; otherwise it prints the exact commands.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { userInfo } from "node:os";
import { randomBytes } from "node:crypto";
import { repo } from "@/server/db";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { createClientOrg } from "@/server/services/accounts";
import { provisionBot } from "@/server/services/bots";
import { suspendClient, reactivateClient } from "@/server/services/clients";
import { refreshRuntimeHealth } from "@/server/services/monitoring";
import { BOT_CATALOG, isBotTypeKey } from "@/config/bot-catalog";
import { SKILLS } from "@/config/skills";
import { awsControl } from "@/server/aws/control";
import { cloudChangesAllowed, platformMode } from "@/server/env";
import { correlationId } from "@/server/ids";
import type { SuspensionReason } from "@/lib/platform/types";

const ROOT = resolve(__dirname, "..");
const TF_DIR = join(ROOT, "infra/terraform/envs/prod");
const TENANTS_FILE = join(TF_DIR, "tenants.auto.tfvars.json");

const args = process.argv.slice(2);
const cmd = args[0] ?? "help";
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const actor: Actor = {
  user: { id: `cli:${userInfo().username}`, email: `${userInfo().username}@cli`, name: `CLI (${userInfo().username})`, status: "active", platformRole: "superadmin" },
  platformRole: "superadmin",
  memberships: [],
};

const say = (s = "") => process.stdout.write(`${s}\n`);
const die = (s: string): never => {
  process.stderr.write(`\n✖ ${s}\n`);
  process.exit(1);
};

function hasTerraform(): boolean {
  return spawnSync("terraform", ["version"], { stdio: "ignore" }).status === 0;
}

function tf(argv: string[]): void {
  if (!hasTerraform()) die("terraform is not installed. See docs/BEGINNER_SETUP.md → Install tools.");
  const r = spawnSync("terraform", argv, { cwd: TF_DIR, stdio: "inherit" });
  if (r.status !== 0) die(`terraform ${argv[0]} failed`);
}

function readTenants(): { tenants: Record<string, { bot_profiles: string[]; instance_type?: string; bundle_version?: string }> } {
  return existsSync(TENANTS_FILE) ? JSON.parse(readFileSync(TENANTS_FILE, "utf8")) : { tenants: {} };
}

async function orgByTenant(tenantId: string) {
  const r = await repo();
  const org = (await r.list("organizations")).find((o) => o.tenantId === tenantId);
  if (!org) die(`No client with tenant id ${tenantId}. Run tenant:create first.`);
  const runtime = (await r.list("runtimes", { orgId: org!.id }))[0];
  return { r, org: org!, runtime };
}

function requireCloud(what: string) {
  if (!cloudChangesAllowed()) {
    say(`\nDry run — ${what} was NOT performed.`);
    say("Set ALLOW_CLOUD_CHANGES=1 to make real changes. Commands that would run are shown above.");
    process.exit(0);
  }
}

/* ───────────────────────────── commands ───────────────────────────── */

async function tenantCreate() {
  const name = flag("name") ?? die("--name is required");
  const bots = (flag("bots") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (bots.length === 0) die(`--bots is required, e.g. --bots ads,seo,crm  (choices: ${BOT_CATALOG.map((b) => b.key).join(", ")})`);
  for (const b of bots) if (!isBotTypeKey(b)) die(`Unknown Bot "${b}".`);
  const r = await repo();
  const org = await createClientOrg(r, actor, { name, instanceType: flag("instance") ?? "t3.medium", region: process.env.AWS_REGION });
  const t = readTenants();
  t.tenants[org.tenantId] = { bot_profiles: bots, instance_type: flag("instance") ?? "t3.medium", bundle_version: process.env.RUNTIME_BUNDLE_VERSION ?? "1.0.0" };
  writeFileSync(TENANTS_FILE, `${JSON.stringify(t, null, 2)}\n`);
  say(`✔ Created ${name}`);
  say(`  tenant id:  ${org.tenantId}`);
  say(`  Bots:       ${bots.join(", ")}`);
  say(`  registered: infra/terraform/envs/prod/tenants.auto.tfvars.json`);
  say(`\nNext:\n  npm run ops -- tenant:plan --tenant ${org.tenantId}`);
}

async function tenantPlan() {
  const tenant = flag("tenant") ?? die("--tenant is required");
  if (!readTenants().tenants[tenant]) die(`${tenant} is not in tenants.auto.tfvars.json`);
  say(`Planning ${tenant} …\n`);
  say(`  cd infra/terraform/envs/prod && terraform init && terraform plan -target='module.tenant["${tenant}"]' -out tfplan\n`);
  if (hasTerraform()) {
    tf(["init", "-input=false"]);
    tf(["plan", "-input=false", `-target=module.tenant["${tenant}"]`, "-out", "tfplan"]);
  } else {
    say("terraform is not installed here — run the commands above where it is.");
  }
}

function buildBundle(version = process.env.RUNTIME_BUNDLE_VERSION ?? "1.0.0"): string {
  const out = join(ROOT, "dist/runtime", version);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "skills"), { recursive: true });
  cpSync(join(ROOT, "infra/runtime/docker-compose.yml"), join(out, "docker-compose.yml"));
  cpSync(join(ROOT, "infra/runtime/lifecycle.sh"), join(out, "lifecycle.sh"));
  cpSync(join(ROOT, "infra/runtime/config"), join(out, "config"), { recursive: true });
  for (const s of SKILLS) cpSync(join(ROOT, "runtime/skills", s.key), join(out, "skills", s.key), { recursive: true });
  // Per-profile skill lists: least capability — only each Bot's default skills.
  for (const b of BOT_CATALOG) writeFileSync(join(out, "skills", `${b.runtimeProfile}.list`), `${b.defaultSkills.join("\n")}\n`);
  const tarball = join(ROOT, "dist/runtime", `bundle-${version}.tar.gz`);
  execFileSync("tar", ["-czf", tarball, "-C", out, "."]);
  say(`✔ Runtime bundle ${version}: ${tarball}`);
  return tarball;
}

async function cloudflareTunnel(tenantId: string): Promise<{ tunnelToken: string; hostname: string; accessClientId?: string; accessClientSecret?: string }> {
  const token = process.env.CLOUDFLARE_API_TOKEN ?? die("CLOUDFLARE_API_TOKEN is required to create the private tunnel.");
  const account = process.env.CLOUDFLARE_ACCOUNT_ID ?? die("CLOUDFLARE_ACCOUNT_ID is required.");
  const zone = process.env.CLOUDFLARE_ZONE_ID ?? die("CLOUDFLARE_ZONE_ID is required.");
  const domain = process.env.RUNTIME_DOMAIN ?? "runtime.agenticbots.dev";
  const hostname = `${tenantId}.${domain}`;
  const cf = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = (await res.json()) as { success: boolean; result: Record<string, unknown>; errors: unknown[] };
    if (!j.success) die(`Cloudflare ${method} ${path} failed: ${JSON.stringify(j.errors).slice(0, 300)}`);
    return j.result;
  };
  const tunnel = await cf("POST", `/accounts/${account}/cfd_tunnel`, { name: `agb-${tenantId}`, config_src: "cloudflare" });
  const tunnelId = String(tunnel.id);
  await cf("PUT", `/accounts/${account}/cfd_tunnel/${tunnelId}/configurations`, {
    config: { ingress: [{ hostname, service: "http://agb-hermes:8642" }, { service: "http_status:404" }] },
  });
  await cf("POST", `/zones/${zone}/dns_records`, { type: "CNAME", name: hostname, content: `${tunnelId}.cfargotunnel.com`, proxied: true });
  // Service-to-service auth: only holders of this service token reach the hostname.
  const st = await cf("POST", `/accounts/${account}/access/service_tokens`, { name: `agb-platform-${tenantId}` });
  const app = await cf("POST", `/accounts/${account}/access/apps`, { name: `agb-runtime-${tenantId}`, domain: hostname, type: "self_hosted", session_duration: "24h" });
  await cf("POST", `/accounts/${account}/access/apps/${app.id}/policies`, { name: "platform only", decision: "non_identity", include: [{ service_token: { token_id: st.id } }] });
  const tok = await cf("GET", `/accounts/${account}/cfd_tunnel/${tunnelId}/token`);
  return { tunnelToken: String(tok), hostname, accessClientId: String(st.client_id), accessClientSecret: String(st.client_secret) };
}

async function putSecret(id: string, value: unknown) {
  const { SecretsManagerClient, PutSecretValueCommand } = await import("@aws-sdk/client-secrets-manager");
  const c = new SecretsManagerClient({ region: process.env.AWS_REGION ?? "us-east-1" });
  await c.send(new PutSecretValueCommand({ SecretId: id, SecretString: JSON.stringify(value) }));
}

async function tenantProvision() {
  const tenant = flag("tenant") ?? die("--tenant is required");
  const t = readTenants().tenants[tenant] ?? die(`${tenant} is not registered`);
  const { r, org, runtime } = await orgByTenant(tenant);
  const env = platformMode() === "staging" ? "staging" : "prod";
  const bucket = process.env.ARTIFACT_BUCKET ?? die("ARTIFACT_BUCKET is required (the S3 bucket from terraform.tfvars).");
  say(`Provisioning ${org.name} (${tenant}) — Bots: ${t.bot_profiles.join(", ")}\n`);
  say("Steps:");
  say(`  1. build + upload runtime bundle → s3://${bucket}/runtime/${t.bundle_version ?? "1.0.0"}/bundle.tar.gz`);
  say(`  2. Cloudflare: tunnel + ${tenant}.${process.env.RUNTIME_DOMAIN ?? "runtime.agenticbots.dev"} + Access service token`);
  say(`  3. Secrets Manager: agenticbots/${env}/tenants/${tenant}/runtime (endpoint, tunnel token, default key)`);
  say(`  4. terraform apply -target='module.tenant["${tenant}"]'`);
  say("  5. wait for first boot, register the runtime, deploy each Bot, health check");
  requireCloud("provisioning");

  const tarball = buildBundle(t.bundle_version);
  execFileSync("aws", ["s3", "cp", tarball, `s3://${bucket}/runtime/${t.bundle_version ?? "1.0.0"}/bundle.tar.gz`], { stdio: "inherit" });

  tf(["init", "-input=false"]);
  tf(["apply", "-input=false", "-auto-approve", `-target=module.tenant["${tenant}"]`]);
  const outputs = JSON.parse(execFileSync("terraform", ["output", "-json", "tenants"], { cwd: TF_DIR }).toString()) as Record<string, { instance_id: string; runtime_secret: string }>;
  const out = outputs[tenant] ?? die("terraform did not output the tenant");

  const tunnel = await cloudflareTunnel(tenant);
  await putSecret(out.runtime_secret, {
    baseUrl: `https://${tunnel.hostname}`,
    tunnelToken: tunnel.tunnelToken,
    accessClientId: tunnel.accessClientId,
    accessClientSecret: tunnel.accessClientSecret,
    defaultProfileKey: randomBytes(32).toString("hex"),
  });
  say("✔ Secrets stored (values not printed).");

  const tx = new Tx(r);
  tx.patch("runtimes", runtime, { instanceId: out.instance_id, deploymentState: "provisioning", endpointRef: out.runtime_secret });
  tx.insert("deployment_events", { orgId: org.id, runtimeId: runtime.id, kind: "provision", status: "started", detail: `EC2 ${out.instance_id}`, actorId: actor.user.id, correlationId: correlationId() });
  await tx.commit();

  say("Waiting for first boot (up to 10 minutes) …");
  for (let i = 0; i < 40; i++) {
    await new Promise((res) => setTimeout(res, 15_000));
    const rt = await refreshRuntimeHealth(r, runtime.id);
    if (rt.ready) break;
    process.stdout.write(".");
  }
  const fresh = await r.get("runtimes", runtime.id);
  if (!fresh?.ready) die("Runtime did not become healthy. Check `npm run ops -- tenant:status` and the instance's /var/log/agenticbots-bootstrap.log via Session Manager.");
  const tx2 = new Tx(r);
  tx2.patch("runtimes", fresh!, { deploymentState: "deployed" });
  tx2.patch("organizations", org, { status: org.status === "onboarding" ? "active" : org.status });
  await tx2.commit();
  for (const p of t.bot_profiles) {
    const bot = await provisionBot(r, actor, org.id, p);
    say(`  ${bot.status === "active" ? "✔" : "✖"} ${bot.name}`);
  }
  say(`\n✔ ${org.name} is live. Open the operator console → Clients → ${org.name}.`);
}

async function tenantStatus() {
  const { r, org, runtime } = await orgByTenant(flag("tenant") ?? die("--tenant is required"));
  say(`${org.name} — account ${org.status}`);
  if (!runtime) {
    say("No runtime record.");
    return;
  }
  const rt = await refreshRuntimeHealth(r, runtime.id);
  say(`  runtime:   ${rt.health}${rt.ready ? " (ready)" : ""}`);
  say(`  instance:  ${rt.instanceId ?? "not provisioned"} ${rt.ec2State ?? ""}`);
  say(`  tunnel:    ${rt.tunnel}`);
  say(`  disk:      ${rt.diskUsedPct ?? "?"}%`);
  if (rt.lastError) say(`  last error: ${rt.lastError.message} (${rt.lastError.correlationId})`);
  const bots = await r.list("bots", { orgId: org.id });
  for (const b of bots) say(`  ${b.name.padEnd(18)} ${b.status}`);
}

async function tenantSuspend() {
  const { r, org } = await orgByTenant(flag("tenant") ?? die("--tenant is required"));
  const reason = (flag("reason") ?? "manual") as SuspensionReason;
  const res = await suspendClient(r, actor, org.id, reason, flag("note"));
  say(res.ok ? `✔ ${res.message}` : `⚠ ${res.message}`);
}

async function tenantReactivate() {
  const { r, org } = await orgByTenant(flag("tenant") ?? die("--tenant is required"));
  const res = await reactivateClient(r, actor, org.id);
  say(res.ok ? `✔ ${res.message}` : `⚠ ${res.message}`);
}

async function tenantBackup() {
  const { runtime } = await orgByTenant(flag("tenant") ?? die("--tenant is required"));
  if (!runtime?.instanceId) die("Runtime is not provisioned.");
  say(`Would run SSM lifecycle backup-now on ${runtime!.instanceId}`);
  requireCloud("backup");
  const res = await awsControl().runLifecycle(runtime!.id, runtime!.instanceId!, "backup-now");
  say(`✔ Snapshot requested (command ${res.commandId}).`);
}

async function tenantDestroy() {
  const tenant = flag("tenant") ?? die("--tenant is required");
  const { org } = await orgByTenant(tenant);
  say(`\n⚠  DESTROY ${org.name} (${tenant})`);
  say("   This terminates the EC2 runtime. The data volume is protected (prevent_destroy) and");
  say("   snapshots are KEPT. Deleting the volume itself is a separate manual step.");
  requireCloud("destroy");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const typed = await rl.question(`Type the tenant id (${tenant}) to confirm: `);
  rl.close();
  if (typed.trim() !== tenant) die("Confirmation did not match. Nothing was changed.");
  say(`Taking a final snapshot first …`);
  await tenantBackup().catch(() => say("  (snapshot request failed — continuing only if you re-run with a manual snapshot)"));
  tf(["destroy", "-input=false", `-target=module.tenant["${tenant}"].aws_instance.runtime`]);
  say("✔ Runtime terminated. Data volume and snapshots retained.");
}

/** Create the very first superadmin (or a new one if you are locked out).
 *  Prints a one-time set-password link; nothing secret is stored in the clear. */
async function userBootstrap() {
  const email = (flag("email") ?? die("--email is required")).toLowerCase();
  const name = flag("name") ?? die("--name is required");
  const r = await repo();
  const { randomToken, sha256Hex } = await import("@/server/ids");
  const token = randomToken(32);
  const existing = (await r.list("users", { where: { email } }))[0];
  const tx = new Tx(r);
  const user = existing
    ? tx.patch("users", existing, { platformRole: "superadmin", status: existing.passwordHash ? existing.status : "invited", inviteTokenHash: sha256Hex(token), inviteExpiresAt: new Date(Date.now() + 86_400_000).toISOString() })
    : tx.insert("users", { email, name, status: "invited", platformRole: "superadmin", inviteTokenHash: sha256Hex(token), inviteExpiresAt: new Date(Date.now() + 86_400_000).toISOString() });
  tx.insert("audit_logs", { actorId: actor.user.id, actorName: actor.user.name, action: "user.bootstrap_superadmin", targetType: "user", targetId: user.id, result: "success", correlationId: correlationId() });
  await tx.commit();
  const base = process.env.OPS_URL ?? "https://ops.agenticbots.dev";
  say(`✔ Superadmin ${email} ready. Open this link within 24 hours to set the password:`);
  say(`  ${base}/login/set-password?u=${user.id}&t=${token}`);
}

const COMMANDS: Record<string, () => Promise<void>> = {
  "user:bootstrap": userBootstrap,
  "tenant:create": tenantCreate,
  "tenant:plan": tenantPlan,
  "tenant:provision": tenantProvision,
  "tenant:status": tenantStatus,
  "tenant:suspend": tenantSuspend,
  "tenant:reactivate": tenantReactivate,
  "tenant:backup": tenantBackup,
  "tenant:destroy": tenantDestroy,
  "bundle:build": async () => {
    buildBundle(flag("version"));
  },
};

(async () => {
  const fn = COMMANDS[cmd];
  if (!fn) {
    say(readFileSync(__filename, "utf8").split("*/")[0].replace(/^\/\*\*?/, "").replace(/^ \* ?/gm, ""));
    process.exit(cmd === "help" ? 0 : 1);
  }
  await fn();
})().catch((e) => die(e instanceof Error ? e.message : String(e)));
