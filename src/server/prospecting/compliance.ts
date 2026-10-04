import "server-only";
import type { Suppression, SuppressionReason } from "@/lib/prospecting/types";
import { audit } from "@/server/services/common";
import { correlationId, nowIso } from "@/server/ids";
import { forbidden, invalid, notFound } from "@/server/errors";
import type { ProspectGraphStore } from "./store";
import { assertAllowed, principalRef, type Ctx } from "./access";
import { normalizeDomain } from "./identity";
import { isValidEmailSyntax } from "./email";

/**
 * Compliance / suppression policy layer.
 *
 * `checkSuppression` is called by the outbound path for every contact,
 * immediately before handoff. It is code, not a prompt instruction: a Bot
 * cannot argue past it, and no tool argument can override a HARD
 * suppression. Soft suppressions may be overridden only by a person with
 * ops.prospecting.manage, and the override is audited.
 *
 * Scope: global suppressions (no orgId) apply to every client; a client's
 * suppressions apply only to that client and are never visible to others.
 */
export interface SuppressionTarget {
  email?: string;
  domain?: string;
  companyId?: string;
  personId?: string;
}

export interface SuppressionHit {
  suppressionId: string;
  reason: SuppressionReason;
  hard: boolean;
  scope: "global" | "client";
  kind: Suppression["kind"];
}

export async function checkSuppression(store: ProspectGraphStore, orgId: string, t: SuppressionTarget, channel: "email" | "phone" = "email"): Promise<SuppressionHit[]> {
  const email = t.email?.trim().toLowerCase();
  const domain = normalizeDomain(t.domain ?? email?.split("@")[1]);
  const all = await store.list("pg_suppressions");
  const hits: SuppressionHit[] = [];
  for (const s of all) {
    if (s.liftedAt) continue;
    if (s.orgId && s.orgId !== orgId) continue;
    if (!s.channels.includes("all") && !s.channels.includes(channel)) continue;
    const match =
      (s.kind === "email" && !!email && s.value === email) ||
      (s.kind === "domain" && !!domain && (domain === s.value || domain.endsWith(`.${s.value}`))) ||
      (s.kind === "company" && !!t.companyId && s.value === t.companyId) ||
      (s.kind === "person" && !!t.personId && s.value === t.personId);
    if (match) hits.push({ suppressionId: s.id, reason: s.reason, hard: s.hard, scope: s.orgId ? "client" : "global", kind: s.kind });
  }
  return hits;
}

export interface SuppressionInput {
  /** Omit for a global suppression (superadmin only). */
  orgId?: string;
  kind: Suppression["kind"];
  value: string;
  reason: SuppressionReason;
  channels?: Suppression["channels"];
  hard?: boolean;
  note?: string;
  source?: string;
}

function normalizeValue(kind: Suppression["kind"], value: string): string {
  const v = value.trim();
  if (kind === "email") {
    const e = v.toLowerCase();
    if (!isValidEmailSyntax(e)) throw invalid("That is not a valid email address.");
    return e;
  }
  if (kind === "domain") {
    const d = normalizeDomain(v);
    if (!d) throw invalid("That is not a valid domain.");
    return d;
  }
  if (!v) throw invalid("A value is required.");
  return v;
}

export async function addSuppression(ctx: Ctx, input: SuppressionInput): Promise<Suppression> {
  if (input.orgId) assertAllowed(ctx.p, "suppress", input.orgId);
  else assertAllowed(ctx.p, "global_suppression");
  const value = normalizeValue(input.kind, input.value);
  const existing = (await ctx.store.list("pg_suppressions")).find((s) => !s.liftedAt && s.orgId === input.orgId && s.kind === input.kind && s.value === value);
  if (existing) return existing;
  const who = principalRef(ctx.p);
  const tx = ctx.store.tx();
  const row = tx.insert("pg_suppressions", {
    orgId: input.orgId,
    kind: input.kind,
    value,
    reason: input.reason,
    channels: input.channels?.length ? input.channels : ["all"],
    source: input.source ?? (ctx.p.kind === "bot" ? "bot" : "operator"),
    note: input.note?.slice(0, 500),
    createdBy: who.name,
    // Suppressions are hard unless a person explicitly makes one soft. A Bot cannot.
    hard: ctx.p.kind === "bot" ? true : input.hard ?? true,
  });
  audit(tx.audit, who, { action: "prospecting.suppression.add", orgId: input.orgId, targetType: "suppression", targetId: row.id, correlationId: correlationId(), detail: `${input.kind} (${input.reason})` });
  await tx.commit();
  return row;
}

export async function liftSuppression(ctx: Ctx, id: string, note?: string): Promise<Suppression> {
  const s = await ctx.store.get("pg_suppressions", id);
  if (!s) throw notFound("Suppression");
  if (s.orgId) assertAllowed(ctx.p, "lift_suppression", s.orgId);
  else assertAllowed(ctx.p, "global_suppression");
  // Unsubscribes and bounces are facts about the recipient; they are permanent.
  if (s.reason === "unsubscribed" || s.reason === "bounced") throw invalid("Unsubscribes and bounces cannot be lifted.");
  const who = principalRef(ctx.p);
  const tx = ctx.store.tx();
  const row = tx.patch("pg_suppressions", s, { liftedAt: nowIso(), liftedBy: who.name });
  audit(tx.audit, who, { action: "prospecting.suppression.lift", orgId: s.orgId, targetType: "suppression", targetId: s.id, correlationId: correlationId(), detail: note });
  await tx.commit();
  return row;
}

/** Suppressions visible to this principal: global (operators only) + the org's own. */
export async function listSuppressions(ctx: Ctx, orgId?: string): Promise<Suppression[]> {
  if (orgId) assertAllowed(ctx.p, "read_private", orgId);
  else {
    // The global list is operator-only (a Bot or client never sees it).
    if (ctx.p.kind === "bot") throw forbidden("prospecting.suppressions");
    assertAllowed(ctx.p, "read_shared");
  }
  const all = await ctx.store.list("pg_suppressions");
  return all.filter((s) => (orgId ? s.orgId === orgId : !s.orgId));
}
