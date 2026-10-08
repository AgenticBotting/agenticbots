import { ProposalLink } from "@/components/marketing/ProposalLink";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CirclePlay, FileText, Layers3, LockKeyhole, Settings2, ShieldCheck } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd } from "@/components/JsonLd";
import { Container } from "@/components/ui/Container";
import { AuditForm } from "@/components/marketing/AuditForm";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { BotWorkflowStory } from "@/components/marketing/BotWorkflowStory";
import { HomeWorkspace } from "@/components/marketing/HomeWorkspace";
import { HomeAuditVisual, HomeBrandMark, HomeDemandVisual, HomeFollowupVisual, HomeRetentionVisual, HomeToolOrbit } from "@/components/marketing/HomeVisuals";
import { PROPOSAL_OFFER, formatPlanPrice, MARKETING_PLANS, PRICING_SCOPE_NOTE } from "@/config/marketing-offer";
import { REGIONS, regionSlug } from "@/lib/geo/regions";
import "./home.css";

const entry = MARKETING_PLANS[0];
const growth = MARKETING_PLANS[1];
export const metadata: Metadata = {
  title: "Managed AI BOTS for contractors | AgenticBots",
  description: "Connect your marketing, sales follow-up and customer operations with managed AI BOTS. Built for established contractors. Request a proposal.",
  alternates: { canonical: "/" },
};

const HOME_FAQ = [
  { q: "How do I request a proposal?", a: PROPOSAL_OFFER.description },
  { q: "Do I need to replace my software?", a: "We design around the systems your business already uses. Scoping establishes what can be connected, which access is required and where custom work may be needed. Connections and permissions are confirmed before implementation." },
  { q: "Who manages the BOTS after launch?", a: "AgenticBots manages the agreed deployment, including monitoring, maintenance, tuning and activity reviews. Your team supplies business context and approves external actions. The proposal defines usage, support and the responsibilities on each side." },
  { q: "Can a BOT send messages or make changes on its own?", a: "BOTS prepare work within defined permissions. Sending messages, publishing content, changing ads and writing to connected systems require human approval. Your organization retains control of its accounts and decisions." },
  { q: "What does implementation cost?", a: `One BOT starts at ${formatPlanPrice(entry.setup)} setup plus ${formatPlanPrice(entry.monthly)}/month. Growth starts at ${formatPlanPrice(growth.setup)} setup plus ${formatPlanPrice(growth.monthly)}/month for 3–5 BOTS. Expansion to ten is quoted separately; Enterprise is custom. Ad spend and third-party usage are separate. You approve a written scope before work starts.` },
  { q: "Are the previews real customer results?", a: "The interfaces show illustrative workflows with fictional data, not measured client results. They explain how the service works. Client case studies will be published when results are measured and approved for release." },
];

function AuditLink({ label = "Find my starting point", secondary = false }: { label?: string; secondary?: boolean }) {
  return <ProposalLink className={`btn ${secondary ? "btn-outline" : "btn-primary"}`}>{label}<ArrowRight size={16} /></ProposalLink>;
}

function Hero() {
  return (
    <section className="ch-hero">
      <Container>
        <div className="ch-hero-intro">
          <HomeToolOrbit />
          <div className="ch-hero-copy">
            <p className="ch-kicker"><span /> Managed AI for established contractors</p>
            <h1>More opportunities.<br /><span>Less manual work.</span></h1>
            <p className="ch-hero-description">Connect your marketing, sales follow-up and customer operations with AI BOTS—built, connected and managed for you.</p>
            <div className="ch-actions"><AuditLink label="Begin Step-1" /><a href="#product-preview" className="btn btn-outline"><CirclePlay size={17} /> See BOTS at work</a></div>
            <p className="ch-hero-note">Six short steps. Mostly quick choices. No payment required.</p>
          </div>
        </div>
        <div className="ch-preview-wrap"><HomeWorkspace /></div>
        <div className="ch-fit-line"><p>Built for residential and commercial contractors <strong>typically doing $2M+ a year.</strong></p><Link href="/pricing">Implementation from {formatPlanPrice(entry.setup)} + {formatPlanPrice(entry.monthly)}/mo <ArrowRight size={14} /></Link></div>
      </Container>
    </section>
  );
}

