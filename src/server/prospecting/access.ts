import "server-only";
import type { Repository } from "@/server/db/repository";
import { can, type Actor, type Permission } from "@/server/auth/policy";
import { forbidden, notFound } from "@/server/errors";
import { graphOf, type PgTable, type ProspectGraphStore } from "./store";
import type { Tables } from "@/lib/platform/types";

/**
 * Who is acting on the Prospect Graph.
 *
 *  user  an operator (ops.prospecting.*) or a client user (portal.prospects.view, read-only)
 *  bot   a Prospecting Bot acting for exactly ONE organization. It holds a
 *        fixed, narrow permission set — it can never touch another client,
 *        lift a suppression, change budgets or approve spend.
 */
export type Principal =
  | { kind: "user"; actor: Actor }
  | { kind: "bot"; botId: string; orgId: string; name: string };

export type ProspectingAction =
  | "read_shared"       // ontology, companies, signals (shared market intelligence)
  | "read_private"      // a client's ICPs, markets, prospects
  | "write_private"     // create markets, save/qualify prospects, run jobs
  | "spend"             // approve paid provider usage beyond the automatic limit
  | "review_ontology"   // approve/reject niche ↔ buyer relationships
  | "suppress"          // add client suppression
  | "lift_suppression"  // remove a client suppression (never a Bot)
  | "global_suppression"// add/lift a global suppression (superadmin)
  | "manage_budgets"
  | "outbound";         // hand a qualified prospect to the outbound contract

const USER_PERMISSION: Record<ProspectingAction, Permission> = {
  read_shared: "ops.prospecting.view",
  read_private: "ops.prospecting.view",
  write_private: "ops.prospecting.manage",
  spend: "ops.prospecting.spend",
  review_ontology: "ops.prospecting.ontology",
  suppress: "ops.prospecting.manage",
  lift_suppression: "ops.prospecting.manage",
  global_suppression: "ops.prospecting.global_suppression",
  manage_budgets: "ops.prospecting.spend",
  outbound: "ops.prospecting.manage",
};

/** What a Bot may do, inside its own organization only. */
const BOT_ACTIONS: ReadonlySet<ProspectingAction> = new Set<ProspectingAction>([
  "read_shared", "read_private", "write_private", "suppress", "outbound",
]);

export function allowed(p: Principal, action: ProspectingAction, orgId?: string): boolean {
  if (p.kind === "bot") {
    if (!BOT_ACTIONS.has(action)) return false;
    // A Bot never acts without an org, and never outside its own.
    if (action === "read_shared") return true;
    return orgId !== undefined && orgId === p.orgId;
  }
  // Client users get a read-only window onto their own prospects.
  if (!p.actor.platformRole) {
    return action === "read_private" && !!orgId && can(p.actor, "portal.prospects.view", orgId);
  }
  return can(p.actor, USER_PERMISSION[action], orgId);
}

export function assertAllowed(p: Principal, action: ProspectingAction, orgId?: string): void {
  if (allowed(p, action, orgId)) return;
  // Never confirm another tenant's record exists.
  throw orgId ? notFound() : forbidden(`prospecting.${action}`);
}

/** Load a PRIVATE row and prove the principal may see it. */
export async function getPrivate<K extends PgTable>(
  store: ProspectGraphStore,
  table: K,
  id: string,
  p: Principal,
  action: ProspectingAction = "read_private",
): Promise<Tables[K]> {
  const row = await store.get(table, id);
  const orgId = row ? (row as { orgId?: string }).orgId : undefined;
  if (!row || !orgId || !allowed(p, action, orgId)) throw notFound();
  return row;
}

export const principalRef = (p: Principal): { id: string; name: string } =>
  p.kind === "bot" ? { id: `bot:${p.botId}`, name: p.name } : { id: p.actor.user.id, name: p.actor.user.name };

export const asUser = (actor: Actor): Principal => ({ kind: "user", actor });

export interface Ctx {
  r: Repository;
  store: ProspectGraphStore;
  p: Principal;
  /** Injected clock: scoring and freshness are deterministic for a given `now`. */
  now: Date;
}

export const ctxOf = (r: Repository, p: Principal, now = new Date()): Ctx => ({ r, store: graphOf(r), p, now });
