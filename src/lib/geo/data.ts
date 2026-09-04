import { CitySchema, LocalServiceSchema, type City, type LocalService } from "./schema";

/**
 * Tier 0 — 12 metros, 4 services (48 city pages + hubs).
 * Held here deliberately (see docs/SEO-ARCHITECTURE.md): a fresh domain
 * launching thousands of near-identical pages is the scaled-content-abuse
 * profile. Expansion is gated on Tier-0 indexing signal.
 *
 * Population/business figures are public-source estimates; CPC bands are
 * estimated ranges for local-service verticals. Pages disclose this.
 */

const CITIES_RAW = [
  { slug: "miami", name: "Miami", stateSlug: "florida", stateName: "Florida", stateAbbr: "FL",
    metroPopulation: 6_100_000, businessCount: 730_000,
    industries: ["hospitality", "construction", "healthcare", "real estate", "logistics"],
    cpcBand: [6, 28] as [number, number], competition: "saturated" as const, timezone: "America/New_York",
    nearby: ["fort-lauderdale", "west-palm-beach", "orlando"],
    localNote: "Miami's service market is bilingual by default — ad copy, intake flows and follow-up sequences that only run in English leave measurable volume on the table, and seasonal demand swings around hurricane season are sharp enough to need budget pacing rules of their own." },
  { slug: "fort-lauderdale", name: "Fort Lauderdale", stateSlug: "florida", stateName: "Florida", stateAbbr: "FL",
    metroPopulation: 1_950_000, businessCount: 240_000,
    industries: ["marine services", "construction", "hospitality", "healthcare"],
    cpcBand: [5, 22] as [number, number], competition: "high" as const, timezone: "America/New_York",
    nearby: ["miami", "west-palm-beach"],
    localNote: "Broward's marine-services cluster is unusual: yacht maintenance, dock construction and marina trades carry ticket sizes closer to commercial than residential work, which changes what a lead is worth and how hard follow-up should push." },
  { slug: "west-palm-beach", name: "West Palm Beach", stateSlug: "florida", stateName: "Florida", stateAbbr: "FL",
    metroPopulation: 1_530_000, businessCount: 210_000,
    industries: ["construction", "healthcare", "financial services", "hospitality"],
    cpcBand: [5, 24] as [number, number], competition: "high" as const, timezone: "America/New_York",
    nearby: ["fort-lauderdale", "miami"],
    localNote: "Palm Beach County splits into two markets wearing one zip prefix — coastal high-ticket residential and inland volume work — and campaigns that don't separate them pay coastal CPCs for inland jobs." },
  { slug: "orlando", name: "Orlando", stateSlug: "florida", stateName: "Florida", stateAbbr: "FL",
    metroPopulation: 2_800_000, businessCount: 310_000,
    industries: ["tourism", "construction", "healthcare", "technology"],
    cpcBand: [4, 19] as [number, number], competition: "high" as const, timezone: "America/New_York",
    nearby: ["tampa", "miami"],
    localNote: "Orlando's tourism economy means a large share of searches come from visitors, not buyers — negative-keyword discipline and geo-fencing do more for wasted spend here than bid strategy does." },
  { slug: "tampa", name: "Tampa", stateSlug: "florida", stateName: "Florida", stateAbbr: "FL",
    metroPopulation: 3_300_000, businessCount: 350_000,
    industries: ["healthcare", "construction", "financial services", "logistics"],
    cpcBand: [4, 18] as [number, number], competition: "high" as const, timezone: "America/New_York",
    nearby: ["orlando", "miami"],
    localNote: "Tampa Bay's growth corridors (Wesley Chapel, Riverview, Lakewood Ranch) shift year to year — service-area pages and ad geo targets that were right in 2023 quietly bleed budget into areas the crews no longer prioritize." },
  { slug: "atlanta", name: "Atlanta", stateSlug: "georgia", stateName: "Georgia", stateAbbr: "GA",
    metroPopulation: 6_300_000, businessCount: 680_000,
    industries: ["logistics", "film & media", "fintech", "construction", "healthcare"],
    cpcBand: [5, 21] as [number, number], competition: "saturated" as const, timezone: "America/New_York",
    nearby: ["charlotte", "nashville"],
    localNote: "Metro Atlanta's sprawl makes drive-time the hidden qualifier: a lead 40 miles across the perimeter can cost more to serve than it returns, so lead scoring that weighs distance beats raw volume every time here." },
  { slug: "charlotte", name: "Charlotte", stateSlug: "north-carolina", stateName: "North Carolina", stateAbbr: "NC",
    metroPopulation: 2_800_000, businessCount: 290_000,
    industries: ["banking", "construction", "healthcare", "manufacturing"],
    cpcBand: [4, 17] as [number, number], competition: "moderate" as const, timezone: "America/New_York",
    nearby: ["atlanta", "nashville"],
    localNote: "Charlotte adds roughly a hundred residents a day, and the new-construction warranty cycle that follows creates a predictable second wave of service demand two to three years behind each subdivision — a calendar most local campaigns ignore." },
  { slug: "nashville", name: "Nashville", stateSlug: "tennessee", stateName: "Tennessee", stateAbbr: "TN",
    metroPopulation: 2_100_000, businessCount: 230_000,
    industries: ["healthcare", "music & entertainment", "construction", "hospitality"],
    cpcBand: [4, 18] as [number, number], competition: "moderate" as const, timezone: "America/Chicago",
    nearby: ["atlanta", "charlotte"],
    localNote: "Nashville is a healthcare-administration capital — a B2B sales floor here sells into hospital systems with long committee cycles, which changes what 'speed to lead' means: the first response still wins, but nurture depth decides the deal." },
  { slug: "houston", name: "Houston", stateSlug: "texas", stateName: "Texas", stateAbbr: "TX",
    metroPopulation: 7_300_000, businessCount: 750_000,
    industries: ["energy", "logistics", "healthcare", "construction", "manufacturing"],
    cpcBand: [5, 23] as [number, number], competition: "saturated" as const, timezone: "America/Chicago",
    nearby: ["dallas", "austin"],
    localNote: "Houston's energy-sector procurement culture bleeds into everything: even residential-adjacent trades see RFQ-style multi-bid behavior, so quote follow-up cadence — not ad spend — is usually the highest-leverage fix in this metro." },
  { slug: "dallas", name: "Dallas", stateSlug: "texas", stateName: "Texas", stateAbbr: "TX",
    metroPopulation: 7_900_000, businessCount: 800_000,
    industries: ["technology", "logistics", "financial services", "construction", "healthcare"],
    cpcBand: [5, 22] as [number, number], competition: "saturated" as const, timezone: "America/Chicago",
    nearby: ["houston", "austin"],
    localNote: "DFW is two ad markets pretending to be one — Dallas-side and Fort Worth-side searches price differently and convert differently, and single-campaign structures average away the difference instead of arbitraging it." },
  { slug: "austin", name: "Austin", stateSlug: "texas", stateName: "Texas", stateAbbr: "TX",
    metroPopulation: 2_500_000, businessCount: 270_000,
    industries: ["technology", "construction", "hospitality", "professional services"],
    cpcBand: [5, 20] as [number, number], competition: "high" as const, timezone: "America/Chicago",
    nearby: ["houston", "dallas"],
    localNote: "Austin's buyer expects software-grade responsiveness from everyone — a plumber included. Review velocity and response-time badges move conversion here more than they do in any comparable Texas metro." },
  { slug: "phoenix", name: "Phoenix", stateSlug: "arizona", stateName: "Arizona", stateAbbr: "AZ",
    metroPopulation: 5_100_000, businessCount: 480_000,
    industries: ["construction", "healthcare", "semiconductors", "real estate"],
    cpcBand: [4, 20] as [number, number], competition: "high" as const, timezone: "America/Phoenix",
    nearby: ["austin", "dallas"],
    localNote: "Phoenix demand is seasonal in reverse — HVAC and exterior trades peak in punishing summer while winter brings the snowbird wave and a second population. Budget pacing tuned to a normal seasonal curve is exactly backwards here, and the no-DST timezone quietly breaks scheduled sequences built elsewhere." },
];

