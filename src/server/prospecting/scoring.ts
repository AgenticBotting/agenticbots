import type {
  BuyerType, ClientIcp, Company, CompanyPerson, ContactPoint, Market, NicheBuyerRelationship, ProspectScore, ScoreComponent, ServiceNiche, Signal, SignalType,
} from "@/lib/prospecting/types";
import { titleMatch } from "./ontology/titles";

/**
 * Fit, Timing and Priority — deterministic and explainable.
 *
 * Same inputs + same `asOf` → identical score (no clock reads, no
 * randomness). Every component records its evidence and whether it was
 * OBSERVED; a component with no evidence scores 0 — it is never guessed.
 *
 *   FIT (0–100)       is this the right kind of buyer, here, at this size,
 *                     with a reachable decision maker?
 *   TIMING (0–100)    observed "why now" signals, decayed by age
 *   PRIORITY (0–100)  0.6·Fit + 0.3·Timing + 0.1·niche attractiveness
 */
export const PROSPECT_SCORE_VERSION = "prospect-score/1.0.0";

export interface ScoreInput {
  company: Company;
  niche: ServiceNiche;
  market: Market;
  icp?: ClientIcp;
  buyerType?: BuyerType;
  relationship?: NicheBuyerRelationship;
  decisionMakers: CompanyPerson[];
  contact?: ContactPoint;
  signals: Signal[];
  asOf: Date;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Signal weight by type: how strongly it implies a near-term purchase. */
export const SIGNAL_WEIGHT: Record<SignalType, number> = {
  bid_posting: 45, procurement_notice: 45, building_permit: 40, construction_project: 38, contract_expiration: 38,
  weather_event: 35, capital_improvement: 34, property_acquisition: 32, management_change: 30, ownership_change: 30,
  inspection_cycle: 30, financed_project: 30, renovation: 30, tenant_improvement: 30, new_facility: 30,
  visible_deterioration: 28, new_location: 26, expansion: 24, facilities_hiring: 24, infrastructure_funding: 20,
  negative_reviews: 16, hiring: 12, website_indicator: 10, client_specific: 20,
};
export const SIGNAL_HALF_LIFE_DAYS = 45;

function geographyComponent(company: Company, market: Market): ScoreComponent {
  const g = market.geography;
  const locs = company.locations;
  const max = 15;
  if (locs.length === 0) return { key: "geography", label: "In the market", points: 0, max, evidence: "No location on record.", observed: false };
  const inState = locs.some((l) => l.state === g.state);
  const exact = locs.some((l) =>
    l.state === g.state && (
      (g.kind === "county" && l.county?.toLowerCase() === g.name.toLowerCase()) ||
      (g.kind === "city" && l.city?.toLowerCase() === g.name.toLowerCase()) ||
      (g.kind === "zip" && !!l.zip && (g.zips ?? [g.name]).includes(l.zip)) ||
      (g.kind === "state") ||
      (!!g.zips?.length && !!l.zip && g.zips.includes(l.zip))
    ));
  if (exact) return { key: "geography", label: "In the market", points: max, max, evidence: `Located in ${g.name}, ${g.state}.`, observed: true };
  if (inState) return { key: "geography", label: "In the market", points: 8, max, evidence: `In ${g.state}; ${g.name} not confirmed.`, observed: true };
  return { key: "geography", label: "In the market", points: 0, max, evidence: "Outside the market geography.", observed: true };
}

function scaleComponent(company: Company): ScoreComponent {
  const max = 15;
  if (company.portfolioSize) {
    const pts = Math.min(max, 6 + Math.log2(company.portfolioSize) * 2);
    return { key: "scale", label: "Size / portfolio", points: r1(pts), max, evidence: `Portfolio of ${company.portfolioSize} properties (reported).`, observed: true };
  }
  if (company.locationCount && company.locationCount > 1) {
    return { key: "scale", label: "Size / portfolio", points: r1(Math.min(max, 5 + Math.log2(company.locationCount) * 2.5)), max, evidence: `${company.locationCount} locations (reported).`, observed: true };
  }
  const band: Record<string, number> = { "1-10": 4, "11-50": 7, "51-200": 10, "201-500": 12, "501-1000": 13, "1001+": 14 };
  if (company.employeeRange && band[company.employeeRange] !== undefined) {
    return { key: "scale", label: "Size / portfolio", points: band[company.employeeRange], max, evidence: `${company.employeeRange} employees (reported).`, observed: true };
  }
  return { key: "scale", label: "Size / portfolio", points: 0, max, evidence: "Size not known.", observed: false };
}

export function scoreProspect(i: ScoreInput): ProspectScore {
  const fit: ScoreComponent[] = [];
  const rel = i.relationship;
  const excluded = !!i.buyerType && !!i.icp?.excludedBuyerTypeIds.includes(i.buyerType.id);
  const preferred = !!i.buyerType && !!i.icp?.preferredBuyerTypeIds.includes(i.buyerType.id);

  // 1. Buyer type (30)
  if (!i.buyerType) fit.push({ key: "buyer_type", label: "Right kind of buyer", points: 0, max: 30, evidence: "Buyer type not classified.", observed: false });
  else if (excluded) fit.push({ key: "buyer_type", label: "Right kind of buyer", points: 0, max: 30, evidence: `${i.buyerType.name} is excluded by the client's ICP.`, observed: true });
  else if (!rel || rel.status === "rejected") fit.push({ key: "buyer_type", label: "Right kind of buyer", points: 0, max: 30, evidence: `${i.buyerType.name} is not a mapped buyer for ${i.niche.name}.`, observed: true });
  else {
    const pts = Math.min(30, rel.confidence * 27 + (preferred ? 3 : 0));
    fit.push({ key: "buyer_type", label: "Right kind of buyer", points: r1(pts), max: 30, evidence: `${i.buyerType.name}: a core buyer of ${i.niche.name.toLowerCase()} (${Math.round(rel.confidence * 100)}% relationship confidence${preferred ? ", preferred by ICP" : ""}).`, observed: true });
  }
  // 2. Geography (15), 3. Scale (15)
  fit.push(geographyComponent(i.company, i.market));
  fit.push(scaleComponent(i.company));
  // 4. Decision maker (20)
  const families = rel?.relevantRoleFamilies ?? i.icp?.decisionMakerRoleFamilies ?? [];
  const best = i.decisionMakers
    .map((d) => ({ d, m: titleMatch(d.title, families) }))
    .sort((a, b) => b.m - a.m || b.d.employmentConfidence - a.d.employmentConfidence)[0];
  if (!best || best.m === 0) fit.push({ key: "decision_maker", label: "Decision maker found", points: 0, max: 20, evidence: "No matching decision maker yet.", observed: false });
  else {
    const seniority = { owner_c_level: 1, vp: 1, director: 0.95, manager: 0.85, individual: 0.6, unknown: 0.6 }[best.d.seniority];
    fit.push({ key: "decision_maker", label: "Decision maker found", points: r1(20 * best.m * seniority * Math.max(0.5, best.d.employmentConfidence)), max: 20, evidence: `Decision maker: ${best.d.title}.`, observed: true });
  }
  // 5. Contactability (10)
  const cpts = { VERIFIED: 10, LIKELY_VALID: 7, CATCH_ALL: 4, RISKY: 2, INVALID: 0, UNKNOWN: 0 } as const;
  fit.push(i.contact
    ? { key: "contactability", label: "Reachable", points: cpts[i.contact.status], max: 10, evidence: `Work email ${i.contact.status.toLowerCase().replace("_", "-")}.`, observed: true }
    : { key: "contactability", label: "Reachable", points: 0, max: 10, evidence: "No work email yet.", observed: false });
  // 6. Data quality (10)
  const dq = i.company.identityConfidence * 5 + (i.company.domain ? 2.5 : 0) + (i.company.phone || i.company.website ? 2.5 : 0);
  fit.push({ key: "data_quality", label: "Record quality", points: r1(Math.min(10, dq)), max: 10, evidence: `Identity ${Math.round(i.company.identityConfidence * 100)}%${i.company.domain ? ", domain known" : ""}.`, observed: true });

  const fitTotal = excluded ? 0 : Math.round(fit.reduce((s, c) => s + c.points, 0));

  // TIMING — observed signals only, decayed by age.
  const timing: ScoreComponent[] = [];
  const asOf = i.asOf.getTime();
  const relevant = i.signals
    .filter((s) => Date.parse(s.observedAt) <= asOf && Date.parse(s.expiresAt) > asOf)
    .filter((s) => s.nicheTags.length === 0 || s.nicheTags.some((t) => i.niche.tags.includes(t)));
  for (const s of relevant) {
    const ageDays = (asOf - Date.parse(s.observedAt)) / 86_400_000;
    const decay = Math.pow(0.5, ageDays / SIGNAL_HALF_LIFE_DAYS);
    const pts = SIGNAL_WEIGHT[s.type] * s.relevance * s.confidence * decay;
    timing.push({ key: `signal:${s.id}`, label: s.type.replace(/_/g, " "), points: r1(pts), max: SIGNAL_WEIGHT[s.type], evidence: `${s.summary} (${Math.round(ageDays)} days ago).`, observed: true });
  }
  timing.sort((a, b) => b.points - a.points || a.key.localeCompare(b.key));
  if (timing.length === 0) timing.push({ key: "no_signal", label: "Why now", points: 0, max: 100, evidence: "No observed timing signal.", observed: false });
  const timingTotal = Math.min(100, Math.round(timing.reduce((s, c) => s + c.points, 0)));

  const priority = Math.round(0.6 * fitTotal + 0.3 * timingTotal + 0.1 * i.niche.attractiveness.total);

  const reasons: string[] = [];
  // Plain-English order a client reads: who they are, who to talk to, size, where, reachability.
  const ORDER = ["buyer_type", "decision_maker", "scale", "geography", "contactability"];
  for (const k of ORDER) {
    const c = fit.find((x) => x.key === k);
    if (c && c.observed && c.points > 0) reasons.push(c.evidence);
  }
  // Observed "why now" leads.
  reasons.unshift(...timing.filter((c) => c.observed && c.points >= 5).slice(0, 2).map((c) => c.evidence));
  return {
    fit: fitTotal,
    timing: timingTotal,
    priority,
    fitComponents: fit,
    timingComponents: timing,
    reasons: reasons.slice(0, 7),
    version: PROSPECT_SCORE_VERSION,
    scoredAt: i.asOf.toISOString(),
  };
}

/* ── Qualification ── */

export interface QualificationRules {
  minFit: number;
  reviewFit: number;
  requireDecisionMaker: boolean;
}

export const DEFAULT_QUALIFICATION: QualificationRules = { minFit: 60, reviewFit: 45, requireDecisionMaker: true };

export function qualify(score: ProspectScore, hasDecisionMaker: boolean, contactStatus: ContactPoint["status"] | undefined, rules: QualificationRules = DEFAULT_QUALIFICATION): { decision: "qualified" | "review" | "rejected"; reasons: string[] } {
  const reasons: string[] = [];
  if (score.fit < rules.reviewFit) return { decision: "rejected", reasons: [`Fit ${score.fit} is below ${rules.reviewFit}.`] };
  // Only a verified or likely-valid address can go to outreach without a person checking it.
  if (contactStatus === undefined) reasons.push("No work email yet.");
  else if (contactStatus !== "VERIFIED" && contactStatus !== "LIKELY_VALID") reasons.push(`The work email is ${contactStatus.toLowerCase().replace("_", "-")} — needs a person to check it.`);
  if (rules.requireDecisionMaker && !hasDecisionMaker) reasons.push("No decision maker found yet.");
  if (score.fit < rules.minFit) reasons.push(`Fit ${score.fit} is below the ${rules.minFit} qualification bar.`);
  if (reasons.length) return { decision: "review", reasons };
  return { decision: "qualified", reasons: [`Fit ${score.fit} meets the ${rules.minFit} bar with a decision maker.`] };
}
