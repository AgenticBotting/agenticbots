/**
 * The AgenticBots taxonomy rules — deterministic, versioned, explainable.
 *
 * 1. Niche tags: what a service business DOES (roofing, fire/life safety,
 *    paving, recurring service, inspection/compliance …), derived from the
 *    niche name with category fallbacks.
 * 2. Buyer facility tags: what a buyer HAS that creates demand (buildings,
 *    parking, grounds, kitchens, critical systems, residential units,
 *    procurement rules, waterfront …), derived from segment + name.
 * 3. Needs: which buyer facility tags each niche tag sells into, with a
 *    base strength and relationship type.
 *
 * Changing any rule bumps TAXONOMY_VERSION; relationships an operator has
 * approved, rejected or edited are never regenerated.
 */
import type { RelationshipType, SellsTo } from "@/lib/prospecting/types";
import { normalizeName } from "./normalize";

export const TAXONOMY_VERSION = "taxonomy/1.0.0";

/* ───────────────────────────── Niche tags ───────────────────────────── */

export const NICHE_TAG_RULES: [string, RegExp][] = [
  ["roofing", /\broof|skylight|gutter/],
  ["building_envelope", /\broof|siding|stucco|soffit|fascia|waterproof|exterior painting|impact window|shutter|envelope|balcony|caulk|coating/],
  ["paving_parking", /\basphalt|paving|sealcoat|striping|parking lot|parking garage|road marking|traffic control/],
  ["concrete_masonry", /\bconcrete|masonry|brick|foundation|polished concrete/],
  ["sitework_civil", /\bsitework|excavation|land clearing|drainage|demolition|dredging|surveyor|civil engineering|retaining wall/],
  ["fire_life_safety", /\bfire (sprinkler|alarm|extinguisher)|hydrant|emergency lighting|exit sign|lightning protection|fire and smoke/],
  ["low_voltage_security", /\bcctv|surveillance|access control|structured cabling|security system|alarm monitoring|gate and access|\bav and|telecom|cell tower/],
  ["electrical", /\belectric|generator|solar|ev charger|lighting retrofit|led\b|switchgear|backup power|power line|landscape lighting/],
  ["mechanical_hvac", /\bhvac|refrigeration|boiler|chiller|duct|building automation|ice machine|kitchen hood|mini split|heat pump|insulation|spray foam|air quality|compressed air/],
  ["refrigeration", /\brefrigeration|ice machine|cold storage/],
  ["plumbing_water", /\bplumb|drain|sewer|water heater|repip|grease trap|septic|backflow|leak detection|slab leak|gas line|well drilling|water treatment|hydro jetting|rooter/],
  ["kitchen_food_service", /\bgrease trap|kitchen hood|commercial kitchen|ice machine|commercial refrigeration|food healthcare/],
  ["landscaping_grounds", /\blandscap|lawn|tree|palm|stump|irrigation|sprinkler install|sod\b|mulch|fertiliz|weed|aeration|turf|pond|lake|fountain|snow removal|playground|hardscap|pavers/],
  ["cleaning_janitorial", /\bjanitorial|cleaning|waxing|stripping|disinfect|sanitiz|pressure washing|soft washing|window cleaning|trash valet|dumpster pad|restroom supply|uniform and linen|fleet washing/],
  ["restoration_remediation", /\brestoration|mold|abatement|asbestos|lead abatement|remediation|biohazard|trauma|water damage|fire and smoke|storm damage|infection control|containment/],
  ["construction_gc", /\bgeneral contractor|tenant improvement|healthcare construction|design build|interior build out|framing|structural steel|scaffold|crane|rigging|temporary fencing|elevator|commercial interior/],
  ["equipment_rental", /\bequipment rental|dumpster|roll off|portable toilet|scaffolding rental|temporary fencing|crane/],
  ["interior_finishes", /\bflooring|hardwood|tile|carpet|epoxy|interior painting|commercial painting|drywall|plaster|acoustical|cabinet|countertop|millwork|trim carpentry|interior doors|window treatment|wallpaper|glass and mirror|ff and e/],
  ["fencing_site", /\bfence|fencing|gate and access|playground|awning|canopy|bollard|signage|sign companies/],
  ["pest", /\bpest|termite|mosquito|rodent|bed bug|wildlife|bird control/],
  ["pool_water_features", /\bpool|fountain|water feature/],
  ["marine", /\bseawall|dock|boat|yacht|marina|marine|dredging/],
  ["industrial_services", /\bmachine shop|fabrication|welding|industrial|sandblasting|powder coating|pallet|material handling|forklift|compressed air|pneumatic|pump and motor|switchgear|lab testing|calibration/],
  ["property_services", /\bfacility management|building maintenance|apartment turnover|maintenance crews|multifamily|parking garage maintenance|reserve study|condo inspection|signage|wayfinding|sign companies|community management/],
  ["fleet_auto", /\bauto|fleet|diesel|truck|towing|collision|tire|windshield|upfitting|vehicle wrap|mechanic|lube|rv repair|motorcycle|trailer/],
  ["logistics_moving", /\bmover|relocation|courier|last mile|freight|warehousing|3pl|packing|crating|storage/],
  ["design_professional", /\barchitect|engineer|surveyor|environmental consultant|permit expediting|envelope consultant|interior design|reserve study|inspection firm/],
  ["security_services", /\bsecurity guard|locksmith|safe services|parking management|valet|private investigator|safety consulting|osha/],
  ["waste_hauling", /\bwaste|recycling|junk removal|hauling|dumpster|roll off|estate cleanout|trash/],
  ["inspection_compliance", /\binspection|testing|certification|backflow|extinguisher|hydrant|fire alarm|fire sprinkler|elevator|reserve study|calibration|grease trap|osha|hood cleaning|emergency lighting/],
  ["emergency", /\bemergency|leak|storm|water damage|fire and smoke|biohazard|towing|locksmith|repair|generator|restoration|rooter|drain/],
  ["recurring_service", /\bmaintenance|janitorial|cleaning|pest|lawn|landscape maintenance|pool service|pool cleaning|hood cleaning|grease trap|fertiliz|mowing|monitoring|security guard|uniform|linen|waste management|sealcoat|striping|fleet|inspection|testing|chiller|boiler|backflow|extinguisher|sanitiz|disinfect|turnover|irrigation|trash valet|generator|elevator|monitoring/],
];

