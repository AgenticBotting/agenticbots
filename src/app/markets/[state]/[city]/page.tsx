import type { Metadata } from "next";
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
  return { title: `${rec.city}, ${rec.state_abbr} — market hub`, description: `Managed AI BOTS for businesses in ${rec.city}, ${rec.state_abbr}. Connect marketing, sales and customer operations. Start with a $499 workflow audit.`, alternates: { canonical: `/markets/${state}/${city}` }, ...(isEnriched(state, city) ? {} : { robots: { index: false, follow: true } }) };
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
  return <><JsonLd data={[serviceLd({ name: `Agentic marketing & sales systems in ${rec.city}, ${rec.state_abbr}`, description: `Managed BOT workflows for marketing, sales and customer operations in the ${rec.metro} metro.`, path, areaServed: `${rec.city}, ${rec.state}` }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Markets", path: "/markets" }, { name: st.name, path: `/markets/${st.slug}` }, { name: rec.city, path }]), faqLd(marketFaqs(rec.city))]} /><Header />
    <main className="service-experience market-experience">
      <MarketHero eyebrow={`Managed AI BOTS · ${rec.city}, ${rec.state_abbr}`} heading="More capacity for" accent={`your business in ${rec.city}.`} description={`Connect marketing, sales follow-up and customer operations with managed BOTS. Built around your team, your tools and the customers you serve in ${rec.city}.`} place={`${rec.city}, ${rec.state_abbr}`} areas={labels} areaLabel={ct ? "Local business districts" : "Surrounding service areas"} breadcrumb={[{ name: "Home", href: "/" }, { name: "Markets", href: "/markets" }, { name: st.name, href: `/markets/${st.slug}` }, { name: rec.city }]} />
      <MarketServices place={rec.city} state={st.slug} city={rec.city_slug} />
      <MarketContext place={rec.city} metro={rec.metro} labels={labels} city={ct} />
      <MarketTools /><ServiceDelivery /><MarketFaq place={rec.city} /><ServiceAudit source={`market-hub-${rec.city_slug}-form`} focus={`your business in ${rec.city}, ${rec.state_abbr}`} />
      <MarketNearby title="Nearby markets." links={near} parent={{ name: `All ${st.name} markets`, href: `/markets/${st.slug}` }} />
    </main><Footer /></>;
}
