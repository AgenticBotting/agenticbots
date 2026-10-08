/** Public planning vocabulary only. No company, contact or client records. */
export type PublicBuyer = {
  slug: string;
  name: string;
  segment: string;
  roles: string[];
  kind: "organization" | "household" | "referral";
  research: string[];
};
export type NicheBuyer = {
  buyer: string;
  roles: string[];
  relationship: "direct" | "subcontract" | "referral" | "bid" | "channel" | "institutional" | "residential" | "other";
  motion: "recurring_service" | "project" | "emergency" | "inspection_compliance" | "bid_procurement" | "referral";
  validation: "reviewed" | "modeled";
};
export type PublicNiche = {
  slug: string;
  name: string;
  category: string;
  audience: string;
  buyers: NicheBuyer[];
};
export type PublicNicheCatalog = { niches: PublicNiche[]; buyers: PublicBuyer[] };
export type BuyerJourney = NicheBuyer & { profile: PublicBuyer };
