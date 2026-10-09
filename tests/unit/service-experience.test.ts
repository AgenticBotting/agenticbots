import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { ALL_SERVICES, CATALOG } from "@/lib/catalog";
import { SERVICE_EXPERIENCES, getServiceExperience } from "@/lib/service-experience";
import { getServicePositioning } from "@/lib/service-positioning";
import { ServiceScope } from "@/components/marketing/ServiceExperience";
import { SERVICE_ACTIVITY_DEMOS } from "@/lib/service-activity-demo";
import { ServiceWorkspace } from "@/components/marketing/ServiceWorkspace";
import { ServicePortfolio } from "@/components/marketing/ServicePortfolio";
import ServicePage from "@/app/services/[slug]/page";
import StatePage from "@/app/services/[slug]/[state]/page";
import CityPage, { generateMetadata } from "@/app/services/[slug]/[state]/[city]/page";

vi.mock("next/navigation", () => ({ usePathname: () => "/services", notFound: () => { throw new Error("not found"); } }));

describe("service buying journey", () => {
  it("covers every service with distinct fictional task examples and the correct BOT configuration", () => {
    expect(Object.keys(SERVICE_EXPERIENCES).sort()).toEqual(ALL_SERVICES.map(s => s.slug).sort());
    for (const svc of ALL_SERVICES) {
      const copy = getServiceExperience(svc.slug);
      expect(copy.examples).toHaveLength(3);
      expect(new Set(copy.examples.map(e => e.title)).size).toBe(3);
      const html = renderToStaticMarkup(createElement(ServiceWorkspace, { title: copy.workspace, botName: getServicePositioning(svc.slug).deliveryModel, examples: copy.examples }));
      expect(html).toContain('data-demo="true"');
      expect(html).toContain("fictional data");
      expect(html).toContain("This preview sends nothing and changes no records.");
      expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    }
  });

  it("shows honest, service-specific activity while preserving all contracted scope items", () => {
    expect(Object.keys(SERVICE_ACTIVITY_DEMOS).sort()).toEqual(ALL_SERVICES.map(s => s.slug).sort());
    for (const svc of ALL_SERVICES) {
      const demo = SERVICE_ACTIVITY_DEMOS[svc.slug];
      expect(demo.demo).toBe(true);
      expect(demo.values).toHaveLength(12);
      expect(demo.values.every(value => Number.isFinite(value) && value >= 0)).toBe(true);
      const html = renderToStaticMarkup(createElement(ServiceScope, { svc }));
      expect(html).toContain('data-demo="true"');
      expect(html).toContain("Illustrative preview · fictional data");
      expect(html).toContain("No live actions in this preview");
      expect(html).toContain(demo.metric);
      expect(html).toContain(String(demo.values.reduce((sum, value) => sum + value, 0)));
      expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
      for (const item of getServicePositioning(svc.slug).scope) expect(html).toContain(renderToStaticMarkup(createElement("span", null, item)));
      expect(html).toContain("require human approval");
      expect(html).toContain("Build your workflow");
    }
  });

  it("keeps every national service discoverable in the portfolio and its parent pillar", () => {
    const all = renderToStaticMarkup(createElement(ServicePortfolio));
    for (const svc of ALL_SERVICES) expect(all).toContain(`href="/services/${svc.serviceSlug}"`);
    for (const pillar of CATALOG) {
      const html = renderToStaticMarkup(createElement(ServicePortfolio, { pillar }));
      for (const svc of ALL_SERVICES.filter(s => s.pillar === pillar.slug)) expect(html).toContain(`href="/services/${svc.serviceSlug}"`);
      expect(html.match(/<h1[ >]/g)).toHaveLength(1);
      expect(html).toContain('id="audit"');
    }
  });

  it("retains scope, controls, local destinations and proposal entry on all national pages", async () => {
    for (const svc of ALL_SERVICES) {
      const html = renderToStaticMarkup(await ServicePage({ params: Promise.resolve({ slug: svc.serviceSlug }) }));
      expect(html.match(/<h1[ >]/g)).toHaveLength(1);
      expect(html).not.toContain("$499");
    expect(html).toContain("Begin Step-1");
      expect(html.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, "")).toMatch(/^Agentic .+ for /);
      expect(html).toContain("$7,500");
      expect(html).toContain("$2,500");
      expect(html).toContain("human approval");
      for (const state of ALL_STATES) expect(html).toContain(`href="/services/${svc.serviceSlug}/${state.slug}"`);
      expect(html).toContain('id="service-preview"');
      expect(html).toContain('id="audit"');
      const visibleCopy = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").toLowerCase().replace(/[\u2010-\u2015-]/g, " ");
      expect(svc.owns.some(term => visibleCopy.includes(term.toLowerCase().replace(/[\u2010-\u2015-]/g, " "))), svc.slug).toBe(true);
    }
  });

  it("renders every Mississippi city as a service-specific link with readable metro labels", async () => {
    const slug = "agentic-ppc-management";
    const html = renderToStaticMarkup(await StatePage({ params: Promise.resolve({ slug, state: "mississippi" }) }));
    for (const city of allCitiesInState("mississippi")) expect(html).toContain(`href="/services/${slug}/mississippi/${city.city_slug}"`);
    expect(html).toContain("Search cities and metro areas");
    expect(html).toContain("Memphis metro");
    expect(html).not.toMatch(/Memphis Metro metro/i);
    expect(html).toContain("More than one service area?");
  });

  it("preserves local navigation and indexability for enriched and structural cities", async () => {
    const slug = "agentic-content-marketing";
    const stateHtml = renderToStaticMarkup(await StatePage({ params: Promise.resolve({ slug, state: "florida" }) }));
    expect(stateHtml).toContain(`href="/services/${slug}/florida/miami"`);
    const miami = { slug, state: "florida", city: "miami" };
    const html = renderToStaticMarkup(await CityPage({ params: Promise.resolve(miami) }));
    expect(html).toContain('href="/services/agentic-seo/florida/miami"');
    expect(html).toContain('href="/markets/florida/miami"');
    expect(html).toContain('href="/services/agentic-content-marketing/florida"');
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    const metadata = await generateMetadata({ params: Promise.resolve(miami) });
    expect(metadata.alternates?.canonical).toBe(`/services/${slug}/florida/miami`);
    expect(metadata.robots).toBeUndefined();
    const structural = { slug, state: "alaska", city: "anchorage" };
    const structuralMetadata = await generateMetadata({ params: Promise.resolve(structural) });
    expect(structuralMetadata.robots).toEqual({ index: false, follow: true });
    expect(renderToStaticMarkup(await CityPage({ params: Promise.resolve(structural) }))).toContain('id="audit"');
  });
});
