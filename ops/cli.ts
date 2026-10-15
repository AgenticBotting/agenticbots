/**
 * AgenticBots provisioning CLI.
 *
 *   npm run ops -- <command> [--flags]            (production)
 *   npm run ops:staging -- <command> [--flags]    (staging: loads .env.staging)
 *
 *   staging:check      verify every setting the staging test needs (read-only)
 *   env:apply          create the shared environment infrastructure      (needs ALLOW_CLOUD_CHANGES=1)
 *   provider:add       --provider openrouter --model anthropic/claude-sonnet-4.6
 *   tenant:create      --name "Acme Roofing" --bots ads,seo,crm [--instance t3.medium] [--data-gb 100]
 *   tenant:plan        --tenant <tenantId>
 *   tenant:provision   --tenant <tenantId> [--provider openrouter]   (needs ALLOW_CLOUD_CHANGES=1)
 *   tenant:set-provider-key --tenant <tenantId> --provider openrouter (needs ALLOW_CLOUD_CHANGES=1)
 *   tenant:status      --tenant <tenantId>
 *   tenant:suspend     --tenant <tenantId> --reason billing|manual|security|contract_ended|other
 *   tenant:reactivate  --tenant <tenantId>
 *   tenant:backup      --tenant <tenantId>          (needs ALLOW_CLOUD_CHANGES=1)
 *   tenant:destroy     --tenant <tenantId>          (needs ALLOW_CLOUD_CHANGES=1 + typed confirmation)
 *   run:test           --tenant <tenantId> --bot seo [--task "…"]   (one real Bot Run, end to end)
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
import { startRun, syncRun } from "@/server/services/runs";
import { BOT_CATALOG, isBotTypeKey } from "@/config/bot-catalog";
import { SKILLS } from "@/config/skills";
import { awsControl } from "@/server/aws/control";
import { cloudChangesAllowed, platformMode } from "@/server/env";
import { correlationId } from "@/server/ids";
import type { SuspensionReason } from "@/lib/platform/types";
import { TERMINAL_RUN_STATUSES } from "@/lib/platform/types";

const ROOT = resolve(__dirname, "..");
/** staging or prod — picked by PLATFORM_ENV (see .env.staging.example). */
const tfEnv = (): "staging" | "prod" => (platformMode() === "staging" ? "staging" : "prod");
const tfDir = () => join(ROOT, "infra/terraform/envs", tfEnv());
const tenantsFile = () => join(tfDir(), "tenants.auto.tfvars.json");
const tfTarget = (tenant: string, resource = "") => `module.stack.module.tenant["${tenant}"]${resource ? `.${resource}` : ""}`;

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

/** terraform, or OpenTofu if that is what is installed. */
function tfBin(): string | null {
  for (const bin of [process.env.TERRAFORM_BIN, "terraform", "tofu"].filter(Boolean) as string[]) {
    if (spawnSync(bin, ["version"], { stdio: "ignore" }).status === 0) return bin;
  }
  return null;
}
const hasTerraform = () => tfBin() !== null;

function tf(argv: string[]): void {
  const bin = tfBin() ?? die("terraform is not installed. See docs/runbooks/FIRST_STAGING_TEST.md → Install tools.");
  const r = spawnSync(bin, argv, { cwd: tfDir(), stdio: "inherit" });
  if (r.status !== 0) die(`terraform ${argv[0]} failed`);
}

function tfOutput<T>(name: string): T {
  const bin = tfBin() ?? die("terraform is not installed.");
  return JSON.parse(execFileSync(bin, ["output", "-json", name], { cwd: tfDir() }).toString()) as T;
}

function readTenants(): { tenants: Record<string, { bot_profiles: string[]; instance_type?: string; data_volume_gb?: number; bundle_version?: string }> } {
  return existsSync(tenantsFile()) ? JSON.parse(readFileSync(tenantsFile(), "utf8")) : { tenants: {} };
}

