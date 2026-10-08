import "server-only";
import { getDatasetCity, getDatasetState } from "./geo/dataset";
import { getIndustry } from "./industries";
import { getService } from "./catalog";
import { getPublicNiche } from "./public-niches";
import { nicheAudience } from "./niche-directory";
import { getSearchPositioning } from "./search-positioning";
import { localDirectoryHref, localIndustryHref, localNicheHref, marketHref, type MarketGeo } from "./local-market-paths";

/** Unknown places, categories, services and extra segments are rejected, never guessed. */
export function resolveLocalMarket(geo: MarketGeo, subject: string[] = []) {
  const state = getDatasetState(geo.state);
  const city = geo.city ? getDatasetCity(geo.state, geo.city) : undefined;
  if (!state || (geo.city && !city)) return;
  const directory = subject.length === 0;
  const isNiche = subject[0] === "niches";
  if ((!isNiche && subject.length > 2) || (isNiche && (subject.length < 2 || subject.length > 3))) return;
  const industry = !directory && !isNiche ? getIndustry(subject[0]) : undefined;
  const niche = isNiche ? getPublicNiche(subject[1]) : undefined;
  if (!directory && !industry && !niche) return;
  const serviceSlug = subject[isNiche ? 2 : 1];
  const service = serviceSlug ? getService(serviceSlug) : undefined;
  if (serviceSlug && !service) return;
  const place = city?.city ?? state.name;
  const location = city ? `${city.city}, ${state.abbr}` : state.name;
  const name = industry?.name ?? niche?.name ?? "Industries";
  const audience = industry?.audience ?? (niche ? nicheAudience(niche.name) : "service businesses");
  const channel: "seo" | "ppc" | undefined = service?.slug === "seo" ? "seo" : service?.slug === "paid-media" ? "ppc" : undefined;
  const label = service ? getSearchPositioning(service.slug).label : "Marketing";
  const basePath = industry ? localIndustryHref(geo, industry.slug) : niche ? localNicheHref(geo, niche.slug) : localDirectoryHref(geo);
  const path = service ? `${basePath}/${service.serviceSlug}` : basePath;
  // Preserve trade/niche identity even for long names. Dropping it would duplicate city-service titles.
  const fullTitle = directory ? `Business niches in ${location} | AgenticBots` : `Agentic ${label.replace(/^[A-Z](?=[a-z])/, c => c.toLowerCase())} for ${audience} in ${location}`;
  const title = fullTitle.length <= 70 ? fullTitle : `${name} ${label.toLowerCase()} in ${location}`;
  const description = directory ? `Find your business niche in ${location}. Explore relevant buyer roles, marketing channels and managed BOT implementation.` : `${name} ${label.toLowerCase()} in ${location}. Define buyer roles, service coverage and the BOT workflow around your business. Request a proposal.`;
  return { geo, state, city, directory, industry, niche, service, channel, place, location, name, audience, label, basePath, path, title, description, marketPath: marketHref(geo), directoryPath: localDirectoryHref(geo) };
}
export type LocalMarket = NonNullable<ReturnType<typeof resolveLocalMarket>>;
