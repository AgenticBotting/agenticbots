import type { ModeledScore, SellsTo, Tier } from "@/lib/prospecting/types";

/**
 * Prospecting Attractiveness Score (0–100) — a MODELED strategic score.
 *
 * It ranks where AgenticBots can most reliably manufacture pipeline
 * (identifiable commercial buyers, recurring/large contracts, public
 * signals, outbound + bid suitability). It is not a market-size fact and
 * the UI says so. Deterministic: same tags + sellsTo → same score, so it is
 * computed once at import and never re-billed to an LLM.
 */
export const NICHE_SCORE_VERSION = "niche-attractiveness/1.0.0";

export const WEIGHTS: Record<string, number> = {
  contractValue: 10,
  commercialBuyerDensity: 9,
  outboundSuitability: 9,
  decisionMakerDiscoverability: 8,
  recurringRevenue: 8,
  lifetimeValue: 7,
  facilityDependence: 7,
  serviceAreaMobility: 6,
  publicSignals: 6,
  buyerConcentration: 6,
  permitSignals: 5,
  bidBoardSuitability: 5,
  urgency: 4,
  regulatoryRecurrence: 4,
  seoDemand: 3,
  ppcDemand: 3,
};

export const COMPONENT_LABELS: Record<string, string> = {
  contractValue: "Contract / job value",
  commercialBuyerDensity: "Commercial buyer density",
  outboundSuitability: "Outbound suitability",
  decisionMakerDiscoverability: "Decision-maker discoverability",
  recurringRevenue: "Recurring revenue",
  lifetimeValue: "Customer lifetime value",
  facilityDependence: "Facility / property dependence",
  serviceAreaMobility: "Service-area mobility",
  publicSignals: "Public buying signals",
  buyerConcentration: "Buyer concentration (low fragmentation)",
  permitSignals: "Permit / project signals",
  bidBoardSuitability: "Bid-board suitability",
  urgency: "Urgency / mandatory service",
  regulatoryRecurrence: "Regulatory / inspection recurrence",
  seoDemand: "SEO demand",
  ppcDemand: "PPC demand",
};

const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));

const BASE: Record<SellsTo, { value: number; density: number; dm: number; outbound: number; concentration: number; bid: number }> = {
  commercial: { value: 7, density: 8, dm: 7, outbound: 8, concentration: 7, bid: 5 },
  industrial: { value: 8, density: 8, dm: 6, outbound: 8, concentration: 7, bid: 4 },
  government: { value: 8, density: 7, dm: 8, outbound: 4, concentration: 8, bid: 10 },
  utility: { value: 9, density: 6, dm: 6, outbound: 5, concentration: 8, bid: 8 },
  mixed: { value: 5.5, density: 6, dm: 5.5, outbound: 6, concentration: 5, bid: 4 },
  agricultural: { value: 5, density: 4, dm: 4, outbound: 5, concentration: 4, bid: 2 },
  residential: { value: 4, density: 1.5, dm: 2.5, outbound: 1.5, concentration: 1.5, bid: 0.5 },
};

