import type { Metadata } from "next";
import { getSearchPositioning, serviceSearchTitle, serviceSearchDescription } from "@/lib/search-positioning";
import { SEARCH_PUBLICATION, searchRobots } from "@/lib/search-publication";
import { IndustryLinks } from "@/components/marketing/IndustryExperience";
import { MarketCoverage } from "@/components/marketing/MarketExperience";
import { cityMarketGroups } from "@/lib/market-experience";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { ServiceHero, ServiceBuyerBrief, ServiceBenefits, ServiceScope, ServiceConnections, ServiceDelivery, ServiceAudit } from "@/components/marketing/ServiceExperience";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { getService } from "@/lib/catalog";
import { allCitiesInState, getDatasetState } from "@/lib/geo/dataset";
import { getServicePositioning } from "@/lib/service-positioning";

type Params = { params: Promise<{ slug: string; state: string }> };

export function generateStaticParams() {
  return Object.keys(SEARCH_PUBLICATION).flatMap((path) => {
    const match = path.match(/^\/services\/([^/]+)\/([^/]+)$/);
    return match ? [{ slug: match[1], state: match[2] }] : [];
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, state } = await params;
  const svc = getService(slug); const st = getDatasetState(state);
  if (!svc || !st) return {};
  const path = `/services/${slug}/${state}`;
  return {
    title: { absolute: serviceSearchTitle(svc, st.name) },
    description: serviceSearchDescription(svc, st.name),
    alternates: { canonical: path },
    robots: searchRobots(path),
  };
}

export default async function StateHub({ params }: Params) {
  const { slug, state } = await params;
  const svc = getService(slug); const st = getDatasetState(state);
  if (!svc || !st) notFound();
  const positioning = getServicePositioning(svc.slug);
  const search = getSearchPositioning(svc.slug);
  const cities = allCitiesInState(state);
  const path = `/services/${svc.serviceSlug}/${st.slug}`;
  const groups = cityMarketGroups(cities, city => `${path}/${city.city_slug}`);
  const faqs = [
    { q: `How do you deliver ${svc.name.toLowerCase()} across ${st.name}?`, a: `${positioning.deliveryModel}. The service can be delivered remotely across ${st.name}. Your proposal defines the systems, data and local context included in the engagement.` },
    { q: "Do I need different software?", a: "We plan around your existing tools. Scoping checks the access, connection requirements and custom work involved before implementation." },
    { q: "What remains under my control?", a: `${positioning.boundary} External messages, publishing, ad changes and CRM writes require human approval.` },
  ];
  return <>
    <JsonLd data={[serviceLd({ name: `${search.title} in ${st.name}`, serviceType: search.label, description: search.introduction, path, areaServed: st.name }), breadcrumbLd([{ name: "Home", path: "/" }, { name: svc.serviceName, path: `/services/${svc.serviceSlug}` }, { name: st.name, path }]), faqLd(faqs)]} />
    <Header market={{ state }} /><main className="service-experience">
      <ServiceHero svc={svc} location={st.name} breadcrumb={<><Link href="/">Home</Link><span>/</span><Link href={`/services/${svc.serviceSlug}`}>{svc.name}</Link><span>/</span><span>{st.name}</span></>} />
      <ServiceBenefits svc={svc} />
      <ServiceBuyerBrief svc={svc} location={st.name} />
      <ServiceScope svc={svc} />
      <MarketCoverage heading={`${search.label} across ${st.name}.`} description="Choose your city to explore a local implementation, or narrow the directory to your metro area." groups={groups} label="Search cities and metro areas" placeholder="City or metro name…" groupLabel="Metro area" itemLabel="city" proposalFocus={`${search.label} in ${st.name}`} />
      <ServiceConnections svc={svc} /><ServiceDelivery />
      <section className="sx-section"><Container><div className="sx-faq-layout"><div className="sx-section-copy"><p className="sx-kicker">Questions about delivery</p><h2>Built around<br /><span>your business in {st.name}.</span></h2><p>A local service area, a clearly defined scope, and one team managing the work.</p></div><FaqAccordion items={faqs} /></div></Container></section>
      <IndustryLinks service={svc.slug} place={st.name} geo={{ state }} />
      <ServiceAudit source={`state-bottom-${svc.serviceSlug}-${st.slug}`} focus={`${svc.name} in ${st.name}`} />
    </main><Footer market={{ state }} />
  </>;
}
