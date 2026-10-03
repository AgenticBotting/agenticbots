import "server-only";
import type { AuditLog, Organization, TableName, Tables } from "@/lib/platform/types";
import type { Repository, Tx } from "@/server/db/repository";
import { can, type Actor, type Permission } from "@/server/auth/policy";
import { forbidden, notFound, suspendedError } from "@/server/errors";
import { redactSecrets } from "@/server/redact";

export interface ActorRef {
  id: string;
  name: string;
}

export const SYSTEM: ActorRef = { id: "system", name: "AgenticBots system" };

export const refOf = (a: Actor | ActorRef): ActorRef =>
  "user" in a ? { id: a.user.id, name: a.user.name } : a;

/**
 * Load a tenant record and prove the actor may touch it. A record in an
 * organization the actor cannot see is reported as not found — changing
 * an id in a URL never reveals that another tenant's record exists.
 */
export async function getScoped<K extends TableName>(
  r: Repository,
  table: K,
  id: string,
  actor: Actor,
  permission: Permission,
): Promise<Tables[K]> {
  const row = await r.get(table, id);
  const orgId = row ? (row as { orgId?: string }).orgId : undefined;
  if (!row || !orgId || !can(actor, permission, orgId)) throw notFound();
  return row;
}

export async function getOrgFor(r: Repository, orgId: string, actor: Actor, permission: Permission): Promise<Organization> {
  if (!can(actor, permission, orgId)) throw notFound("Client");
  const org = await r.get("organizations", orgId);
  if (!org) throw notFound("Client");
  return org;
}

export function assertPermission(actor: Actor, permission: Permission, orgId?: string): void {
  if (!can(actor, permission, orgId)) throw orgId ? notFound() : forbidden(permission);
}

/** The execution gate. Suspended or canceled organizations cannot start
 *  any work — checked before every run, automation and approval resume. */
export function assertExecutable(org: Organization): void {
  if (org.status === "suspended" || org.status === "canceled") throw suspendedError();
}

export function audit(
  tx: Tx,
  actor: Actor | ActorRef,
  entry: {
    action: string;
    orgId?: string;
    targetType: string;
    targetId?: string;
    result?: AuditLog["result"];
    correlationId: string;
    detail?: string;
  },
): void {
  const who = refOf(actor);
  tx.insert("audit_logs", {
    orgId: entry.orgId,
    actorId: who.id,
    actorName: who.name,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    result: entry.result ?? "success",
    correlationId: entry.correlationId,
    detail: entry.detail ? redactSecrets(entry.detail, 500) : undefined,
  });
}

export const monthKey = (d = new Date()): string => d.toISOString().slice(0, 7);
