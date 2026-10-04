import type { RoleFamily, SignalType } from "@/lib/prospecting/types";

/**
 * Vertical knowledge packs: reusable, client-agnostic defaults for a trade.
 * A pack never contains client data — ICPs reference a pack and override.
 * Packs match niches by tag, so new niches inherit a pack automatically.
 */
export interface VerticalPack {
  key: string;
  label: string;
  /** A niche belongs to the pack if it has ANY of these tags. */
  nicheTags: string[];
  preferredBuyerTags: string[];
  excludedBuyerKinds: ("consumer" | "referral")[];
  roleFamilies: RoleFamily[];
  discoveryRecipes: string[];
  signals: SignalType[];
  qualification: { minFit: number; requireDecisionMaker: boolean };
  projectTypes: string[];
  buyingMotions: string[];
  recurring: string;
  outboundAngles: string[];
}

export const PACKS: VerticalPack[] = [
  {
    key: "commercial-roofing", label: "Commercial Roofing", nicheTags: ["roofing"],
    preferredBuyerTags: ["portfolio_owner", "owns_buildings", "industrial_plant", "residential_units"], excludedBuyerKinds: ["consumer"],
    roleFamilies: ["facilities", "property_management", "asset_management", "engineering_maintenance"],
    discoveryRecipes: ["county-property", "pm-portfolios", "reit-portfolios", "building-permits", "maps-listings"],
    signals: ["weather_event", "property_acquisition", "building_permit", "capital_improvement", "visible_deterioration", "inspection_cycle"],
    qualification: { minFit: 60, requireDecisionMaker: true },
    projectTypes: ["Re-roof (TPO/mod-bit)", "Roof coating restoration", "Leak repair", "Annual inspection program"],
    buyingMotions: ["project", "recurring_service"], recurring: "Inspection and maintenance programs across a portfolio.",
    outboundAngles: ["Post-storm inspection", "Coating vs. replacement cost comparison", "Portfolio roof condition report"],
  },
  {
    key: "hvac-mechanical", label: "HVAC / Mechanical", nicheTags: ["mechanical_hvac", "refrigeration"],
    preferredBuyerTags: ["critical_systems", "owns_buildings", "multi_site", "portfolio_owner"], excludedBuyerKinds: ["consumer"],
    roleFamilies: ["facilities", "engineering_maintenance", "property_management"],
    discoveryRecipes: ["maps-listings", "healthcare-registries", "pm-portfolios", "company-sites"],
    signals: ["facilities_hiring", "new_facility", "capital_improvement", "contract_expiration", "weather_event"],
    qualification: { minFit: 60, requireDecisionMaker: true },
    projectTypes: ["PM agreements", "RTU replacement", "Chiller service", "Controls retrofit"],
    buyingMotions: ["recurring_service", "emergency", "project"], recurring: "Preventive-maintenance agreements.",
    outboundAngles: ["PM agreement audit", "Energy cost reduction", "Emergency response SLA"],
  },
  {
    key: "plumbing", label: "Commercial Plumbing", nicheTags: ["plumbing_water", "kitchen_food_service"],
    preferredBuyerTags: ["residential_units", "has_kitchen", "owns_buildings", "multi_site"], excludedBuyerKinds: ["consumer"],
    roleFamilies: ["facilities", "engineering_maintenance", "property_management", "operations"],
    discoveryRecipes: ["maps-listings", "apartment-directories", "brand-directories"],
    signals: ["inspection_cycle", "renovation", "tenant_improvement", "negative_reviews"],
    qualification: { minFit: 55, requireDecisionMaker: true },
    projectTypes: ["Backflow certification", "Grease trap service", "Repipe", "Emergency service"],
    buyingMotions: ["inspection_compliance", "recurring_service", "emergency"], recurring: "Annual backflow and grease-trap cycles.",
    outboundAngles: ["Compliance calendar", "Emergency response", "Turnover support"],
  },
  {
    key: "paving", label: "Asphalt / Paving / Parking", nicheTags: ["paving_parking"],
    preferredBuyerTags: ["has_parking", "portfolio_owner", "residential_units", "procurement"], excludedBuyerKinds: ["consumer"],
    roleFamilies: ["property_management", "facilities", "asset_management", "public_works", "procurement"],
    discoveryRecipes: ["county-property", "pm-portfolios", "maps-listings", "local-procurement", "bid-boards"],
    signals: ["property_acquisition", "visible_deterioration", "capital_improvement", "procurement_notice", "bid_posting"],
    qualification: { minFit: 60, requireDecisionMaker: true },
    projectTypes: ["Sealcoat + restripe", "Mill and overlay", "ADA compliance", "Pothole repair"],
    buyingMotions: ["recurring_service", "bid_procurement", "project"], recurring: "2–3 year sealcoat and striping cycles.",
    outboundAngles: ["Portfolio pavement assessment", "ADA compliance check", "Budget-season planning"],
  },
  {
    key: "restoration", label: "Restoration / Remediation", nicheTags: ["restoration_remediation"],
    preferredBuyerTags: ["portfolio_owner", "residential_units", "regulated_inspections", "insurance_referral"], excludedBuyerKinds: [],
    roleFamilies: ["property_management", "facilities", "safety_ehs", "clinical_admin"],
    discoveryRecipes: ["pm-portfolios", "maps-listings", "associations"],
    signals: ["weather_event", "negative_reviews", "ownership_change"],
    qualification: { minFit: 55, requireDecisionMaker: true },
    projectTypes: ["Water mitigation", "Mold remediation", "Abatement", "Infection-control containment"],
    buyingMotions: ["emergency", "referral"], recurring: "Preferred-vendor agreements with property managers.",
    outboundAngles: ["Preferred-vendor program", "24/7 response SLA", "Storm readiness"],
  },
  {
    key: "electrical", label: "Electrical / Power", nicheTags: ["electrical"],
    preferredBuyerTags: ["industrial_plant", "critical_systems", "owns_buildings", "construction_buyer"], excludedBuyerKinds: ["consumer"],
    roleFamilies: ["facilities", "engineering_maintenance", "construction_project"],
    discoveryRecipes: ["maps-listings", "building-permits", "contractor-licensing", "company-sites"],
    signals: ["building_permit", "tenant_improvement", "new_facility", "expansion"],
    qualification: { minFit: 60, requireDecisionMaker: true },
    projectTypes: ["Generator service", "LED retrofit", "EV charging", "Switchgear maintenance"],
    buyingMotions: ["project", "recurring_service"], recurring: "Generator and switchgear maintenance.",
    outboundAngles: ["Generator readiness", "Energy retrofit payback", "EV charging for tenants"],
  },
  {
    key: "fire-life-safety", label: "Fire / Life Safety", nicheTags: ["fire_life_safety"],
    preferredBuyerTags: ["regulated_inspections", "owns_buildings", "industrial_plant", "residential_units"], excludedBuyerKinds: ["consumer"],
    roleFamilies: ["facilities", "engineering_maintenance", "safety_ehs", "property_management", "procurement"],
    discoveryRecipes: ["maps-listings", "healthcare-registries", "school-directories", "local-procurement"],
    signals: ["inspection_cycle", "new_facility", "ownership_change", "contract_expiration"],
    qualification: { minFit: 60, requireDecisionMaker: true },
    projectTypes: ["Annual inspections", "Deficiency repairs", "Monitoring", "New installs"],
    buyingMotions: ["inspection_compliance", "recurring_service"], recurring: "Code-mandated annual and quarterly inspections.",
    outboundAngles: ["Inspection calendar takeover", "Deficiency backlog clearance", "Consolidated vendor"],
  },
  {
    key: "landscaping", label: "Commercial Landscaping", nicheTags: ["landscaping_grounds"],
    preferredBuyerTags: ["has_grounds", "residential_units", "portfolio_owner", "procurement"], excludedBuyerKinds: ["consumer"],
    roleFamilies: ["property_management", "community_board", "facilities", "public_works"],
    discoveryRecipes: ["pm-portfolios", "county-property", "associations", "local-procurement"],
    signals: ["contract_expiration", "ownership_change", "management_change", "negative_reviews"],
    qualification: { minFit: 55, requireDecisionMaker: true },
    projectTypes: ["Grounds maintenance", "Irrigation", "Enhancements", "Tree care"],
    buyingMotions: ["recurring_service", "bid_procurement"], recurring: "Annual maintenance contracts, bid every 1–3 years.",
    outboundAngles: ["Contract renewal timing", "Water savings", "Curb-appeal upgrades"],
  },
  {
    key: "facility-services", label: "Facility Services", nicheTags: ["cleaning_janitorial", "property_services", "pest", "security_services", "waste_hauling"],
    preferredBuyerTags: ["owns_buildings", "multi_site", "portfolio_owner", "residential_units", "regulated_inspections"], excludedBuyerKinds: ["consumer"],
    roleFamilies: ["facilities", "property_management", "operations"],
    discoveryRecipes: ["maps-listings", "pm-portfolios", "brand-directories", "local-procurement"],
    signals: ["contract_expiration", "new_location", "new_facility", "negative_reviews", "management_change"],
    qualification: { minFit: 55, requireDecisionMaker: true },
    projectTypes: ["Janitorial", "Turnovers", "Pest programs", "Day porter"],
    buyingMotions: ["recurring_service", "bid_procurement"], recurring: "Monthly service contracts.",
    outboundAngles: ["Vendor consolidation", "Inspection-ready facilities", "Turnover speed"],
  },
  {
    key: "sitework", label: "Sitework / Heavy Civil", nicheTags: ["sitework_civil", "construction_gc", "equipment_rental", "concrete_masonry", "fencing_site"],
    preferredBuyerTags: ["construction_buyer", "land_development", "procurement", "industrial_plant"], excludedBuyerKinds: ["consumer"],
    roleFamilies: ["construction_project", "estimating_preconstruction", "public_works", "procurement", "owner_executive"],
    discoveryRecipes: ["building-permits", "bid-boards", "contractor-licensing", "local-procurement"],
    signals: ["building_permit", "bid_posting", "financed_project", "construction_project", "infrastructure_funding"],
    qualification: { minFit: 55, requireDecisionMaker: true },
    projectTypes: ["Site development", "Demolition", "Drainage", "Concrete flatwork"],
    buyingMotions: ["bid_procurement", "project"], recurring: "Repeat GC relationships across projects.",
    outboundAngles: ["Bid-list inclusion", "Schedule capacity", "Value engineering"],
  },
];

export function packsForNiche(tags: string[]): VerticalPack[] {
  return PACKS.filter((p) => p.nicheTags.some((t) => tags.includes(t)));
}
