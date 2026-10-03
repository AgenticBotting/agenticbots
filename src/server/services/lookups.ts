import "server-only";
import type { Bot } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { can, type Actor } from "@/server/auth/policy";

/** Name lookups for operator tables, limited to organizations the actor covers. */
export async function lookups(r: Repository, actor: Actor) {
  const [orgs, bots, users] = await Promise.all([r.list("organizations", { order: "asc" }), r.list("bots", { order: "asc" }), r.list("users")]);
  const visibleOrgs = orgs.filter((o) => can(actor, "ops.view", o.id));
  return {
    orgList: visibleOrgs,
    orgs: new Map(visibleOrgs.map((o) => [o.id, o.name])),
    bots: new Map<string, Bot>(bots.filter((b) => can(actor, "ops.view", b.orgId)).map((b) => [b.id, b])),
    users: new Map(users.map((u) => [u.id, u.name])),
    operators: users.filter((u) => u.platformRole && u.status === "active"),
    visible: (orgId?: string) => !!orgId && can(actor, "ops.view", orgId),
  };
}
