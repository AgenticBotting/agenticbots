import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Target } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { JsonLd, breadcrumbLd, serviceLd } from "@/components/JsonLd";
import { ProposalLink } from "./ProposalLink";
import { ServiceHero, ServiceDelivery, ServiceAudit, ServiceScope, ServiceConnections, ServiceBuyerBrief } from "./ServiceExperience";
import { ServiceWorkspace } from "./ServiceWorkspace";
import { IndustryPlan, IndustryServiceBrief, IndustryOperations, IndustryLinks } from "./IndustryExperience";
import { IndustryBuyerSection, NicheBuyerSection } from "./NicheExperience";
import { NicheDirectory } from "./NicheDirectory";
import { LocalSearchSource } from "./MarketExperience";
import { ALL_SERVICES } from "@/lib/catalog";
import { getServiceExperience } from "@/lib/service-experience";
import { getSearchPositioning, agenticServiceLabel } from "@/lib/search-positioning";
import { industryExamples } from "@/lib/industries";
import { PUBLIC_NICHES, PUBLIC_BUYERS } from "@/lib/public-niches";
import { nicheAudience } from "@/lib/niche-directory";
import { NICHE_BRIEFS } from "@/lib/niche-planning";
import { getLocalSearchBrief, STATE_SEARCH_BRIEFS } from "@/lib/local-search-briefs";
import { allCitiesInState } from "@/lib/geo/dataset";
import { localDirectoryHref, localIndustryHref, localNicheHref } from "@/lib/local-market-paths";
import type { LocalMarket } from "@/lib/local-market";
import { PROPOSAL_OFFER } from "@/config/marketing-offer";
import "./service-experience.css";
import "./industry-experience.css";
import "./niche-experience.css";
import "./local-industry-experience.css";

function subjectHref(page: LocalMarket, service?: string, geo = page.geo) {
  return page.industry ? localIndustryHref(geo, page.industry.slug, service) : page.niche ? localNicheHref(geo, page.niche.slug, service) : localDirectoryHref(geo);
}

function breadcrumbs(page: LocalMarket) {
  return [
    { name: "Home", path: "/" }, { name: page.state.name, path: `/markets/${page.geo.state}` },
    ...(page.city ? [{ name: page.city.city, path: page.marketPath }] : []),
    { name: "Industries", path: page.directoryPath },
    ...(!page.directory ? [{ name: page.name, path: page.basePath }] : []),
    ...(page.service ? [{ name: page.label, path: page.path }] : []),
  ];
}

function LocalBreadcrumb({ page }: { page: LocalMarket }) {
  const items = breadcrumbs(page);
  return <>{items.map((item, i) => <span key={item.path}>{i > 0 && <span aria-hidden="true"> / </span>}{i === items.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}</span>)}</>;
}

function LocalPlanning({ page }: { page: LocalMarket }) {
  const brief = page.city ? getLocalSearchBrief(page.geo.state, page.geo.city!) : undefined;
  const nicheBrief = page.niche ? NICHE_BRIEFS[page.niche.category] : undefined;
  const inputs = nicheBrief?.inputs ?? page.industry?.projectTypes ?? [];
  return <section className="sx-section sx-section-soft"><Container><div className="sx-scope-layout">
    <div className="sx-section-copy"><p className="sx-kicker">{page.name} · {page.location}</p><h2>Your market.<br /><span>Your actual capacity.</span></h2>
      <p>{brief ? page.channel ? brief[page.channel] : brief.planning : page.city ? `Start with the ${nicheAudience(page.name)} work you accept in ${page.place}. Confirm your service boundary within the ${page.city.metro} metro, the customers you serve and how a new enquiry reaches your team.` : STATE_SEARCH_BRIEFS[page.geo.state] ?? `Define the ${page.state.name} markets your operation can support before expanding the marketing plan.`}</p>
      <p>{nicheBrief?.evidence ?? page.industry?.qualification}</p>
      <p className="sx-note">Remote delivery, scoped to your service area. Your customer records and confirmed operating capacity inform the plan.</p>
      {brief?.source && <LocalSearchSource brief={brief} />}
    </div>
    <div className="lx-planning"><p className="sx-kicker">Build the brief around</p><ul>{inputs.map(input => <li key={input}><Target size={16} />{input}</li>)}</ul><p>Confirm accepted locations, available capacity, decision-making roles and the evidence your team can provide.</p><ProposalLink className="sx-text-link" focus={`${page.name} ${nicheAudience(page.label)} in ${page.location}`}>Define your implementation<ArrowRight size={16} /></ProposalLink></div>
  </div></Container></section>;
}