/** Commands that touch real infrastructure or the real database refuse demo mode. */
function requireLiveMode() {
  if (platformMode() === "demo") die("DEMO_MODE is on. Use `npm run ops:staging -- …` (loads .env.staging) or set DEMO_MODE=false.");
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
  requireLiveMode();
  const r = await repo();
  const org = await createClientOrg(r, actor, { name, instanceType: flag("instance") ?? "t3.medium", region: process.env.AWS_REGION });
  const t = readTenants();
  // Staging runtimes get a small data volume; production clients 100 GB.
  const dataGb = Number(flag("data-gb") ?? (tfEnv() === "staging" ? 20 : 100));
  t.tenants[org.tenantId] = { bot_profiles: bots, instance_type: flag("instance") ?? "t3.medium", data_volume_gb: dataGb, bundle_version: process.env.RUNTIME_BUNDLE_VERSION ?? "1.0.0" };
  writeFileSync(tenantsFile(), `${JSON.stringify(t, null, 2)}\n`);
  say(`✔ Created ${name} (${tfEnv()})`);
  say(`  tenant id:  ${org.tenantId}`);
  say(`  Bots:       ${bots.join(", ")}`);
  say(`  registered: infra/terraform/envs/${tfEnv()}/tenants.auto.tfvars.json`);
  say(`\nNext:\n  npm run ${opsScript()} -- tenant:plan --tenant ${org.tenantId}`);
}

