/**
 * The full national dataset (src/data/cities-dataset.json — 924 cities,
 * 51 states, 334 metro clusters). This drives NAVIGATION and the
 * structural city/state hub pages.
 *
 * The hand-enriched set in ./data.ts (localNote, districts, character,
 * CPC bands) remains the INDEXABLE set — structural pages render honest
 * coverage content and stay noindex until enriched, per the release
 * schedule in docs/PROGRAMMATIC-SEO-PLAN.md.
 */
import raw from "@/data/cities-dataset.json";
import { CITIES as ENRICHED } from "./data";

export interface DatasetCity {
  city: string;
  state: string;
  state_abbr: string;
  city_slug: string;
  state_slug: string;
  metro: string;
  metro_slug: string;
  tier: 1 | 2 | 3;
  surrounding: { city: string; slug: string; metro: string }[];
}
export interface DatasetState { name: string; abbr: string; slug: string }

const data = raw as unknown as {
  services: { slug: string; short: string; h1_pattern: string }[];
  states: DatasetState[];
  cities: DatasetCity[];
};

export const ALL_STATES: DatasetState[] = data.states;
export const ALL_CITIES: DatasetCity[] = data.cities;

const byState = new Map<string, DatasetCity[]>();
for (const c of ALL_CITIES) {
  if (!byState.has(c.state_slug)) byState.set(c.state_slug, []);
  byState.get(c.state_slug)!.push(c);
}
// Tier first, then name — the order every list renders in.
for (const list of byState.values())
  list.sort((a, b) => a.tier - b.tier || a.city.localeCompare(b.city));

export const allCitiesInState = (stateSlug: string): DatasetCity[] => byState.get(stateSlug) ?? [];
export const getDatasetState = (slug: string): DatasetState | undefined =>
  ALL_STATES.find((s) => s.slug === slug);
export const getDatasetCity = (stateSlug: string, citySlug: string): DatasetCity | undefined =>
  byState.get(stateSlug)?.find((c) => c.city_slug === citySlug);

const enrichedKeys = new Set(ENRICHED.map((c) => `${c.stateSlug}/${c.slug}`));
export const isEnriched = (stateSlug: string, citySlug: string) =>
  enrichedKeys.has(`${stateSlug}/${citySlug}`);
export const enrichedCount = (stateSlug: string) =>
  allCitiesInState(stateSlug).filter((c) => isEnriched(c.state_slug, c.city_slug)).length;
