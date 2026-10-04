import type { BuyerType, NicheBuyerRelationship, RelationshipType, RoleFamily, ServiceNiche } from "@/lib/prospecting/types";
import { NEEDS, ROLE_FAMILIES_FOR_TAG, TAXONOMY_VERSION } from "./taxonomy";
import { titleMatch } from "./titles";

/**
 * Proposes niche ↔ buyer relationships WITHOUT a Cartesian product.
 *
 * For each niche we only consider buyers whose facility tags answer one of
 * the niche's needs (taxonomy.NEEDS), gated by Sells To. Each candidate
 * gets a confidence from the strongest matching need, adjusted for buyer
 * kind and sells-to alignment. Results are capped per niche.
 *
 *   confidence ≥ AUTO_APPROVE  and a direct commercial buyer → auto_approved
 *   otherwise (referral, consumer edge cases, weaker fits)    → needs_review
 *
 * An LLM is NOT called here. The `AmbiguityClassifier` seam lets one be
 * added later for needs_review rows only — never for approved rows.
 */
export const RELATIONSHIP_VERSION = `relationships/1.0.0+${TAXONOMY_VERSION}`;
export const AUTO_APPROVE = 0.72;
export const MIN_CONFIDENCE = 0.45;
export const MAX_PER_NICHE = 40;
/** Referral sources are ranked separately so direct buyers never crowd them out. */
export const MAX_REFERRAL_PER_NICHE = 6;

