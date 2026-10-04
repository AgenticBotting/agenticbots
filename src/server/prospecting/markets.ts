import "server-only";
import type { ClientIcp, Geography, Market, RoleFamily } from "@/lib/prospecting/types";
import { audit } from "@/server/services/common";
import { correlationId, nowIso } from "@/server/ids";
import { invalid, notFound } from "@/server/errors";
import { allowed, assertAllowed, getPrivate, principalRef, type Ctx } from "./access";

/**
 * ICPs and Markets — PRIVATE client intelligence (orgId on every row).
 *
 * A Market = one niche × one geography × the buyer types worth targeting,
 * optionally derived from the client's ICP. Coverage is reported as
 * OBSERVED counts; a universe size is shown only when someone recorded one
 * WITH a methodology, and it is always labeled "Estimated".
 */
export const US_STATES = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" "));

export function validateGeography(g: Geography): Geography {
  const state = g.state?.trim().toUpperCase();
  if (!state || !US_STATES.has(state)) throw invalid("Choose a valid two-letter US state.");
  const name = g.name?.trim();
  if (!name) throw invalid("Geography needs a name (county, city, metro or ZIP).");
  const zips = (g.zips ?? []).map((z) => z.trim()).filter((z) => /^\d{5}$/.test(z)).slice(0, 200);
  return { kind: g.kind, name, state, ...(zips.length ? { zips } : {}), ...(g.radiusMiles ? { radiusMiles: Math.min(250, Math.max(1, g.radiusMiles)) } : {}) };
}

export interface IcpInput {
  name: string;
  nicheIds: string[];
  services?: string[];
  geographies: Geography[];
  minOpportunityUsd?: number;
  preferredBuyerTypeIds?: string[];
  excludedBuyerTypeIds?: string[];
  exclusions?: string[];
  decisionMakerRoleFamilies?: RoleFamily[];
  notes?: string;
}

export async function createIcp(ctx: Ctx, orgId: string, input: IcpInput): Promise<ClientIcp> {
  assertAllowed(ctx.p, "write_private", orgId);
  if (!(await ctx.r.get("organizations", orgId))) throw notFound("Client");
  const name = input.name?.trim();
  if (!name) throw invalid("Give the ICP a name.");
  if (!input.nicheIds.length) throw invalid("Choose at least one service niche.");
  for (const id of input.nicheIds) if (!(await ctx.store.get("pg_niches", id))) throw invalid("Unknown niche.");
  for (const id of [...(input.preferredBuyerTypeIds ?? []), ...(input.excludedBuyerTypeIds ?? [])]) {
    if (!(await ctx.store.get("pg_buyer_types", id))) throw invalid("Unknown buyer type.");
  }
  const who = principalRef(ctx.p);
  const tx = ctx.store.tx();
  const icp = tx.insert("pg_icps", {
    orgId,
    name: name.slice(0, 120),
    nicheIds: [...new Set(input.nicheIds)],
    services: (input.services ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 30),
    geographies: input.geographies.map(validateGeography),
    minOpportunityUsd: input.minOpportunityUsd,
    preferredBuyerTypeIds: [...new Set(input.preferredBuyerTypeIds ?? [])],
    excludedBuyerTypeIds: [...new Set(input.excludedBuyerTypeIds ?? [])],
    exclusions: (input.exclusions ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 50),
    decisionMakerRoleFamilies: input.decisionMakerRoleFamilies ?? [],
    notes: input.notes?.slice(0, 2000),
    status: "active",
    createdBy: who.id,
  });
  audit(tx.audit, who, { action: "prospecting.icp.create", orgId, targetType: "icp", targetId: icp.id, correlationId: correlationId() });
  await tx.commit();
  return icp;
}

export async function listIcps(ctx: Ctx, orgId: string): Promise<ClientIcp[]> {
  assertAllowed(ctx.p, "read_private", orgId);
  return ctx.store.list("pg_icps", { orgId });
}

export interface MarketInput {
  nicheId: string;
  geography: Geography;
  icpId?: string;
  buyerTypeIds?: string[];
  name?: string;
}

/** Default buyer types: approved, direct relationships for the niche, shaped by the ICP. */
export async function defaultBuyerTypes(ctx: Ctx, nicheId: string, icp?: ClientIcp): Promise<string[]> {
  const rels = (await ctx.store.list("pg_relationships", { where: { nicheId } }))
    .filter((x) => (x.status === "approved" || x.status === "auto_approved") && x.relationshipType !== "referral")
    .sort((a, b) => a.priority - b.priority || b.confidence - a.confidence);
  let ids = rels.map((x) => x.buyerTypeId);
  if (icp) {
    ids = ids.filter((id) => !icp.excludedBuyerTypeIds.includes(id));
    const preferred = icp.preferredBuyerTypeIds.filter((id) => ids.includes(id));
    if (preferred.length) return preferred;
  }
  return ids.slice(0, 8);
}