/** Categories that are storefront / consumer-local by nature. */
const CONSUMER_CATEGORIES = new Set([
  "health wellness and beauty", "food and hospitality services", "education and childcare",
]);
const PROFESSIONAL_CATEGORIES = new Set(["professional services local"]);

/** Niches inside consumer categories that are actually B2B trades. */
const CONSUMER_EXCEPTIONS = /commercial kitchen design|event rentals|trade schools|hotels/;

export function nicheTags(category: string, niche: string, sellsTo: SellsTo): string[] {
  const n = normalizeName(niche);
  const c = normalizeName(category);
  const tags = new Set<string>();
  for (const [tag, re] of NICHE_TAG_RULES) if (re.test(n)) tags.add(tag);

  if (CONSUMER_CATEGORIES.has(c) && !CONSUMER_EXCEPTIONS.test(n)) tags.add("consumer_local");
  if (PROFESSIONAL_CATEGORIES.has(c)) tags.add(sellsTo === "commercial" || sellsTo === "mixed" ? "professional_b2b" : "consumer_local");
  if (c === "home services other" && sellsTo === "residential") tags.add("residential_home");
  if (sellsTo === "residential" && !tags.has("consumer_local")) tags.add("residential_home");
  if (c === "property and facility services") tags.add("property_services");
  if (c === "industrial and specialty") tags.add("industrial_services");
  if (c === "security and safety") tags.add("security_services");
  if (c === "moving and logistics") tags.add("logistics_moving");
  if (c === "auto and fleet") tags.add("fleet_auto");
  if (c === "pest and wildlife") tags.add("pest");
  if (c === "agriculture and marine" && /marina|boat|dock|dredg|charter/.test(n)) tags.add("marine");
  // Field trades travel to the customer; storefronts do not.
  if (!tags.has("consumer_local") && !tags.has("professional_b2b")) tags.add("field_service");
  return [...tags].sort();
}

