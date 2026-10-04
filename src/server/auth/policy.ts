import "server-only";
import type { ClientRole, ID, Membership, PlatformRole, User } from "@/lib/platform/types";

/**
 * Centralized authorization. Every server route, server action and page
 * loader asks `can()` — hidden navigation is never the control.
 *
 *   superadmin     everything, every organization
 *   operator       daily operations; all orgs, or a configured subset
 *   client_admin   their organization's portal, approvals, requests
 *   client_member  their organization's portal, read + submit requests
 */
export interface Actor {
  user: Pick<User, "id" | "email" | "name" | "status" | "platformRole" | "operatorOrgIds">;
  platformRole?: PlatformRole;
  memberships: Pick<Membership, "orgId" | "role">[];
}

export type Permission =
  // operator console
  | "ops.view"
  | "ops.bots.manage"
  | "ops.runs.control"
  | "ops.requests.manage"
  | "ops.approvals.resolve"
  | "ops.automations.manage"
  | "ops.integrations.manage"
  | "ops.runtime.control"
  | "ops.clients.suspend"
  | "ops.clients.manage"
  | "ops.billing.read"
  | "ops.billing.write"
  | "ops.skills.manage"
  | "ops.models.manage"
  | "ops.notes.write"
  | "ops.audit.read"
  | "ops.settings.manage"
  | "ops.users.manage"
  | "ops.provisioning"
  | "ops.destroy"
  // prospecting (Prospect Graph)
  | "ops.prospecting.view"
  | "ops.prospecting.manage"
  | "ops.prospecting.ontology"
  | "ops.prospecting.spend"
  | "ops.prospecting.global_suppression"
  // client portal
  | "portal.view"
  | "portal.requests.create"
  | "portal.requests.comment"
  | "portal.approvals.resolve"
  | "portal.reports.view"
  | "portal.integrations.view"
  | "portal.prospects.view";

const OPERATOR: ReadonlySet<Permission> = new Set<Permission>([
  "ops.view", "ops.bots.manage", "ops.runs.control", "ops.requests.manage", "ops.approvals.resolve",
  "ops.automations.manage", "ops.integrations.manage", "ops.runtime.control", "ops.clients.suspend",
  "ops.clients.manage", "ops.billing.read", "ops.billing.write", "ops.skills.manage", "ops.models.manage",
  "ops.notes.write", "ops.audit.read", "ops.provisioning",
  "ops.prospecting.view", "ops.prospecting.manage", "ops.prospecting.ontology", "ops.prospecting.spend",
]);

const SUPERADMIN_ONLY: ReadonlySet<Permission> = new Set<Permission>([
  "ops.settings.manage", "ops.users.manage", "ops.destroy",
  // Global (all-client) suppression changes affect every customer.
  "ops.prospecting.global_suppression",
]);

const CLIENT: Record<ClientRole, ReadonlySet<Permission>> = {
  client_admin: new Set<Permission>([
    "portal.view", "portal.requests.create", "portal.requests.comment", "portal.approvals.resolve",
    "portal.reports.view", "portal.integrations.view", "portal.prospects.view",
  ]),
  client_member: new Set<Permission>([
    "portal.view", "portal.requests.create", "portal.requests.comment", "portal.reports.view",
    "portal.integrations.view", "portal.prospects.view",
  ]),
};

export function isStaff(actor: Actor | null): boolean {
  return !!actor && actor.user.status === "active" && !!actor.platformRole;
}

/** Can this operator see this organization at all? */
export function operatorCoversOrg(actor: Actor, orgId: ID): boolean {
  if (actor.platformRole === "superadmin") return true;
  const scope = actor.user.operatorOrgIds;
  return !scope || scope.length === 0 || scope.includes(orgId);
}

/**
 * The one authorization question.
 * `orgId` is required for any permission that touches tenant data.
 */
export function can(actor: Actor | null, permission: Permission, orgId?: ID): boolean {
  if (!actor || actor.user.status !== "active") return false;

  if (permission.startsWith("ops.")) {
    if (!actor.platformRole) return false;
    if (SUPERADMIN_ONLY.has(permission)) return actor.platformRole === "superadmin";
    if (!OPERATOR.has(permission)) return false;
    return orgId === undefined ? true : operatorCoversOrg(actor, orgId);
  }

  // Portal permissions are strictly per-organization membership. Staff use
  // the operator console's "view as client" preview, which is read-only and
  // goes through ops permissions instead.
  if (!orgId) return false;
  const m = actor.memberships.find((x) => x.orgId === orgId);
  return !!m && CLIENT[m.role].has(permission);
}

/** Organizations this actor may open in the client portal. */
export function portalOrgIds(actor: Actor | null): ID[] {
  if (!actor || actor.user.status !== "active") return [];
  return actor.memberships.map((m) => m.orgId);
}