export async function createMarket(ctx: Ctx, orgId: string, input: MarketInput): Promise<Market> {
  assertAllowed(ctx.p, "write_private", orgId);
  const niche = await ctx.store.get("pg_niches", input.nicheId);
  if (!niche) throw invalid("Unknown niche.");
  const icp = input.icpId ? await getPrivate(ctx.store, "pg_icps", input.icpId, ctx.p, "write_private") : undefined;
  if (icp && icp.orgId !== orgId) throw notFound();
  const geography = validateGeography(input.geography);
  const buyerTypeIds = input.buyerTypeIds?.length ? [...new Set(input.buyerTypeIds)] : await defaultBuyerTypes(ctx, niche.id, icp);
  for (const id of buyerTypeIds) if (!(await ctx.store.get("pg_buyer_types", id))) throw invalid("Unknown buyer type.");
  if (buyerTypeIds.length === 0) throw invalid("This niche has no approved buyer types yet — review its relationships first.");
  const who = principalRef(ctx.p);
  const tx = ctx.store.tx();
  const market = tx.insert("pg_markets", {
    orgId,
    icpId: icp?.id,
    nicheId: niche.id,
    geography,
    buyerTypeIds,
    name: (input.name?.trim() || `${niche.name} — ${geography.name}, ${geography.state}`).slice(0, 160),
    status: "active",
    discovery: [],
    createdBy: who.id,
  });
  audit(tx.audit, who, { action: "prospecting.market.create", orgId, targetType: "market", targetId: market.id, correlationId: correlationId(), detail: market.name });
  await tx.commit();
  return market;
}

export async function listMarkets(ctx: Ctx, orgId?: string): Promise<Market[]> {
  if (orgId) {
    assertAllowed(ctx.p, "read_private", orgId);
    return ctx.store.list("pg_markets", { orgId });
  }
  // All markets: operators only; filtered to the orgs they cover.
  assertAllowed(ctx.p, "read_shared");
  if (ctx.p.kind === "bot") return [];
  const all = await ctx.store.list("pg_markets");
  return all.filter((m) => allowed(ctx.p, "read_private", m.orgId));
}

export async function setUniverseEstimate(ctx: Ctx, marketId: string, count: number, methodology: string): Promise<Market> {
  const m = await getPrivate(ctx.store, "pg_markets", marketId, ctx.p, "write_private");
  if (ctx.p.kind === "bot") throw invalid("Estimates are recorded by a person.");
  if (!Number.isInteger(count) || count < 0) throw invalid("Enter a whole number.");
  if (methodology.trim().length < 20) throw invalid("Describe how the estimate was made (at least a sentence).");
  const tx = ctx.store.tx();
  const next = tx.patch("pg_markets", m, { universeEstimate: { count, methodology: methodology.trim().slice(0, 1000), version: "estimate/manual-1", estimatedAt: nowIso() } });
  audit(tx.audit, principalRef(ctx.p), { action: "prospecting.market.estimate", orgId: m.orgId, targetType: "market", targetId: m.id, correlationId: correlationId(), detail: String(count) });
  await tx.commit();
  return next;
}

export interface MarketCoverage {
  observed: {
    companies: number;
    prospects: number;
    withDecisionMaker: number;
    withContact: number;
    verified: number;
    qualified: number;
    inReview: number;
    rejected: number;
    sentToOutbound: number;
  };
  byBuyerType: { buyerTypeId: string; name: string; companies: number; qualified: number; sources: { provider: string; exhausted: boolean; runs: number; companiesSeen: number }[] }[];
  /** Only present when recorded with a methodology. */
  estimate?: Market["universeEstimate"];
  exhaustion: { state: "not_started" | "in_progress" | "sources_exhausted"; note: string };
  methodology: string;
}

export async function marketCoverage(ctx: Ctx, marketId: string): Promise<MarketCoverage> {
  const m = await getPrivate(ctx.store, "pg_markets", marketId, ctx.p);
  const prospects = (await ctx.store.list("pg_prospects", { orgId: m.orgId, where: { marketId } })).filter((p) => p.marketId === marketId);
  const contacts = await Promise.all(prospects.map((p) => (p.primaryContactPointId ? ctx.store.get("pg_contact_points", p.primaryContactPointId) : null)));
  const buyers = await Promise.all(m.buyerTypeIds.map((id) => ctx.store.get("pg_buyer_types", id)));
  const status = (s: string) => prospects.filter((p) => p.status === s).length;
  const sources = m.discovery;
  const anyRun = sources.some((s) => s.runs > 0);
  const allDone = m.buyerTypeIds.length > 0 && m.buyerTypeIds.every((b) => {
    const ss = sources.filter((s) => s.buyerTypeId === b);
    return ss.length > 0 && ss.every((s) => s.exhausted);
  });
  return {
    observed: {
      companies: new Set(prospects.map((p) => p.companyId)).size,
      prospects: prospects.length,
      withDecisionMaker: prospects.filter((p) => p.decisionMakerIds.length > 0).length,
      withContact: contacts.filter(Boolean).length,
      verified: contacts.filter((c) => c?.status === "VERIFIED").length,
      qualified: status("qualified"),
      inReview: status("review"),
      rejected: status("rejected"),
      sentToOutbound: prospects.filter((p) => ["sent_to_outbound", "contacted", "replied", "meeting", "opportunity", "won", "lost"].includes(p.status)).length,
    },
    byBuyerType: m.buyerTypeIds.map((id, i) => {
      const ps = prospects.filter((p) => p.buyerTypeId === id);
      return {
        buyerTypeId: id,
        name: buyers[i]?.name ?? "Unknown",
        companies: ps.length,
        qualified: ps.filter((p) => p.status === "qualified").length,
        sources: sources.filter((s) => s.buyerTypeId === id).map((s) => ({ provider: s.provider, exhausted: s.exhausted, runs: s.runs, companiesSeen: s.companiesSeen })),
      };
    }),
    estimate: m.universeEstimate,
    exhaustion: !anyRun
      ? { state: "not_started", note: "No discovery has run yet." }
      : allDone
        ? { state: "sources_exhausted", note: "Every connected source reported no further results for every buyer type. Other sources may still hold more." }
        : { state: "in_progress", note: "At least one source still has more results." },
    methodology: "Observed = records actually found by discovery in this market. A source is 'exhausted' only when it reported no further results. The universe size is shown only if someone recorded an estimate with its method.",
  };
}
