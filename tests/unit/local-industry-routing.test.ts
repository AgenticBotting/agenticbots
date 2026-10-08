import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import CityHub from "@/app/markets/[state]/[city]/page";
import StateHub from "@/app/markets/[state]/page";
import CityService from "@/app/services/[slug]/[state]/[city]/page";
import LocalCityPage, { generateMetadata } from "@/app/markets/[state]/[city]/industries/[[...subject]]/page";
import LocalStatePage from "@/app/markets/[state]/industries/[[...subject]]/page";
import { LocalIndustryExperience } from "@/components/marketing/LocalIndustryExperience";
import { resolveLocalMarket } from "@/lib/local-market";
import { localIndustryHref, localNicheHref, localDirectoryHref, marketServiceHref } from "@/lib/local-market-paths";
import { acquisitionContext } from "@/lib/acquisition-attribution";
import { ALL_SERVICES } from "@/lib/catalog";
import { ALL_CITIES, ALL_STATES } from "@/lib/geo/dataset";
import { INDUSTRIES } from "@/lib/industries";
import { PUBLIC_NICHES } from "@/lib/public-niches";
import { SEARCH_PUBLICATION } from "@/lib/search-publication";
import routeData from "@/data/public-market-routes.json";

vi.mock("next/navigation", () => ({ usePathname: () => "/markets/arizona/buckeye", notFound: () => { throw new Error("not found"); } }));
const geo = { state: "arizona", city: "buckeye" };
const root = "/markets/arizona/buckeye/industries";
const main = (html: string) => html.match(/<main\b[^>]*>([\s\S]*)<\/main>/)![1];