/* ───────────────────────────── Buyer facility tags ───────────────────────────── */

const BUYER_RULES: [string, RegExp][] = [
  ["has_kitchen", /\brestaurant|grocery|supermarket|food processing|hotel|senior living|skilled nursing|hospital|school|college|universit|convention|stadium|country club|golf|amusement|convenience|cafeteria|cannabis/],
  ["has_pool", /\bhoa|condo|master planned|gated|country club|55|active adult|timeshare|multifamily|apartment|hotel|resort|student housing|senior living|fitness|vacation rental|build to rent|luxury|waterfront/],
  ["has_parking", /\bshopping|mall|strip center|big box|retail|office|business park|industrial park|hospital|medical office|church|school|college|universit|stadium|arena|convention|airport|parking|dealership|multifamily|apartment|hoa|condo|grocery|hotel|warehouse|distribution|amusement|mixed use|self storage|transit|city|county/],
  ["has_grounds", /\bhoa|condo|master planned|gated|country club|golf|community development|park|campus|school|college|universit|office park|business park|industrial park|cemetery|church|apartment|multifamily|senior living|hotel|resort|stadium|cdd|timeshare|mobile home|townhome/],
  ["critical_systems", /\bhospital|health system|surgery|data center|lab|cleanroom|dialysis|imaging|cold storage|pharmac|aerospace|utilities|airport/],
  ["cold_chain", /\bcold storage|grocery|supermarket|food processing|restaurant|convenience/],
  ["industrial_plant", /\bmanufactur|plant|warehouse|distribution|industrial|food processing|cold storage|port|terminal|shipping|cross dock|data center|aerospace|oil|gas|energy|utilities|recycling|waste|lab/],
  ["multi_site", /\bchain|franchis|regional|national|bank|credit union|dso|group|health system|operators|management compan|reit|dealership|fitness|daycare|urgent care|dispensar/],
  ["regulated_inspections", /\bhospital|health|surgery|clinic|dental|dialysis|imaging|skilled nursing|assisted living|behavioral|veterinary|pharmac|rehab|senior living|school|college|universit|daycare|hotel|restaurant|food processing|data center|lab|airport|stadium|convention|condo|high rise|housing authorit/],
  ["residential_units", /\bhoa|condo|co op|master planned|community development|gated|55|active adult|mobile home|manufactured|townhome|villa|timeshare|multifamily|apartment|student housing|single family rental|build to rent|senior living|housing authorit|vacation rental|residential/],
  ["owns_buildings", /\bproperty manag|owner|reit|real estate|office|business park|mixed use|shopping|mall|strip|big box|retail|grocery|bank|dealership|hotel|senior living|self storage|church|school|college|universit|hospital|medical|clinic|warehouse|distribution|industrial park|manufactur|government|city|county|state agenc|federal|housing authorit|airport|stadium|arena|convention|museum|librar|nonprofit|fitness|restaurant|data center|condo|hoa|multifamily|apartment|coworking|flex space|cannabis|car wash|veterinary|dental|daycare|developer|plant/],
  ["procurement", /\bgovernment|city|county|municipal|state agenc|federal|gsa|military|housing authorit|parks and recreation|water and utility|transit|airports and seaports public|fire and police|emergency management|code enforcement|redevelopment|special taxing|public school|k 12|universit|utilities/],
  ["construction_buyer", /\bgeneral contractor|construction manager|design build|subcontractor|home builder|custom home builder|remodeler|specialty contractor|developer|land developer|owner s representative|restoration contractor|disaster relief/],
  ["design_buyer", /\barchitect|engineer|interior designer|owner s representative/],
  ["land_development", /\bdeveloper|land developer|master planned|build to rent|home builder|community development|redevelopment/],
  ["waterfront", /\bmarina|yacht|port|seaport|marine|waterfront|boat|dredg/],
  ["fleet", /\bfleet|trucking|transit|dealership|rental house|equipment dealer|utilities|logistics/],
  ["venue", /\bstadium|arena|convention|event venue|amusement|entertainment|theater|golf|country club/],
  ["portfolio_owner", /\bproperty management compan|real estate investment trust|reit|commercial real estate owner|management compan|owners and operators|industrial park owner|office park|business park owner|strip center owner|shopping center|single family rental operator|mixed use/],
  ["insurance_referral", /\binsurance|adjuster|public adjuster|restoration contractor/],
  ["real_estate_referral", /\breal estate agent|home inspector|title compan|closing attorney|lender|mortgage|broker leasing/],
  ["trade_referral", /\bdistributor|supplier|equipment dealer|rental house|chamber|trade association|franchise system|engineering and inspection|consultant|law firm/],
];