async function tenantPlan() {
  const tenant = flag("tenant") ?? die("--tenant is required");
  if (!readTenants().tenants[tenant]) die(`${tenant} is not in tenants.auto.tfvars.json`);
  say(`Planning ${tenant} (${tfEnv()}) …\n`);
  say(`  cd infra/terraform/envs/${tfEnv()} && terraform init && terraform plan -out tfplan\n`);
  if (hasTerraform()) {
    tf(["init", "-input=false"]);
    // Whole environment: the first time this also shows the shared pieces
    // (network, role, document, backups, bucket) that the tenant needs.
    tf(["plan", "-input=false", "-out", "tfplan"]);
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
  cpSync(join(ROOT, "infra/runtime/network-guard.sh"), join(out, "network-guard.sh"));
  cpSync(join(ROOT, "infra/runtime/config"), join(out, "config"), { recursive: true });
  for (const s of SKILLS) cpSync(join(ROOT, "runtime/skills", s.key), join(out, "skills", s.key), { recursive: true });
  // Per-profile skill lists: least capability — only each Bot's default skills.
  for (const b of BOT_CATALOG) writeFileSync(join(out, "skills", `${b.runtimeProfile}.list`), `${b.defaultSkills.join("\n")}\n`);
  const tarball = join(ROOT, "dist/runtime", `bundle-${version}.tar.gz`);
  execFileSync("tar", ["-czf", tarball, "-C", out, "."]);
  say(`✔ Runtime bundle ${version}: ${tarball}`);
  return tarball;
}

const opsScript = () => (tfEnv() === "staging" ? "ops:staging" : "ops");

/** Env var name the engine reads for each model provider's key. */
const PROVIDER_KEY_ENV: Record<string, string> = {
  openrouter: "OPENROUTER_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  "ai-gateway": "AI_GATEWAY_API_KEY",
};

async function cloudflareTunnel(tenantId: string): Promise<{ tunnelToken: string; hostname: string; accessClientId: string; accessClientSecret: string }> {
  const token = process.env.CLOUDFLARE_API_TOKEN ?? die("CLOUDFLARE_API_TOKEN is required to create the private tunnel.");
  const account = process.env.CLOUDFLARE_ACCOUNT_ID ?? die("CLOUDFLARE_ACCOUNT_ID is required.");
  const zone = process.env.CLOUDFLARE_ZONE_ID ?? die("CLOUDFLARE_ZONE_ID is required.");
  const domain = process.env.RUNTIME_DOMAIN ?? die("RUNTIME_DOMAIN is required: your Cloudflare zone, e.g. agenticbots-runtime.com.");
  const hostname = `${tenantId}.${domain}`;
  const cf = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = (await res.json()) as { success: boolean; result: unknown; errors: unknown[] };
    if (!j.success) die(`Cloudflare ${method} ${path.split("?")[0]} failed: ${JSON.stringify(j.errors).slice(0, 300)}`);
    return j.result as Record<string, unknown> & Record<string, unknown>[];
  };
  const name = `agb-${tfEnv()}-${tenantId}`;
  // Re-runnable: reuse what an earlier, interrupted run already created.
  const existingTunnels = (await cf("GET", `/accounts/${account}/cfd_tunnel?name=${encodeURIComponent(name)}&is_deleted=false`)) as unknown as Record<string, unknown>[];
  const tunnelId = String(existingTunnels[0]?.id ?? (await cf("POST", `/accounts/${account}/cfd_tunnel`, { name, config_src: "cloudflare" })).id);
  say(`  tunnel ${existingTunnels[0] ? "reused" : "created"}: ${name}`);
  await cf("PUT", `/accounts/${account}/cfd_tunnel/${tunnelId}/configurations`, {
    config: { ingress: [{ hostname, service: "http://agb-hermes:8642" }, { service: "http_status:404" }] },
  });
  const records = (await cf("GET", `/zones/${zone}/dns_records?type=CNAME&name=${encodeURIComponent(hostname)}`)) as unknown as Record<string, unknown>[];
  const dns = { type: "CNAME", name: hostname, content: `${tunnelId}.cfargotunnel.com`, proxied: true };
  if (records[0]) await cf("PUT", `/zones/${zone}/dns_records/${records[0].id}`, dns);
  else await cf("POST", `/zones/${zone}/dns_records`, dns);
  // Service-to-service auth: only holders of this service token reach the hostname.
  // A service token's secret is only shown once, so always mint a fresh one.
  const st = await cf("POST", `/accounts/${account}/access/service_tokens`, { name: `${name}-${Date.now().toString(36)}` });
  const apps = (await cf("GET", `/accounts/${account}/access/apps?domain=${encodeURIComponent(hostname)}`)) as unknown as Record<string, unknown>[];
  const app = apps.find((a) => a.domain === hostname) ?? (await cf("POST", `/accounts/${account}/access/apps`, { name: `${name}`, domain: hostname, type: "self_hosted", session_duration: "24h" }));
  await cf("POST", `/accounts/${account}/access/apps/${app.id}/policies`, { name: `platform only ${Date.now().toString(36)}`, decision: "non_identity", include: [{ service_token: { token_id: st.id } }] });
  const tok = await cf("GET", `/accounts/${account}/cfd_tunnel/${tunnelId}/token`);
  return { tunnelToken: String(tok), hostname, accessClientId: String(st.client_id), accessClientSecret: String(st.client_secret) };
}

async function secretsClient() {
  const sm = await import("@aws-sdk/client-secrets-manager");
  return { sm, c: new sm.SecretsManagerClient({ region: process.env.AWS_REGION ?? "us-east-2" }) };
}

async function putSecret(id: string, value: unknown) {
  const { sm, c } = await secretsClient();
  await c.send(new sm.PutSecretValueCommand({ SecretId: id, SecretString: JSON.stringify(value) }));
}

/** Current JSON value of a secret, or null if it has no value yet. */
async function readSecret<T>(id: string): Promise<T | null> {
  const { sm, c } = await secretsClient();
  try {
    const out = await c.send(new sm.GetSecretValueCommand({ SecretId: id }));
    return JSON.parse(out.SecretString ?? "null") as T;
  } catch (e) {
    if ((e as { name?: string }).name === "ResourceNotFoundException") return null;
    throw e;
  }
}

/** Ask for a value without echoing it to the terminal. */
async function askHidden(prompt: string): Promise<string> {
  if (process.env.PROVIDER_API_KEY) return process.env.PROVIDER_API_KEY;
  if (!process.stdin.isTTY) die("Run this in a terminal (or set PROVIDER_API_KEY for this one command).");
  process.stdout.write(prompt);
  spawnSync("stty", ["-echo"], { stdio: "inherit" });
  const rl = createInterface({ input: process.stdin });
  const value = await new Promise<string>((res) => rl.once("line", res));
  rl.close();
  spawnSync("stty", ["echo"], { stdio: "inherit" });
  process.stdout.write("\n");
  return value.trim();
}