export type ProposedRelationship = Omit<NicheBuyerRelationship, "id" | "createdAt" | "updatedAt" | "version" | "status" | "source" | "reviewedBy" | "reviewedAt" | "reviewNote"> & {
  status: "auto_approved" | "needs_review";
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function allowedByKind(niche: ServiceNiche, buyer: BuyerType): { ok: boolean; factor: number; note?: string } {
  const residential = niche.sellsTo === "residential";
  if (buyer.buyerKind === "consumer") {
    if (residential) return { ok: true, factor: 1 };
    if (niche.sellsTo === "mixed") return { ok: true, factor: 0.85 };
    return { ok: false, factor: 0 };
  }
  if (residential) {
    // Residential trades still sell to communities and small landlords.
    if (buyer.buyerKind === "community") return { ok: true, factor: 0.85 };
    if (buyer.buyerKind === "referral") return { ok: true, factor: 0.8 };
    if (buyer.tags.includes("residential_units")) return { ok: true, factor: 0.7 };
    return { ok: false, factor: 0 };
  }
  if (buyer.buyerKind === "referral") return { ok: true, factor: 0.8, note: "Referral source, not the end buyer." };
  if (niche.sellsTo === "government" && buyer.buyerKind !== "institutional" && !buyer.tags.includes("construction_buyer")) {
    return { ok: true, factor: 0.75 };
  }
  // Public buyers purchase through procurement: real, but slower to reach.
  if (niche.sellsTo !== "government" && buyer.tags.includes("procurement")) {
    return { ok: true, factor: 0.9, note: "Public buyer: usually purchases through formal procurement." };
  }
  return { ok: true, factor: 1 };
}

function buyingMotion(niche: ServiceNiche, type: RelationshipType): NicheBuyerRelationship["buyingMotion"] {
  if (type === "referral") return "referral";
  if (type === "bid") return "bid_procurement";
  if (niche.tags.includes("inspection_compliance")) return "inspection_compliance";
  if (niche.tags.includes("recurring_service")) return "recurring_service";
  if (niche.tags.includes("emergency") && niche.tags.includes("restoration_remediation")) return "emergency";
  return "project";
}

export function roleFamiliesForNiche(niche: ServiceNiche): RoleFamily[] {
  const fams = new Set<string>();
  for (const t of niche.tags) for (const f of ROLE_FAMILIES_FOR_TAG[t] ?? []) fams.add(f);
  if (fams.size === 0) for (const f of ROLE_FAMILIES_FOR_TAG.default) fams.add(f);
  return [...fams] as RoleFamily[];
}

export function proposeForNiche(niche: ServiceNiche, buyers: BuyerType[]): ProposedRelationship[] {
  const needs = niche.tags.flatMap((t) => (NEEDS[t] ?? []).map((n) => ({ ...n, nicheTag: t })));
  if (needs.length === 0) return [];
  const families = roleFamiliesForNiche(niche);
  const out: ProposedRelationship[] = [];

  for (const buyer of buyers) {
    const gate = allowedByKind(niche, buyer);
    if (!gate.ok) continue;
    const hits = needs.filter((n) => buyer.tags.includes(n.buyerTag));
    if (hits.length === 0) continue;
    hits.sort((a, b) => b.strength - a.strength);
    const best = hits[0];
    // Independent needs corroborate (max +0.06).
    const corroboration = Math.min(0.06, (new Set(hits.map((h) => h.buyerTag)).size - 1) * 0.02);
    // Portfolio owners/managers buy for many properties at once — the
    // concentration AgenticBots prospecting is built around.
    const portfolio = buyer.tags.includes("portfolio_owner") && ["owns_buildings", "residential_units", "has_parking", "has_grounds"].includes(best.buyerTag) ? 0.06 : 0;
    const confidence = round2(Math.min(0.97, best.strength * gate.factor + corroboration + portfolio));
    if (confidence < MIN_CONFIDENCE) continue;

    const relevantTitles = buyer.decisionMakerTitles.filter((t) => titleMatch(t, families) > 0);
    const titles = relevantTitles.length > 0 ? relevantTitles : buyer.decisionMakerTitles;
    const relType: RelationshipType = buyer.buyerKind === "referral" ? "referral" : buyer.buyerKind === "consumer" ? "residential" : best.type;
    const recurring = niche.attractiveness.components.recurringRevenue ?? 5;
    const value = niche.attractiveness.components.contractValue ?? 5;

    const reasoning = [
      `${niche.name} sells into ${best.buyerTag.replace(/_/g, " ")} (${best.nicheTag.replace(/_/g, " ")}).`,
      ...(hits.length > 1 ? [`Also matches: ${[...new Set(hits.slice(1).map((h) => h.buyerTag.replace(/_/g, " ")))].join(", ")}.`] : []),
      ...(portfolio ? ["Portfolio owner/manager: one relationship covers many properties."] : []),
      ...(gate.note ? [gate.note] : []),
      relevantTitles.length > 0
        ? `Decision makers: ${relevantTitles.join(", ")}.`
        : "No title matched the niche's usual role families — kept all titles; review.",
    ];

    const direct = relType !== "referral" && buyer.buyerKind !== "consumer";
    out.push({
      nicheId: niche.id,
      buyerTypeId: buyer.id,
      priority: confidence >= 0.85 ? 1 : confidence >= 0.75 ? 2 : confidence >= 0.65 ? 3 : confidence >= 0.55 ? 4 : 5,
      confidence,
      relationshipType: relType,
      relevantDecisionMakerTitles: titles,
      relevantRoleFamilies: families,
      buyingMotion: buyingMotion(niche, relType),
      recurringPotential: recurring,
      contractValuePotential: value,
      outboundSuitability: direct ? (niche.attractiveness.components.outboundSuitability ?? 5) : 3,
      bidBoardSuitability: buyer.tags.includes("procurement") ? 9 : relType === "subcontract" ? 6 : 2,
      seoSuitability: niche.attractiveness.components.seoDemand ?? 5,
      ppcSuitability: niche.attractiveness.components.ppcDemand ?? 5,
      publicSignalAvailability: buyer.tags.includes("procurement") ? 9 : buyer.tags.includes("construction_buyer") || buyer.tags.includes("land_development") ? 8 : buyer.tags.includes("owns_buildings") ? 6 : 3,
      status: direct && confidence >= AUTO_APPROVE && relevantTitles.length > 0 ? "auto_approved" : "needs_review",
      reasoning,
      generatorVersion: RELATIONSHIP_VERSION,
    });
  }
  const kindRank = (id: string) => {
    const k = buyers.find((b) => b.id === id)?.buyerKind;
    return k === "commercial" ? 0 : k === "community" ? 1 : k === "institutional" ? 2 : k === "consumer" ? 3 : 4;
  };
  const ranked = out.sort((a, b) => b.confidence - a.confidence || kindRank(a.buyerTypeId) - kindRank(b.buyerTypeId) || a.buyerTypeId.localeCompare(b.buyerTypeId));
  return [
    ...ranked.filter((r) => r.relationshipType !== "referral").slice(0, MAX_PER_NICHE),
    ...ranked.filter((r) => r.relationshipType === "referral").slice(0, MAX_REFERRAL_PER_NICHE),
  ];
}

/** Seam for a future LLM pass on needs_review rows only. Default: no-op. */
export interface AmbiguityClassifier {
  classify(rel: ProposedRelationship, niche: ServiceNiche, buyer: BuyerType): Promise<{ confidence: number; note: string } | null>;
}
export const NO_LLM: AmbiguityClassifier = { classify: async () => null };
