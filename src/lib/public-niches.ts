import "server-only";
import raw from "@/data/public-niche-catalog.json";
import type { BuyerJourney, PublicNicheCatalog } from "./public-niche-types";

export const PUBLIC_NICHE_CATALOG = raw as PublicNicheCatalog;
export const PUBLIC_NICHES = PUBLIC_NICHE_CATALOG.niches;
export const PUBLIC_BUYERS = PUBLIC_NICHE_CATALOG.buyers;
const nicheBySlug = new Map(PUBLIC_NICHES.map(niche => [niche.slug, niche]));
const buyerBySlug = new Map(PUBLIC_BUYERS.map(buyer => [buyer.slug, buyer]));
export const getPublicNiche = (slug: string) => nicheBySlug.get(slug);
export const nicheHref = (slug: string) => `/industries/niches/${slug}`;
export function nicheJourneys(slug: string): BuyerJourney[] {
  return (getPublicNiche(slug)?.buyers ?? []).flatMap(buyer => {
    const profile = buyerBySlug.get(buyer.buyer);
    return profile ? [{ ...buyer, profile }] : [];
  });
}
export const TRADE_NICHE_CATEGORIES: Record<string, string> = {
  hvac: "HVAC & Mechanical", plumbing: "Plumbing & Water", electrical: "Electrical & Low Voltage",
  roofing: "Roofing & Exterior", remodeling: "Remodeling & Construction", "general-contractors": "Remodeling & Construction",
};
export const TRADE_FEATURED_NICHE: Record<string, string> = {
  hvac: "commercial-hvac", plumbing: "commercial-plumbing", electrical: "commercial-electricians",
  roofing: "commercial-roofing", remodeling: "general-contractors-commercial", "general-contractors": "general-contractors-commercial",
};
export function tradeNiches(industry: string) {
  const category = TRADE_NICHE_CATEGORIES[industry];
  return PUBLIC_NICHES.filter(niche => niche.category === category);
}