export function buyerTags(segment: string, customerType: string): string[] {
  const t = ` ${normalizeName(customerType)} `;
  const s = normalizeName(segment);
  const tags = new Set<string>();
  for (const [tag, re] of BUYER_RULES) if (re.test(t)) tags.add(tag);
  if (s === "government and public sector") { tags.add("procurement"); tags.add("owns_buildings"); }
  if (s === "residential communities") { tags.add("residential_units"); tags.add("has_grounds"); }
  if (s === "healthcare") { tags.add("regulated_inspections"); tags.add("owns_buildings"); }
  if (s === "industrial and logistics") tags.add("industrial_plant");
  if (s === "construction and development") tags.add("construction_buyer");
  if (s === "residential consumers") tags.add("consumer");
  if (s === "specialty buyers") tags.add("referral_source");
  return [...tags].sort();
}

export function buyerKindOf(segment: string, customerType: string): "institutional" | "commercial" | "community" | "referral" | "consumer" {
  const s = normalizeName(segment);
  const t = normalizeName(customerType);
  if (s === "residential consumers") return "consumer";
  if (s === "specialty buyers") return /franchise systems|disaster relief|distributors/.test(t) ? "commercial" : "referral";
  if (s === "residential communities") return "community";
  if (s === "government and public sector" || s === "education" || s === "healthcare") return "institutional";
  return "commercial";
}

/* ───────────────────────────── Needs (niche tag → buyer facility tag) ───────────────────────────── */

export interface Need {
  buyerTag: string;
  strength: number; // 0–1
  type: RelationshipType;
}

const N = (buyerTag: string, strength: number, type: RelationshipType = "direct"): Need => ({ buyerTag, strength, type });

