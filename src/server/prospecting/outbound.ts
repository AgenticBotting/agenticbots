import "server-only";
import { sharedRateLimit } from "@/server/security/rate-limit";
import type { OutboundHandoff, OutboundPayload } from "@/lib/prospecting/types";
import { assertExecutable, audit } from "@/server/services/common";
import { correlationId, sha256Hex } from "@/server/ids";
import { AppError, notFound } from "@/server/errors";
import { getPrivate, principalRef, type Ctx } from "./access";
import { checkSuppression } from "./compliance";
import { OUTBOUND_OK } from "./email";
import { providers as defaultProviders } from "./providers/registry";
import type { OutboundProvider, ProviderSet } from "./providers/types";
import { ProviderError } from "./providers/types";

/**
 * The outbound handoff contract.
 *
 * A prospect reaches an outbound system only through `sendToOutbound`,
 * which runs EVERY policy check in code, immediately before handoff:
 *
 *   1. caller may act for this client; the client is not suspended
 *   2. the prospect is qualified
 *   3. it has a decision-maker contact whose email is VERIFIED or LIKELY_VALID
 *      (CATCH_ALL only with a person's explicit approval)
 *   4. no HARD suppression (global or client) on email, domain, company or person
 *      — no argument can override this; soft ones only by a person
 *   5. demo contacts never go to a live outbound system
 *   6. per-client daily handoff cap (no mail-flooding)
 *
 * A failed check records a `rejected_policy` handoff with the reasons, so
 * the operator sees what was blocked and why. Nothing is ever sent by this
 * module itself — it hands a vendor-neutral payload to an OutboundProvider.
 */
export const DEFAULT_DAILY_HANDOFF_CAP = 50;

export interface OutboundOptions {
  sequenceKey?: string;
  /** People only: allow overriding SOFT suppressions. Ignored for Bots. */
  overrideSoft?: boolean;
  /** People only: allow a CATCH_ALL address. Ignored for Bots. */
  allowCatchAll?: boolean;
  providers?: ProviderSet;
}

export interface OutboundResult {
  handoff: OutboundHandoff;
  sent: boolean;
  violations: string[];
}

function pickProvider(set: ProviderSet, demoContact: boolean): OutboundProvider | undefined {
  return [...set.outbound]
    .filter((p) => p.status() === "ready" && (!demoContact || p.demo))
    .sort((a, b) => a.priority - b.priority)[0];
}

