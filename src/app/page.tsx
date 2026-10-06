import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Fingerprint, Layers3, Settings2, ShieldCheck } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd } from "@/components/JsonLd";
import { Container } from "@/components/ui/Container";
import { AuditForm } from "@/components/marketing/AuditForm";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { BotWorkflowStory } from "@/components/marketing/BotWorkflowStory";
import { PricingCards } from "@/components/marketing/PricingCards";
import { CoverageSystemVisual, HeroSystemVisual } from "@/components/marketing/WorkforceSystemVisuals";
import { AUDIT_OFFER, formatPlanPrice, MARKETING_PLANS } from "@/config/marketing-offer";
import { REGIONS, regionSlug } from "@/lib/geo/regions";

const entry = MARKETING_PLANS[0];
const growth = MARKETING_PLANS[1];
export const metadata: Metadata = {
  title: "A coordinated BOT workforce for your business",
  description: "AgenticBots builds and operates specialized BOTS for contractors. Connect marketing, sales and customer operations to the tools you already use. Setup from $7,500.",
  alternates: { canonical: "/" },
};

const HOME_FAQ = [
  { q: "What exactly am I buying?", a: "A managed business workflow: discovery, BOT configuration, agreed integrations, testing, a monitored launch and ongoing operation. Start with one process or build a connected system across marketing, sales and customer operations." },
  { q: "What does it cost?", a: `One BOT starts at ${formatPlanPrice(entry.setup)} setup and ${formatPlanPrice(entry.monthly)} a month. Growth starts at ${formatPlanPrice(growth.setup)} setup and ${formatPlanPrice(growth.monthly)} a month for a scoped system of 3–5 BOTS, with expansion to ten quoted separately. Enterprise is custom. Included usage, third-party charges and support are defined in your proposal.` },
  { q: "Do I have to replace my current tools?", a: "We start with the tools you already use. The audit identifies which connections are needed, and the proposal confirms what can be integrated before the build begins." },
  { q: "How quickly can we start?", a: `The initial ${AUDIT_OFFER.name} comes back within ${AUDIT_OFFER.turnaround}. Build and launch timing depends on the workflow, account access and integration requirements; we confirm it in your proposal.` },
  { q: "Can BOTS send or change things without me?", a: "Sending messages, publishing, changing ads and writing to connected systems require human approval. BOTS can prepare work and surface recommendations; your team makes the approval decisions." },
  { q: "Are the examples on this page real client results?", a: "No. The workflow and interface visuals are illustrative demonstrations with a fictional account. We are developing our first client case studies and do not present demonstrations as measured results." },
];

function Hero() {
  return (
    <section className="workforce-hero">
      <Container>
        <div className="workforce-hero-grid">
          <div className="hero-copy">
            <p className="eyebrow mb-6">Built for contractors. Operated for you.</p>
            <h1>Your business.<br />A coordinated<br /><span>BOT workforce.</span></h1>
            <p className="body-lg mt-6 max-w-[45ch]">We build and operate BOTS around your business—connecting marketing, sales and customer operations to the tools you already use.</p>
            <div className="hero-actions mt-8"><a href="#audit" className="btn btn-primary">Get your free audit <ArrowRight size={17} /></a><a href="#demo" className="hero-demo-link">See the BOTS at work <ArrowRight size={16} /></a></div>
            <p className="body-sm mt-5">Start with one workflow. Expand into a connected system.</p>
            <div className="hero-service-signals"><span><Layers3 size={15} /> Built around your tools</span><span><ShieldCheck size={15} /> Human approvals</span><span><Settings2 size={15} /> Managed continuously</span></div>
          </div>
          <HeroSystemVisual />
        </div>
      </Container>
      <div className="hero-bottom-strip"><Container><p>One BOT → Growth System → Enterprise</p><Link href="/pricing">Setup from {formatPlanPrice(entry.setup)} · {formatPlanPrice(entry.monthly)}/month <ArrowRight size={15} /></Link></Container></div>
    </section>
  );
}

