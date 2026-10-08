import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Fingerprint, Layers3 } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd } from "@/components/JsonLd";
import { Container } from "@/components/ui/Container";
import { AuditForm } from "@/components/marketing/AuditForm";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { BotWorkflowStory } from "@/components/marketing/BotWorkflowStory";
import { PricingCards } from "@/components/marketing/PricingCards";
import { ServicePlatformConstellation } from "@/components/marketing/ServicePlatformConstellation";
import { StackStrip } from "@/components/marketing/GeoSections";
import { CoverageSystemVisual, HeroSystemVisual } from "@/components/marketing/WorkforceSystemVisuals";
import { AUDIT_OFFER, formatPlanPrice, MARKETING_PLANS } from "@/config/marketing-offer";
import { REGIONS, regionSlug } from "@/lib/geo/regions";

const entry = MARKETING_PLANS[0];
const growth = MARKETING_PLANS[1];
export const metadata: Metadata = {
  title: "Managed BOT systems for established contractors",
  description: "AgenticBots designs, deploys and operates governed BOT systems for established residential and commercial contractors. Setup from $7,500.",
  alternates: { canonical: "/" },
};

const HOME_FAQ = [
  { q: "What exactly am I buying?", a: "A managed operating capability: workflow design, BOT configuration, scoped integrations, acceptance testing, controlled launch and ongoing operation. Begin with one defined process or deploy a coordinated system across demand generation, revenue operations and customer lifecycle workflows." },
  { q: "What does it cost?", a: `One BOT starts at ${formatPlanPrice(entry.setup)} setup and ${formatPlanPrice(entry.monthly)} a month. Growth starts at ${formatPlanPrice(growth.setup)} setup and ${formatPlanPrice(growth.monthly)} a month for a scoped system of 3–5 BOTS, with expansion to ten quoted separately. Enterprise is custom. Included usage, third-party charges and support are defined in your proposal.` },
  { q: "Do I have to replace my current systems?", a: "The deployment is designed around your current systems of record. The audit identifies required connections, and the proposal documents integration scope, access requirements and operating boundaries before implementation." },
  { q: "How quickly can we start?", a: `The initial ${AUDIT_OFFER.name} comes back within ${AUDIT_OFFER.turnaround}. Build and launch timing depends on the workflow, account access and integration requirements; we confirm it in your proposal.` },
  { q: "How is BOT authority controlled?", a: "Authority is defined by workflow. External communications, publishing, advertising changes and writes to connected systems follow explicit approval policies. BOTS prepare and coordinate work; authorized people retain decision rights." },
  { q: "Are the examples on this page real client results?", a: "No. The workflow and interface visuals are illustrative demonstrations with a fictional account. We are developing our first client case studies and do not present demonstrations as measured results." },
];

function Hero() {
  return (
    <section className="workforce-hero home-command-hero">
      <Container>
        <div className="workforce-hero-shell">
          <div className="home-command-intro">
            <div className="hero-copy">
              <p className="eyebrow mb-6">Managed automation for established contractors</p>
              <h1>Your operating model, extended by a <span>BOT workforce.</span></h1>
            </div>
            <div className="home-command-brief">
              <p className="body-lg">We design, deploy and operate specialized BOTS across demand generation, revenue operations and customer lifecycle workflows—within your existing systems and controls.</p>
              <div className="hero-actions mt-8">
                <a href="#audit" className="btn btn-primary">{AUDIT_OFFER.cta} <ArrowRight size={17} /></a>
                <a href="#demo" className="hero-demo-link">Review the operating model <ArrowRight size={16} /></a>
              </div>
              <dl className="home-command-facts">
                <div><dt>Entry point</dt><dd>One governed workflow</dd></div>
                <div><dt>Scale path</dt><dd>Coordinated multi-BOT system</dd></div>
                <div><dt>Operating model</dt><dd>Managed continuously</dd></div>
              </dl>
            </div>
          </div>
          <div className="home-hero-stage">
            <span className="home-hero-halo" aria-hidden="true" />
            <div className="home-system-layout">
              <ServicePlatformConstellation serviceName="Revenue operating system" />
              <HeroSystemVisual />
            </div>
            <dl className="home-hero-proof">
              <div><dt>01 · Mandate</dt><dd>Defined workflow ownership</dd></div>
              <div><dt>02 · Systems</dt><dd>Scoped connections and access</dd></div>
              <div><dt>03 · Authority</dt><dd>Human approval gates</dd></div>
              <div><dt>04 · Activity</dt><dd>Reviewable operating record</dd></div>
            </dl>
          </div>
        </div>
      </Container>
      <div className="hero-bottom-strip"><Container><p>Single workflow → Multi-BOT system → Enterprise deployment</p><Link href="/pricing">Engagements from {formatPlanPrice(entry.setup)} setup · {formatPlanPrice(entry.monthly)}/month <ArrowRight size={15} /></Link></Container></div>
    </section>
  );
}