function LocalChannels({ page }: { page: LocalMarket }) {
  const featured = ["seo", "paid-media", "inbound", "crm"];
  const relevant = ALL_SERVICES.filter(service => service.slug !== page.service?.slug);
  const ordered = [...relevant].sort((a, b) => (featured.indexOf(a.slug) < 0 ? 100 : featured.indexOf(a.slug)) - (featured.indexOf(b.slug) < 0 ? 100 : featured.indexOf(b.slug)));
  return <section className="sx-section" id="local-services"><Container>
    <div className="sx-section-heading"><p className="sx-kicker">{page.name} · {page.place}</p><h2>{page.service ? "Connect the next workflow." : "Choose the work to improve."}</h2><p>Each service keeps your business type and location in view. Scope follows your priorities, existing systems and customer journey.</p></div>
    <div className="nx-channel-links">{ordered.slice(0, 4).map(service => <Link key={service.slug} href={subjectHref(page, service.serviceSlug)}><span className="sx-kicker">{getSearchPositioning(service.slug).label}</span><h3>{getServiceExperience(service.slug).benefits[0].title}</h3><p>{getSearchPositioning(service.slug).decision}</p><span className="sx-text-link">Explore {page.name} {nicheAudience(getSearchPositioning(service.slug).label)}<ArrowRight size={15} /></span></Link>)}</div>
    <details className="lx-more"><summary>Explore all {ordered.length} {page.service ? "other " : ""}services for {nicheAudience(page.name)} in {page.place}</summary><ul>{ordered.map(service => <li key={service.slug}><Link href={subjectHref(page, service.serviceSlug)}>{getSearchPositioning(service.slug).label}<ArrowRight size={15} /></Link></li>)}</ul></details>
  </Container></section>;
}

function LocalCoverage({ page }: { page: LocalMarket }) {
  const cities = page.city ? page.city.surrounding.flatMap(city => allCitiesInState(page.geo.state).filter(record => record.city_slug === city.slug)).slice(0, 6) : allCitiesInState(page.geo.state);
  return <section className="sx-section"><Container><div className="nb-specialties">
    <Link className="sx-text-link" href={page.marketPath}>All marketing services in {page.place}<ArrowRight size={16} /></Link>
    <Link className="sx-text-link" href={page.directoryPath}>All business niches in {page.place}<ArrowRight size={16} /></Link>
    {page.city && <Link className="sx-text-link" href={subjectHref(page, page.service?.serviceSlug, { state: page.geo.state })}>{page.name} {nicheAudience(page.label)} across {page.state.name}<ArrowRight size={16} /></Link>}
    {!!cities.length && <details><summary>{page.city ? "Nearby markets" : `Find your city in ${page.state.name}`}</summary><ul>{cities.map(city => <li key={city.city_slug}><Link href={subjectHref(page, page.service?.serviceSlug, { state: page.geo.state, city: city.city_slug })}>{page.name} {nicheAudience(page.label)} in {city.city}</Link></li>)}</ul></details>}
  </div></Container></section>;
}

function LocalDirectory({ page }: { page: LocalMarket }) {
  return <><section className="sx-hero"><Container><nav className="sx-breadcrumb" aria-label="Breadcrumb"><LocalBreadcrumb page={page} /></nav><div className="sx-hero-intro"><div className="sx-hero-copy"><p className="sx-kicker">Industries · {page.location}</p><h1>Marketing in {page.place}.<br /><span>Built around your business.</span></h1><p className="sx-lead">Find the service you provide, explore the people who buy it and build a managed BOT workflow around your local operation.</p><div className="sx-actions"><ProposalLink className="btn btn-primary" focus={`marketing in ${page.location}`}>Begin Step-1<ArrowRight size={16} /></ProposalLink><a href="#niche-directory" className="btn btn-outline">Find your business<ArrowRight size={16} /></a></div></div></div></Container></section>
    <IndustryLinks place={page.place} geo={page.geo} />
    <section className="nd-section" id="niche-directory"><Container><div className="nd-heading"><div><p className="sx-kicker">Service & buyer planning · {page.place}</p><h2>Your niche.<br /><span>The right buying path.</span></h2><p>Explore our service taxonomy with {page.place} retained in every destination. Buyer profiles are planning references to validate, not a count of local prospects.</p></div></div><NicheDirectory basePath={page.directoryPath} niches={PUBLIC_NICHES.map(niche => ({ slug: niche.slug, name: niche.name, category: niche.category, buyers: niche.buyers.map(buyer => buyer.buyer) }))} buyers={PUBLIC_BUYERS.map(buyer => ({ slug: buyer.slug, name: buyer.name, segment: buyer.segment, roles: buyer.roles }))} /></Container></section>
  </>;
}

