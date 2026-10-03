import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { can, isStaff, portalOrgIds, type Actor, type Permission } from "./policy";
import { currentActor } from "./session";
import { AppError, forbidden, unauthenticated, notFound } from "@/server/errors";
import { repo } from "@/server/db";
import type { Organization } from "@/lib/platform/types";

/**
 * Guards for pages (redirect) and for actions/routes (throw AppError,
 * turned into a JSON status by the route wrapper).
 */

export async function requireActor(): Promise<Actor> {
  const a = await currentActor();
  if (!a) throw unauthenticated();
  return a;
}

export async function requirePermission(permission: Permission, orgId?: string): Promise<Actor> {
  const a = await requireActor();
  if (!can(a, permission, orgId)) {
    // Cross-tenant probes look exactly like a missing record.
    throw orgId ? notFound() : forbidden(permission);
  }
  return a;
}

/** Page guard for the operator console. */
export async function requireOperatorPage(): Promise<Actor> {
  const a = await currentActor();
  if (!a) redirect("/login?next=/ops");
  if (!isStaff(a)) redirect("/portal");
  return a;
}

export const PREVIEW_COOKIE = "ab_preview_org";
export const ORG_COOKIE = "ab_org";

export interface PortalContext {
  actor: Actor;
  org: Organization;
  /** Staff viewing a client's portal: read-only, no client actions. */
  preview: boolean;
}

/** Page guard for the client portal. Resolves which organization is shown. */
export async function requirePortalPage(): Promise<PortalContext> {
  const actor = await currentActor();
  if (!actor) redirect("/login?next=/portal");
  const jar = await cookies();
  const r = await repo();

  if (isStaff(actor)) {
    const orgId = jar.get(PREVIEW_COOKIE)?.value;
    const org = orgId ? await r.get("organizations", orgId) : null;
    if (!org || !can(actor, "ops.view", org.id)) redirect("/ops/clients");
    return { actor, org, preview: true };
  }

  const ids = portalOrgIds(actor);
  if (ids.length === 0) redirect("/login?error=no_access");
  const chosen = jar.get(ORG_COOKIE)?.value;
  const orgId = chosen && ids.includes(chosen) ? chosen : ids[0];
  const org = await r.get("organizations", orgId);
  if (!org) redirect("/login?error=no_access");
  return { actor, org, preview: false };
}

/** Resolve the org for a client-facing API call, enforcing membership. */
export async function requirePortalOrg(permission: Permission): Promise<{ actor: Actor; org: Organization }> {
  const actor = await requireActor();
  const ids = portalOrgIds(actor);
  const jar = await cookies();
  const chosen = jar.get(ORG_COOKIE)?.value;
  const orgId = chosen && ids.includes(chosen) ? chosen : ids[0];
  if (!orgId || !can(actor, permission, orgId)) throw forbidden(permission);
  const org = await (await repo()).get("organizations", orgId);
  if (!org) throw notFound();
  return { actor, org };
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