async function storeProviderKey(prefix: string, provider: string) {
  const envName = flag("env-name") ?? PROVIDER_KEY_ENV[provider] ?? die(`Unknown provider "${provider}". Pass --env-name <ENV_VAR_THE_ENGINE_READS>.`);
  const key = await askHidden(`Paste the ${provider} API key (input hidden): `);
  if (key.length < 16) die("That does not look like an API key.");
  const id = `${prefix}/providers`;
  const current = (await readSecret<Record<string, string>>(id)) ?? {};
  await putSecret(id, { ...current, [envName]: key });
  say(`✔ ${envName} stored in Secrets Manager (${id}). Value not printed.`);
}

async function tenantProvision() {
  requireLiveMode();
  const tenant = flag("tenant") ?? die("--tenant is required");
  const t = readTenants().tenants[tenant] ?? die(`${tenant} is not registered in infra/terraform/envs/${tfEnv()}`);
  const { r, org, runtime } = await orgByTenant(tenant);
  const env = tfEnv();
  const bucket = process.env.ARTIFACT_BUCKET ?? die("ARTIFACT_BUCKET is required (the S3 bucket from terraform.tfvars).");
  const version = t.bundle_version ?? "1.0.0";
  const provider = flag("provider") ?? "openrouter";
  const prefix = `agenticbots/${env}/tenants/${tenant}`;
  say(`Provisioning ${org.name} (${tenant}) on ${env} — Bots: ${t.bot_profiles.join(", ")}\n`);
  say("Steps:");
  say(`  1. build + upload runtime bundle → s3://${bucket}/runtime/${version}/bundle.tar.gz`);
  say(`  2. terraform apply (phase 1): this client's KMS key + Secrets Manager entries`);
  say(`  3. Cloudflare: tunnel + ${tenant}.${process.env.RUNTIME_DOMAIN ?? "<RUNTIME_DOMAIN>"} + Access service token`);
  say(`  4. Secrets Manager: ${prefix}/runtime (endpoint, tunnel token, default key) and /providers (${provider} key — you will be asked)`);
  say(`  5. terraform apply (phase 2): the EC2 runtime, data volume, alarms`);
  say("  6. wait for first boot, register the runtime, deploy each Bot, health check");
  requireCloud("provisioning");

  const tarball = buildBundle(version);
  execFileSync("aws", ["s3", "cp", tarball, `s3://${bucket}/runtime/${version}/bundle.tar.gz`], { stdio: "inherit" });

  tf(["init", "-input=false"]);
  // Phase 1: secrets exist and are filled in BEFORE the instance boots, so
  // first boot never races the control plane.
  tf(["apply", "-input=false", "-auto-approve", `-target=${tfTarget(tenant, "aws_secretsmanager_secret.runtime")}`, `-target=${tfTarget(tenant, "aws_secretsmanager_secret.provider")}`]);

  const existing = await readSecret<{ baseUrl?: string; tunnelToken?: string; defaultProfileKey?: string }>(`${prefix}/runtime`);
  if (existing?.baseUrl && existing.tunnelToken && existing.defaultProfileKey) {
    say("✔ Runtime connection secret already present — keeping it.");
  } else {
    const tunnel = await cloudflareTunnel(tenant);
    await putSecret(`${prefix}/runtime`, {
      baseUrl: `https://${tunnel.hostname}`,
      tunnelToken: tunnel.tunnelToken,
      accessClientId: tunnel.accessClientId,
      accessClientSecret: tunnel.accessClientSecret,
      defaultProfileKey: randomBytes(32).toString("hex"),
    });
    say("✔ Runtime connection secret stored (values not printed).");
  }
  const providers = await readSecret<Record<string, string>>(`${prefix}/providers`);
  if (!providers || Object.keys(providers).length === 0) await storeProviderKey(prefix, provider);
  else say("✔ Model provider key already present — keeping it.");

  // Phase 2: everything else for this tenant (and any shared pieces not yet created).
  tf(["apply", "-input=false", "-auto-approve"]);
  const outputs = tfOutput<Record<string, { instance_id: string; runtime_secret: string }>>("tenants");
  const out = outputs[tenant] ?? die("terraform did not output the tenant");

  const tx = new Tx(r);
  tx.patch("runtimes", runtime, { instanceId: out.instance_id, deploymentState: "provisioning", endpointRef: out.runtime_secret });
  tx.insert("deployment_events", { orgId: org.id, runtimeId: runtime.id, kind: "provision", status: "started", detail: `EC2 ${out.instance_id}`, actorId: actor.user.id, correlationId: correlationId() });
  await tx.commit();

  say("Waiting for first boot (usually 5–8 minutes, up to 15) …");
  for (let i = 0; i < 60; i++) {
    await new Promise((res) => setTimeout(res, 15_000));
    const rt = await refreshRuntimeHealth(r, runtime.id);
    if (rt.ready) break;
    process.stdout.write(".");
  }
  say("");
  const fresh = await r.get("runtimes", runtime.id);
  if (!fresh?.ready) die(`Runtime did not become healthy. Check \`npm run ${opsScript()} -- tenant:status --tenant ${tenant}\` and the instance's /var/log/agenticbots-bootstrap.log via Session Manager.`);
  const tx2 = new Tx(r);
  tx2.patch("runtimes", fresh!, { deploymentState: "deployed" });
  tx2.patch("organizations", org, { status: org.status === "onboarding" ? "active" : org.status });
  await tx2.commit();
  const already = new Set((await r.list("bots", { orgId: org.id })).map((b) => b.typeKey as string));
  for (const p of t.bot_profiles) {
    if (already.has(p)) {
      say(`  ✔ ${p} already deployed`);
      continue;
    }
    const bot = await provisionBot(r, actor, org.id, p);
    say(`  ${bot.status === "active" ? "✔" : "✖"} ${bot.name}${bot.errorState ? ` — ${bot.errorState.message}` : ""}`);
  }
  say(`\n✔ ${org.name} is live. Next: npm run ${opsScript()} -- run:test --tenant ${tenant} --bot ${t.bot_profiles[0]}`);
}