function Outcomes() {
  return (
    <section id="outcomes" className="ch-section ch-outcomes">
      <Container>
        <div className="ch-section-heading"><p className="ch-kicker">Give your team room to grow</p><h2>Keep the opportunity.<br />Lose the busywork.</h2><p>From the first search to the next service visit, put a consistent process behind the work that grows your business.</p></div>
        <div className="ch-benefit-grid">
          <article className="ch-benefit ch-benefit-demand"><HomeDemandVisual /><div className="ch-benefit-copy"><span className="ch-feature-label">01 / Build demand</span><h3>Be there when customers look.</h3><p>Bring search, advertising and content into one managed plan, with work prepared for your team to review.</p><Link href="/marketing">Explore marketing BOTS <ArrowRight size={16} /></Link></div></article>
          <article className="ch-benefit ch-benefit-followup"><HomeFollowupVisual /><div className="ch-benefit-copy"><span className="ch-feature-label">02 / Move sales forward</span><h3>Give every enquiry a next step.</h3><p>Prepare relevant responses, proposal follow-ups and CRM updates so your team can focus on the customer.</p><Link href="/sales">Explore sales BOTS <ArrowRight size={16} /></Link></div></article>
          <article className="ch-benefit ch-benefit-retention"><div className="ch-benefit-copy"><span className="ch-feature-label">03 / Grow customer value</span><h3>The next opportunity may<br />already know your name.</h3><p>Turn customer history into timely follow-up, review requests and reactivation campaigns—with your team approving outreach.</p><Link href="/services/agentic-customer-reactivation">Explore customer reactivation <ArrowRight size={16} /></Link></div><HomeRetentionVisual /></article>
        </div>
        <div className="ch-inline-cta"><p>Start with the process that matters most to your business.</p><AuditLink /></div>
      </Container>
    </section>
  );
}

function ConnectedTools() {
  return (
    <section className="ch-section ch-connections">
      <Container>
        <div className="ch-split">
          <div className="ch-connect-visual" aria-label="Examples of software considered during integration scoping">
            <div className="ch-connect-orbits" aria-hidden="true"><i /><i /></div>
            <span className="ch-connect-hub"><Layers3 size={28} /><strong>Your business</strong><small>One connected workflow</small></span>
            <span className="ch-connect-node"><HomeBrandMark name="hubspot" />HubSpot</span>
            <span className="ch-connect-node"><span className="ch-wordmark">Salesforce</span></span>
            <span className="ch-connect-node"><span className="ch-wordmark">ServiceTitan</span></span>
            <span className="ch-connect-node"><span className="ch-wordmark">Jobber</span></span>
            <span className="ch-connect-node"><HomeBrandMark name="ads" />Google Ads</span>
            <span className="ch-connect-node"><HomeBrandMark name="wordpress" />WordPress</span>
            <span className="ch-connect-caption">Common systems considered during scoping</span>
          </div>
          <div className="ch-section-copy"><p className="ch-kicker">Work with what you already use</p><h2>Your tools.<br /><span>A more connected team.</span></h2><p>Your CRM, marketing channels and service software hold valuable context. We design the workflow between them, so your people spend less time moving information around.</p><ul className="ch-check-list"><li><Check /> Plan around your existing business systems</li><li><Check /> Define access and approvals before launch</li><li><Check /> Keep your accounts and customer relationships</li></ul><p className="ch-small">Available connections, custom work and permissions are confirmed during scoping.</p><Link href="/services" className="ch-text-link">See the full service portfolio <ArrowRight size={16} /></Link></div>
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="ch-section ch-launch">
      <Container>
        <div className="ch-section-heading"><p className="ch-kicker">Built for you. Managed with you.</p><h2>You run the business.<br />We run the BOTS.</h2><p>Start with a clear plan, launch a focused workflow, and expand when it makes business sense.</p></div>
        <ol className="ch-launch-steps">
          <li><span className="ch-step-symbol"><FileText size={25} /></span><span className="ch-feature-label">01 / Find the right starting point</span><h3>Define the opportunity.</h3><p>Share your priorities, team, tools and investment range. We review fit and define the next step.</p><span className="ch-step-output">A focused proposal + agreed scope</span></li>
          <li><span className="ch-step-symbol"><Settings2 size={25} /></span><span className="ch-feature-label">02 / Build around your business</span><h3>Connect. Test. Launch.</h3><p>We configure the BOTS, connect the agreed systems and validate the workflow with your team.</p><span className="ch-step-output">Documented scope + controlled launch</span></li>
          <li><span className="ch-step-symbol"><ShieldCheck size={25} /></span><span className="ch-feature-label">03 / Keep improving</span><h3>Stay supported.</h3><p>We monitor and maintain the system. Your team reviews activity and approves the next step.</p><span className="ch-step-output">Ongoing management + regular review</span></li>
        </ol>
        <div className="ch-managed-note"><LockKeyhole size={18} /><p><strong>Your decisions stay yours.</strong> BOTS prepare the work. People approve messages, publishing, ad changes and updates to connected systems.</p><Link href="/how-it-works">How it works <ArrowRight size={15} /></Link></div>
      </Container>
    </section>
  );
}

