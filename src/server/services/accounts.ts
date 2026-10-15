import "server-only";
import type { ClientRole, Organization, PlatformRole, User } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { correlationId as newCorrelationId, nowIso, randomToken, sha256Hex } from "@/server/ids";
import { conflict, invalid, notFound } from "@/server/errors";
import { sharedRateLimit } from "@/server/security/rate-limit";
import { platformMode } from "@/server/env";
import { assertPermission, audit, SYSTEM } from "./common";
import { defaultRuntimeProvider } from "@/server/runtime";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
const normEmail = (e: string) => e.trim().toLowerCase();

/** Instance-type → rough monthly on-demand cost used for operator cost
 *  estimates only (EC2 + 100 GB gp3 + snapshots). Edit freely. */
export const INSTANCE_COST_USD: Record<string, number> = {
  "t3.medium": 45,
  "t3.large": 80,
  "t3.xlarge": 150,
  "m6i.large": 95,
  "m6i.xlarge": 175,
};

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

/** Step 1 of onboarding: the organization, its tenant id and an
 *  unprovisioned runtime record. Infrastructure is created by the
 *  provisioning CLI (ops/cli), which then registers back here. */
export async function createClientOrg(
  r: Repository,
  actor: Actor,
  input: { name: string; industry?: string; website?: string; primaryContactName?: string; primaryContactEmail?: string; timezone?: string; instanceType?: string; region?: string },
): Promise<Organization> {
  assertPermission(actor, "ops.clients.manage");
  const name = input.name.trim();
  if (name.length < 2) throw invalid("Client name is required.");
  const slug = slugify(name);
  const existing = await r.list("organizations");
  if (existing.some((o) => o.slug === slug)) throw conflict("A client with that name already exists.");
  const mode = platformMode();
  const env = mode === "demo" ? "demo" : mode;
  const tenantId = `${slug}-${randomToken(3).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4) || "t1"}`;
  const instanceType = input.instanceType ?? "t3.medium";
  const correlationId = newCorrelationId();
  const tx = new Tx(r);
  const org = tx.insert("organizations", {
    name,
    slug,
    status: "onboarding",
    tenantId,
    environment: env,
    industry: input.industry,
    website: input.website,
    primaryContactName: input.primaryContactName,
    primaryContactEmail: input.primaryContactEmail ? normEmail(input.primaryContactEmail) : undefined,
    timezone: input.timezone ?? "America/New_York",
    holds: { manual: false, security: false, billing: false },
  });
  const envPath = env === "production" ? "prod" : env;
  tx.insert("runtimes", {
    orgId: org.id,
    provider: mode === "demo" ? "demo" : defaultRuntimeProvider(),
    region: input.region ?? process.env.AWS_REGION ?? "us-east-2",
    instanceType,
    health: mode === "demo" ? "healthy" : "unknown",
    ready: mode === "demo",
    runtimeVersion: process.env.RUNTIME_BUNDLE_VERSION ?? "1.0.0",
    engineVersion: process.env.RUNTIME_ENGINE_VERSION ?? "v2026.9.24",
    endpointRef: `agenticbots/${envPath}/tenants/${tenantId}/runtime`,
    tunnel: mode === "demo" ? "connected" : "unknown",
    backup: { status: "none", retentionDays: 30 },
    restartCount24h: 0,
    deploymentState: mode === "demo" ? "deployed" : "not_provisioned",
    estimatedMonthlyCostUsd: INSTANCE_COST_USD[instanceType] ?? 60,
  });
  audit(tx, actor, { action: "client.create", orgId: org.id, targetType: "organization", targetId: org.id, correlationId, detail: name });
  await tx.commit();
  return org;
}

export interface InviteResult {
  user: User;
  /** One-time link path. Shown to the operator once; only its hash is stored. */
  setPasswordPath: string;
}

export async function inviteUser(
  r: Repository,
  actor: Actor,
  input: { email: string; name: string; platformRole?: PlatformRole; operatorAllOrgs?: boolean; operatorOrgIds?: string[]; orgId?: string; clientRole?: ClientRole },
): Promise<InviteResult> {
  if (input.platformRole && !["superadmin", "operator"].includes(input.platformRole)) throw invalid("Invalid staff role.");
  if (input.clientRole && !["client_admin", "client_member"].includes(input.clientRole)) throw invalid("Invalid client role.");
  if (input.orgId && !await r.get("organizations", input.orgId)) throw notFound("Client");
  if (input.platformRole) assertPermission(actor, "ops.users.manage");
  else {
    if (!input.orgId || !input.clientRole) throw invalid("Choose the client and role.");
    assertPermission(actor, "ops.clients.manage", input.orgId);
  }
  const email = normEmail(input.email);
  if (!EMAIL.test(email)) throw invalid("Enter a valid email address.");
  if (!input.name.trim()) throw invalid("Enter the person's name.");
  const scope = input.platformRole === "operator" ? await operatorScope(r, input.operatorAllOrgs === true, input.operatorOrgIds ?? []) : {};
  const token = randomToken(32);
  const users = await r.list("users", { where: { email } });
  const tx = new Tx(r);
  let user = users[0];
  if (user) {
    if (input.platformRole && user.platformRole) throw conflict("That person already has staff access.");
    user = tx.patch("users", user, {
      ...(input.platformRole ? { platformRole: input.platformRole, ...scope } : {}),
      inviteTokenHash: user.status === "invited" ? sha256Hex(token) : user.inviteTokenHash,
      inviteExpiresAt: user.status === "invited" ? new Date(Date.now() + 7 * 86_400_000).toISOString() : user.inviteExpiresAt,
    });
  } else {
    user = tx.insert("users", {
      email,
      name: input.name.trim(),
      status: "invited",
      platformRole: input.platformRole,
      ...scope,
      inviteTokenHash: sha256Hex(token),
      inviteExpiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    });
  }
  if (input.orgId && input.clientRole) {
    const m = await r.list("memberships", { orgId: input.orgId, where: { userId: user.id } });
    if (m.length === 0) tx.insert("memberships", { orgId: input.orgId, userId: user.id, role: input.clientRole });
  }
  audit(tx, actor, { action: "user.invite", orgId: input.orgId, targetType: "user", targetId: user.id, correlationId: newCorrelationId(), detail: `${email} ${input.platformRole ?? input.clientRole}` });
  await tx.commit();
  return { user, setPasswordPath: `/login/set-password?u=${user.id}&t=${token}` };
}