export function LocalIndustryExperience({ page }: { page: LocalMarket }) {
  const { industry, niche, service, channel } = page;
  const navigation = { ...page.geo, industry: industry?.slug, niche: niche?.slug };
  const introduction = service ? `${getSearchPositioning(service.slug).introduction} We scope the workflow for ${page.audience} serving ${page.location}.` : industry ? industry.introduction : `Build your ${nicheAudience(page.name)} marketing around relevant buyers, clear service coverage and an accountable follow-up process in ${page.location}.`;
  const examples = service
    ? industry && channel ? [industry[channel].example, ...getServiceExperience(service.slug).examples.slice(1)] : getServiceExperience(service.slug).examples
    : industry ? industryExamples(industry) : [];
  return <><JsonLd data={[breadcrumbLd(breadcrumbs(page)), ...(!page.directory ? [serviceLd({ name: page.title, description: page.description, path: page.path, areaServed: page.location, serviceType: page.label })] : [])]} /><Header market={navigation} />
    <main className="service-experience lx-experience">
      {page.directory ? <LocalDirectory page={page} /> : <>
        {service ? <ServiceHero svc={service} location={page.location} breadcrumb={<LocalBreadcrumb page={page} />} editorial={{ heading: agenticServiceLabel(page.label), accent: `for ${page.audience} in ${page.place}.`, introduction, examples }} /> : <section className="sx-hero"><Container>
          <nav className="sx-breadcrumb" aria-label="Breadcrumb"><LocalBreadcrumb page={page} /></nav>
          <div className="sx-hero-intro"><div className="sx-hero-copy"><p className="sx-kicker"><MapPin size={14} />{page.name} · {page.location}</p><h1>Agentic marketing<br /><span>for {page.audience} in {page.place}.</span></h1><p className="sx-lead">{introduction}</p><div className="sx-actions"><ProposalLink className="btn btn-primary" focus={`${page.name} marketing in ${page.location}`}>Begin Step-1<ArrowRight size={16} /></ProposalLink><a href="#buyer-map" className="btn btn-outline">Explore your buyers<ArrowRight size={16} /></a></div><p className="sx-note">{PROPOSAL_OFFER.note}</p></div></div>
          {industry && <div className="sx-preview-frame"><ServiceWorkspace title={`${industry.name} marketing · ${page.place}`} botName="Managed BOT workflows" examples={examples} /></div>}
          <div className="sx-hero-foot"><span><MapPin size={15} />{page.location} service-area planning</span><span><Target size={15} />Trade-specific buyer context</span><span><ShieldCheck size={15} />Human approval before action</span></div>
        </Container></section>}
        <LocalPlanning page={page} />
        {industry ? <IndustryBuyerSection industry={industry.slug} channel={channel} geo={page.geo} service={service?.serviceSlug} /> : niche && <NicheBuyerSection niche={niche} channel={channel} />}
        {industry && channel && <IndustryServiceBrief industry={industry} channel={channel} />}
        {industry && !service && <IndustryPlan industry={industry} geo={page.geo} />}
        {service && <><ServiceBuyerBrief svc={service} location={page.location} /><ServiceScope svc={service} /><ServiceConnections svc={service} /></>}
        {industry && <IndustryOperations industry={industry} geo={page.geo} />}
        <LocalChannels page={page} />
        {niche && <section className="sx-section"><Container><div className="nb-specialties"><p className="sx-kicker">Related specialties · {page.place}</p><details><summary>Explore other {niche.category.toLowerCase()} services</summary><ul>{PUBLIC_NICHES.filter(item => item.category === niche.category && item.slug !== niche.slug).map(item => <li key={item.slug}><Link href={localNicheHref(page.geo, item.slug, service?.serviceSlug)}>{item.name}</Link></li>)}</ul></details></div></Container></section>}
      </>}
      <ServiceDelivery /><ServiceAudit source={`local-industry-${page.geo.state}-${page.geo.city ?? "state"}`} focus={`${page.name} ${nicheAudience(page.label)} in ${page.location}`} /><LocalCoverage page={page} />
    </main><Footer market={navigation} /></>;
}
