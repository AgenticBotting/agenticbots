import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { JsonLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { MarketHero, MarketCoverage, MarketServices, MarketTools, MarketFaq, MarketNearby, marketFaqs } from "@/components/marketing/MarketExperience";
import { ServiceDelivery, ServiceAudit } from "@/components/marketing/ServiceExperience";
import { getState as getEnrichedState, citiesInState as enrichedCitiesInState } from "@/lib/geo/data";
import { ALL_STATES, allCitiesInState, getDatasetState } from "@/lib/geo/dataset";
import { regionOf, regionSlug } from "@/lib/geo/regions";
import type { MarketGroup } from "@/lib/market-experience";

type Params = { params: Promise<{ state: string }> };
export function generateStaticParams() { return ALL_STATES.map(st => ({ state: st.slug })); }
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { state } = await params;
  const st = getDatasetState(state);
  if (!st) return {};
  return { title: `${st.name} markets`, description: `Managed AI BOTS for ${st.name} businesses. Explore local services for marketing, sales and customer operations. Start with a $499 audit.`, alternates: { canonical: `/markets/${state}` }, ...(getEnrichedState(state) ? {} : { robots: { index: false, follow: true } }) };
}
export default async function StateMarketPage({ params }: Params) {
  const { state } = await params;
  const st = getDatasetState(state);
  if (!st) notFound();
  const cities = allCitiesInState(state);
  const place = st.slug === "district-of-columbia" ? "the District of Columbia" : st.name;
  const groups = new Map<string, MarketGroup>();
  for (const city of cities) {
    if (!groups.has(city.metro_slug)) groups.set(city.metro_slug, { id: city.metro_slug, name: `${city.metro} metro`, items: [] });
    groups.get(city.metro_slug)!.items.push({ name: city.city, href: `/markets/${st.slug}/${city.city_slug}`, search: `${st.name} ${st.abbr}` });
  }
  const region = regionOf(st.slug);
  const serviceState = enrichedCitiesInState(state).length ? state : undefined;
  const siblings = ALL_STATES.filter(item => item.slug !== st.slug && regionOf(item.slug) === region).slice(0, 4);
  return <><JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Markets", path: "/markets" }, { name: st.name, path: `/markets/${st.slug}` }]), faqLd(marketFaqs(place))]} /><Header />
    <main className="service-experience market-experience">
      <MarketHero eyebrow={`Managed AI BOTS · ${st.name}`} heading="More capacity for" accent={`your business in ${place}.`} description={`Bring marketing, sales follow-up and customer operations together. Managed BOTS built around your ${st.name} service area, existing tools and team.`} place={st.name} areas={cities.slice(0, 4).map(city => city.city)} areaLabel="Local service areas" breadcrumb={[{ name: "Home", href: "/" }, { name: "Markets", href: "/markets" }, { name: region, href: `/markets/region/${regionSlug(region)}` }, { name: st.name }]} directory />
      <MarketCoverage heading={`Find your city in ${place}.`} description={`Explore ${cities.length} city ${cities.length === 1 ? "destination" : "destinations"}, grouped by metro. Start locally or discuss a workflow spanning several locations.`} groups={[...groups.values()]} label={`Search ${st.name} cities and metros`} placeholder="City or metro name…"><Link href="#services" className="sx-text-link">View {st.name} services<ArrowRight size={16} /></Link></MarketCoverage>
      <MarketServices place={place} state={serviceState} /><MarketTools /><ServiceDelivery /><MarketFaq place={place} /><ServiceAudit source={`markets-${st.slug}`} focus={`your business in ${place}`} />
      <MarketNearby title={`More of the ${region}.`} links={siblings.map(item => ({ name: item.name, href: `/markets/${item.slug}` }))} parent={{ name: `All ${region} markets`, href: `/markets/region/${regionSlug(region)}` }} />
    </main><Footer /></>;
}
