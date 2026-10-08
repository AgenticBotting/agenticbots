import type { Metadata } from "next";
import { agenticSearchTitle } from "@/lib/search-positioning";
import { searchRobots } from "@/lib/search-publication";
import { IndustryLinks } from "@/components/marketing/IndustryExperience";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { JsonLd, breadcrumbLd, serviceLd, faqLd } from "@/components/JsonLd";
import { MarketHero, MarketContext, MarketServices, MarketTools, MarketFaq, MarketNearby, marketFaqs } from "@/components/marketing/MarketExperience";
import { ServiceDelivery, ServiceAudit } from "@/components/marketing/ServiceExperience";
import { getCity, nearbyCities } from "@/lib/geo/data";
import { ALL_CITIES, getDatasetCity, getDatasetState, isEnriched } from "@/lib/geo/dataset";

type Params = { params: Promise<{ state: string; city: string }> };
export function generateStaticParams() { return ALL_CITIES.map(city => ({ state: city.state_slug, city: city.city_slug })); }
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { state, city } = await params;
  const rec = getDatasetCity(state, city);
  if (!rec) return {};
  return { title: { absolute: agenticSearchTitle("marketing", "contractors", `${rec.city}, ${rec.state_abbr}`) }, description: `Marketing services for contractors in ${rec.city}, ${rec.state_abbr}: SEO, PPC and customer follow-up with managed AI BOTS. Start with a $499 workflow audit.`, alternates: { canonical: `/markets/${state}/${city}` }, robots: searchRobots(`/markets/${state}/${city}`) };
}
export default async function CityMarketHub({ params }: Params) {
  const { state, city } = await params;
  const rec = getDatasetCity(state, city);
  const st = getDatasetState(state);
  if (!rec || !st) notFound();
  const enriched = isEnriched(state, city);
  const ct = enriched ? getCity(state, city) : undefined;
  if (enriched && !ct) notFound();
  const near = ct ? nearbyCities(ct, 5).map(n => ({ name: `${n.name}, ${n.stateAbbr}`, href: `/markets/${n.stateSlug}/${n.slug}` })) : rec.surrounding.filter(n => ALL_CITIES.some(x => x.city_slug === n.slug && x.state_slug === state)).slice(0, 5).map(n => ({ name: `${n.city}, ${rec.state_abbr}`, href: `/markets/${state}/${n.slug}` }));
  const labels = ct ? ct.districts : rec.surrounding.slice(0, 5).map(n => n.city);
  const path = `/markets/${state}/${city}`;
  return <><JsonLd data={[serviceLd({ name: `Contractor marketing services in ${rec.city}, ${rec.state_abbr}`, serviceType: "Contractor marketing services", description: `Managed BOT workflows for marketing, sales and customer operations in the ${rec.metro} metro.`, path, areaServed: `${rec.city}, ${rec.state}` }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Markets", path: "/markets" }, { name: st.name, path: `/markets/${st.slug}` }, { name: rec.city, path }]), faqLd(marketFaqs(rec.city))]} /><Header />
    <main className="service-experience market-experience">
      <MarketHero eyebrow={`Managed marketing · ${rec.city}, ${rec.state_abbr}`} heading="Agentic marketing" accent={`for contractors in ${rec.city}.`} description={`SEO, PPC and customer follow-up for the trades in ${rec.city}. Get the marketing services your business needs, delivered through managed BOTS with your team in control.`} place={`${rec.city}, ${rec.state_abbr}`} areas={labels} areaLabel={ct ? "Local business districts" : "Surrounding service areas"} breadcrumb={[{ name: "Home", href: "/" }, { name: "Markets", href: "/markets" }, { name: st.name, href: `/markets/${st.slug}` }, { name: rec.city }]} />
      <MarketServices place={rec.city} state={st.slug} city={rec.city_slug} />
      <MarketContext place={rec.city} metro={rec.metro} labels={labels} city={ct} />
      <IndustryLinks place={rec.city} /><MarketTools /><ServiceDelivery /><MarketFaq place={rec.city} /><ServiceAudit source={`market-hub-${rec.city_slug}-form`} focus={`your business in ${rec.city}, ${rec.state_abbr}`} />
      <MarketNearby title="Nearby markets." links={near} parent={{ name: `All ${st.name} markets`, href: `/markets/${st.slug}` }} />
    </main><Footer /></>;
}