const SERVICES_RAW = [
  { slug: "ppc", name: "Agentic PPC", catalogPillar: "marketing" as const, catalogSlug: "paid-media", botName: "Ads Bot",
    headlinePattern: "Agentic PPC management in {city} — reviewed daily, not quarterly.",
    intro: "An ad account managed by an agent reads every search term, every day, and moves budget while the human agencies are preparing next month's slide deck. Same platforms, radically shorter feedback loop.",
    implementationWeeks: 2,
    baseline: [
      { metric: "Search-term review cadence", value: "daily" },
      { metric: "Creative variants in rotation", value: "continuous" },
      { metric: "Budget-shift latency", value: "<24h" },
    ] },
  { slug: "seo", name: "Agentic SEO", catalogPillar: "marketing" as const, catalogSlug: "seo", botName: "SEO Bot",
    headlinePattern: "Agentic SEO in {city} — maintenance, not a one-time audit.",
    intro: "Rankings decay because nobody re-crawls, re-writes and re-links after the audit PDF lands. An agent runs the crawl on a schedule, fixes what broke, and closes coverage gaps while they are still cheap.",
    implementationWeeks: 3,
    baseline: [
      { metric: "Technical crawl cadence", value: "weekly" },
      { metric: "Rank tracking", value: "daily" },
      { metric: "Content gap refresh", value: "monthly" },
    ] },
  { slug: "crm", name: "Agentic CRM", catalogPillar: "sales" as const, catalogSlug: "crm", botName: "CRM Bot",
    headlinePattern: "Agentic CRM operations in {city} — records that update themselves.",
    intro: "A CRM nobody updates is a reporting liability you pay monthly for. An agent logs every call, email and meeting against the right record, advances stages on evidence, and merges the duplicates nobody has time for.",
    implementationWeeks: 2,
    baseline: [
      { metric: "Activity logging", value: "automatic" },
      { metric: "Duplicate hygiene", value: "daily" },
      { metric: "Stalled-deal alerts", value: "real-time" },
    ] },
  { slug: "speed-to-lead", name: "Speed-to-Lead", catalogPillar: "sales" as const, catalogSlug: "inbound", botName: "Speed-to-Lead Bot",
    headlinePattern: "Speed-to-lead automation in {city} — under a minute, any hour.",
    intro: "The first responder wins the job, and the decay is measured in minutes. An agent answers every call, form and chat within seconds, qualifies in real conversation, and books straight onto the calendar.",
    implementationWeeks: 2,
    baseline: [
      { metric: "First response", value: "<60s" },
      { metric: "Coverage", value: "24/7" },
      { metric: "Escalation to humans", value: "rule-based" },
    ] },
];

/* Parse at module load — a bad row fails the build, not the SERP. */
export const CITIES: City[] = CITIES_RAW.map((c) => CitySchema.parse(c));
export const LOCAL_SERVICES: LocalService[] = SERVICES_RAW.map((s) => LocalServiceSchema.parse(s));

export const STATES = [...new Map(CITIES.map((c) => [c.stateSlug, { slug: c.stateSlug, name: c.stateName, abbr: c.stateAbbr }])).values()];

export const getService = (slug: string) => LOCAL_SERVICES.find((s) => s.slug === slug);
export const getState = (slug: string) => STATES.find((s) => s.slug === slug);
export const getCity = (stateSlug: string, citySlug: string) =>
  CITIES.find((c) => c.stateSlug === stateSlug && c.slug === citySlug);
export const citiesInState = (stateSlug: string) => CITIES.filter((c) => c.stateSlug === stateSlug);
export const nearbyCities = (city: City) =>
  city.nearby.map((slug) => CITIES.find((c) => c.slug === slug)).filter((c): c is City => Boolean(c));

export const fmt = new Intl.NumberFormat("en-US");