describe("location-preserving industry journeys", () => {
  it("routes Buckeye trade links locally and carries the selected service into the trade", async () => {
    const hub = main(renderToStaticMarkup(await CityHub({ params: Promise.resolve(geo) })));
    for (const industry of INDUSTRIES) expect(hub).toContain(`href="${localIndustryHref(geo, industry.slug)}"`);
    expect(hub).toContain(`href="${root}#niche-directory"`);
    expect(hub).not.toContain('href="/industries/');
    const seo = main(renderToStaticMarkup(await CityService({ params: Promise.resolve({ ...geo, slug: "agentic-seo" }) })));
    expect(seo).toContain(`href="${root}/hvac/agentic-seo"`);
    const crm = main(renderToStaticMarkup(await CityService({ params: Promise.resolve({ ...geo, slug: "agentic-crm-automation" }) })));
    expect(crm).toContain(`href="${root}/hvac/agentic-crm-automation"`);
  });

  it("preserves the selected location and business in shared service navigation", () => {
    for (const service of ALL_SERVICES) {
      expect(marketServiceHref(service.serviceSlug, geo)).toBe(`/services/${service.serviceSlug}/arizona/buckeye`);
      expect(marketServiceHref(service.serviceSlug, { ...geo, industry: "hvac" })).toBe(`${root}/hvac/${service.serviceSlug}`);
      expect(marketServiceHref(service.serviceSlug, { ...geo, niche: "commercial-hvac" })).toBe(`${root}/niches/commercial-hvac/${service.serviceSlug}`);
    }
  });

  it("retains city and niche through service choices, buyer specialties and related services", async () => {
    const html = main(renderToStaticMarkup(await LocalCityPage({ params: Promise.resolve({ ...geo, subject: ["hvac"] }) })));
    expect(html.replace(/<[^>]+>/g, "")).toContain("for HVAC companies in Buckeye.");
    expect(html).toContain(`href="${root}/niches/commercial-hvac"`);
    for (const service of ALL_SERVICES) expect(html).toContain(`href="${root}/hvac/${service.serviceSlug}"`);
    expect(html).not.toContain('href="/industries/');
    expect(html).not.toContain('href="/services/');
    const detail = main(renderToStaticMarkup(await LocalCityPage({ params: Promise.resolve({ ...geo, subject: ["niches", "commercial-hvac", "agentic-seo"] }) })));
    expect(detail.replace(/<[^>]+>/g, "")).toContain("commercial HVAC in Buckeye.");
    expect(detail).toContain("Buyer-to-pipeline map");
    expect(detail).toContain('data-demo="true"');
    expect(detail).toContain(`href="${root}/niches/commercial-hvac/agentic-ppc-management"`);
    expect(detail).toContain('href="/markets/arizona/industries/niches/commercial-hvac/agentic-seo"');
    expect(detail.match(/<h1[ >]/g)).toHaveLength(1);
    const crm = renderToStaticMarkup(createElement(LocalIndustryExperience, { page: resolveLocalMarket(geo, ["hvac", "agentic-crm-automation"])! }));
    expect(crm).not.toContain("Replacement page brief");
    expect(crm).toContain('href="/markets/arizona/buckeye/industries/hvac/agentic-seo"');
  });

  it("supports all states including unenriched states without falling back to national services", async () => {
    const html = main(renderToStaticMarkup(await StateHub({ params: Promise.resolve({ state: "alaska" }) })));
    for (const service of ALL_SERVICES) expect(html).toContain(`href="/services/${service.serviceSlug}/alaska"`);
    expect(html).toContain('href="/markets/alaska/industries/hvac"');
    const local = main(renderToStaticMarkup(await LocalStatePage({ params: Promise.resolve({ state: "alaska", subject: ["hvac"] }) })));
    expect(local).toContain('href="/markets/alaska/anchorage/industries/hvac"');
    expect(local.replace(/<[^>]+>/g, "")).toContain("for HVAC companies in Alaska.");
  });

  it("keeps all 341 directory destinations within the location and validates their service combinations", () => {
    const directory = renderToStaticMarkup(createElement(LocalIndustryExperience, { page: resolveLocalMarket(geo)! }));
    for (const niche of PUBLIC_NICHES) {
      expect(directory).toContain(`href="${localNicheHref(geo, niche.slug)}"`);
      for (const service of ALL_SERVICES) {
        const page = resolveLocalMarket(geo, ["niches", niche.slug, service.serviceSlug]);
        expect(page?.path).toBe(localNicheHref(geo, niche.slug, service.serviceSlug));
        expect(acquisitionContext(page!.path)).toMatchObject({ state: "arizona", city: "buckeye", niche: niche.slug, service: service.serviceSlug });
      }
    }
  });

  it("validates the compact browser route allowlist against the full catalogs and geography", () => {
    expect(routeData.industries.sort()).toEqual(INDUSTRIES.map(i => i.slug).sort());
    expect(routeData.services.sort()).toEqual(ALL_SERVICES.map(s => s.serviceSlug).sort());
    expect(Object.keys(routeData.states).sort()).toEqual(ALL_STATES.map(s => s.slug).sort());
    for (const state of ALL_STATES) {
      expect(routeData.states[state.slug as keyof typeof routeData.states].slice().sort()).toEqual(ALL_CITIES.filter(c => c.state_slug === state.slug).map(c => c.city_slug).sort());
      expect(acquisitionContext(localDirectoryHref({ state: state.slug }))).toMatchObject({ state: state.slug });
    }
    for (const city of ALL_CITIES) {
      const context = { state: city.state_slug, city: city.city_slug };
      for (const industry of INDUSTRIES) {
        const page = resolveLocalMarket(context, [industry.slug]);
        expect(page?.path).toBe(localIndustryHref(context, industry.slug));
        expect(acquisitionContext(page!.path)).toMatchObject({ ...context, industry: industry.slug });
      }
    }
  });

  it("uses self canonicals and keeps new intersections outside the publication register", async () => {
    const titles = new Set<string>();
    for (const subject of [[], ["hvac"], ["hvac", "agentic-seo"], ["hvac", "agentic-ppc-management"], ["niches", "commercial-hvac"], ["niches", "commercial-hvac", "agentic-seo"]]) {
      const page = resolveLocalMarket(geo, subject)!;
      const metadata = await generateMetadata({ params: Promise.resolve({ ...geo, subject }) });
      expect(metadata.robots).toEqual({ index: false, follow: true });
      expect(metadata.alternates?.canonical).toBe(page.path);
      expect(SEARCH_PUBLICATION[page.path]).toBeUndefined();
      expect(titles.has(page.title)).toBe(false);
      titles.add(page.title);
    }
    expect(Object.keys(SEARCH_PUBLICATION)).toHaveLength(584);
  });

  it("rejects wrong state-city pairs, unknown services, taxonomy aliases and extra segments", async () => {
    for (const subject of [["unknown"], ["hvac", "seo"], ["hvac", "agentic-seo", "extra"], ["niches"], ["niches", "unknown"], ["niches", "commercial-hvac", "invalid"], ["niches", "commercial-hvac", "agentic-seo", "extra"]]) {
      expect(resolveLocalMarket(geo, subject)).toBeUndefined();
      expect(acquisitionContext(`${root}/${subject.join("/")}`)).toEqual({});
      await expect(LocalCityPage({ params: Promise.resolve({ ...geo, subject }) })).rejects.toThrow("not found");
    }
    for (const invalid of [{ state: "florida", city: "buckeye" }, { state: "arizona", city: "unknown" }, { state: "unknown" }]) expect(resolveLocalMarket(invalid, ["hvac"])).toBeUndefined();
    for (const path of [`${root}/hvac?email=private@example.com`, `${root}/hvac/`, "/markets/florida/buckeye/industries/hvac"]) expect(acquisitionContext(path)).toEqual({});
  });
});
