import "server-only";
import type { OutcomeEvent, OutcomeStage, Prospect, ProspectStatus } from "@/lib/prospecting/types";
import { audit } from "@/server/services/common";
import { correlationId, nowIso } from "@/server/ids";
import { invalid, notFound } from "@/server/errors";
import type { GraphTx, ProspectGraphStore } from "./store";
import { assertAllowed, getPrivate, principalRef, type Ctx } from "./access";
import { activeSignals } from "./signals";
import { DEFAULT_QUALIFICATION, qualify, scoreProspect, type QualificationRules, type ScoreInput } from "./scoring";
import { packsForNiche } from "./ontology/packs";
import { stableId } from "./ontology/normalize";

/**
 * Prospects — PRIVATE to one client. A prospect is a company in one of
 * the client's markets, with the chosen decision makers, the best contact,
 * a score with reasons, and a status.
 */
export const prospectId = (orgId: string, marketId: string, companyId: string) => stableId(`pros_${orgId}_${marketId}_${companyId}`);

export async function loadScoreInput(store: ProspectGraphStore, p: Prospect, now: Date): Promise<ScoreInput> {
  const market = await store.get("pg_markets", p.marketId);
  const company = await store.get("pg_companies", p.companyId);
  if (!market || !company) throw notFound("Prospect data");
  const niche = await store.get("pg_niches", market.nicheId);
  if (!niche) throw notFound("Niche");
  const buyerType = p.buyerTypeId ? (await store.get("pg_buyer_types", p.buyerTypeId)) ?? undefined : undefined;
  const relationship = buyerType ? (await store.get("pg_relationships", stableId(`rel_${niche.id}|${buyerType.id}`))) ?? undefined : undefined;
  const icp = market.icpId ? (await store.get("pg_icps", market.icpId)) ?? undefined : undefined;
  const decisionMakers = (await Promise.all(p.decisionMakerIds.map((id) => store.get("pg_company_people", id)))).filter((x): x is NonNullable<typeof x> => !!x);
  const contact = p.primaryContactPointId ? (await store.get("pg_contact_points", p.primaryContactPointId)) ?? undefined : undefined;
  return { company, niche, market, icp, buyerType, relationship, decisionMakers, contact, signals: await activeSignals(store, company.id, now), asOf: now };
}

export async function rulesFor(store: ProspectGraphStore, nicheId: string): Promise<QualificationRules> {
  const niche = await store.get("pg_niches", nicheId);
  const pack = niche ? packsForNiche(niche.tags)[0] : undefined;
  return pack ? { ...DEFAULT_QUALIFICATION, minFit: pack.qualification.minFit, requireDecisionMaker: pack.qualification.requireDecisionMaker } : DEFAULT_QUALIFICATION;
}

/** Recompute the score and the WHY lines. Writes in `tx` if given, else commits. */
export async function rescore(store: ProspectGraphStore, p: Prospect, now: Date, tx?: GraphTx): Promise<Prospect> {
  const input = await loadScoreInput(store, p, now);
  const score = scoreProspect(input);
  const whyNow = score.reasons;
  const own = tx ?? store.tx();
  const next = own.patch("pg_prospects", p, { score, whyNow });
  if (!tx) await own.commit();
  return next;
}

/** Rule-based qualification. Never overrides a person's decision. */
export async function autoQualify(store: ProspectGraphStore, p: Prospect, tx?: GraphTx): Promise<Prospect> {
  if (!p.score) return p;
  if (p.qualification && p.qualification.decidedBy !== "rules") return p;
  if (!["new", "researching", "review", "qualified", "rejected"].includes(p.status)) return p;
  const market = await store.get("pg_markets", p.marketId);
  const contact = p.primaryContactPointId ? await store.get("pg_contact_points", p.primaryContactPointId) : null;
  const q = qualify(p.score, p.decisionMakerIds.length > 0, contact?.status, await rulesFor(store, market?.nicheId ?? ""));
  const own = tx ?? store.tx();
  const next = own.patch("pg_prospects", p, {
    status: q.decision === "qualified" ? "qualified" : q.decision === "review" ? "review" : "rejected",
    qualification: { decision: q.decision, reasons: q.reasons, decidedBy: "rules", decidedAt: nowIso() },
    nextAction: q.decision === "qualified" ? "Ready for outbound" : q.decision === "review" ? "Operator review" : undefined,
  });
  if (!tx) await own.commit();
  return next;
}