/** The shared pieces of one environment (no client runtimes). */
const SHARED_TARGETS = [
  "module.stack.module.network",
  "module.stack.module.lifecycle_document",
  "module.stack.module.control_plane",
  "module.stack.module.backups",
  "module.stack.aws_s3_bucket.artifacts",
  "module.stack.aws_s3_bucket_public_access_block.artifacts",
  "module.stack.aws_s3_bucket_server_side_encryption_configuration.artifacts",
  "module.stack.aws_s3_bucket_versioning.artifacts",
  "module.stack.aws_sns_topic.alarms",
  "module.stack.aws_sns_topic_subscription.email",
];

async function envApply() {
  requireLiveMode();
  say(`Creating the shared ${tfEnv()} infrastructure (no client runtimes):`);
  say("  network (VPC, no inbound access), lifecycle command document, Vercel OIDC role,");
  say("  daily backup policy, runtime-bundle bucket, alarm topic.\n");
  say(`  cd infra/terraform/envs/${tfEnv()} && terraform init && terraform apply ${SHARED_TARGETS.map((t) => `-target=${t}`).join(" ")}\n`);
  requireCloud("the environment apply");
  tf(["init", "-input=false"]);
  // Interactive: terraform shows the plan and asks you to type "yes".
  tf(["apply", ...SHARED_TARGETS.map((t) => `-target=${t}`)]);
  say(`\n✔ Shared ${tfEnv()} infrastructure is in place. Values for your env file / Vercel:`);
  say(`  AWS_ROLE_ARN=${tfOutput<string>("control_plane_role_arn")}`);
  say(`  AWS_LIFECYCLE_DOCUMENT=${tfOutput<string>("lifecycle_document")}`);
  say(`  ARTIFACT_BUCKET=${tfOutput<string>("artifact_bucket")}`);
}