export async function sendToOutbound(ctx: Ctx, prospectId: string, opts: OutboundOptions = {}): Promise<OutboundResult> {
  const p = await getPrivate(ctx.store, "pg_prospects", prospectId, ctx.p, "outbound");
  const org = await ctx.r.get("organizations", p.orgId);
  if (!org) throw notFound("Client");
  assertExecutable(org);
  const isPerson = ctx.p.kind === "user";
  const who = principalRef(ctx.p);
  const set = opts.providers ?? defaultProviders();

  // Idempotent: an accepted handoff for this prospect is returned as is.
  const prior = (await ctx.store.list("pg_handoffs", { orgId: p.orgId, where: { prospectId: p.id } })).find((h) => h.provider !== "crm_queue" && (h.status === "accepted" || h.status === "queued"));
  if (prior && prior.provider !== "crm_queue") return { handoff: prior, sent: false, violations: [] };

  const violations: string[] = [];
  if (!isPerson) violations.push("A person must approve outbound handoffs.");
  if (p.status !== "qualified") violations.push(`Prospect is "${p.status}", not qualified.`);
  const contact = p.primaryContactPointId ? await ctx.store.get("pg_contact_points", p.primaryContactPointId) : null;
  const company = await ctx.store.get("pg_companies", p.companyId);
  const person = contact ? await ctx.store.get("pg_people", contact.personId) : null;
  const role = contact ? (await ctx.store.list("pg_company_people", { where: { companyId: p.companyId, personId: contact.personId } }))[0] : undefined;
  if (!contact || !person || !company) violations.push("No decision-maker contact.");
  else {
    const catchAllOk = contact.status === "CATCH_ALL" && isPerson && !!opts.allowCatchAll;
    if (!OUTBOUND_OK.has(contact.status) && !catchAllOk) violations.push(`Email status is ${contact.status}.`);
    const hits = await checkSuppression(ctx.store, p.orgId, { email: contact.value, domain: company.domain, companyId: company.id, personId: person.id }, "email");
    for (const h of hits) {
      if (h.hard || !isPerson || !opts.overrideSoft) violations.push(`Suppressed (${h.scope} ${h.kind}: ${h.reason.replace(/_/g, " ")}).`);
    }
    if (contact.provenance.demo || person.demo || company.demo) {
      if (!pickProvider(set, true)) violations.push("Demo contacts can only go to the demo outbound system.");
    }
  }
  const budgets = await ctx.store.list("pg_budgets");
  const cap = budgets.find((b) => b.scope === "client" && b.orgId === p.orgId)?.maxLeadsExportedPerRun ?? DEFAULT_DAILY_HANDOFF_CAP;
  const today = ctx.now.toISOString().slice(0, 10);
  const sentToday = (await ctx.store.list("pg_handoffs", { orgId: p.orgId })).filter((h) => h.status === "accepted" && h.createdAt.slice(0, 10) === today).length;
  if (sentToday >= cap) violations.push(`Daily handoff cap of ${cap} reached for this client.`);

  const demoContact = !!(contact?.provenance.demo || person?.demo || company?.demo);
  const provider = pickProvider(set, demoContact);
  if (provider && !provider.demo) violations.push("Live outbound is not released. A reviewed provider, sender address, unsubscribe flow and exact-message approval are required.");
  if (!provider && violations.length === 0) violations.push("No outbound system is connected.");

  const market = await ctx.store.get("pg_markets", p.marketId);
  const payload: OutboundPayload = {
    company: { name: company?.canonicalName ?? "", domain: company?.domain, city: company?.locations[0]?.city, state: company?.locations[0]?.state },
    contact: { fullName: person?.fullName ?? "", title: role?.title ?? "", email: contact?.value ?? "" },
    reasons: p.whyNow.slice(0, 5),
    sequenceKey: (opts.sequenceKey ?? "default").slice(0, 60),
    marketName: market?.name ?? "",
  };

  const tx = ctx.store.tx();
  const cid = correlationId();
  if (violations.length > 0 || !provider || !contact) {
    const handoff = tx.insert("pg_handoffs", {
      orgId: p.orgId, prospectId: p.id, contactPointId: contact?.id ?? "", provider: provider?.key ?? "none", status: "rejected_policy",
      payload, policyViolations: violations, requestedBy: who.name, demo: demoContact,
      createdAt: ctx.now.toISOString(),
    });
    audit(tx.audit, who, { action: "prospecting.outbound.blocked", orgId: p.orgId, targetType: "prospect", targetId: p.id, result: "denied", correlationId: cid, detail: violations.join(" ") });
    await tx.commit();
    return { handoff, sent: false, violations };
  }

  const idem = `${p.orgId}:${p.id}:${contact.id}:${payload.sequenceKey}`;
  const handoffId = sha256Hex(idem);
  const existing = await ctx.store.get("pg_handoffs", handoffId);
  if (existing) return { handoff: existing, sent: false, violations: existing.policyViolations };
  // Count reservations, including uncertain outcomes, never just completed sends.
  const limit = await sharedRateLimit(ctx.r, `outbound:${p.orgId}:${today}`, cap, 86_400_000);
  if (!limit.allowed) throw new Error("Daily outbound allowance has been reserved.");
  const reservation = tx.insert("pg_handoffs", {
    id: handoffId, orgId: p.orgId, prospectId: p.id, contactPointId: contact.id,
    provider: provider.key, status: "queued", payload, policyViolations: [], requestedBy: who.name,
    demo: demoContact, createdAt: ctx.now.toISOString(),
  });
  audit(tx.audit, who, { action: "prospecting.outbound.reserved", orgId: p.orgId, targetType: "prospect", targetId: p.id, correlationId: cid });
  try { await tx.commit(); }
  catch (e) {
    if (e instanceof AppError && e.code === "conflict") {
      const claimed = await ctx.store.get("pg_handoffs", handoffId);
      if (claimed) return { handoff: claimed, sent: false, violations: [] };
    }
    throw e;
  }
  let status: OutboundHandoff["status"] = "failed";
  let externalRef: string | undefined;
  const reasons: string[] = [];
  try {
    const res = await provider.handoff(payload, idem);
    status = res.accepted ? "accepted" : "failed";
    externalRef = res.externalRef;
    if (res.reason) reasons.push(res.reason.slice(0, 200));
  } catch (e) {
    reasons.push(e instanceof ProviderError ? `Outbound system: ${e.kind.replace("_", " ")}.` : "Outbound system error.");
  }
  const handoff = tx.patch("pg_handoffs", reservation, { status, externalRef, policyViolations: reasons });
  if (status === "accepted") tx.patch("pg_prospects", p, { status: "sent_to_outbound", nextAction: "In outbound sequence" });
  audit(tx.audit, who, { action: "prospecting.outbound.handoff", orgId: p.orgId, targetType: "prospect", targetId: p.id, result: status === "accepted" ? "success" : "failure", correlationId: cid, detail: status });
  await tx.commit();
  return { handoff, sent: status === "accepted", violations: [] };
}

