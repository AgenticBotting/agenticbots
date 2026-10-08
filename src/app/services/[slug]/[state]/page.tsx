import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { ServiceHero, ServiceBenefits, ServiceScope, ServiceConnections, ServiceDelivery, ServiceAudit } from "@/components/marketing/ServiceExperience";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { citiesInState } from "@/lib/geo/data";
import { ALL_SERVICES, getService } from "@/lib/catalog";
import { ALL_STATES, allCitiesInState, getDatasetState } from "@/lib/geo/dataset";
import { getServicePositioning } from "@/lib/service-positioning";

type Params = { params: Promise<{ slug: string; state: string }> };

export function generateStaticParams() {
  return ALL_SERVICES.flatMap((s) => ALL_STATES.map((st) => ({ slug: s.serviceSlug, state: st.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, state } = await params;
  const svc = getService(slug); const st = getDatasetState(state);
  if (!svc || !st) return {};
  const positioning = getServicePositioning(svc.slug);
  const enriched = citiesInState(state).length > 0;
  return {
    /* absolute: the root template's " | AgenticBots" costs 14 of the 70
       chars seo-checks allows, and the long service names need them. */
    title: { absolute: `${svc.serviceName} in ${st.name} | AgenticBots` },
    description: `${svc.serviceName} across ${st.name}. ${positioning.summary} Scope is confirmed before launch.`,
    alternates: { canonical: `/services/${slug}/${state}` },
    ...(enriched ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function StateHub({ params }: Params) {
  const { slug, state } = await params;
  const svc = getService(slug); const st = getDatasetState(state);
  if (!svc || !st) notFound();
  const positioning = getServicePositioning(svc.slug);
  const cities = allCitiesInState(state);
  const metros = [...new Map(cities.map(c => [c.metro, cities.filter(x => x.metro === c.metro)])).entries()];
  const path = `/services/${svc.serviceSlug}/${st.slug}`;
  const faqs = [
    { q: `How do you deliver ${svc.name.toLowerCase()} across ${st.name}?`, a: `${positioning.deliveryModel}. The service can be delivered remotely across ${st.name}. Your proposal defines the systems, data and local context included in the engagement.` },
    { q: "Do I need different software?", a: "We plan around your existing tools. The audit checks the access, connection requirements and custom work involved before implementation." },
    { q: "What remains under my control?", a: `${positioning.boundary} External messages, publishing, ad changes and CRM writes require human approval.` },
  ];
  return <>
    <JsonLd data={[serviceLd({ name: `${svc.serviceName} in ${st.name}`, description: positioning.summary, path, areaServed: st.name }), breadcrumbLd([{ name: "Home", path: "/" }, { name: svc.serviceName, path: `/services/${svc.serviceSlug}` }, { name: st.name, path }]), faqLd(faqs)]} />
    <Header /><main className="service-experience">
      <ServiceHero svc={svc} location={st.name} breadcrumb={<><Link href="/">Home</Link><span>/</span><Link href={`/services/${svc.serviceSlug}`}>{svc.name}</Link><span>/</span><span>{st.name}</span></>} />
      <ServiceBenefits svc={svc} />
      <ServiceScope svc={svc} />
      <section className="sx-section"><Container><div className="sx-section-heading"><p className="sx-kicker">Local coverage · {cities.length} city destinations</p><h2>{svc.name},<br /><span>across {st.name}.</span></h2><p>Explore your metro and city. Local context informs the plan; your systems and business priorities define the implementation.</p></div><div className="sx-market-links">{metros.map(([metro, list]) => <div key={metro} className="sx-market-group"><h3>{metro} metro</h3><ul>{list.map(city => <li key={city.city_slug}><Link href={`${path}/${city.city_slug}`}>{city.city}</Link></li>)}</ul></div>)}</div></Container></section>
      <ServiceConnections svc={svc} /><ServiceDelivery />
      <section className="sx-section"><Container><div className="sx-faq-layout"><div className="sx-section-copy"><p className="sx-kicker">Questions about delivery</p><h2>Built around<br /><span>your business in {st.name}.</span></h2><p>A local service area, a clearly defined scope, and one team managing the work.</p></div><FaqAccordion items={faqs} /></div></Container></section>
      <ServiceAudit source={`state-bottom-${svc.serviceSlug}-${st.slug}`} focus={`${svc.name} in ${st.name}`} />
    </main><Footer />
  </>;
}