export function scoreNiche(tags: string[], sellsTo: SellsTo): ModeledScore {
  const has = (t: string) => tags.includes(t);
  const b = BASE[sellsTo];
  const reasons: string[] = [];
  const consumer = has("consumer_local");
  const field = has("field_service");
  const heavy = ["construction_gc", "sitework_civil", "paving_parking", "equipment_rental"].some(has);
  const buildingTrade = ["roofing", "building_envelope", "mechanical_hvac", "electrical", "plumbing_water", "fire_life_safety", "low_voltage_security", "concrete_masonry", "paving_parking", "interior_finishes", "fencing_site"].some(has);
  const nonResidential = sellsTo !== "residential" && sellsTo !== "agricultural";
  // Commercial building systems are sold on service agreements, not one-off jobs.
  const systemsTrade = nonResidential && ["mechanical_hvac", "electrical", "plumbing_water", "low_voltage_security", "fire_life_safety", "refrigeration"].some(has);
  // "Mixed" trades that commercial properties buy constantly behave like commercial for prospecting.
  const mixedB2b = sellsTo === "mixed" && (buildingTrade || heavy || ["landscaping_grounds", "restoration_remediation", "cleaning_janitorial", "sitework_civil", "pest"].some(has)) ? 1.5 : 0;
  
  const c: Record<string, number> = {};
  c.contractValue = clamp(b.value + (heavy ? 1.5 : 0) + (has("roofing") && sellsTo !== "residential" ? 1.5 : 0) + (has("fire_life_safety") || has("low_voltage_security") ? 0.5 : 0) + (consumer ? -2.5 : 0) + (has("cleaning_janitorial") && !has("restoration_remediation") ? -1 : 0));
  c.commercialBuyerDensity = clamp(b.density + mixedB2b + (has("property_services") ? 1 : 0) + (consumer ? -2 : 0));
  c.outboundSuitability = clamp(b.outbound + mixedB2b + (has("property_services") || has("fire_life_safety") ? 1 : 0) + (consumer ? -2 : 0) + (has("emergency") && sellsTo === "residential" ? -0.5 : 0));
  c.decisionMakerDiscoverability = clamp(b.dm + mixedB2b + (has("property_services") ? 1 : 0) + (consumer ? -1.5 : 0));
  c.recurringRevenue = clamp((has("recurring_service") ? 8.5 : systemsTrade ? 7 : 4) + (has("inspection_compliance") ? 1 : 0) + (has("paving_parking") ? 1.5 : 0) + (has("roofing") ? 1 : 0) + (consumer ? -1 : 0));
  c.facilityDependence = clamp((buildingTrade || has("property_services") || has("landscaping_grounds") || has("cleaning_janitorial") || has("pest") ? 8.5 : 5) + (has("industrial_services") ? 1.5 : 0) + (consumer ? -5 : 0) + (has("professional_b2b") ? -3 : 0) + (sellsTo === "residential" ? -2 : 0));
  c.serviceAreaMobility = clamp(field ? 9 : has("professional_b2b") ? 5 : 2);
  c.publicSignals = clamp((sellsTo === "government" ? 9 : 3) + (heavy ? 4 : 0) + (has("fire_life_safety") ? 3 : 0) + (has("roofing") || has("restoration_remediation") ? 2.5 : 0) + (has("paving_parking") ? 2 : 0) + (consumer ? -2 : 0));
  c.buyerConcentration = clamp(b.concentration + mixedB2b + (has("property_services") || has("paving_parking") ? 1 : 0) + (consumer ? -1 : 0));
  c.permitSignals = clamp((heavy ? 9 : 2) + (has("roofing") ? 6 : 0) + (has("electrical") || has("mechanical_hvac") || has("plumbing_water") ? 4.5 : 0) + (has("pool_water_features") || has("concrete_masonry") || has("fire_life_safety") ? 4.5 : 0) + (consumer ? -2 : 0));
  c.bidBoardSuitability = clamp(b.bid + (heavy ? 3 : 0) + (has("fire_life_safety") || has("cleaning_janitorial") || has("landscaping_grounds") || has("security_services") ? 2 : 0) + (consumer ? -3 : 0));
  c.urgency = clamp((has("emergency") ? 8 : 4) + (has("inspection_compliance") ? 2 : 0) + (has("restoration_remediation") ? 1 : 0));
  c.regulatoryRecurrence = clamp(has("inspection_compliance") ? 9.5 : has("fire_life_safety") ? 9 : has("restoration_remediation") ? 5 : 2);
  c.seoDemand = clamp((sellsTo === "residential" || sellsTo === "mixed" ? 8 : 6) + (has("emergency") ? 1.5 : 0) + (sellsTo === "industrial" || sellsTo === "government" ? -2 : 0));
  c.ppcDemand = clamp((sellsTo === "residential" || sellsTo === "mixed" ? 8 : 5.5) + (has("emergency") ? 1.5 : 0) + (sellsTo === "government" ? -3 : 0));
  c.lifetimeValue = clamp((c.recurringRevenue + c.contractValue) / 2);

  let total = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) total += (c[k] / 10) * w;
  total = Math.round(total);

  // Always say what drove the number, weighted by importance.
  const ranked = Object.keys(WEIGHTS).sort((x, y) => c[y] * WEIGHTS[y] - c[x] * WEIGHTS[x]);
  const label = (k: string) => (COMPONENT_LABELS[k] ?? k).toLowerCase();
  reasons.push(`Driven by ${ranked.slice(0, 3).map(label).join(", ")}; weakest on ${Object.keys(WEIGHTS).sort((x, y) => c[x] - c[y] || WEIGHTS[y] - WEIGHTS[x]).slice(0, 2).map(label).join(" and ")}.`);
  if (consumer) reasons.push("Storefront / consumer-local business: deprioritized for V1 prospecting.");
  if (sellsTo === "residential") reasons.push("Sells mainly to homeowners: few identifiable commercial decision makers.");
  if (heavy) reasons.push("Construction/site trade: permits, bid boards and GCs make buyers discoverable.");
  if (has("fire_life_safety") || has("inspection_compliance")) reasons.push("Mandatory inspection cycles create recurring, schedulable demand.");
  if (has("recurring_service")) reasons.push("Recurring service contract potential.");
  if (systemsTrade) reasons.push("Commercial building systems sell on preventive-maintenance agreements.");
  if (mixedB2b) reasons.push("Mixed residential/commercial trade that commercial properties buy routinely.");
  if (has("roofing") && sellsTo !== "residential") reasons.push("Commercial roofing: high contract values and property-manager buyers.");
  if (has("paving_parking")) reasons.push("Every shopping center, office park and HOA owns pavement on a maintenance cycle.");
  if (has("property_services")) reasons.push("Buyers concentrate in property/facility management portfolios.");
  if (sellsTo === "government") reasons.push("Public procurement: bid boards are the discovery channel.");

  const explicit = tags.filter((t) => !["field_service", "residential_home", "consumer_local"].includes(t)).length;
  const confidence = Math.round(Math.min(0.9, 0.45 + explicit * 0.1) * 100) / 100;
  if (explicit === 0) reasons.push("Scored mostly from category defaults — review recommended.");

  return { total, components: c, weights: WEIGHTS, reasoning: reasons, confidence, version: NICHE_SCORE_VERSION };
}

export const TIER_THRESHOLDS = { A: 65, B: 50 } as const;

export function tierOf(total: number): Tier {
  return total >= TIER_THRESHOLDS.A ? "A" : total >= TIER_THRESHOLDS.B ? "B" : "C";
}
