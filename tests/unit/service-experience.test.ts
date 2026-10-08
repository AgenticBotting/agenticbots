import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ALL_SERVICES, CATALOG } from "@/lib/catalog";
import { SERVICE_EXPERIENCES, getServiceExperience } from "@/lib/service-experience";
import { getServicePositioning } from "@/lib/service-positioning";
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

  it("retains scope, controls, local destinations and paid-audit terms on all national pages", async () => {
    for (const svc of ALL_SERVICES) {
      const html = renderToStaticMarkup(await ServicePage({ params: Promise.resolve({ slug: svc.serviceSlug }) }));
      expect(html.match(/<h1[ >]/g)).toHaveLength(1);
      expect(html).toContain("$499");
      expect(html).toContain("$7,500");
      expect(html).toContain("$2,500");
      expect(html).toContain("human approval");
      expect(html).toContain(`href="/services/${svc.serviceSlug}/florida"`);
      expect(html).toContain('id="service-preview"');
      expect(html).toContain('id="audit"');
      const visibleCopy = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").toLowerCase().replace(/[\u2010-\u2015-]/g, " ");
      expect(svc.owns.some(term => visibleCopy.includes(term.toLowerCase().replace(/[\u2010-\u2015-]/g, " "))), svc.slug).toBe(true);
    }
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