function Pricing() {
  const summaries = ["Put one important process on a reliable footing.", "Coordinate the work across several BOTS and systems.", "Build around multiple teams, locations or complex requirements."];
  return (
    <section id="pricing" className="ch-section ch-pricing">
      <Container>
        <div className="ch-section-heading"><p className="ch-kicker">A clear investment</p><h2>Start focused.<br /><span>Build as you grow.</span></h2><p>One-time setup to build the system. Monthly management to keep it working. Your proposal defines the scope.</p></div>
        <div className="ch-plans">
          {MARKETING_PLANS.map((plan, index) => <article key={plan.key} className={`ch-plan ${plan.featured ? "ch-plan-featured" : ""}`}><p className="ch-plan-label">{plan.key === "one" ? "One focused workflow" : plan.key === "growth" ? "Connected workflows" : "Custom deployment"}</p><h3>{plan.name}</h3><p className="ch-plan-summary">{summaries[index]}</p><div className="ch-plan-price"><strong>{formatPlanPrice(plan.setup, plan.from)}</strong><span>{plan.setup === null ? "Setup + monthly management" : "one-time setup"}</span></div>{plan.monthly !== null && <p className="ch-monthly">+ <strong>{formatPlanPrice(plan.monthly, plan.from)}</strong> / month</p>}<p className="ch-capacity">{plan.botRange}</p><ul>{plan.features.filter((_, i) => i === 0 || i === 2 || i === 4).map(feature => <li key={feature}><Check size={15} />{feature}</li>)}</ul><AuditLink label={plan.key === "enterprise" ? "Discuss your requirements" : "Begin Step-1"} secondary={!plan.featured} /></article>)}
        </div>
        <p className="ch-pricing-note">{PRICING_SCOPE_NOTE}</p><Link href="/pricing" className="ch-text-link">Compare the full scope <ArrowRight size={16} /></Link>
      </Container>
    </section>
  );
}

function Audit() {
  return (
    <section id="audit" className="ch-section ch-audit">
      <Container>
        <div className="ch-audit-heading"><p className="ch-kicker">Your first step · Request a proposal</p><h2>Know where AI belongs<br /><span>in your business.</span></h2><p>Tell us where you want the business to go. A few focused questions help us shape a realistic implementation around your team, tools and budget.</p></div>
        <div className="ch-audit-layout"><HomeAuditVisual /><AuditForm source="home-final" compact className="ch-audit-form" /></div>
        <p className="ch-audit-qualifier">For established residential and commercial contractors. Implementation starts at {formatPlanPrice(entry.setup)} setup + {formatPlanPrice(entry.monthly)}/month.</p>
      </Container>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={[faqLd(HOME_FAQ)]} />
      <Header />
      <main className="conversion-home">
        <Hero />
        <Outcomes />
        <ConnectedTools />
        <div className="ch-demo-section"><BotWorkflowStory /><Container><div className="ch-demo-trust"><span><ShieldCheck size={17} /> Human approval</span><span><LockKeyhole size={17} /> Scoped access</span><span><FileText size={17} /> Recorded BOT ACTIVITY</span></div></Container></div>
        <HowItWorks />
        <Pricing />
        <section className="ch-section ch-faq"><Container><div className="ch-faq-grid"><div className="ch-section-copy"><p className="ch-kicker">Before you get started</p><h2>Good questions.<br />Clear answers.</h2><p>Understand what you’re buying, what stays in your control, and what happens next.</p><Link href="/about" className="ch-text-link">Meet AgenticBots <ArrowRight size={16} /></Link></div><FaqAccordion items={HOME_FAQ} /></div></Container></section>
        <Audit />
        <section className="ch-markets"><Container><div><h2>Local understanding. National reach.</h2><Link href="/markets" className="ch-text-link">Explore your market <ArrowRight size={16} /></Link></div><nav aria-label="Regional service coverage">{REGIONS.map(region => <Link key={region} href={`/markets/region/${regionSlug(region)}`}>{region}<ArrowRight size={14} /></Link>)}</nav></Container></section>
      </main>
      <Footer />
    </>
  );
}
