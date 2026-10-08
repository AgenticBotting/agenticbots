import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { JsonLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { MarketHero, MarketCoverage, MarketServices, MarketTools, MarketFaq, MarketNearby, marketFaqs } from "@/components/marketing/MarketExperience";
import { ServiceDelivery, ServiceAudit } from "@/components/marketing/ServiceExperience";
import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { REGIONS, groupByRegion, regionFromSlug, regionSlug, siblingRegions } from "@/lib/geo/regions";

type Params = { params: Promise<{ region: string }> };
function regionStates(region: string) {
  return (groupByRegion(ALL_STATES).find(group => group.region === region)?.states ?? []).map(st => ({ ...st, cities: allCitiesInState(st.slug) }));
}
export function generateStaticParams() { return REGIONS.map(region => ({ region: regionSlug(region) })); }
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { region: slug } = await params;
  const region = regionFromSlug(slug);
  if (!region) return {};
  return { title: `${region} markets`, description: `Managed AI BOTS for businesses across the ${region}. Explore state and city services for marketing, sales and customer operations. Start with a $499 audit.`, alternates: { canonical: `/markets/region/${slug}` } };
}
export default async function RegionMarketPage({ params }: Params) {
  const { region: slug } = await params;
  const region = regionFromSlug(slug);
  if (!region) notFound();
  const states = regionStates(region);
  const cities = states.reduce((total, st) => total + st.cities.length, 0);
  const groups = [{ id: slug, name: `${region} coverage`, items: states.map(st => ({ name: st.name, href: `/markets/${st.slug}`, detail: `${st.cities.length} city ${st.cities.length === 1 ? "destination" : "destinations"}`, search: st.abbr })), searchItems: states.flatMap(st => st.cities.map(city => ({ name: `${city.city}, ${st.abbr}`, href: `/markets/${st.slug}/${city.city_slug}`, detail: st.name, search: city.metro }))) }];
  return <><JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Markets", path: "/markets" }, { name: region, path: `/markets/region/${slug}` }]), faqLd(marketFaqs(`the ${region}`))]} /><Header />
    <main className="service-experience market-experience">
      <MarketHero eyebrow={`Managed AI BOTS · ${region}`} heading="More capacity for business." accent={`Across the ${region}.`} description="Connect the work between finding customers, following up and keeping relationships strong. We build and manage the BOTS around your existing systems." place={`The ${region}`} areas={states.slice(0, 4).map(st => st.name)} areaLabel="Explore your region" breadcrumb={[{ name: "Home", href: "/" }, { name: "Markets", href: "/markets" }, { name: region }]} directory />
      <MarketCoverage heading={`Your next step starts in the ${region}.`} description={`Find your state and explore ${cities} city destinations. Every engagement starts with your business process and the locations you serve.`} groups={groups} label={`Search ${region} cities and states`} placeholder="City, state or metro name…" />
      <MarketServices /><MarketTools /><ServiceDelivery /><MarketFaq place={`the ${region}`} /><ServiceAudit source={`markets-region-${slug}`} focus={`your business in the ${region}`} />
      <MarketNearby title="Explore other regions." links={siblingRegions(region).map(r => ({ name: r, href: `/markets/region/${regionSlug(r)}` }))} parent={{ name: "All markets", href: "/markets" }} />
    </main><Footer /></>;
}