export async function listProspects(ctx: Ctx, orgId: string, f: { marketId?: string; status?: ProspectStatus } = {}): Promise<Prospect[]> {
  assertAllowed(ctx.p, "read_private", orgId);
  const rows = await ctx.store.list("pg_prospects", { orgId });
  return rows
    .filter((p) => p.orgId === orgId && (!f.marketId || p.marketId === f.marketId) && (!f.status || p.status === f.status))
    .sort((a, b) => (b.score?.priority ?? -1) - (a.score?.priority ?? -1) || a.id.localeCompare(b.id));
}

/** Save a known company into one of the client's markets. Idempotent. */
export async function saveProspect(ctx: Ctx, marketId: string, companyId: string, opts: { buyerTypeId?: string; notes?: string } = {}): Promise<Prospect> {
  const m = await getPrivate(ctx.store, "pg_markets", marketId, ctx.p, "write_private");
  const company = await ctx.store.get("pg_companies", companyId);
  if (!company) throw notFound("Company");
  const id = prospectId(m.orgId, m.id, company.id);
  const existing = await ctx.store.get("pg_prospects", id);
  if (existing) return existing;
  const buyerTypeId = opts.buyerTypeId ?? company.buyerClassification?.buyerTypeId ?? company.buyerTypeIds[0];
  if (buyerTypeId && !(await ctx.store.get("pg_buyer_types", buyerTypeId))) throw invalid("Unknown buyer type.");
  const who = principalRef(ctx.p);
  const tx = ctx.store.tx();
  const p = tx.insert("pg_prospects", {
    id, orgId: m.orgId, marketId: m.id, companyId: company.id, buyerTypeId, decisionMakerIds: [], status: "new",
    whyNow: [], createdBy: who.name, notes: opts.notes?.slice(0, 2000), acquisitionCostUsd: 0,
  });
  audit(tx.audit, who, { action: "prospecting.prospect.save", orgId: m.orgId, targetType: "prospect", targetId: id, correlationId: correlationId() });
  await tx.commit();
  return rescore(ctx.store, p, ctx.now);
}

export async function scoreProspectById(ctx: Ctx, id: string): Promise<Prospect> {
  const p = await getPrivate(ctx.store, "pg_prospects", id, ctx.p, "write_private");
  return rescore(ctx.store, p, ctx.now);
}

/**
 * Qualify. Without `decision`, applies the deterministic rules.
 * A person (not a Bot) may record a different decision with a reason.
 */
export async function qualifyProspect(ctx: Ctx, id: string, manual?: { decision: "qualified" | "review" | "rejected"; reason: string }): Promise<Prospect> {
  let p = await getPrivate(ctx.store, "pg_prospects", id, ctx.p, "write_private");
  if (!p.score) p = await rescore(ctx.store, p, ctx.now);
  // Rules never override a decision a person made.
  if (!manual) return autoQualify(ctx.store, p);
  if (ctx.p.kind === "bot") throw invalid("A Bot applies the qualification rules; only a person can override them.");
  if (!manual.reason.trim()) throw invalid("Say why.");
  const who = principalRef(ctx.p);
  const tx = ctx.store.tx();
  const next = tx.patch("pg_prospects", p, {
    status: manual.decision,
    qualification: { decision: manual.decision, reasons: [manual.reason.trim().slice(0, 500)], decidedBy: who.name, decidedAt: nowIso() },
    nextAction: manual.decision === "qualified" ? "Ready for outbound" : undefined,
  });
  audit(tx.audit, who, { action: `prospecting.prospect.${manual.decision}`, orgId: p.orgId, targetType: "prospect", targetId: p.id, correlationId: correlationId(), detail: manual.reason });
  await tx.commit();
  return next;
}