export const NEEDS: Record<string, Need[]> = {
  roofing: [N("owns_buildings", 0.85), N("residential_units", 0.8), N("industrial_plant", 0.75), N("procurement", 0.65, "bid"), N("construction_buyer", 0.6, "subcontract"), N("insurance_referral", 0.55, "referral"), N("consumer", 0.8, "residential"), N("trade_referral", 0.6, "referral")],
  building_envelope: [N("owns_buildings", 0.75), N("residential_units", 0.8), N("construction_buyer", 0.6, "subcontract"), N("procurement", 0.55, "bid"), N("consumer", 0.75, "residential")],
  paving_parking: [N("has_parking", 0.9), N("residential_units", 0.7), N("procurement", 0.75, "bid"), N("construction_buyer", 0.65, "subcontract"), N("land_development", 0.6, "subcontract")],
  concrete_masonry: [N("residential_units", 0.75), N("owns_buildings", 0.65), N("construction_buyer", 0.75, "subcontract"), N("procurement", 0.6, "bid"), N("consumer", 0.6, "residential"), N("trade_referral", 0.6, "referral")],
  sitework_civil: [N("construction_buyer", 0.85, "subcontract"), N("land_development", 0.85), N("procurement", 0.75, "bid"), N("industrial_plant", 0.55), N("has_grounds", 0.5)],
  fire_life_safety: [N("regulated_inspections", 0.9, "institutional"), N("owns_buildings", 0.8), N("industrial_plant", 0.8), N("residential_units", 0.75), N("multi_site", 0.7), N("has_kitchen", 0.65), N("procurement", 0.7, "bid"), N("construction_buyer", 0.6, "subcontract")],
  low_voltage_security: [N("multi_site", 0.8), N("critical_systems", 0.8), N("owns_buildings", 0.75), N("industrial_plant", 0.7), N("residential_units", 0.65), N("procurement", 0.6, "bid"), N("construction_buyer", 0.6, "subcontract")],
  electrical: [N("industrial_plant", 0.8), N("critical_systems", 0.8), N("owns_buildings", 0.75), N("construction_buyer", 0.7, "subcontract"), N("multi_site", 0.65), N("residential_units", 0.6), N("procurement", 0.6, "bid"), N("consumer", 0.8, "residential"), N("trade_referral", 0.6, "referral")],
  mechanical_hvac: [N("critical_systems", 0.85), N("owns_buildings", 0.8), N("industrial_plant", 0.75), N("multi_site", 0.75), N("residential_units", 0.7), N("has_kitchen", 0.6), N("construction_buyer", 0.6, "subcontract"), N("procurement", 0.6, "bid"), N("consumer", 0.8, "residential"), N("trade_referral", 0.6, "referral")],
  refrigeration: [N("cold_chain", 0.9), N("has_kitchen", 0.85), N("industrial_plant", 0.7)],
  plumbing_water: [N("residential_units", 0.8), N("owns_buildings", 0.7), N("has_kitchen", 0.7), N("regulated_inspections", 0.7, "institutional"), N("multi_site", 0.7), N("industrial_plant", 0.6), N("construction_buyer", 0.55, "subcontract"), N("consumer", 0.8, "residential"), N("trade_referral", 0.6, "referral")],
  kitchen_food_service: [N("has_kitchen", 0.95), N("cold_chain", 0.7)],
  landscaping_grounds: [N("has_grounds", 0.88), N("residential_units", 0.85), N("owns_buildings", 0.6), N("procurement", 0.65, "bid"), N("land_development", 0.55, "subcontract"), N("consumer", 0.8, "residential")],
  cleaning_janitorial: [N("owns_buildings", 0.8), N("multi_site", 0.8), N("regulated_inspections", 0.75, "institutional"), N("residential_units", 0.6), N("construction_buyer", 0.6, "subcontract"), N("procurement", 0.6, "bid"), N("consumer", 0.7, "residential")],
  restoration_remediation: [N("residential_units", 0.8), N("owns_buildings", 0.7), N("regulated_inspections", 0.7, "institutional"), N("insurance_referral", 0.75, "referral"), N("construction_buyer", 0.55, "subcontract"), N("procurement", 0.55, "bid"), N("consumer", 0.75, "residential")],
  construction_gc: [N("owns_buildings", 0.75), N("land_development", 0.8), N("multi_site", 0.7), N("regulated_inspections", 0.65, "institutional"), N("procurement", 0.7, "bid"), N("construction_buyer", 0.55, "subcontract"), N("consumer", 0.65, "residential")],
  equipment_rental: [N("construction_buyer", 0.9, "channel"), N("industrial_plant", 0.6), N("venue", 0.55), N("procurement", 0.5, "bid")],
  interior_finishes: [N("construction_buyer", 0.75, "subcontract"), N("residential_units", 0.7), N("owns_buildings", 0.6), N("multi_site", 0.6), N("design_buyer", 0.55, "channel"), N("consumer", 0.8, "residential"), N("trade_referral", 0.6, "referral")],
  fencing_site: [N("has_parking", 0.75), N("industrial_plant", 0.75), N("residential_units", 0.75), N("has_grounds", 0.7), N("construction_buyer", 0.7, "subcontract"), N("procurement", 0.65, "bid"), N("consumer", 0.7, "residential")],
  pest: [N("has_kitchen", 0.85), N("residential_units", 0.8), N("regulated_inspections", 0.75, "institutional"), N("multi_site", 0.75), N("industrial_plant", 0.65), N("owns_buildings", 0.6), N("consumer", 0.8, "residential")],
  pool_water_features: [N("has_pool", 0.88), N("consumer", 0.8, "residential")],
  marine: [N("waterfront", 0.88), N("procurement", 0.6, "bid"), N("residential_units", 0.5), N("consumer", 0.75, "residential")],
  industrial_services: [N("industrial_plant", 0.85), N("fleet", 0.5), N("critical_systems", 0.55)],
  property_services: [N("residential_units", 0.85), N("owns_buildings", 0.75), N("multi_site", 0.6)],
  fleet_auto: [N("fleet", 0.85), N("multi_site", 0.5), N("procurement", 0.55, "bid"), N("consumer", 0.8, "residential")],
  logistics_moving: [N("industrial_plant", 0.6), N("owns_buildings", 0.55), N("multi_site", 0.6), N("consumer", 0.8, "residential")],
  design_professional: [N("construction_buyer", 0.8, "channel"), N("land_development", 0.8), N("owns_buildings", 0.6), N("procurement", 0.7, "bid"), N("residential_units", 0.55)],
  security_services: [N("owns_buildings", 0.7), N("venue", 0.8), N("residential_units", 0.7), N("multi_site", 0.65), N("construction_buyer", 0.55), N("procurement", 0.6, "bid"), N("consumer", 0.6, "residential")],
  waste_hauling: [N("construction_buyer", 0.75, "channel"), N("industrial_plant", 0.7), N("owns_buildings", 0.6), N("residential_units", 0.6), N("consumer", 0.7, "residential")],
  professional_b2b: [N("multi_site", 0.5), N("owns_buildings", 0.4), N("construction_buyer", 0.45)],
  residential_home: [N("consumer", 0.85, "residential"), N("real_estate_referral", 0.5, "referral"), N("residential_units", 0.5)],
  consumer_local: [N("consumer", 0.7, "residential")],
};

