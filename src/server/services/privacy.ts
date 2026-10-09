import "server-only";
import type { PrivacyCase } from "@/lib/platform/types";
import { can, type Actor } from "@/server/auth/policy";
import { Tx, type Repository } from "@/server/db/repository";
import { invalid, notFound } from "@/server/errors";
import { nowIso, correlationId } from "@/server/ids";
import { redactSecrets } from "@/server/redact";
import { audit } from "./common";

export async function createPrivacyCase(r: Repository, actor: Actor, input: { orgId?: string; kind: string; details: string; contactEmail?: string }) {
  const owner = can(actor, "ops.settings.manage");
  if (!owner && (!input.orgId || !can(actor, "portal.requests.create", input.orgId))) throw notFound();
  if (!["access", "correct", "delete", "opt_out", "cancel"].includes(input.kind)) throw invalid("Choose a request type.");
  if (input.kind === "cancel" && !owner && !actor.memberships.some(m => m.orgId === input.orgId && m.role === "client_admin")) throw invalid("Only a client administrator can request service cancellation.");
  if (input.details.length > 2000) throw invalid("Keep details under 2,000 characters. Do not include passwords or identity documents.");
  const contactEmail = owner && input.contactEmail ? input.contactEmail.trim().toLowerCase() : actor.user.email;
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(contactEmail)) throw invalid("Enter a valid reply email.");
  if (input.orgId && !await r.get("organizations", input.orgId)) throw notFound();
  const tx = new Tx(r);
  const item = tx.insert("privacy_cases", {
    orgId: input.orgId, subjectUserId: owner && input.contactEmail ? undefined : actor.user.id,
    contactEmail, kind: input.kind as PrivacyCase["kind"], details: redactSecrets(input.details, 2000),
    status: "received", dueAt: new Date(Date.now() + (input.kind === "opt_out" ? 24 : 30 * 24) * 3600_000).toISOString(),
  });
  audit(tx, actor, { action: "privacy.request.received", orgId: input.orgId, targetType: "privacy_case", targetId: item.id, correlationId: correlationId(), detail: input.kind });
  await tx.commit();
  return item;
}

export async function decidePrivacyCase(r: Repository, actor: Actor, id: string, status: string, resolution: string) {
  if (!can(actor, "ops.settings.manage")) throw notFound();
  const item = await r.get("privacy_cases", id);
  if (!item) throw notFound();
  const allowed = item.status === "received" ? ["verified", "declined"] : item.status === "verified" ? ["completed", "declined"] : [];
  if (!allowed.includes(status)) throw invalid("Verify the requester before fulfillment. Closed requests cannot be rewritten.");
  if (resolution.trim().length < 15 || resolution.length > 2000) throw invalid("Record the verification or fulfillment evidence (15–2,000 characters), without identity documents or secrets.");
  const tx = new Tx(r);
  tx.patch("privacy_cases", item, {
    status: status as PrivacyCase["status"], resolution: redactSecrets(resolution, 2000),
    ...(status === "verified" ? { verifiedAt: nowIso() } : { resolvedAt: nowIso() }),
  });
  audit(tx, actor, { action: `privacy.request.${status}`, orgId: item.orgId, targetType: "privacy_case", targetId: id, correlationId: correlationId() });
  await tx.commit();
}

/** Copy-in projection: no other employee's requests or internal evidence. */
export async function ownPrivacyReceipts(r: Repository, actor: Actor, orgId: string) {
  if (!can(actor, "portal.view", orgId)) throw notFound();
  return (await r.list("privacy_cases", { orgId, where: { subjectUserId: actor.user.id } })).map(p => ({ id: p.id, kind: p.kind, status: p.status, createdAt: p.createdAt }));
}
