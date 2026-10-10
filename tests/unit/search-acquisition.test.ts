import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import IndustryIndex from "@/app/industries/page";
import IndustryPage, { generateMetadata as industryMetadata, generateStaticParams as industryParams } from "@/app/industries/[industry]/page";
import IndustryServicePage, { generateMetadata as channelMetadata, generateStaticParams as channelParams } from "@/app/industries/[industry]/[service]/page";
import CityServicePage, { generateStaticParams as cityServiceParams } from "@/app/services/[slug]/[state]/[city]/page";
import { generateStaticParams as stateServiceParams } from "@/app/services/[slug]/[state]/page";
import sitemap from "@/app/sitemap";
import { ALL_SERVICES } from "@/lib/catalog";
import { ALL_CITIES, ALL_STATES } from "@/lib/geo/dataset";
import { INDUSTRIES, INDUSTRY_CHANNELS } from "@/lib/industries";
import { LOCAL_SEARCH_BRIEFS } from "@/lib/local-search-briefs";
import { SEARCH_PUBLICATION, searchRobots } from "@/lib/search-publication";
import { SEARCH_POSITIONING, agenticSearchTitle, serviceSearchTitle, serviceSearchDescription } from "@/lib/search-positioning";
import { acquisitionContext, acquisitionEventContext } from "@/lib/acquisition-attribution";

vi.mock("next/navigation", () => ({ usePathname: () => "/industries", notFound: () => { throw new Error("not found"); } }));