async function tenantSetProviderKey() {
  requireLiveMode();
  const tenant = flag("tenant") ?? die("--tenant is required");
  const provider = flag("provider") ?? "openrouter";
  say(`Would store the ${provider} key in agenticbots/${tfEnv()}/tenants/${tenant}/providers and restart the runtime.`);
  requireCloud("storing the provider key");
  await storeProviderKey(`agenticbots/${tfEnv()}/tenants/${tenant}`, provider);
  const { runtime } = await orgByTenant(tenant);
  if (runtime?.instanceId) {
    const res = await awsControl().runLifecycle(runtime.id, runtime.instanceId, "restart-runtime");
    say(`✔ Runtime restart requested (command ${res.commandId}) so the new key is picked up.`);
  }
}

async function providerAdd() {
  requireLiveMode();
  const provider = flag("provider") ?? die("--provider is required (e.g. openrouter)");
  const model = flag("model") ?? die("--model is required (e.g. anthropic/claude-sonnet-4.6)");
  const r = await repo();
  const entry = {
    id: model,
    label: flag("label") ?? model,
    inputPerM: Number(flag("in") ?? 3),
    outputPerM: Number(flag("out") ?? 15),
  };
  const existing = (await r.list("provider_configurations")).find((p) => p.provider === provider);
  const tx = new Tx(r);
  if (existing) tx.patch("provider_configurations", existing, { models: [...existing.models.filter((m) => m.id !== model), entry] });
  else tx.insert("provider_configurations", { provider, displayName: flag("name") ?? provider, status: "unknown", models: [entry] });
  await tx.commit();
  say(`✔ ${provider} / ${model} is available to Bots (price estimates: $${entry.inputPerM} in / $${entry.outputPerM} out per million tokens).`);
}

async function runTest() {
  requireLiveMode();
  const tenant = flag("tenant") ?? die("--tenant is required");
  const botKey = flag("bot") ?? "seo";
  const task =
    flag("task") ??
    "List three practical local-SEO checks a roofing contractor's website should pass. Reply in under 120 words. Do not use any tools.";
  const { r, org } = await orgByTenant(tenant);
  const bot = (await r.list("bots", { orgId: org.id })).find((b) => b.typeKey === botKey) ?? die(`${org.name} has no ${botKey} Bot.`);
  say(`Starting a Bot Run on ${bot.name} for ${org.name} …`);
  let run = await startRun(r, actor, { botId: bot.id, task, idempotencyKey: `cli-test-${Date.now().toString(36)}` });
  say(`  AgenticBots run id: ${run.id}`);
  if (run.status === "failed") die(`Run could not start: ${run.failureReason ?? "see Monitoring"}`);
  const deadline = Date.now() + 6 * 60_000;
  let last = "";
  while (!TERMINAL_RUN_STATUSES.includes(run.status) && Date.now() < deadline) {
    await new Promise((res) => setTimeout(res, 5_000));
    run = await syncRun(r, run.id);
    if (run.status !== last) {
      say(`  status: ${run.status}`);
      last = run.status;
    }
    if (run.status === "waiting_for_approval") say("  (waiting for approval — approve it in the operator console)");
  }
  // Read it back from the database to prove the result was stored.
  const stored = await r.get("runs", run.id);
  const events = await r.list("run_events", { orgId: org.id, where: { runId: run.id } });
  say(`\nFinal status (from the database): ${stored?.status}`);
  say(`Events stored: ${events.length}`);
  if (stored?.resultSummary) say(`\nResult:\n${stored.resultSummary}\n`);
  if (stored?.failureReason) say(`Failure: ${stored.failureReason}`);
  if (stored?.status !== "completed") process.exit(1);
  say("✔ End-to-end chain verified: AgenticBots → runtime → Bot → result → database.");
}