export async function rejectProspect(ctx: Ctx, id: string, reason: string): Promise<Prospect> {
  const p = await getPrivate(ctx.store, "pg_prospects", id, ctx.p, "write_private");
  const who = principalRef(ctx.p);
  const tx = ctx.store.tx();
  const next = tx.patch("pg_prospects", p, {
    status: "rejected",
    qualification: { decision: "rejected", reasons: [reason.trim().slice(0, 500) || "Rejected."], decidedBy: who.name, decidedAt: nowIso() },
    nextAction: undefined,
  });
  audit(tx.audit, who, { action: "prospecting.prospect.reject", orgId: p.orgId, targetType: "prospect", targetId: p.id, correlationId: correlationId(), detail: reason });
  await tx.commit();
  return next;
}

const STAGE_STATUS: Partial<Record<OutcomeStage, ProspectStatus>> = {
  contacted: "contacted", replied: "replied", positive_reply: "replied", meeting: "meeting", quote: "opportunity", opportunity: "opportunity", won: "won", lost: "lost",
};

/** Feedback loop: what happened after handoff. Feeds future scoring calibration. */
export async function recordOutcome(ctx: Ctx, id: string, e: { stage: OutcomeStage; valueCents?: number; source: OutcomeEvent["source"]; note?: string; occurredAt?: string }): Promise<OutcomeEvent> {
  const p = await getPrivate(ctx.store, "pg_prospects", id, ctx.p, "write_private");
  if (e.valueCents !== undefined && (!Number.isInteger(e.valueCents) || e.valueCents < 0)) throw invalid("Value must be a whole number of cents.");
  const tx = ctx.store.tx();
  const ev = tx.insert("pg_outcomes", { orgId: p.orgId, prospectId: p.id, stage: e.stage, valueCents: e.valueCents, source: e.source, note: e.note?.slice(0, 500), occurredAt: e.occurredAt ?? nowIso() });
  const status = STAGE_STATUS[e.stage];
  if (status) tx.patch("pg_prospects", p, { status });
  audit(tx.audit, principalRef(ctx.p), { action: "prospecting.outcome", orgId: p.orgId, targetType: "prospect", targetId: p.id, correlationId: correlationId(), detail: e.stage });
  await tx.commit();
  return ev;
}

export interface OutcomeStats {
  byBuyerType: { buyerTypeId: string; sent: number; replied: number; meetings: number; won: number }[];
}

/** Outcome rollup per buyer type — the input for future score calibration. */
export async function outcomeStats(ctx: Ctx, orgId: string): Promise<OutcomeStats> {
  assertAllowed(ctx.p, "read_private", orgId);
  const [prospects, outcomes] = await Promise.all([ctx.store.list("pg_prospects", { orgId }), ctx.store.list("pg_outcomes", { orgId })]);
  const by = new Map<string, { sent: number; replied: number; meetings: number; won: number }>();
  const bt = new Map(prospects.filter((p) => p.orgId === orgId).map((p) => [p.id, p.buyerTypeId ?? "unclassified"]));
  for (const p of prospects) {
    if (p.orgId !== orgId) continue;
    const k = p.buyerTypeId ?? "unclassified";
    const x = by.get(k) ?? { sent: 0, replied: 0, meetings: 0, won: 0 };
    if (!["new", "researching", "review", "qualified", "rejected", "exhausted"].includes(p.status)) x.sent++;
    by.set(k, x);
  }
  for (const o of outcomes) {
    if (o.orgId !== orgId) continue;
    const k = bt.get(o.prospectId);
    if (!k) continue;
    const x = by.get(k)!;
    if (o.stage === "replied" || o.stage === "positive_reply") x.replied++;
    if (o.stage === "meeting") x.meetings++;
    if (o.stage === "won") x.won++;
  }
  return { byBuyerType: [...by.entries()].map(([buyerTypeId, v]) => ({ buyerTypeId, ...v })) };
}
