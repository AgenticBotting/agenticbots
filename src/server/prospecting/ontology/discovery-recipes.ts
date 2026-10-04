/**
 * Discovery recipes — WHERE each kind of buyer can be found.
 *
 * A recipe names a source class (not a vendor), what it yields, how
 * reliable it is, and which provider capability serves it. Recipes are
 * matched to buyer types by facility tags/segments, so a Market knows which
 * sources to run before any provider is chosen. Most sources here have NO
 * adapter yet; `adapter` says which neutral capability would serve them,
 * and the operator console shows which ones are live vs. planned.
 */
export type SourceClass =
  | "local_business_listings"
  | "property_records"
  | "property_manager_portfolios"
  | "reit_portfolios"
  | "company_websites"
  | "state_contractor_licensing"
  | "building_permits"
  | "bid_boards"
  | "public_procurement"
  | "federal_procurement"
  | "association_directories"
  | "brand_location_directories"
  | "apartment_directories"
  | "hotel_directories"
  | "healthcare_registries"
  | "school_directories"
  | "business_registrations"
  | "professional_networks";

export interface DiscoveryRecipe {
  key: string;
  label: string;
  source: SourceClass;
  /** What a run produces. */
  yields: ("companies" | "locations" | "people" | "signals" | "portfolio_size")[];
  /** Buyer facility tags / segment keys this recipe is good for. */
  forBuyerTags: string[];
  forSegments?: string[];
  reliability: "high" | "medium" | "low";
  /** Neutral provider capability that would execute it. */
  adapter: "company_discovery" | "property_data" | "procurement" | "permits" | "web_research" | "contact_enrichment";
  notes: string;
}

export const DISCOVERY_RECIPES: DiscoveryRecipe[] = [
  { key: "maps-listings", label: "Local business listings", source: "local_business_listings", yields: ["companies", "locations"], forBuyerTags: ["owns_buildings", "has_parking", "has_kitchen", "multi_site", "venue", "fleet", "industrial_plant"], reliability: "high", adapter: "company_discovery", notes: "Category + geography search. Good coverage for storefront and facility buyers; weak on portfolio owners." },
  { key: "county-property", label: "County property records", source: "property_records", yields: ["companies", "locations", "portfolio_size"], forBuyerTags: ["owns_buildings", "portfolio_owner", "residential_units", "has_parking"], reliability: "high", adapter: "property_data", notes: "Owner of record per parcel; aggregate parcels to find portfolio owners." },
  { key: "pm-portfolios", label: "Property manager portfolios", source: "property_manager_portfolios", yields: ["companies", "locations", "portfolio_size", "people"], forBuyerTags: ["portfolio_owner", "residential_units"], reliability: "medium", adapter: "web_research", notes: "Managed-property lists on PM company websites tie properties to the manager who buys services." },
  { key: "reit-portfolios", label: "REIT portfolios", source: "reit_portfolios", yields: ["companies", "locations", "portfolio_size"], forBuyerTags: ["portfolio_owner"], reliability: "high", adapter: "web_research", notes: "Public filings and property search pages list every asset by market." },
  { key: "company-sites", label: "Company websites", source: "company_websites", yields: ["companies", "people", "signals"], forBuyerTags: ["owns_buildings", "multi_site", "construction_buyer", "portfolio_owner"], reliability: "medium", adapter: "web_research", notes: "Team pages, locations, news. Research step, not bulk discovery." },
  { key: "contractor-licensing", label: "State contractor licensing", source: "state_contractor_licensing", yields: ["companies", "people"], forBuyerTags: ["construction_buyer"], forSegments: ["construction-and-development"], reliability: "high", adapter: "company_discovery", notes: "Licensed GCs and subs with qualifier names." },
  { key: "building-permits", label: "Building permits", source: "building_permits", yields: ["companies", "signals"], forBuyerTags: ["construction_buyer", "land_development", "owns_buildings"], reliability: "high", adapter: "permits", notes: "Who is building what, where, now — the strongest timing signal for trades." },
  { key: "bid-boards", label: "Bid boards and project databases", source: "bid_boards", yields: ["companies", "signals"], forBuyerTags: ["construction_buyer", "procurement"], reliability: "medium", adapter: "procurement", notes: "Open bids name the GC/owner and the scope." },
  { key: "local-procurement", label: "County and municipal procurement portals", source: "public_procurement", yields: ["companies", "signals", "people"], forBuyerTags: ["procurement"], forSegments: ["government-and-public-sector", "education"], reliability: "high", adapter: "procurement", notes: "Solicitations, awards, buyer contacts." },
  { key: "sam-gov", label: "Federal procurement (SAM.gov)", source: "federal_procurement", yields: ["signals", "people"], forBuyerTags: ["procurement"], reliability: "high", adapter: "procurement", notes: "Federal opportunities and contracting officers." },
  { key: "associations", label: "Industry association directories", source: "association_directories", yields: ["companies", "people"], forBuyerTags: ["construction_buyer", "residential_units", "portfolio_owner"], reliability: "medium", adapter: "web_research", notes: "CAI, BOMA, IREM, AGC chapters and similar member lists." },
  { key: "brand-directories", label: "Brand / franchise location directories", source: "brand_location_directories", yields: ["locations", "companies"], forBuyerTags: ["multi_site"], reliability: "high", adapter: "company_discovery", notes: "Every location of a chain, with the operating entity when available." },
  { key: "apartment-directories", label: "Apartment directories", source: "apartment_directories", yields: ["locations", "companies"], forBuyerTags: ["residential_units"], reliability: "medium", adapter: "company_discovery", notes: "Properties with their management company." },
  { key: "hotel-directories", label: "Hotel brand and management-company directories", source: "hotel_directories", yields: ["locations", "companies"], forBuyerTags: ["has_pool", "has_kitchen"], reliability: "medium", adapter: "company_discovery", notes: "Hotel → management company → engineering leadership." },
  { key: "healthcare-registries", label: "Healthcare facility registries", source: "healthcare_registries", yields: ["companies", "locations"], forBuyerTags: ["regulated_inspections", "critical_systems"], forSegments: ["healthcare"], reliability: "high", adapter: "company_discovery", notes: "State-licensed facilities with ownership." },
  { key: "school-directories", label: "School and district directories", source: "school_directories", yields: ["companies", "people"], forBuyerTags: [], forSegments: ["education"], reliability: "high", adapter: "company_discovery", notes: "Districts, campuses and facilities leadership." },
  { key: "business-registrations", label: "State business registrations", source: "business_registrations", yields: ["companies"], forBuyerTags: ["owns_buildings", "portfolio_owner"], reliability: "medium", adapter: "company_discovery", notes: "Legal entities and registered agents — identity resolution, not targeting." },
  { key: "decision-makers", label: "Decision-maker lookup", source: "professional_networks", yields: ["people"], forBuyerTags: ["owns_buildings", "multi_site", "construction_buyer", "portfolio_owner", "industrial_plant", "procurement"], reliability: "medium", adapter: "contact_enrichment", notes: "Via licensed contact-data providers only. No platform scraping." },
];

export function recipesForBuyer(buyer: { tags: string[]; segmentKey: string }): DiscoveryRecipe[] {
  return DISCOVERY_RECIPES.filter(
    (r) => r.forBuyerTags.some((t) => buyer.tags.includes(t)) || (r.forSegments ?? []).includes(buyer.segmentKey),
  );
}