/**
 * Queue a qualified prospect for the client's CRM (picked up by the CRM
 * Bot). Same suppression rules; records a "crm_queue" handoff. Nothing is
 * written to an external CRM here.
 */
export async function sendToCRM(ctx: Ctx, prospectId: string): Promise<OutboundResult> {
  const p = await getPrivate(ctx.store, "pg_prospects", prospectId, ctx.p, "outbound");
  const org = await ctx.r.get("organizations", p.orgId);
  if (!org) throw notFound("Client");
  assertExecutable(org);
  const who = principalRef(ctx.p);
  const company = await ctx.store.get("pg_companies", p.companyId);
  const contact = p.primaryContactPointId ? await ctx.store.get("pg_contact_points", p.primaryContactPointId) : null;
  const person = contact ? await ctx.store.get("pg_people", contact.personId) : null;
  const violations: string[] = [];
  if (!["qualified", "sent_to_outbound", "contacted", "replied", "meeting", "opportunity"].includes(p.status)) violations.push(`Prospect is "${p.status}".`);
  const hits = await checkSuppression(ctx.store, p.orgId, { email: contact?.value, domain: company?.domain, companyId: p.companyId, personId: person?.id }, "email");
  for (const h of hits) if (h.hard) violations.push(`Suppressed (${h.scope} ${h.kind}).`);
  const existing = (await ctx.store.list("pg_handoffs", { orgId: p.orgId, where: { prospectId: p.id } })).find((h) => h.provider === "crm_queue" && h.status === "queued");
  if (existing && violations.length === 0) return { handoff: existing, sent: false, violations: [] };
  const market = await ctx.store.get("pg_markets", p.marketId);
  const tx = ctx.store.tx();
  const handoff = tx.insert("pg_handoffs", {
    orgId: p.orgId, prospectId: p.id, contactPointId: contact?.id ?? "", provider: "crm_queue", status: violations.length ? "rejected_policy" : "queued",
    payload: {
      company: { name: company?.canonicalName ?? "", domain: company?.domain, city: company?.locations[0]?.city, state: company?.locations[0]?.state },
      contact: { fullName: person?.fullName ?? "", title: "", email: contact?.value ?? "" },
      reasons: p.whyNow.slice(0, 5), sequenceKey: "crm", marketName: market?.name ?? "",
    },
    policyViolations: violations, requestedBy: who.name, demo: !!company?.demo,
    createdAt: ctx.now.toISOString(),
  });
  audit(tx.audit, who, { action: "prospecting.crm.queue", orgId: p.orgId, targetType: "prospect", targetId: p.id, result: violations.length ? "denied" : "success", correlationId: correlationId() });
  await tx.commit();
  return { handoff, sent: violations.length === 0, violations };
}
