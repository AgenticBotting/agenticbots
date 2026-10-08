import type { Metadata } from "next";
import { searchRobots } from "@/lib/search-publication";
import { IndustryLinks } from "@/components/marketing/IndustryExperience";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { MarketHero, MarketCoverage, MarketServices, MarketTools, MarketFaq, MarketNearby, marketFaqs } from "@/components/marketing/MarketExperience";
import { ServiceDelivery, ServiceAudit } from "@/components/marketing/ServiceExperience";
import { ALL_STATES, ALL_CITIES, allCitiesInState } from "@/lib/geo/dataset";
import { groupByRegion, regionSlug, REGIONS } from "@/lib/geo/regions";

export const metadata: Metadata = {
  title: "Contractor Marketing Services Across the US",
  description: "Contractor marketing services across the US. Explore local SEO, PPC and follow-up services, delivered through managed AI BOTS. Start with a $499 workflow audit.",
  alternates: { canonical: "/markets" },
  robots: searchRobots("/markets"),
};

export default function MarketsIndex() {
  const groups = groupByRegion(ALL_STATES).map(({ region, states }) => ({
    id: regionSlug(region), name: region,
    items: states.map(st => ({ name: st.name, href: `/markets/${st.slug}`, detail: `${allCitiesInState(st.slug).length} city ${allCitiesInState(st.slug).length === 1 ? "destination" : "destinations"}`, search: st.abbr })),
    searchItems: states.flatMap(st => allCitiesInState(st.slug).map(city => ({ name: `${city.city}, ${st.abbr}`, href: `/markets/${st.slug}/${city.city_slug}`, detail: st.name, search: city.metro }))),
  }));
  return <><JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Markets", path: "/markets" }]), faqLd(marketFaqs("the United States"))]} /><Header />
    <main className="service-experience market-experience">
      <MarketHero eyebrow="Agentic marketing · National delivery" heading="Marketing for the trades." accent="Built for your market." description="SEO, paid advertising and customer follow-up for established contractors. We implement and manage the BOTS that connect that work inside your existing systems." place="United States" areas={[...REGIONS]} areaLabel="Regional coverage" breadcrumb={[{ name: "Home", href: "/" }, { name: "Markets" }]} directory />
      <MarketCoverage heading="Find your market. Plan your next move." description={`Explore ${ALL_CITIES.length} city destinations across 50 states and Washington, DC. Search for your city or choose a state to explore.`} groups={groups} label="Search cities and states" placeholder="City, state or metro name…" showFilters><Link href="/services" className="sx-text-link">Browse by service<ArrowRight size={16} /></Link></MarketCoverage>
      <MarketServices /><IndustryLinks /><MarketTools /><ServiceDelivery /><MarketFaq place="the United States" /><ServiceAudit source="markets-index" focus="your service area" />
      <MarketNearby title="Explore by region." links={REGIONS.map(region => ({ name: region, href: `/markets/region/${regionSlug(region)}` }))} parent={{ name: "All services", href: "/services" }} />
    </main><Footer /></>;
}