function ManagedSystem() {
  const jobs = [
    { title: "Get found.", copy: "Search, ads, content and prospecting. Build the workflows that put your business in front of the right customers.", href: "/marketing", label: "Explore marketing BOTS", roles: "SEO · Ads · Content · Prospecting" },
    { title: "Follow through.", copy: "Prepare follow-ups, organize your CRM and move proposals forward—with the approval decisions kept in your hands.", href: "/sales", label: "Explore sales BOTS", roles: "Outbound · CRM · Proposal" },
    { title: "Know what is working.", copy: "Bring activity and reporting into a clear review. Keep improving the system as your business and processes change.", href: "/services/agentic-analytics", label: "Explore reporting", roles: "Analytics · Reviews · Reactivation" },
  ];
  return <section className="section-pad border-b border-[var(--border)]"><Container><div className="system-intro"><h2 className="display-xl max-w-[21ch]">The work connects.<br /><span className="em-green">So should your BOTS.</span></h2><p className="body-lg max-w-[43ch]">Your marketing, sales and customer operations share a process. We design the handoffs, connect the tools and keep the system maintained.</p></div><div className="system-outcomes">{jobs.map((job, index) => <article key={job.title}><span className="system-index">0{index + 1}</span><h3 className="display-lg">{job.title}</h3><p className="body-base mt-4">{job.copy}</p><p className="system-roles">{job.roles}</p><Link href={job.href} className="inline-flex items-center gap-2 text-[14px] font-semibold">{job.label}<ArrowRight size={16} /></Link></article>)}</div></Container></section>;
}

function Governance() {
  return <section id="infrastructure" className="workforce-governance section-pad on-dark"><Container><div className="governance-layout"><div><p className="eyebrow-dark mb-5">Designed into the platform</p><h2 className="display-xl max-w-[18ch]">A workforce<br />with boundaries.</h2><p className="body-lg text-ink-300 mt-6 max-w-[42ch]">Specialized BOTS. Defined access. A person in control. The infrastructure supports the work without making the important decisions for you.</p><Link href="/how-it-works" className="btn btn-on-dark mt-8">How we operate <ArrowRight size={16} /></Link></div><div className="governance-record"><div className="governance-record-head"><Fingerprint size={20} /><span>Your business environment</span></div><div className="governance-record-core"><Layers3 size={31} /><p>Connected BOTS</p><span>Each with an agreed role and workflow</span></div><dl>{[
    ["Dedicated client environment", "Client access and data are separated by organization."],
    ["Human approval controls", "External changes wait for an authorized person."],
    ["Reviewable BOT ACTIVITY", "Runs, decisions and outcomes have a recorded trail."],
    ["Ongoing operation", "Monitoring, tuning and maintenance are part of the service."],
  ].map(([title, description]) => <div key={title}><dt><Check size={15} />{title}</dt><dd>{description}</dd></div>)}</dl><p className="governance-record-note">Architecture and service approach · scope confirmed before launch</p></div></div></Container></section>;
}

function WhoFor() {
  return <section className="section-pad border-b border-[var(--border)]"><Container><div className="audience-layout"><CoverageSystemVisual /><div><p className="eyebrow mb-5">Residential &amp; commercial</p><h2 className="display-xl max-w-[18ch]">Keep your pipeline moving while you run the business.</h2><p className="body-lg mt-6 max-w-[43ch]">For contractors with real work to deliver—and business processes that need more attention than the day allows.</p><div className="audience-trades"><div><h3 className="display-md">Residential service businesses</h3><p className="body-sm mt-2">Roofing · HVAC · plumbing · electrical · remodeling</p></div><div><h3 className="display-md">Commercial contractors</h3><p className="body-sm mt-2">General contractors · specialty trades · facilities services</p></div></div><a href="#audit" className="inline-flex items-center gap-2 text-[14px] font-semibold mt-6">Find the workflow worth starting with <ArrowRight size={16} /></a></div></div></Container></section>;
}

