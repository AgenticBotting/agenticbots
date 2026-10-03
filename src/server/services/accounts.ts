import "server-only";
import type { ClientRole, Organization, PlatformRole, User } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { correlationId as newCorrelationId, nowIso, randomToken, sha256Hex } from "@/server/ids";
import { conflict, invalid, notFound } from "@/server/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { platformMode } from "@/server/env";
import { assertPermission, audit, SYSTEM } from "./common";

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
    kind: mode === "demo" ? "demo" : "hermes",
    region: input.region ?? process.env.AWS_REGION ?? "us-east-1",
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
  input: { email: string; name: string; platformRole?: PlatformRole; orgId?: string; clientRole?: ClientRole },
): Promise<InviteResult> {
  if (input.platformRole) assertPermission(actor, "ops.users.manage");
  else {
    if (!input.orgId || !input.clientRole) throw invalid("Choose the client and role.");
    assertPermission(actor, "ops.clients.manage", input.orgId);
  }
  const email = normEmail(input.email);
  if (!EMAIL.test(email)) throw invalid("Enter a valid email address.");
  if (!input.name.trim()) throw invalid("Enter the person's name.");
  const token = randomToken(32);
  const users = await r.list("users", { where: { email } });
  const tx = new Tx(r);
  let user = users[0];
  if (user) {
    if (input.platformRole && user.platformRole) throw conflict("That person already has staff access.");
    user = tx.patch("users", user, {
      ...(input.platformRole ? { platformRole: input.platformRole } : {}),
      inviteTokenHash: user.status === "invited" ? sha256Hex(token) : user.inviteTokenHash,
      inviteExpiresAt: user.status === "invited" ? new Date(Date.now() + 7 * 86_400_000).toISOString() : user.inviteExpiresAt,
    });
  } else {
    user = tx.insert("users", {
      email,
      name: input.name.trim(),
      status: "invited",
      platformRole: input.platformRole,
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
  const user = await r.get("users", userId);
  if (!user || !user.inviteTokenHash || !user.inviteExpiresAt) throw notFound("Invitation");
  if (Date.parse(user.inviteExpiresAt) < Date.now()) throw conflict("This invitation has expired. Ask AgenticBots for a new one.");
  if (sha256Hex(token) !== user.inviteTokenHash) throw notFound("Invitation");
  const tx = new Tx(r);
  const next = tx.patch("users", user, {
    passwordHash: await hashPassword(password),
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
  const e = normEmail(email);
  const byIp = checkRateLimit(`login-ip:${ip}`, 20, 15 * 60_000);
  const byEmail = checkRateLimit(`login-email:${e}`, 8, 15 * 60_000);
  if (!byIp.allowed || !byEmail.allowed) throw conflict("Too many sign-in attempts. Wait a few minutes and try again.");
  const user = (await r.list("users", { where: { email: e } }))[0];
  const ok = await verifyPassword(password, user?.passwordHash);
  if (!ok || !user || user.status !== "active") return null;
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
