import Link from "next/link";
import { ArrowRight, Bot, Layers3, MapPin, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui";
import { ServiceAuditLink, ServiceOrbit } from "./ServiceExperience";
import { MarketWorkspace } from "./MarketWorkspace";
import { MarketDirectory } from "./MarketDirectory";
import { FaqAccordion } from "./FaqAccordion";
import { PlatformMark } from "./ServicePlatformConstellation";
import { ALL_SERVICES, serviceGeoHref, serviceHref } from "@/lib/catalog";
import { getServicePositioning } from "@/lib/service-positioning";
import { getServiceExperience } from "@/lib/service-experience";
import { getServicePlatforms } from "@/config/service-platforms";
import { AUDIT_OFFER, MARKETING_PLANS, formatPlanPrice } from "@/config/marketing-offer";
import { MARKET_PRIORITIES, type MarketDestination, type MarketGroup } from "@/lib/market-experience";
import { getSearchPositioning } from "@/lib/search-positioning";
import { getLocalSearchBrief, type LocalSearchBrief } from "@/lib/local-search-briefs";
import type { City } from "@/lib/geo/schema";
import "./market-experience.css";

export function MarketHero({ eyebrow, heading, accent, description, place, areas, areaLabel, breadcrumb, directory = false }: {
  eyebrow: string; heading: string; accent: string; description: string; place: string;
  areas: string[]; areaLabel: string; breadcrumb: { name: string; href?: string }[]; directory?: boolean;
}) {
  return <section className="sx-hero mx-hero"><Container>
    <nav className="sx-breadcrumb" aria-label="Breadcrumb">{breadcrumb.map((item, i) => <span key={item.name}>{i > 0 && <span aria-hidden="true">/</span>}{item.href ? <Link href={item.href}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}</span>)}</nav>
    <div className="sx-hero-intro"><ServiceOrbit /><div className="sx-hero-copy"><p className="sx-kicker"><MapPin size={13} />{eyebrow}</p><h1>{heading}<br /><span>{accent}</span></h1><p className="sx-lead">{description}</p><div className="sx-actions"><ServiceAuditLink /><a href={directory ? "#coverage" : "#services"} className="btn btn-outline">{directory ? "Find your market" : "Explore local services"}<ArrowRight size={16} /></a></div><p className="sx-note">{AUDIT_OFFER.priceLabel} workflow audit. Written findings within {AUDIT_OFFER.turnaround} of payment.</p></div></div>
    <div className="sx-preview-frame"><MarketWorkspace place={place} areas={areas} areaLabel={areaLabel} /></div>
    <div className="sx-hero-foot"><span><Layers3 size={15} />Your existing tools</span><span><ShieldCheck size={15} />Your team’s approval</span><span><Bot size={15} />Built and managed for you</span></div>
  </Container></section>;
}

export function MarketServices({ place, state, city }: { place?: string; state?: string; city?: string }) {
  return <section id="services" className="sx-section mx-services"><Container>
    <div className="sx-section-heading"><p className="sx-kicker">{place ? `Marketing services in ${place}` : "Choose your starting point"}</p><h2>What would make the<br /><span>biggest difference?</span></h2><p>SEO, paid advertising and customer follow-up, delivered through managed BOTS. Choose the service your business needs; we define the workflow, connections and approval process behind it.</p></div>
    <div className="mx-outcome-list">{MARKET_PRIORITIES.map((priority, i) => <section key={priority.id} id={priority.id} className="mx-outcome"><div className="sx-section-copy"><p className="sx-kicker">0{i + 1} / {priority.label}</p><h3>{priority.title}</h3><p>{priority.description}</p></div><ul>{priority.slugs.map(slug => {
      const svc = ALL_SERVICES.find(item => item.slug === slug)!;
      return <li key={slug}><Link href={state ? serviceGeoHref(svc, state, city) : serviceHref(svc)}><span><strong>{getSearchPositioning(slug).label}</strong><small>{getServiceExperience(slug).benefits[0].title}</small></span><ArrowRight size={17} /><span className="mx-service-model">{getServicePositioning(slug).deliveryModel}</span></Link></li>;
    })}</ul></section>)}</div>
  </Container></section>;
}

export function MarketCoverage({ heading, description, groups, label, placeholder, showFilters, children }: {
  heading: string; description: string; groups: MarketGroup[]; label: string; placeholder: string;
  showFilters?: boolean; children?: React.ReactNode;
}) {
  return <section id="coverage" className="sx-section mx-coverage"><Container><div className="mx-directory-heading"><div className="sx-section-copy"><p className="sx-kicker">Find your service area</p><h2>{heading}</h2><p>{description}</p></div>{children}</div><MarketDirectory groups={groups} label={label} placeholder={placeholder} showFilters={showFilters} /><p className="sx-note mx-count-note">Directory counts describe coverage pages, not client locations or results. Services are delivered remotely and scoped to your business.</p></Container></section>;
}

export function MarketContext({ place, metro, labels, city }: { place: string; metro: string; labels: string[]; city?: City }) {
  const brief = city ? getLocalSearchBrief(city.stateSlug, city.slug) : undefined;
  return <section className="sx-section mx-local-context"><Container><div className="mx-context-layout"><div className="sx-section-copy"><p className="sx-kicker">The local perspective</p><h2>{brief?.headline ?? <>The right system starts<br /><span>with your market.</span></>}</h2><p>{brief?.planning ?? city?.character ?? `Your customers and service area across the ${metro} metro shape the work. We start with the services you sell, the locations you cover and the tools your team uses today.`}</p><div className="mx-local-note"><MapPin size={19} /><div><h3>Planning for {place}</h3><p>{brief?.review ?? city?.localNote ?? `The audit reviews your own enquiries, sales process and customer history. Together, we define the locations, workflows and review responsibilities included in your implementation.`}</p></div></div>{brief && <LocalSearchSource brief={brief} />}</div><aside className="mx-context-sheet"><div><MapPin size={20} /><span>{metro} metro</span></div><h3>{place} and your<br />surrounding service area.</h3><p>Locations considered during planning</p><ul>{labels.slice(0, 5).map(label => <li key={label}><span />{label}</li>)}</ul>{city && <div className="mx-industry-list"><p>Local business context</p><div>{city.industries.slice(0, 4).map(industry => <span key={industry}>{industry}</span>)}</div></div>}<p className="sx-note">Your approved scope defines the exact service area and customer audience.</p></aside></div></Container></section>;
}

export function MarketTools() {
  return <section className="sx-section mx-tools"><Container><div className="mx-tools-layout"><div className="sx-section-copy"><p className="sx-kicker">Built around your business</p><h2>The tools you know.<br /><span>Working together.</span></h2><p>Your CRM, marketing platforms and field-service systems are the starting point. We confirm access and connection requirements before building.</p><a href="#audit" className="sx-text-link">Map your first workflow <ArrowRight size={16} /></a></div><div><div className="mx-tools-grid">{getServicePlatforms().map(platform => <div key={platform.id}><span><PlatformMark id={platform.id} mark={platform.mark} /></span><strong>{platform.name}</strong></div>)}</div><p className="sx-note">Common systems considered during scoping. Available integrations and write permissions depend on your approved deployment.</p></div></div></Container></section>;
}

export function marketFaqs(place: string) {
  return [
    { q: `Do you provide marketing agency services in ${place}?`, a: "Yes. We scope SEO, paid advertising, content and customer follow-up for contractors and local service businesses. Agentic implementation means managed BOTS prepare and coordinate agreed tasks inside your systems, with human approval for external actions. We deliver remotely, with coverage and responsibilities defined in your proposal." },
    { q: `How do you work with businesses in ${place}?`, a: "We deliver the service remotely, working with your team to understand your customers, tools and operating process. Your proposal defines the locations, workflows, access and responsibilities included." },
    { q: "Where should we start?", a: `The ${AUDIT_OFFER.priceLabel} workflow audit identifies a practical first opportunity and implementation priorities. Written findings arrive within ${AUDIT_OFFER.turnaround} of payment. No payment is taken when you submit the request.` },
    { q: "What does implementation cost?", a: `One defined BOT workflow starts at ${formatPlanPrice(MARKETING_PLANS[0].setup)} setup plus ${formatPlanPrice(MARKETING_PLANS[0].monthly)}/month. Multiple-BOT systems, usage and custom connections are quoted to scope. Ad spend and third-party usage are separate.` },
    { q: "Can one deployment cover multiple locations?", a: "We scope around the locations your business serves. The audit identifies shared processes and any location-specific routing, permissions or requirements before a multi-location build is proposed." },
    { q: "Who approves customer-facing actions?", a: "Your team retains control. External messages, publishing, ad changes and CRM writes require human approval. We manage the agreed deployment and make BOT ACTIVITY available for review." },
  ];
}

export function MarketFaq({ place }: { place: string }) {
  return <section className="sx-section"><Container><div className="sx-faq-layout"><div className="sx-section-copy"><p className="sx-kicker">Before you get started</p><h2>A local priority.<br /><span>A clear way forward.</span></h2><p>What to expect when working with AgenticBots in {place}.</p></div><FaqAccordion items={marketFaqs(place)} /></div></Container></section>;
}

export function MarketNearby({ title, links, parent }: { title: string; links: MarketDestination[]; parent: MarketDestination }) {
  return <section className="sx-section mx-nearby"><Container><div className="mx-nearby-heading"><div><p className="sx-kicker">Continue exploring</p><h2>{title}</h2></div><Link href={parent.href} className="sx-text-link">{parent.name}<ArrowRight size={16} /></Link></div><div className="mx-nearby-links">{links.map(link => <Link key={link.href} href={link.href}><MapPin size={15} /><span>{link.name}</span><ArrowRight size={15} /></Link>)}</div></Container></section>;
}

export function LocalSearchSource({ brief }: { brief: LocalSearchBrief }) {
  if (!brief.source) return null;
  return <aside className="sx-local-source"><p>{brief.source.observation}</p><a href={brief.source.url} target="_blank" rel="noreferrer">{brief.source.label}<ArrowRight size={13} /></a><span>Source reviewed {brief.source.checked}</span></aside>;
}

export function MarketPlanning({ place, text }: { place: string; text?: string }) {
  if (!text) return null;
  return <section className="sx-section"><Container><div className="sx-section-copy" data-state-brief={place}><p className="sx-kicker">Marketing across {place}</p><h2>Local coverage.<br /><span>One accountable operating plan.</span></h2><p>{text}</p><p>We connect the agreed SEO, advertising and follow-up work through managed BOTS. Your team approves the scope and customer-facing actions.</p></div></Container></section>;
}