function Delivery() {
  return <section className="section-pad bg-[var(--bg-alt)] border-b border-[var(--border)]"><Container><div className="system-intro"><h2 className="display-xl max-w-[22ch]">Built carefully.<br />Run continuously.</h2><p className="body-lg max-w-[43ch]">Setup creates the system. The retainer keeps it working. Every engagement starts with a defined scope and a useful first workflow.</p></div><ol className="delivery-rows">{[
    ["Discover & design", "A workflow map, integration requirements and clear acceptance criteria. You know what is being built before we start."],
    ["Connect & test", "Configuration, scoped access and testing against your process. Human approval rules are set before launch."],
    ["Launch & maintain", "A monitored rollout, ongoing tuning and plain-language reporting. Expansion is agreed before new work is added."],
  ].map(([title, description], index) => <li key={title}><span>0{index + 1}</span><h3 className="display-lg">{title}</h3><p className="body-base">{description}</p></li>)}</ol></Container></section>;
}

function Founding() {
  return <section id="founding" className="section-pad-sm border-b border-[var(--border)]"><Container><div className="founding-note"><p className="display-md">Building our first client case studies.</p><p className="body-base max-w-[57ch]">Our demonstrations show the approach. Measured client results will be published with permission as deployments are completed.</p><Link href="/about" className="inline-flex items-center gap-2 text-[14px] font-semibold">Meet AgenticBots <ArrowRight size={16} /></Link></div></Container></section>;
}

function Audit() {
  return <section id="audit" className="section-pad"><Container><div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 lg:gap-16 items-start"><div><p className="eyebrow mb-5">A useful first step</p><h2 className="display-xl max-w-[18ch]">Find the work your first BOT should handle.</h2><p className="body-lg mt-5 max-w-[43ch]">Tell us where your business gets stuck. We review your lead journey and identify an opportunity for a focused BOT workflow.</p><ul className="mt-7 space-y-3">{["Initial recommendations in two business days", "No call required to receive the audit", "A scoped proposal before any build begins"].map((text) => <li key={text} className="flex items-start gap-2.5 text-[14px]"><Check size={16} className="text-[var(--accent-text)] shrink-0 mt-0.5" />{text}</li>)}</ul><p className="body-sm mt-7">One BOT: {formatPlanPrice(entry.setup)} setup + {formatPlanPrice(entry.monthly)}/month.</p></div><AuditForm source="home-final" /></div></Container></section>;
}

export default function HomePage() {
  return <><JsonLd data={[faqLd(HOME_FAQ)]} /><Header /><main><Hero /><BotWorkflowStory /><ManagedSystem /><Governance /><WhoFor /><Delivery /><section id="pricing" className="section-pad border-b border-[var(--border)]"><Container><div className="system-intro mb-12"><h2 className="display-xl max-w-[20ch]">Start focused.<br /><span className="em-green">Grow connected.</span></h2><p className="body-lg max-w-[43ch]">Choose a starting scope, not a ceiling. Your system can expand as the work and the business grow.</p></div><PricingCards /><Link href="/pricing" className="inline-flex items-center gap-2 mt-6 text-[14px] font-semibold">See what setup and the retainer include <ArrowRight size={16} /></Link></Container></section><Founding /><section className="section-pad border-b border-[var(--border)]"><Container><div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-10 lg:gap-16"><h2 className="display-xl max-w-[18ch]">Before you<br />take the next step.</h2><FaqAccordion items={HOME_FAQ} /></div></Container></section><Audit /><section className="section-pad-sm border-t border-[var(--border)] bg-[var(--bg-alt)]"><Container><div className="coverage-intro"><div><h2 className="display-md">Local businesses. National coverage.</h2><p className="body-sm mt-3">We work remotely with contractors across the US. Explore your market.</p></div><Link href="/markets" className="inline-flex items-center gap-2 text-[14px] font-semibold">All markets <ArrowRight size={16} /></Link></div><ul className="coverage-links">{REGIONS.map((region) => <li key={region}><Link href={`/markets/region/${regionSlug(region)}`}>{region}<ArrowRight size={14} /></Link></li>)}</ul></Container></section></main><Footer /></>;
}
