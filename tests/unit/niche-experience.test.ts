import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import NichePage, { generateMetadata, generateStaticParams } from "@/app/industries/niches/[niche]/page";
import { NicheDirectory } from "@/components/marketing/NicheDirectory";
import { NicheBuyerFlow } from "@/components/marketing/NicheBuyerFlow";
import { PUBLIC_NICHES, PUBLIC_BUYERS, TRADE_FEATURED_NICHE, nicheJourneys, getPublicNiche, nicheHref } from "@/lib/public-niches";
import { NICHE_BRIEFS, routeForBuyer } from "@/lib/niche-planning";
import { filterNicheDirectory, nicheTitle, nicheDescription, nicheAudience } from "@/lib/niche-directory";
import { searchRobots, SEARCH_PUBLICATION } from "@/lib/search-publication";
import { parseCsv } from "@/server/prospecting/ontology/csv";
import { BUYER_TYPES_CSV, NICHES_CSV } from "@/server/prospecting/ontology/seed-data";
import nicheRoutes from "@/data/public-niche-routes.json";
import { acquisitionEventContext, acquisitionContext } from "@/lib/acquisition-attribution";

vi.mock("next/navigation", () => ({ usePathname: () => "/industries", notFound: () => { throw new Error("not found"); } }));
const entries = PUBLIC_NICHES.map(niche => ({ ...niche, buyers: niche.buyers.map(buyer => buyer.buyer) }));

describe("niche buying journeys", () => {
  it("covers every source niche and buyer type with unique routes, complete briefs and crawlable directory links", () => {
    expect(PUBLIC_NICHES.map(niche => niche.name).sort()).toEqual(parseCsv(NICHES_CSV).slice(1).map(row => row.fields[1]).sort());
    expect(PUBLIC_BUYERS.map(buyer => buyer.name).sort()).toEqual(parseCsv(BUYER_TYPES_CSV).slice(1).map(row => row.fields[1]).sort());
    expect(generateStaticParams()).toHaveLength(341);
    expect(new Set(PUBLIC_NICHES.map(niche => niche.slug)).size).toBe(341);
    expect(new Set(PUBLIC_BUYERS.map(buyer => buyer.slug)).size).toBe(137);
    const directory = renderToStaticMarkup(createElement(NicheDirectory, { niches: entries, buyers: PUBLIC_BUYERS }));
    for (const niche of PUBLIC_NICHES) {
      expect(NICHE_BRIEFS[niche.category], niche.category).toBeDefined();
      expect(directory).toContain(`href="${nicheHref(niche.slug)}"`);
      expect(nicheJourneys(niche.slug)).toHaveLength(niche.buyers.length);
    }
    for (const slug of Object.values(TRADE_FEATURED_NICHE)) expect(nicheJourneys(slug).length, slug).toBeGreaterThan(0);
  });

  it("retains natural niche-specific titles, unique descriptions and noindex until publication review", async () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    expect(nicheAudience("Commercial HVAC & BMS Services")).toBe("commercial HVAC & BMS services");
    for (const niche of PUBLIC_NICHES) {
      const title = nicheTitle(niche.name);
      const description = nicheDescription(niche.name);
      expect(title.length, title).toBeLessThanOrEqual(70);
      expect(description.length, niche.name).toBeLessThanOrEqual(170);
      expect(titles.has(title), title).toBe(false);
      expect(descriptions.has(description), description).toBe(false);
      titles.add(title); descriptions.add(description);
      const path = nicheHref(niche.slug);
      expect(searchRobots(path)).toEqual({ index: false, follow: true });
      expect(SEARCH_PUBLICATION[path]).toBeUndefined();
      const metadata = await generateMetadata({ params: Promise.resolve({ niche: niche.slug }) });
      expect(metadata.alternates?.canonical).toBe(path);
      expect(metadata.title).toEqual({ absolute: title });
    }
  });

  it("filters by service, category and included buyer relationship, preserving unmapped buyers in the catalog", () => {
    const roofing = getPublicNiche("commercial-roofing")!;
    const buyer = roofing.buyers[0].buyer;
    expect(filterNicheDirectory(entries, " COMMERCIAL   roofing ", roofing.category, buyer).map(niche => niche.slug)).toContain(roofing.slug);
    expect(filterNicheDirectory(entries, "roofing", "Auto & Fleet", "")).toEqual([]);
    const used = new Set(PUBLIC_NICHES.flatMap(niche => niche.buyers.map(item => item.buyer)));
    const unmapped = PUBLIC_BUYERS.find(item => !used.has(item.slug))!;
    expect(unmapped).toBeDefined();
    expect(filterNicheDirectory(entries, "", "", unmapped.slug)).toEqual([]);
    expect(filterNicheDirectory(entries, "", "", "")).toHaveLength(341);
  });

  it("renders real mapped roles, an explicitly illustrative flow and a proposal without fabricated intent", async () => {
    const params = Promise.resolve({ niche: "commercial-roofing" });
    const html = renderToStaticMarkup(await NichePage({ params }));
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).toContain("for commercial roofing.");
    expect(html).toContain("Community Manager");
    expect(html).toContain("Modeled fit");
    expect(html).toContain("no live prospect data");
    expect(html).toContain('data-demo="true"');
    expect(html).toContain('id="audit"');
    expect(html).not.toContain("$499");
    expect(html).toContain("Begin Step-1");
    expect(html).toContain("No payment required");
    const empty = PUBLIC_NICHES.find(niche => !niche.buyers.length)!;
    const emptyHtml = renderToStaticMarkup(await NichePage({ params: Promise.resolve({ niche: empty.slug }) }));
    expect(emptyHtml).toContain("buyer relationships need further review");
    expect(emptyHtml).not.toContain("Buyer-to-pipeline map");
    await expect(NichePage({ params: Promise.resolve({ niche: "not-in-catalog" }) })).rejects.toThrow("not found");
  });

  it("adapts the execution path to the buyer and requested service", () => {
    const buyer = nicheJourneys("commercial-roofing")[0];
    expect(routeForBuyer(buyer).channel).toBe("B2B buyer development");
    expect(routeForBuyer({ ...buyer, profile: { ...buyer.profile, kind: "household" } }).channel).toBe("SEO & paid search");
    expect(routeForBuyer({ ...buyer, relationship: "referral" }).channel).toBe("Referral development");
    expect(routeForBuyer({ ...buyer, motion: "bid_procurement" }).channel).toBe("Procurement research");
    for (const channel of ["seo", "ppc"] as const) {
      const html = renderToStaticMarkup(createElement(NicheBuyerFlow, { niche: "Commercial Roofing", buyers: [buyer], brief: NICHE_BRIEFS["Roofing & Exterior"], channel }));
      expect(html).toContain(channel === "seo" ? "SEO planning" : "PPC planning");
      expect(html).not.toContain("B2B buyer development");
    }
  });

  it("attributes only known public niche pages without importing the full catalog into analytics", () => {
    expect(nicheRoutes).toEqual(PUBLIC_NICHES.map(niche => nicheHref(niche.slug)));
    expect(acquisitionEventContext("/industries/niches/commercial-roofing", "/markets/florida/miami")).toMatchObject({ niche: "commercial-roofing", landing_city: "miami" });
    for (const path of ["/industries/niches/private-account", "/industries/niches/commercial-roofing?email=test@example.com", "/ops/prospecting", "/industries/niches/commercial-roofing/"]) expect(acquisitionContext(path)).toEqual({});
  });
});
