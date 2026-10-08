import Link from "next/link";
import { ArrowRight, Check, FileText, Layers3, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui";
import { FaqAccordion } from "./FaqAccordion";
import { ServiceAuditLink, ServiceOrbit } from "./ServiceExperience";
import { ServiceWorkspace } from "./ServiceWorkspace";
import { INDUSTRIES, industryChannelName, industryExamples, type Industry, type IndustryChannel } from "@/lib/industries";
import { AUDIT_OFFER } from "@/config/marketing-offer";
import "./service-experience.css";
import "./industry-experience.css";

export function IndustryLinks({ service, place }: { service?: string; place?: string }) {
  const channel = service === "seo" ? "seo" : service === "paid-media" ? "ppc" : undefined;
  return <section className="ix-trades"><Container>
    <div className="ix-trades-heading"><div><p className="sx-kicker">Built for the trades</p><h2>{place ? `Marketing for the work you do in ${place}.` : "Find the approach for your business."}</h2></div><Link href="/industries" className="sx-text-link">Explore industries<ArrowRight size={16} /></Link></div>
    <ul>{INDUSTRIES.map(industry => <li key={industry.slug}><Link href={`/industries/${industry.slug}${channel ? `/${channel}` : ""}`}>{industry.name}{channel ? ` ${industryChannelName(channel)}` : " marketing"}<ArrowRight size={15} /></Link></li>)}</ul>
  </Container></section>;
}

export function IndustryHero({ industry }: { industry: Industry }) {
  return <section className="sx-hero"><Container>
    <nav className="sx-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/industries">Industries</Link><span>/</span><span aria-current="page">{industry.name}</span></nav>
    <div className="sx-hero-intro"><ServiceOrbit /><div className="sx-hero-copy">
      <p className="sx-kicker"><span className="sx-dot" />Managed BOTS · Built around your business</p>
      <h1>Agentic marketing{" "}<br /><span>for {industry.audience}.</span></h1>
      <p className="sx-lead">{industry.introduction}</p>
      <div className="sx-actions"><ServiceAuditLink /><a href="#marketing-plan" className="btn btn-outline">Explore the approach<ArrowRight size={16} /></a></div>
      <p className="sx-note">For established {industry.audience}. Start with a {AUDIT_OFFER.priceLabel} workflow audit.</p>
    </div></div>
    <div className="sx-preview-frame"><ServiceWorkspace title={`${industry.name} marketing workspace`} botName="Managed BOT workflows" examples={industryExamples(industry)} /></div>
    <div className="sx-hero-foot"><span><Layers3 size={15} />Your existing systems</span><span><ShieldCheck size={15} />Your approval before action</span><span><FileText size={15} />A defined implementation plan</span></div>
  </Container></section>;
}

export function IndustryPlan({ industry }: { industry: Industry }) {
  return <section className="sx-section" id="marketing-plan"><Container>
    <div className="sx-section-heading"><p className="sx-kicker">A process that reflects your trade</p><h2>From the right search<br /><span>to the right conversation.</span></h2><p>SEO and paid advertising create the starting point. Qualification and follow-up connect that interest to your team.</p></div>
    <div className="ix-service-paths">
      {(["seo", "ppc"] as const).map((channel, i) => <article key={channel}><div className="ix-path-top"><span>0{i + 1}</span><span>{industryChannelName(channel)}</span></div><h3>{industry[channel].heading}</h3><p>{industry[channel].introduction}</p><Link href={`/industries/${industry.slug}/${channel}`} className="sx-text-link">Explore {industry.name} {industryChannelName(channel)}<ArrowRight size={16} /></Link></article>)}
    </div>
    <div className="ix-projects"><p className="sx-kicker">Your actual services define the scope</p><ul>{industry.projectTypes.map(project => <li key={project}><Check size={15} />{project}</li>)}</ul></div>
  </Container></section>;
}

export function IndustryOperations({ industry }: { industry: Industry }) {
  return <section className="sx-section ix-operations"><Container><div className="sx-scope-layout">
    <div className="sx-section-copy"><p className="sx-kicker">After the enquiry</p><h2>Give your team<br /><span>the context to act.</span></h2><p>We implement the workflow around your sales process. Your team retains responsibility for availability, advice, pricing and customer commitments.</p></div>
    <div className="ix-operating-rows"><article><span>01</span><div><h3>Qualify the next step.</h3><p>{industry.qualification}</p></div></article><article><span>02</span><div><h3>Keep the conversation connected.</h3><p>{industry.followUp}</p></div></article><Link href="/services/agentic-speed-to-lead" className="sx-text-link">Explore lead follow-up<ArrowRight size={16} /></Link></div>
  </div></Container></section>;
}

export function IndustryServiceBrief({ industry, channel }: { industry: Industry; channel: IndustryChannel }) {
  const brief = industry[channel];
  return <section className="sx-section" id="industry-approach"><Container>
    <div className="sx-section-heading"><p className="sx-kicker">{industry.name} {industryChannelName(channel)} · The approach</p><h2>{brief.heading}</h2><p>{brief.introduction}</p></div>
    <div className="ix-decision-list">{brief.decisions.map((decision, i) => <article key={decision.title}><span>0{i + 1}</span><h3>{decision.title}</h3><p>{decision.body}</p></article>)}</div>
    <p className="sx-note ix-fit-note">Your scope starts with the services you actually offer: {industry.projectTypes.join(", ").toLowerCase()}. Platform access and implementation requirements are confirmed before launch.</p>
  </Container></section>;
}

export function industryFaqs(industry: Industry, channel?: IndustryChannel) {
  return [
    { q: `How does ${channel ? industryChannelName(channel) : "marketing"} work for ${industry.audience}?`, a: `${channel ? industry[channel].introduction : industry.introduction} We start with a defined scope, connect the required systems and manage the agreed BOT workflow with your team.` },
    { q: "What is different about agentic implementation?", a: "BOTS work with approved information to monitor signals and prepare tasks. Our team configures and manages the workflow. Sending, publishing, advertising changes and CRM writes require human approval." },
    { q: "Can you work alongside our existing marketing team?", a: "Yes. We define ownership, access and review responsibilities with your team before implementation. Your existing accounts and customer relationships remain yours." },
    { q: "Do you provide services in our area?", a: "We deliver remotely across the United States. The audit confirms the locations your business serves and how those locations affect targeting, content and follow-up." },
    { q: "What does the paid audit provide?", a: `The ${AUDIT_OFFER.priceLabel} workflow audit provides an opportunity assessment, a recommended starting workflow and implementation priorities within ${AUDIT_OFFER.turnaround} of payment. No payment is taken on form submission. Implementation and third-party usage are priced separately.` },
  ];
}

export function IndustryFaq({ industry, channel }: { industry: Industry; channel?: IndustryChannel }) {
  return <section className="sx-section"><Container><div className="sx-faq-layout"><div className="sx-section-copy"><p className="sx-kicker">Before we build</p><h2>Clear scope.<br /><span>A practical next step.</span></h2><p>What to expect from a managed marketing engagement for {industry.audience}.</p></div><FaqAccordion items={industryFaqs(industry, channel)} /></div></Container></section>;
}