function ManagedSystem() {
  const jobs = [
    { title: "Demand generation", copy: "Coordinate search, paid media, content and prospecting through a shared market strategy and operating cadence.", href: "/marketing", label: "Review demand-generation BOTS", roles: "SEO · Paid media · Content · Prospecting" },
    { title: "Revenue execution", copy: "Connect response, follow-through, CRM administration and proposal workflows while preserving defined approval authority.", href: "/sales", label: "Review revenue-operations BOTS", roles: "Inbound · Outbound · CRM · Proposals" },
    { title: "Management visibility", copy: "Bring operating activity, exceptions and outcomes into a consistent review process that supports accountable decisions.", href: "/services/agentic-analytics", label: "Review analytics operations", roles: "Analytics · Reputation · Reactivation" },
  ];
  return (
    <section className="home-operating-system section-pad border-b border-[var(--border)]">
      <Container>
        <div className="home-operating-layout">
          <div className="home-operating-heading">
            <p className="eyebrow mb-5">Coordinated operating system</p>
            <h2 className="display-xl max-w-[21ch]">One operating layer across the <span className="em-green">revenue lifecycle.</span></h2>
            <p className="body-lg mt-6 max-w-[42ch]">Demand generation, sales execution and customer operations share data, decisions and handoffs. We engineer the workflow between them and remain accountable for its operation.</p>
            <Link href="/services" className="inline-flex items-center gap-2 text-[14px] font-semibold mt-7">Review all service mandates <ArrowRight size={16} /></Link>
          </div>
          <ol className="home-operating-lanes">
            {jobs.map((job, index) => (
              <li key={job.title}>
                <span className="system-index">0{index + 1}</span>
                <div>
                  <p className="home-operating-status">Managed mandate</p>
                  <h3 className="display-lg">{job.title}</h3>
                  <p className="body-base mt-3">{job.copy}</p>
                  <p className="system-roles">{job.roles}</p>
                </div>
                <Link href={job.href} aria-label={job.label}><ArrowRight size={18} /></Link>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

function Governance() {
  return <section id="infrastructure" className="workforce-governance section-pad on-dark"><Container><div className="governance-layout"><div><p className="eyebrow-dark mb-5">Governance by design</p><h2 className="display-xl max-w-[18ch]">Control is part<br />of the architecture.</h2><p className="body-lg text-ink-300 mt-6 max-w-[44ch]">Each BOT operates within a defined mandate, access model and approval policy. The system expands operational capacity while authorized people retain decision rights.</p><Link href="/how-it-works" className="btn btn-on-dark mt-8">Review the operating model <ArrowRight size={16} /></Link></div><div className="governance-record"><div className="governance-record-head"><Fingerprint size={20} /><span>Governed client environment</span></div><div className="governance-record-core"><Layers3 size={31} /><p>Coordinated BOT system</p><span>Defined roles, controls and workflow ownership</span></div><dl>{[
    ["Dedicated client environment", "Client access and data are separated by organization."],
    ["Human approval controls", "External changes wait for an authorized person."],
    ["Reviewable BOT ACTIVITY", "Runs, decisions and outcomes have a recorded trail."],
    ["Ongoing operation", "Monitoring, tuning and maintenance are part of the service."],
  ].map(([title, description]) => <div key={title}><dt><Check size={15} />{title}</dt><dd>{description}</dd></div>)}</dl><p className="governance-record-note">Architecture and service approach · scope confirmed before launch</p></div></div></Container></section>;
}

function WhoFor() {
  return <section className="section-pad border-b border-[var(--border)]"><Container><div className="audience-layout"><CoverageSystemVisual /><div><p className="eyebrow mb-5">Built for established contractors</p><h2 className="display-xl max-w-[18ch]">Operational leverage for firms with real complexity.</h2><p className="body-lg mt-6 max-w-[45ch]">Designed for residential and commercial contractors typically operating above $2M in annual revenue, where disconnected systems and inconsistent execution create material operating drag.</p><div className="audience-trades"><div><h3 className="display-md">Residential service organizations</h3><p className="body-sm mt-2">Roofing · HVAC · plumbing · electrical · remodeling</p></div><div><h3 className="display-md">Commercial contracting organizations</h3><p className="body-sm mt-2">General contractors · specialty trades · facilities services</p></div></div><a href="#audit" className="inline-flex items-center gap-2 text-[14px] font-semibold mt-6">Identify the first operating workflow <ArrowRight size={16} /></a></div></div></Container></section>;
}

function Delivery() {
  return <section className="section-pad bg-[var(--bg-alt)] border-b border-[var(--border)]"><Container><div className="system-intro"><h2 className="display-xl max-w-[22ch]">Implementation is scoped.<br />Operation is continuous.</h2><p className="body-lg max-w-[45ch]">The setup engagement establishes the operating system. The monthly retainer provides monitoring, maintenance and controlled improvement against the agreed mandate.</p></div><ol className="delivery-rows">{[
    ["Assess & architect", "Document the current process, operating constraints, integration requirements and acceptance criteria before implementation begins."],
    ["Configure & validate", "Establish scoped access, decision rules and test coverage against representative workflows and exception cases."],
    ["Launch & operate", "Move through a monitored release, ongoing performance review and governed expansion as priorities change."],
  ].map(([title, description], index) => <li key={title}><span>0{index + 1}</span><h3 className="display-lg">{title}</h3><p className="body-base">{description}</p></li>)}</ol></Container></section>;
}

function Founding() {
  return <section id="founding" className="section-pad-sm border-b border-[var(--border)]"><Container><div className="founding-note"><p className="display-md">Evidence, presented responsibly.</p><p className="body-base max-w-[57ch]">Interface demonstrations explain the operating model. Client outcomes will be published only when they are measured, attributable and approved for release.</p><Link href="/about" className="inline-flex items-center gap-2 text-[14px] font-semibold">Our operating principles <ArrowRight size={16} /></Link></div></Container></section>;
}

function Audit() {
  return <section id="audit" className="section-pad"><Container><div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 lg:gap-16 items-start"><div><p className="eyebrow mb-5">{AUDIT_OFFER.priceLabel} workflow audit</p><h2 className="display-xl max-w-[18ch]">Define the business case for your first BOT.</h2><p className="body-lg mt-5 max-w-[45ch]">We review the customer journey, operating constraints and existing systems to identify a focused workflow with a credible path to implementation.</p><ul className="mt-7 space-y-3">{["Written findings within two business days of payment", "Focused operating review before a sales conversation", "Documented scope before implementation begins"].map((text) => <li key={text} className="flex items-start gap-2.5 text-[14px]"><Check size={16} className="text-[var(--accent-text)] shrink-0 mt-0.5" />{text}</li>)}</ul><p className="body-sm mt-7">The audit is {AUDIT_OFFER.priceLabel}. Managed BOT engagements begin at {formatPlanPrice(entry.setup)} setup + {formatPlanPrice(entry.monthly)}/month.</p></div><AuditForm source="home-final" /></div></Container></section>;
}

export default function HomePage() {
  return <><JsonLd data={[faqLd(HOME_FAQ)]} /><Header /><main className="home-overhaul"><Hero /><StackStrip tools={["Client-owned systems", "Workflow policy", "BOT orchestration", "Approval queue", "BOT ACTIVITY", "Management reporting"]} label="Managed operating architecture" /><ManagedSystem /><BotWorkflowStory /><Governance /><WhoFor /><Delivery /><section id="pricing" className="section-pad border-b border-[var(--border)]"><Container><div className="system-intro mb-12"><h2 className="display-xl max-w-[20ch]">A controlled entry point.<br /><span className="em-green">A system designed to scale.</span></h2><p className="body-lg max-w-[45ch]">Select the initial operating mandate. Expand only after the workflow is stable, governed and producing reviewable activity.</p></div><PricingCards /><Link href="/pricing" className="inline-flex items-center gap-2 mt-6 text-[14px] font-semibold">Review commercial terms and scope <ArrowRight size={16} /></Link></Container></section><Founding /><section className="section-pad border-b border-[var(--border)]"><Container><div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-10 lg:gap-16"><h2 className="display-xl max-w-[18ch]">Commercial and<br />operating questions.</h2><FaqAccordion items={HOME_FAQ} /></div></Container></section><Audit /><section className="section-pad-sm border-t border-[var(--border)] bg-[var(--bg-alt)]"><Container><div className="coverage-intro"><div><h2 className="display-md">National delivery. Local market context.</h2><p className="body-sm mt-3">Managed deployments for established contractors across the United States.</p></div><Link href="/markets" className="inline-flex items-center gap-2 text-[14px] font-semibold">Review market coverage <ArrowRight size={16} /></Link></div><ul className="coverage-links">{REGIONS.map((region) => <li key={region}><Link href={`/markets/region/${regionSlug(region)}`}>{region}<ArrowRight size={14} /></Link></li>)}</ul></Container></section></main><Footer /></>;
}
