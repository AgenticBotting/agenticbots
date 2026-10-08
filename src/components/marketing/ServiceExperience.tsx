import Link from "next/link";
import { ArrowRight, Bot, Check, CirclePlay, FileText, Layers3, LockKeyhole, Settings2, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui";
import { AuditForm } from "./AuditForm";
import { ServiceWorkspace } from "./ServiceWorkspace";
import { PlatformMark } from "./ServicePlatformConstellation";
import { getServiceExperience } from "@/lib/service-experience";
import { getServicePositioning } from "@/lib/service-positioning";
import { getServicePlatforms } from "@/config/service-platforms";
import { AUDIT_OFFER, MARKETING_PLANS, formatPlanPrice } from "@/config/marketing-offer";
import type { Service } from "@/lib/catalog";
import type { ServiceExperience } from "@/lib/service-experience";
import { getSearchPositioning } from "@/lib/search-positioning";
import "./service-experience.css";

export function ServiceAuditLink({ label = "Start with a $499 audit" }: { label?: string }) {
  return <a href="#audit" className="btn btn-primary">{label}<ArrowRight size={16} /></a>;
}

export function ServiceOrbit({ slug }: { slug?: string }) {
  return <div className="sx-orbit" aria-hidden="true"><i /><i />{getServicePlatforms(slug).slice(0, 4).map((platform, i) => <span key={platform.id} className={`sx-orbit-node sx-orbit-node-${i}`}><PlatformMark id={platform.id} mark={platform.mark} /></span>)}</div>;
}

export function ServiceHero({ svc, location, breadcrumb, editorial }: {
  svc: Service; location?: string; breadcrumb?: React.ReactNode;
  editorial?: { heading: string; accent: string; introduction: string; examples: ServiceExperience["examples"] };
}) {
  const copy = getServiceExperience(svc.slug);
  const search = getSearchPositioning(svc.slug);
  const positioning = getServicePositioning(svc.slug);
  return (
    <section className="sx-hero">
      <Container>
        {breadcrumb && <nav className="sx-breadcrumb" aria-label="Breadcrumb">{breadcrumb}</nav>}
        <div className="sx-hero-intro"><ServiceOrbit slug={svc.slug} /><div className="sx-hero-copy">
          <p className="sx-kicker"><span className="sx-dot" />Agentic implementation · Managed for you</p>
          <h1>{editorial ? <>{editorial.heading}<br /><span>{editorial.accent}</span></> : <>{search.label}<br /><span>for {search.audience}{location ? ` in ${location}` : ""}.</span></>}</h1>
          <p className="sx-lead">{editorial?.introduction ?? search.introduction}</p>
          <div className="sx-actions"><ServiceAuditLink /><a href="#service-preview" className="btn btn-outline"><CirclePlay size={16} /> See the workflow</a></div>
          <p className="sx-note">Written findings within {AUDIT_OFFER.turnaround} of payment. Implementation scoped separately.</p>
        </div></div>
        <div className="sx-preview-frame" id="service-preview"><ServiceWorkspace title={copy.workspace} botName={positioning.deliveryModel} examples={editorial?.examples ?? copy.examples} /></div>
        <div className="sx-hero-foot"><span><Bot size={15} />{positioning.deliveryModel}</span><span><Layers3 size={15} />Built around your existing tools</span><span><Settings2 size={15} />Managed by AgenticBots</span></div>
      </Container>
    </section>
  );
}

export function ServiceBuyerBrief({ svc, location }: { svc: Service; location?: string }) {
  const copy = getSearchPositioning(svc.slug);
  return <section className="sx-section"><Container><div className="sx-scope-layout">
    <div className="sx-section-copy"><p className="sx-kicker">{copy.label}{location ? ` · ${location}` : " · Your starting point"}</p><h2>{copy.decision}</h2><p>Start with the business decision. We use your accounts, service information and operating priorities to define what the BOT should prepare and what your team needs to review.</p></div>
    <ol className="sx-benefit-list">{copy.inputs.map((input, i) => <li key={input}><span>0{i + 1}</span><p>{input}</p></li>)}</ol>
  </div></Container></section>;
}

export function ServiceBenefits({ svc }: { svc: Service }) {
  const copy = getServiceExperience(svc.slug);
  return <section id="benefits" className="sx-section"><Container>
    <div className="sx-section-heading"><p className="sx-kicker">A better way to move the work forward</p><h2>Put the process to work.<br /><span>Keep your team focused.</span></h2></div>
    <div className="sx-benefits-layout">
      <div className="sx-process-art" aria-label={`Illustrative ${svc.name} workflow`}>
        <span className="sx-art-label">THE CONNECTED WORKFLOW</span>
        <div className="sx-process-input"><span><Layers3 size={18} /></span><div><strong>Your business context</strong><p>Approved sources, goals and rules</p></div></div>
        <div className="sx-process-line" aria-hidden="true"><i /></div>
        <div className="sx-process-bot"><Bot size={22} /><div><strong>{copy.workspace}</strong><p>{getServicePositioning(svc.slug).scope.slice(0, 2).join(" · ")}</p></div></div>
        <div className="sx-process-line" aria-hidden="true"><i /></div>
        <div className="sx-process-output"><ShieldCheck size={19} /><div><strong>Prepared for a decision</strong><p>Your team reviews the next step</p></div><Check size={15} /></div>
        <span className="sx-art-caption">Illustrative workflow · no live account connected</span>
      </div>
      <div className="sx-benefit-list">{copy.benefits.map((benefit, i) => <article key={benefit.title}><span>0{i + 1}</span><div><h3>{benefit.title}</h3><p>{benefit.body}</p></div></article>)}</div>
    </div>
  </Container></section>;
}

export function ServiceScope({ svc }: { svc: Service }) {
  const positioning = getServicePositioning(svc.slug);
  return <section id="included" className="sx-section sx-scope"><Container>
    <div className="sx-scope-layout"><div className="sx-section-copy"><p className="sx-kicker">What’s included</p><h2>Clear responsibilities.<br /><span>Practical deliverables.</span></h2><p>{positioning.execution}</p><a href="#audit" className="sx-text-link">Define your scope <ArrowRight size={16} /></a></div>
      <div className="sx-scope-sheet"><div><FileText size={17} /><strong>{svc.name}</strong><span>Service scope</span></div><ul>{positioning.scope.map(item => <li key={item}><Check size={16} /><span>{item}</span></li>)}</ul><p>Exact integrations, included usage, support and acceptance criteria are agreed in your proposal.</p></div>
    </div>
    <div className="sx-control-note"><ShieldCheck size={21} /><div><strong>Your team keeps control.</strong><p>{positioning.boundary} External messages, publishing, ad changes and CRM writes require human approval.</p></div></div>
  </Container></section>;
}

export function ServiceConnections({ svc }: { svc: Service }) {
  const platforms = getServicePlatforms(svc.slug);
  return <section id="connections" className="sx-section"><Container><div className="sx-connections-layout">
    <div className="sx-tool-map"><div className="sx-tool-orbits" aria-hidden="true"><i /><i /></div><div className="sx-tool-core"><Layers3 size={26} /><strong>Your existing tools</strong><span>One connected workflow</span></div>{platforms.map((p, i) => <div key={p.id} className={`sx-tool-node sx-tool-node-${i}`}><span><PlatformMark id={p.id} mark={p.mark} /></span><strong>{p.name}</strong></div>)}<p>Common systems considered during scoping</p></div>
    <div className="sx-section-copy"><p className="sx-kicker">Built around your business</p><h2>Keep your tools.<br /><span>Connect the work.</span></h2><p>Your {svc.name} workflow is designed around the systems your team already uses. The audit establishes what can connect, what access is needed and where custom work belongs.</p><ul className="sx-checks"><li><Check /> Your accounts and relationships stay yours</li><li><Check /> Connection requirements confirmed up front</li><li><Check /> Clear permissions before anything goes live</li></ul><p className="sx-note">These platforms are scoping references. Available integrations and write permissions depend on your approved deployment.</p></div>
  </div></Container></section>;
}

export function ServiceDelivery() {
  return <section className="sx-section sx-delivery"><Container><div className="sx-section-heading"><p className="sx-kicker">A managed service from the start</p><h2>Your priorities.<br /><span>Our implementation and support.</span></h2></div><ol className="sx-delivery-steps">
    <li><FileText size={23} /><span>01 / Audit</span><h3>Choose the right first move.</h3><p>Review your process and systems. Receive written findings and implementation priorities.</p></li>
    <li><Settings2 size={23} /><span>02 / Build</span><h3>Connect, test and launch.</h3><p>Approve a scope, configure the BOTS and validate the workflow with your team.</p></li>
    <li><ShieldCheck size={23} /><span>03 / Manage</span><h3>Keep the work supported.</h3><p>We monitor, maintain and tune the agreed deployment, with activity available for review.</p></li>
  </ol><div className="sx-investment"><div><p className="sx-kicker">Plan the investment</p><h3>Start focused. Expand by scope.</h3><p>A single defined BOT workflow starts at <strong>{formatPlanPrice(MARKETING_PLANS[0].setup)} setup + {formatPlanPrice(MARKETING_PLANS[0].monthly)}/month.</strong> Multiple-BOT services and custom connections are quoted to scope. Ad spend and third-party usage are separate.</p></div><Link href="/pricing" className="btn btn-outline">Compare plans <ArrowRight size={16} /></Link></div></Container></section>;
}

export function ServiceAudit({ source, focus }: { source: string; focus?: string }) {
  return <section id="audit" className="sx-section sx-audit"><Container><div className="sx-audit-layout">
    <div className="sx-section-copy"><p className="sx-kicker">Your starting point · {AUDIT_OFFER.priceLabel}</p><h2>Know what to build.<br /><span>Before you commit.</span></h2><p>{focus ? `Discuss your priorities for ${focus}.` : "Start with the process that matters most to your business."} Get a practical recommendation, with written findings within {AUDIT_OFFER.turnaround} of payment.</p><ul className="sx-audit-outputs"><li><FileText size={18} /><div><strong>Opportunity assessment</strong><span>Where work stalls and where a BOT could help.</span></div></li><li><Layers3 size={18} /><div><strong>Recommended workflow</strong><span>The systems, inputs and approvals involved.</span></div></li><li><ArrowRight size={18} /><div><strong>Implementation priorities</strong><span>A clear next decision before investing in a build.</span></div></li></ul><p className="sx-note"><LockKeyhole size={13} /> No charge on submission. Scope and payment confirmed by email.</p></div>
    <AuditForm compact source={source} focus={focus} className="sx-audit-form" />
  </div></Container></section>;
}