describe("search acquisition rollout", () => {
  it("keeps every service label aligned with the real catalog and within metadata limits nationwide", () => {
    expect(Object.keys(SEARCH_POSITIONING).sort()).toEqual(ALL_SERVICES.map(s => s.slug).sort());
    const titles = new Set<string>();
    for (const svc of ALL_SERVICES) {
      for (const location of [undefined, ...ALL_STATES.map(s => s.name), ...ALL_CITIES.map(c => `${c.city}, ${c.state_abbr}`)]) {
        const title = serviceSearchTitle(svc, location);
        expect(title).toMatch(/^Agentic /);
        expect(title.length, title).toBeLessThanOrEqual(70);
        if (location) expect(title).toContain(` in ${location}`);
        expect(serviceSearchDescription(svc, location).length, title).toBeLessThanOrEqual(170);
        expect(titles.has(title), title).toBe(false);
        titles.add(title);
      }
    }
    for (const location of [...ALL_STATES.map(s => s.name), ...ALL_CITIES.map(c => `${c.city}, ${c.state_abbr}`)]) {
      const title = agenticSearchTitle("marketing", "contractors", location);
      expect(title.length, title).toBeLessThanOrEqual(70);
      expect(title).toContain(` in ${location}`);
      expect(titles.has(title), title).toBe(false);
      titles.add(title);
    }
    expect(agenticSearchTitle("marketing", "contractors", "Miami, FL")).toBe("Agentic marketing for contractors in Miami, FL | AgenticBots");
    expect(agenticSearchTitle("SEO", "HVAC companies")).toBe("Agentic SEO for HVAC companies | AgenticBots");
    expect(agenticSearchTitle("Content marketing", "contractors", "Miami, FL")).toBe("Agentic content marketing for contractors in Miami, FL | AgenticBots");
    expect(agenticSearchTitle("Outbound sales support", "commercial contractors", "Rancho Santa Margarita, CA")).toBe("Agentic outbound sales support in Rancho Santa Margarita, CA");
  });

  it("preserves the prior 565 indexable destinations and adds only the 19 curated industry pages", async () => {
    const entries = Object.entries(SEARCH_PUBLICATION);
    expect(entries.filter(([, entry]) => entry.basis === "retained-indexability")).toHaveLength(565);
    expect(entries.filter(([, entry]) => entry.basis === "editorial-content")).toHaveLength(19);
    expect(new Set(entries.map(([, entry]) => entry.intent)).size).toBe(entries.length);
    expect(searchRobots("/services/agentic-seo/alaska/anchorage")).toEqual({ index: false, follow: true });
    expect(searchRobots("/industries/hvac/arizona/phoenix")).toEqual({ index: false, follow: true });
    expect(searchRobots("/industries/hvac/seo")).toBeUndefined();
    const urls = await sitemap({ id: 1 });
    expect(urls.map(url => new URL(url.url).pathname).sort()).toEqual(entries.map(([path]) => path).sort());
    for (const entry of urls) expect(entry.lastModified).toBe(SEARCH_PUBLICATION[new URL(entry.url).pathname].updated);
  });

  it("prerenders approved service geography while leaving the wider matrix on demand", () => {
    const paths = Object.keys(SEARCH_PUBLICATION);
    const expectedCities = paths.flatMap(path => {
      const match = path.match(/^\/services\/([^/]+)\/([^/]+)\/([^/]+)$/);
      return match ? [{ slug: match[1], state: match[2], city: match[3] }] : [];
    });
    const expectedStates = paths.flatMap(path => {
      const match = path.match(/^\/services\/([^/]+)\/([^/]+)$/);
      return match ? [{ slug: match[1], state: match[2] }] : [];
    });
    expect(cityServiceParams()).toEqual(expectedCities);
    expect(stateServiceParams()).toEqual(expectedStates);
    expect(cityServiceParams().length).toBeLessThan(ALL_SERVICES.length * ALL_CITIES.length);
  });

  it("renders all trade journeys with unique buying guidance, real scope and proposal paths", async () => {
    expect(industryParams()).toHaveLength(6);
    expect(channelParams()).toHaveLength(12);
    const directory = renderToStaticMarkup(createElement(IndustryIndex));
    const titles = new Set();
    for (const industry of INDUSTRIES) {
      expect(directory).toContain(`href="/industries/${industry.slug}"`);
      const params = { industry: industry.slug };
      const html = renderToStaticMarkup(await IndustryPage({ params: Promise.resolve(params) }));
      expect(html).toContain(renderToStaticMarkup(createElement("p", null, industry.qualification)));
      expect(html).toContain('data-demo="true"');
      const metadata = await industryMetadata({ params: Promise.resolve(params) });
      expect(metadata.title).toEqual({ absolute: agenticSearchTitle("marketing", industry.audience) });
      expect(metadata.description!.length).toBeLessThanOrEqual(170);
      for (const service of INDUSTRY_CHANNELS) {
        const path = `/industries/${industry.slug}/${service}`;
        expect(html).toContain(`href="${path}"`);
        const detail = renderToStaticMarkup(await IndustryServicePage({ params: Promise.resolve({ ...params, service }) }));
        expect(detail.match(/<h1[ >]/g)).toHaveLength(1);
        expect(detail.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, "")).toMatch(/^Agentic (?:SEO|PPC management) for /);
        expect(detail).toContain('id="audit"');
        expect(detail).not.toContain("$499");
        expect(detail).toContain("Begin Step-1");
        expect(detail).toContain(renderToStaticMarkup(createElement("p", null, industry[service].decisions[0].body)));
        const meta = await channelMetadata({ params: Promise.resolve({ ...params, service }) });
        expect(meta.robots).toBeUndefined();
        expect(meta.alternates?.canonical).toBe(path);
        expect(meta.description!.length).toBeLessThanOrEqual(170);
        expect((meta.title as { absolute: string }).absolute.length).toBeLessThanOrEqual(70);
        expect(titles.has(JSON.stringify(meta.title))).toBe(false);
        titles.add(JSON.stringify(meta.title));
      }
    }
  });

  it("uses distinct SEO and PPC planning briefs in each pilot city", async () => {
    for (const [key, brief] of Object.entries(LOCAL_SEARCH_BRIEFS)) {
      const [state, city] = key.split("/");
      expect(brief.seo).not.toBe(brief.ppc);
      for (const [channel, slug] of [["seo", "agentic-seo"], ["ppc", "agentic-ppc-management"]] as const) {
        const html = renderToStaticMarkup(await CityServicePage({ params: Promise.resolve({ slug, state, city }) }));
        const paragraph = renderToStaticMarkup(createElement("p", null, brief[channel]));
        expect(html).toContain(paragraph);
        expect(html).toContain('data-local-brief=');
      }
    }
  });

  it("rejects unknown trades, channels and unimplemented geographic trade intersections", async () => {
    await expect(IndustryPage({ params: Promise.resolve({ industry: "unknown" }) })).rejects.toThrow("not found");
    await expect(IndustryServicePage({ params: Promise.resolve({ industry: "hvac", service: "arizona" }) })).rejects.toThrow("not found");
    await expect(IndustryServicePage({ params: Promise.resolve({ industry: "unknown", service: "seo" }) })).rejects.toThrow("not found");
  });

  it("allows only verified public route context in analytics", () => {
    expect(acquisitionEventContext("/industries/hvac/ppc", "/services/agentic-seo/florida/miami")).toMatchObject({ industry: "hvac", service: "ppc", landing_state: "florida", landing_city: "miami", landing_service: "agentic-seo" });
    for (const value of [null, {}, "/ops/clients/private-id", "/services/private-client", "/industries/hvac?email=name@example.com", "https://example.com/", "__proto__", "/markets/alaska/anchorage"]) expect(acquisitionContext(value)).toEqual({});
  });
});
