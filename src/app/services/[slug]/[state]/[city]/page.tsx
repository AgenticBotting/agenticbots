import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { CityVignette } from "@/components/marketing/CityVignette";
import { ServiceHero, ServiceBenefits, ServiceScope, ServiceConnections, ServiceDelivery, ServiceAudit } from "@/components/marketing/ServiceExperience";
import { getCity, nearbyCities } from "@/lib/geo/data";
import { ALL_SERVICES, getService } from "@/lib/catalog";
import { ALL_CITIES, getDatasetCity, getDatasetState, isEnriched } from "@/lib/geo/dataset";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { getServicePositioning } from "@/lib/service-positioning";
import { getServiceExperience } from "@/lib/service-experience";

type Params = { params: Promise<{ slug: string; state: string; city: string }> };

export function generateStaticParams() {
  /* Every service × every city in the national dataset — the internal
     links from city hubs land on a real service+city variation for all
     924 markets, not just the enriched set. */
  return ALL_SERVICES.flatMap((s) =>
    ALL_CITIES.map((c) => ({ slug: s.serviceSlug, state: c.state_slug, city: c.city_slug }))
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, state, city } = await params;
  const svc = getService(slug);
  const rec = getDatasetCity(state, city);
  if (!svc || !rec) return {};
  const enriched = isEnriched(state, city);
  const positioning = getServicePositioning(svc.slug);
  return {
    /* absolute: at 13 services x 924 cities the " | AgenticBots" suffix
       pushed the longest combinations past the 70-char cap. */
    title: { absolute: `${svc.serviceName} Company in ${rec.city}, ${rec.state_abbr}` },
    description: `${svc.serviceName} in ${rec.city}, ${rec.state_abbr}. ${positioning.summary} Scope is confirmed before launch.`,
    alternates: { canonical: `/services/${slug}/${state}/${city}` },
    /* Structural markets stay out of the index until enriched —
       release schedule, docs/PROGRAMMATIC-SEO-PLAN.md §6. */
    ...(enriched ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function CityPage({ params }: Params) {
  const { slug, state, city } = await params;
  const svc = getService(slug); const st = getDatasetState(state); const rec = getDatasetCity(state, city);
  if (!svc || !st || !rec) notFound();
  const enriched = isEnriched(state, city);
  const ct = enriched ? getCity(state, city) : undefined;
  if (enriched && !ct) notFound();
  const positioning = getServicePositioning(svc.slug);
  const path = `/services/${svc.serviceSlug}/${st.slug}/${rec.city_slug}`;
  const surrounding = ct ? nearbyCities(ct, 6).map(n => ({ name: n.name, state: n.stateSlug, slug: n.slug })) : rec.surrounding.filter(n => ALL_CITIES.some(x => x.city_slug === n.slug && x.state_slug === rec.state_slug)).slice(0, 5).map(n => ({ name: n.city, state: st.slug, slug: n.slug }));
  const labels = ct ? ct.districts : rec.surrounding.slice(0, 5).map(n => n.city);
  const faqs = [
    { q: `How is ${svc.name.toLowerCase()} delivered in ${rec.city}?`, a: `${positioning.deliveryModel}. We can operate the service remotely across the ${rec.metro} metro. Your systems, priorities and review process determine the implementation.` },
    { q: "How does local context affect the plan?", a: `${rec.city} and its surrounding markets provide context for the services you sell and the customers you serve. We review your actual customer journey and systems before recommending a workflow.` },
    { q: "What remains under my control?", a: `${positioning.boundary} External messages, publishing, ad changes and CRM writes require human approval.` },
  ];
  return <>
    <JsonLd data={[serviceLd({ name: `${svc.serviceName} in ${rec.city}, ${rec.state_abbr}`, description: positioning.summary, path, areaServed: `${rec.city}, ${st.name}` }), breadcrumbLd([{ name: "Home", path: "/" }, { name: svc.serviceName, path: `/services/${svc.serviceSlug}` }, { name: st.name, path: `/services/${svc.serviceSlug}/${st.slug}` }, { name: rec.city, path }]), faqLd(faqs)]} />
    <Header /><main className="service-experience">
      <ServiceHero svc={svc} location={`${rec.city}, ${rec.state_abbr}`} breadcrumb={<><Link href="/">Home</Link><span>/</span><Link href={`/services/${svc.serviceSlug}`}>{svc.name}</Link><span>/</span><Link href={`/services/${svc.serviceSlug}/${st.slug}`}>{st.name}</Link><span>/</span><span>{rec.city}</span></>} />
      <ServiceBenefits svc={svc} />
      <section className="sx-section sx-local-context"><Container><div className="sx-local-grid"><CityVignette name={rec.city} stateAbbr={rec.state_abbr} labels={labels} /><div className="sx-section-copy"><p className="sx-kicker">Local understanding</p><h2>A plan that reflects<br /><span>{rec.city}.</span></h2>{ct ? <><p>{ct.character} {ct.localNote}</p><p className="sx-note">Local context informs the review. Your customer journey, systems and commercial priorities determine what we build.</p></> : <p>We plan around the customers and service areas your business covers in the {rec.metro} metro. Your own systems, customer history and business priorities provide the starting point.</p>}<div className="sx-local-links">{surrounding.map(n => <Link key={`${n.state}-${n.slug}`} href={`/services/${svc.serviceSlug}/${n.state}/${n.slug}`}>{svc.name} in {n.name}</Link>)}<Link href={`/services/${svc.serviceSlug}/${st.slug}`}>All {st.name} markets</Link></div></div></div></Container></section>
      <ServiceScope svc={svc} /><ServiceConnections svc={svc} /><ServiceDelivery />
      <section className="sx-section"><Container><div className="sx-faq-layout"><div className="sx-section-copy"><p className="sx-kicker">Before you get started</p><h2>Local context.<br /><span>Clear responsibilities.</span></h2><p>What to expect from {svc.name.toLowerCase()} in {rec.city}.</p></div><FaqAccordion items={faqs} /></div></Container></section>
      <ServiceAudit source={`local-${svc.slug}-${rec.city_slug}-form`} focus={`${svc.name} in ${rec.city}`} />
      <section className="sx-section sx-related"><Container><div className="sx-section-copy"><p className="sx-kicker">More ways to support your business</p><h2>Explore other services<br /><span>in {rec.city}.</span></h2></div><div className="sx-related-grid">{ALL_SERVICES.filter(s => s.slug !== svc.slug).map(s => <Link key={s.slug} href={`/services/${s.serviceSlug}/${st.slug}/${rec.city_slug}`}><span><strong>{s.name} in {rec.city}</strong><p>{getServiceExperience(s.slug).benefits[0].title}</p></span><ArrowRight /></Link>)}</div><Link className="sx-text-link mt-6" href={`/markets/${st.slug}/${rec.city_slug}`}>Explore the {rec.city} market hub <ArrowRight size={16} /></Link></Container></section>
    </main><Footer />
  </>;
}