export async function acceptInvite(r: Repository, userId: string, token: string, password: string): Promise<User> {
  if (password.length < 12 || password.length > 1024) throw invalid("Use a password between 12 and 1024 characters.");
  const user = await r.get("users", userId);
  if (!user || !user.inviteTokenHash || !user.inviteExpiresAt) throw notFound("Invitation");
  if (Date.parse(user.inviteExpiresAt) < Date.now()) throw conflict("This invitation has expired. Ask AgenticBots for a new one.");
  if (sha256Hex(token) !== user.inviteTokenHash) throw notFound("Invitation");
  const tx = new Tx(r);
  const next = tx.patch("users", user, {
    passwordHash: await hashPassword(password),
    termsAcceptedAt: nowIso(), termsVersion: "2026-10-09", privacyVersion: "2026-10-09",
    status: "active",
    inviteTokenHash: undefined,
    inviteExpiresAt: undefined,
  });
  audit(tx, SYSTEM, { action: "user.activate", targetType: "user", targetId: user.id, correlationId: newCorrelationId() });
  await tx.commit();
  return next;
}

/** Email + password check, rate limited per email and per IP. */
export async function authenticate(r: Repository, email: string, password: string, ip: string): Promise<User | null> {
  if (email.length > 254 || password.length > 1024) throw invalid("Invalid credentials.");
  const e = normEmail(email);
  const byIp = await sharedRateLimit(r, `login-ip:${ip}`, 20, 15 * 60_000);
  const byEmail = await sharedRateLimit(r, `login-email:${e}`, 8, 15 * 60_000);
  if (!byIp.allowed || !byEmail.allowed) throw conflict("Too many sign-in attempts. Wait a few minutes and try again.");
  const user = (await r.list("users", { where: { email: e } }))[0];
  const ok = await verifyPassword(password, user?.passwordHash);
  const accepted = !!(ok && user && user.status === "active");
  const tx = new Tx(r);
  audit(tx, SYSTEM, { action: accepted ? "auth.password.accepted" : "auth.password.denied", targetType: "user", targetId: user?.id ?? sha256Hex(e), correlationId: newCorrelationId(), result: accepted ? "success" : "denied" });
  await tx.commit();
  if (!accepted) return null;
  return user;
}

export async function setUserStatus(r: Repository, actor: Actor, userId: string, status: "active" | "disabled"): Promise<void> {
  assertPermission(actor, "ops.users.manage");
  const user = await r.get("users", userId);
  if (!user) throw notFound("User");
  if (user.id === actor.user.id) throw conflict("You cannot disable your own account.");
  const tx = new Tx(r);
  tx.patch("users", user, { status });
  if (status === "disabled") {
    for (const s of await r.list("sessions", { where: { userId } })) if (!s.revokedAt) tx.patch("sessions", s, { revokedAt: nowIso() });
  }
  audit(tx, actor, { action: `user.${status}`, targetType: "user", targetId: userId, correlationId: newCorrelationId() });
  await tx.commit();
}

async function operatorScope(r: Repository, all: boolean, ids: string[]) {
  if (!Array.isArray(ids) || ids.length > 1000 || ids.some(id => typeof id !== "string")) throw invalid("Choose valid clients.");
  const scope = [...new Set(ids)];
  if (all && scope.length) throw invalid("Choose all clients or selected clients, not both.");
  for (const id of scope) if (!await r.get("organizations", id)) throw notFound("Client");
  return { operatorAllOrgs: all, operatorOrgIds: all ? undefined : scope };
}

export async function setOperatorScope(r: Repository, actor: Actor, userId: string, all: boolean, ids: string[]) {
  assertPermission(actor, "ops.users.manage");
  const user = await r.get("users", userId);
  if (!user || user.platformRole !== "operator") throw notFound("Operator");
  const scope = await operatorScope(r, all, ids);
  const tx = new Tx(r);
  tx.patch("users", user, scope);
  for (const session of await r.list("sessions", { where: { userId } })) if (!session.revokedAt) tx.patch("sessions", session, { revokedAt: nowIso() });
  audit(tx, actor, { action: "user.scope.change", targetType: "user", targetId: userId, correlationId: newCorrelationId(), detail: all ? "Explicit all-client access" : `${ids.length} selected clients; sessions revoked` });
  await tx.commit();
}
