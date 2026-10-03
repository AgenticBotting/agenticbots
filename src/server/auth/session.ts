import "server-only";
import { cookies, headers } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { repo } from "@/server/db";
import { Tx } from "@/server/db/repository";
import { nowIso, randomToken, sha256Hex } from "@/server/ids";
import type { Session, User } from "@/lib/platform/types";
import type { Actor } from "./policy";

/**
 * Server-side sessions. The cookie holds `<sessionId>.<secret>`; the
 * database holds only sha256(secret). Revoking a session (logout,
 * disabling a user) takes effect on the very next request.
 */
export const SESSION_COOKIE = "ab_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export async function createSession(user: User): Promise<void> {
  const r = await repo();
  const secret = randomToken(32);
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  const h = await headers();
  const tx = new Tx(r);
  const session = tx.insert("sessions", {
    userId: user.id,
    tokenHash: sha256Hex(secret),
    expiresAt: expires.toISOString(),
    userAgent: (h.get("user-agent") ?? "").slice(0, 200),
  });
  tx.patch("users", user, { lastLoginAt: nowIso() });
  await tx.commit();
  (await cookies()).set(SESSION_COOKIE, `${session.id}.${secret}`, cookieOptions(expires));
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  jar.delete(SESSION_COOKIE);
  const found = raw ? await lookup(raw) : null;
  if (found) {
    const tx = new Tx(await repo());
    tx.patch("sessions", found.session, { revokedAt: nowIso() });
    await tx.commit();
  }
}

async function lookup(raw: string): Promise<{ session: Session; user: User } | null> {
  const dot = raw.indexOf(".");
  if (dot < 1) return null;
  const id = raw.slice(0, dot);
  const secret = raw.slice(dot + 1);
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const r = await repo();
  const session = await r.get("sessions", id);
  if (!session || session.revokedAt || Date.parse(session.expiresAt) < Date.now()) return null;
  const a = Buffer.from(sha256Hex(secret), "hex");
  const b = Buffer.from(session.tokenHash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const user = await r.get("users", session.userId);
  if (!user || user.status !== "active") return null;
  return { session, user };
}

/** Resolve the signed-in actor for this request, or null. */
export async function currentActor(): Promise<Actor | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const found = await lookup(raw);
  if (!found) return null;
  const memberships = await (await repo()).list("memberships", { where: { userId: found.user.id } });
  return actorFrom(found.user, memberships);
}

export function actorFrom(user: User, memberships: { orgId: string; role: "client_admin" | "client_member" }[]): Actor {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      platformRole: user.platformRole,
      operatorOrgIds: user.operatorOrgIds,
    },
    platformRole: user.platformRole,
    memberships: memberships.map((m) => ({ orgId: m.orgId, role: m.role })),
  };
}