async function stagingCheck() {
  const rows: [string, boolean, string][] = [];
  const check = (label: string, ok: boolean, hint = "") => rows.push([label, ok, hint]);
  const env = (k: string) => (process.env[k] ?? "").trim();
  check("PLATFORM_ENV=staging", platformMode() === "staging", "Use `npm run ops:staging` with .env.staging (PLATFORM_ENV=staging, DEMO_MODE=false).");
  check("CONVEX_URL set (staging database)", env("CONVEX_URL").startsWith("https://"), "Staging Convex deployment URL.");
  check("PLATFORM_SERVER_SECRET (32+ chars)", env("PLATFORM_SERVER_SECRET").length >= 32, "Same value as `npx convex env set` on the staging deployment.");
  let db = false;
  try {
    await (await repo()).list("organizations", { limit: 1 });
    db = true;
  } catch (e) {
    rows.push(["Staging database reachable", false, (e as Error).message.slice(0, 160)]);
  }
  if (db) check("Staging database reachable", true);
  check("AWS_REGION", !!env("AWS_REGION"));
  const sts = spawnSync("aws", ["sts", "get-caller-identity", "--output", "text", "--query", "Account"], { encoding: "utf8" });
  check(`AWS credentials work${sts.status === 0 ? ` (account ${sts.stdout.trim()})` : ""}`, sts.status === 0, "Install the AWS CLI, then `aws login --profile agenticbots-staging` (see the runbook).");
  check("terraform or tofu installed", hasTerraform(), "brew install terraform");
  const tfvars = join(tfDir(), "terraform.tfvars");
  const tfv = existsSync(tfvars) ? readFileSync(tfvars, "utf8") : "";
  check(`infra/terraform/envs/${tfEnv()}/terraform.tfvars exists`, !!tfv, "Copy terraform.tfvars.example and fill it in.");
  check("engine image pinned by digest", !!tfv && /default_engine_image\s*=\s*"[^"]+@sha256:[a-f0-9]{64}"/.test(tfv));
  check("backend.tf state bucket filled in", !readFileSync(join(tfDir(), "backend.tf"), "utf8").includes("REPLACE-"), "Put your Terraform state bucket name in backend.tf.");
  check("ARTIFACT_BUCKET", !!env("ARTIFACT_BUCKET"), "Same name as artifact_bucket in terraform.tfvars.");
  check("ALLOW_CLOUD_CHANGES is NOT set in the file", env("ALLOW_CLOUD_CHANGES") !== "1", "Set it per command instead: ALLOW_CLOUD_CHANGES=1 npm run …");
  for (const k of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ZONE_ID", "RUNTIME_DOMAIN"]) check(k, !!env(k), "See the Cloudflare step in docs/runbooks/FIRST_STAGING_TEST.md.");
  if (db) {
    const providers = await (await repo()).list("provider_configurations");
    check("A model provider is configured", providers.some((p) => p.models.length > 0), `npm run ops:staging -- provider:add --provider openrouter --model <model id>`);
  }
  say(`\nStaging readiness (${tfEnv()}):\n`);
  for (const [label, ok, hint] of rows) say(`  ${ok ? "✔" : "✖"} ${label}${!ok && hint ? `\n      → ${hint}` : ""}`);
  const bad = rows.filter((x) => !x[1]).length;
  say(bad ? `\n${bad} item(s) to fix.` : "\nAll set.");
  if (bad) process.exit(1);
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
  tf(["destroy", "-input=false", `-target=${tfTarget(tenant, "aws_instance.runtime")}`]);
  say("✔ Runtime terminated. Data volume and snapshots retained.");
}

/** Create the very first superadmin (or a new one if you are locked out).
 *  Prints a one-time set-password link; nothing secret is stored in the clear. */
async function userBootstrap() {
  requireLiveMode();
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
  "staging:check": stagingCheck,
  "env:apply": envApply,
  "provider:add": providerAdd,
  "run:test": runTest,
  "tenant:set-provider-key": tenantSetProviderKey,
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
