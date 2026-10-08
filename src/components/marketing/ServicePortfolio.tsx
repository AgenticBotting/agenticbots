import { ProposalLink } from "@/components/marketing/ProposalLink";
import Link from "next/link";
import { ArrowRight, Bot, RefreshCw, Search, Target } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { ALL_SERVICES, serviceHref, type Pillar } from "@/lib/catalog";
import { getServiceExperience } from "@/lib/service-experience";
import { getServicePositioning } from "@/lib/service-positioning";
import { ServiceOrbit, ServiceAuditLink, ServiceDelivery, ServiceAudit } from "./ServiceExperience";

const GROUPS = [
  { id: "found", title: "Get found", accent: "by the right customers.", description: "Build a consistent presence across search, content and targeted outreach.", icon: Search, slugs: ["paid-media", "seo", "reviews", "content", "lead-generation", "outbound"] },
  { id: "close", title: "Move opportunities", accent: "toward the next step.", description: "Connect enquiry handling, communication and proposals so your team can keep the conversation moving.", icon: Target, slugs: ["inbound", "cro", "email", "enablement"] },
  { id: "repeat", title: "Build on the relationships", accent: "you already have.", description: "Bring customer history, pipeline quality and management reporting into a repeatable process.", icon: RefreshCw, slugs: ["reactivation", "crm", "analytics"] },
];

export function ServicePortfolio({ pillar }: { pillar?: Pillar }) {
  const services = ALL_SERVICES.filter(s => !pillar || s.pillar === pillar.slug);
  const groups = GROUPS.map(group => ({ ...group, services: services.filter(s => group.slugs.includes(s.slug)) })).filter(group => group.services.length);
  return <><Header /><main className="service-experience">
    <section className="sx-hero sx-portfolio-intro"><Container><div className="sx-hero-intro"><ServiceOrbit /><div className="sx-hero-copy">
      <p className="sx-kicker"><span className="sx-dot" />{pillar ? `${pillar.name} services` : "Managed BOT services"}</p>
      <h1>{pillar?.slug === "marketing" ? <>Be easier to find.<br /><span>Be ready for what follows.</span></> : pillar?.slug === "sales" ? <>Keep the opportunity.<br /><span>Move the work forward.</span></> : <>The right BOTS.<br /><span>For the work ahead.</span></>}</h1>
      <p className="sx-lead">Choose the business process you want to improve. We build, connect and manage the BOTS around your tools, your customers and your team.</p>
      <div className="sx-actions"><ServiceAuditLink /><a href={`#${groups[0].id}`} className="btn btn-outline">Explore the services <ArrowRight size={16} /></a></div>
      <p className="sx-note">Start with one priority. Expand when it makes business sense.</p>
    </div></div><nav className="sx-portfolio-nav" aria-label="Choose a business outcome">{groups.map(({ id, icon: Icon, services: groupServices }, i) => <a href={`#${id}`} key={id}><Icon size={23} /><span><strong>{id === "found" ? "Build demand" : id === "close" ? "Move sales forward" : "Grow customer value"}</strong><small>{groupServices.length} services to explore · 0{i + 1}</small></span><ArrowRight /></a>)}</nav></Container></section>
    {groups.map(group => <section key={group.id} id={group.id} className="sx-section sx-portfolio-group"><Container><div className="sx-portfolio-layout"><div className="sx-section-copy"><p className="sx-kicker">{group.id === "found" ? "Demand generation" : group.id === "close" ? "Sales follow-through" : "Customer operations"}</p><h2>{group.title}<br /><span>{group.accent}</span></h2><p>{group.description}</p><ProposalLink className="sx-text-link">Find your starting point <ArrowRight size={16} /></ProposalLink></div><div className="sx-service-list">{group.services.map(svc => <Link key={svc.slug} href={serviceHref(svc)} className="sx-service-card"><span><Bot size={23} /><span className="sx-note">{svc.index}</span></span><h3>{svc.name}</h3><p>{getServiceExperience(svc.slug).benefits[0].body}</p><span>{getServicePositioning(svc.slug).deliveryModel}<ArrowRight size={16} /></span></Link>)}</div></div></Container></section>)}
    <ServiceDelivery /><ServiceAudit source={pillar ? `pillar-${pillar.slug}` : "services-index"} focus={pillar?.name} />
  </main><Footer /></>;
}
