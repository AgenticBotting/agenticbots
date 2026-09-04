/**
 * US regions for the Service Areas navigation — five columns, so 51
 * states never render as one overwhelming list. Every state is mapped
 * now; the menu shows whichever states have live markets and scales to
 * national coverage without a layout change.
 */

export const REGIONS = ["West", "Southwest", "Midwest", "Southeast", "Northeast"] as const;
export type Region = (typeof REGIONS)[number];

const MAP: Record<Region, string[]> = {
  West: ["washington", "oregon", "california", "nevada", "idaho", "montana", "wyoming", "utah", "colorado", "alaska", "hawaii"],
  Southwest: ["arizona", "new-mexico", "texas", "oklahoma"],
  Midwest: ["north-dakota", "south-dakota", "nebraska", "kansas", "minnesota", "iowa", "missouri", "wisconsin", "illinois", "indiana", "michigan", "ohio"],
  Southeast: ["arkansas", "louisiana", "mississippi", "alabama", "tennessee", "kentucky", "west-virginia", "virginia", "north-carolina", "south-carolina", "georgia", "florida"],
  Northeast: ["maine", "new-hampshire", "vermont", "massachusetts", "rhode-island", "connecticut", "new-york", "new-jersey", "pennsylvania", "delaware", "maryland", "district-of-columbia"],
};

const LOOKUP = new Map<string, Region>();
for (const r of REGIONS) for (const s of MAP[r]) LOOKUP.set(s, r);

export function regionOf(stateSlug: string): Region {
  return LOOKUP.get(stateSlug) ?? "Midwest";
}

export function groupByRegion<T extends { slug: string }>(states: T[]): { region: Region; states: T[] }[] {
  return REGIONS.map((region) => ({
    region,
    states: states.filter((s) => regionOf(s.slug) === region),
  })).filter((g) => g.states.length > 0);
}
