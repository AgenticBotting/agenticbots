/** One canonical location → trade/niche → service hierarchy. Safe to use in client links. */
export type MarketGeo = { state: string; city?: string };
export const marketHref = ({ state, city }: MarketGeo) => `/markets/${state}${city ? `/${city}` : ""}`;
export const localDirectoryHref = (geo: MarketGeo) => `${marketHref(geo)}/industries`;
export const localIndustryHref = (geo: MarketGeo, industry: string, service?: string) => `${localDirectoryHref(geo)}/${industry}${service ? `/${service}` : ""}`;
export const localNicheHref = (geo: MarketGeo, niche: string, service?: string) => `${localDirectoryHref(geo)}/niches/${niche}${service ? `/${service}` : ""}`;
export type MarketNavigation = MarketGeo & { industry?: string; niche?: string };
export function marketServiceHref(service: string, context: MarketNavigation) {
  if (context.niche) return localNicheHref(context, context.niche, service);
  if (context.industry) return localIndustryHref(context, context.industry, service);
  return `/services/${service}/${context.state}${context.city ? `/${context.city}` : ""}`;
}
