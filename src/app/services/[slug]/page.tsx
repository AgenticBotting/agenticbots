import type { Metadata } from "next";
import { getSearchPositioning, serviceSearchTitle, serviceSearchDescription } from "@/lib/search-positioning";
import { searchRobots } from "@/lib/search-publication";
import { IndustryLinks } from "@/components/marketing/IndustryExperience";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { ServiceHero, ServiceBuyerBrief, ServiceBenefits, ServiceScope, ServiceConnections, ServiceDelivery, ServiceAudit } from "@/components/marketing/ServiceExperience";
import { JsonLd, serviceLd, breadcrumbLd, faqLd } from "@/components/JsonLd";
import { MarketCoverage } from "@/components/marketing/MarketExperience";
import { ALL_STATES, allCitiesInState } from "@/lib/geo/dataset";
import { groupByRegion } from "@/lib/geo/regions";
import { ALL_SERVICES, ALL_CATEGORIES, getService, serviceHref } from "@/lib/catalog";
import { getOffer } from "@/lib/offers";
import { getServicePositioning } from "@/lib/service-positioning";
import { getServiceExperience } from "@/lib/service-experience";
import { PROPOSAL_OFFER } from "@/config/marketing-offer";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ALL_SERVICES.map((s) => ({ slug: s.serviceSlug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) return {};
  const path = `/services/${slug}`;
  return {
    title: { absolute: serviceSearchTitle(svc) },
    description: serviceSearchDescription(svc),
    alternates: { canonical: path },
    robots: searchRobots(path),
  };
}

export default async function ServiceHub({ params }: Params) {
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) notFound();
  const positioning = getServicePositioning(svc.slug);
  const search = getSearchPositioning(svc.slug);
  const href = `/services/${svc.serviceSlug}`;
  const coverage = groupByRegion(ALL_STATES).map(({ region, states }) => ({
    id: region, name: region,
    items: states.map(st => ({ name: st.name, href: `${href}/${st.slug}`, detail: `${allCitiesInState(st.slug).length} ${allCitiesInState(st.slug).length === 1 ? "city" : "cities"}`, search: st.abbr })),
    searchItems: states.flatMap(st => allCitiesInState(st.slug).map(city => ({ name: `${city.city}, ${st.abbr}`, href: `${href}/${st.slug}/${city.city_slug}`, detail: st.name, search: city.metro }))),
  }));
  const faqs = [
    { q: `What is included in ${svc.name.toLowerCase()}?`, a: `${positioning.summary} Your proposal sets out the workflows, integrations, support and acceptance criteria for the engagement.` },
    { q: "Which BOTS deliver this service?", a: `${positioning.deliveryModel}. We configure the service around your existing systems and the work your team needs to move forward.` },
    { q: "What stays under my control?", a: `${positioning.boundary} External messages, publishing, ad changes and CRM writes require human approval.` },
    { q: "Who manages the work after launch?", a: "AgenticBots monitors, maintains and tunes the agreed deployment. Your team reviews activity and approves external actions. Support, usage and responsibilities are defined in your proposal." },
    { q: "How do I request a proposal?", a: PROPOSAL_OFFER.description },
  ];
  const pairs = (getOffer(svc.slug)?.pairs ?? []).map(sl => ALL_CATEGORIES.find(c => c.slug === sl)).filter((c): c is NonNullable<typeof c> => !!c);
  return <>
    <JsonLd data={[serviceLd({ name: search.title, serviceType: search.label, description: search.introduction, path: href, areaServed: "United States" }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }, { name: svc.serviceName, path: href }]), faqLd(faqs)]} />
    <Header />
    <main className="service-experience">
      <ServiceHero svc={svc} />
      <ServiceBenefits svc={svc} />
      <ServiceBuyerBrief svc={svc} />
      <ServiceScope svc={svc} />
      <ServiceConnections svc={svc} />
      <ServiceDelivery />
      <section className="sx-section"><Container><div className="sx-faq-layout"><div className="sx-section-copy"><p className="sx-kicker">Before you get started</p><h2>A clear scope.<br /><span>No unanswered questions.</span></h2><p>Know what the service covers, how it is managed and where your team stays involved.</p><Link className="sx-text-link" href="/how-it-works">How we work <ArrowRight size={16} /></Link></div><FaqAccordion items={faqs} /></div></Container></section>
      <IndustryLinks service={svc.slug} />
      <ServiceAudit source={`service-${svc.serviceSlug}-form`} focus={svc.name} />
      {pairs.length > 0 && <section className="sx-section sx-related"><Container><div className="sx-section-copy"><p className="sx-kicker">Build on the first workflow</p><h2>Connect the next<br /><span>part of the business.</span></h2></div><div className="sx-related-grid">{pairs.map(c => <Link key={c.slug} href={serviceHref(c)}><span><strong>{c.name}</strong><p>{getServiceExperience(c.slug).benefits[0].title}</p></span><ArrowRight /></Link>)}</div></Container></section>}
      <MarketCoverage heading={`${search.label}, where you do business.`} description="Choose a state or search for your city to explore this service in your market." groups={coverage} label="Search cities and states" placeholder="City, state or metro name…" showFilters proposalFocus={search.label} />
    </main>
    <Footer />
  </>;
}