/** Role families the decision makers usually come from, per niche tag. */
export const ROLE_FAMILIES_FOR_TAG: Record<string, string[]> = {
  default: ["facilities", "property_management", "owner_executive", "operations"],
  sitework_civil: ["construction_project", "estimating_preconstruction", "public_works", "procurement", "owner_executive"],
  construction_gc: ["construction_project", "facilities", "asset_management", "owner_executive", "procurement"],
  design_professional: ["construction_project", "design_principal", "owner_executive"],
  equipment_rental: ["construction_project", "operations", "owner_executive"],
  fire_life_safety: ["facilities", "engineering_maintenance", "safety_ehs", "property_management", "procurement"],
  mechanical_hvac: ["facilities", "engineering_maintenance", "property_management", "operations"],
  electrical: ["facilities", "engineering_maintenance", "construction_project", "operations"],
  industrial_services: ["engineering_maintenance", "operations", "facilities", "procurement"],
  paving_parking: ["property_management", "facilities", "asset_management", "public_works", "procurement"],
  landscaping_grounds: ["property_management", "community_board", "facilities", "public_works"],
  roofing: ["facilities", "property_management", "asset_management", "engineering_maintenance"],
  fleet_auto: ["operations", "owner_executive", "procurement"],
  residential_home: ["homeowner"],
  consumer_local: ["homeowner"],
};
