import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import MarketsIndex from "@/app/markets/page";
import RegionPage from "@/app/markets/region/[region]/page";
import StatePage, { generateMetadata as stateMetadata, generateStaticParams as stateParams } from "@/app/markets/[state]/page";
import CityPage, { generateMetadata as cityMetadata, generateStaticParams as cityParams } from "@/app/markets/[state]/[city]/page";
import { ALL_SERVICES } from "@/lib/catalog";
import { ALL_CITIES, ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { getLocalSearchBrief } from "@/lib/local-search-briefs";
import { getCity } from "@/lib/geo/data";
import { MARKET_PRIORITIES, filterMarketGroups, type MarketGroup } from "@/lib/market-experience";
import { MarketWorkspace } from "@/components/marketing/MarketWorkspace";

vi.mock("next/navigation", () => ({ usePathname: () => "/markets", notFound: () => { throw new Error("not found"); } }));
const groups: MarketGroup[] = [
  { id: "southeast", name: "Southeast", items: [{ name: "Florida", href: "/markets/florida", search: "FL" }], searchItems: [{ name: "Miami, FL", href: "/markets/florida/miami", detail: "Florida" }] },
  { id: "west", name: "West", items: [{ name: "California", href: "/markets/california", search: "CA" }] },
];

describe("geographic buying journey", () => {
  it("filters real destinations by city, state, abbreviation and region without changing source data", () => {
    expect(filterMarketGroups(groups, "").flatMap(g => g.items)).toHaveLength(2);
    expect(filterMarketGroups(groups, "Miami, FL")[0].items[0].href).toBe("/markets/florida/miami");
    expect(filterMarketGroups(groups, "FL")[0].items).toHaveLength(2);
    expect(filterMarketGroups(groups, "", "west")[0].items[0].name).toBe("California");
    expect(filterMarketGroups(groups, "Miami", "west")).toEqual([]);
    expect(filterMarketGroups(groups, "unknown market")).toEqual([]);
    expect(groups[0].items).toHaveLength(1);
  });

  it("retains crawlable region, state and metro-to-city paths in the initial HTML", async () => {
    const national = renderToStaticMarkup(createElement(MarketsIndex));
    for (const state of ALL_STATES) expect(national).toContain(`href="/markets/${state.slug}"`);
    const southeast = renderToStaticMarkup(await RegionPage({ params: Promise.resolve({ region: "southeast" }) }));
    expect(southeast).toContain('href="/markets/florida"');
    expect(southeast).toContain('href="/markets/region/west"');
    const florida = renderToStaticMarkup(await StatePage({ params: Promise.resolve({ state: "florida" }) }));
    for (const city of allCitiesInState("florida")) expect(florida).toContain(`href="/markets/florida/${city.city_slug}"`);
    for (const svc of ALL_SERVICES) expect(florida).toContain(`href="/services/${svc.serviceSlug}/florida"`);
    expect(stateParams()).toHaveLength(ALL_STATES.length);
    expect(cityParams()).toHaveLength(ALL_CITIES.length);
  });

  it("preserves enriched local content, every city-service link and nearby navigation", async () => {
    const html = renderToStaticMarkup(await CityPage({ params: Promise.resolve({ state: "florida", city: "miami" }) }));
    const local = getCity("florida", "miami")!;
    expect(html).toContain(renderToStaticMarkup(createElement("p", null, getLocalSearchBrief("florida", "miami")!.review)));
    for (const district of local.districts) expect(html).toContain(district);
    for (const svc of ALL_SERVICES) expect(html).toContain(`href="/services/${svc.serviceSlug}/florida/miami"`);
    expect(html).toContain('href="/markets/florida/fort-lauderdale"');
    expect(html).toContain('href="/markets/florida"');
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).toContain('id="audit"');
    expect(html).toContain("$499");
    expect(html).toContain("$7,500");
    expect(html).not.toContain("Metro population");
    expect(html).not.toContain("CPC band");
  });

  it("keeps structural markets noindex while rendering useful services and a local audit", async () => {
    const params = { state: "alaska", city: "anchorage" };
    const metadata = await cityMetadata({ params: Promise.resolve(params) });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("/markets/alaska/anchorage");
    expect((await stateMetadata({ params: Promise.resolve({ state: "alaska" }) })).robots).toEqual({ index: false, follow: true });
    expect((await cityMetadata({ params: Promise.resolve({ state: "florida", city: "miami" }) })).robots).toBeUndefined();
    const html = renderToStaticMarkup(await CityPage({ params: Promise.resolve(params) }));
    for (const svc of ALL_SERVICES) expect(html).toContain(`href="/services/${svc.serviceSlug}/alaska/anchorage"`);
    expect(html).toContain("your business in Anchorage, AK");
  });

  it("covers the full service catalogue once and labels the planning workspace as illustrative", () => {
    const slugs = MARKET_PRIORITIES.flatMap(priority => [...priority.slugs]);
    expect([...slugs].sort()).toEqual(ALL_SERVICES.map(s => s.slug).sort());
    const html = renderToStaticMarkup(createElement(MarketWorkspace, { place: "Miami", areas: ["Brickell", "Wynwood"], areaLabel: "Local districts" }));
    expect(html).toContain('data-demo="true"');
    expect(html).toContain("Illustrative workflow · no live data");
    expect(html).toContain("Nothing is sent or changed.");
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  });

  it("rejects invalid region, state and city combinations", async () => {
    await expect(RegionPage({ params: Promise.resolve({ region: "not-a-region" }) })).rejects.toThrow("not found");
    await expect(StatePage({ params: Promise.resolve({ state: "not-a-state" }) })).rejects.toThrow("not found");
    await expect(CityPage({ params: Promise.resolve({ state: "alaska", city: "miami" }) })).rejects.toThrow("not found");
  });
});
