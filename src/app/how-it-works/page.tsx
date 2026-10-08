import { ProposalLink } from "@/components/marketing/ProposalLink";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd, breadcrumbLd } from "@/components/JsonLd";
import { Container } from "@/components/ui/Container";
import { AuditForm } from "@/components/marketing/AuditForm";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { BotWorkflowStory } from "@/components/marketing/BotWorkflowStory";
import { PROPOSAL_OFFER } from "@/config/marketing-offer";

export const metadata: Metadata = {
  title: "How your BOT workforce works",
  description: "Discover, connect, test and operate. A scoped BOT system with human approvals, a monitored launch and ongoing maintenance.",
  alternates: { canonical: "/how-it-works" },
};

const PHASES = [
  ["Discover & define", "Map your process, identify a useful starting workflow and agree on deliverables. Your proposal confirms integrations, costs, access requirements and launch timing."],
  ["Connect & configure", "Build around your existing tools and business rules. Configure the BOTS, define the handoffs and establish the approval and escalation policies."],
  ["Test & launch", "Review behavior against agreed acceptance criteria, then begin a monitored rollout. Human approval controls remain in place for actions that change external systems."],
  ["Operate & improve", "Monitor the agreed workflows, handle issues, maintain connections and review activity. Expansion is scoped and approved before additional work is added."],
];
const FAQ = [
  { q: "What do you need for a proposal?", a: "Your priorities, current tools, team, budget and preferred timing. We review fit before defining the implementation scope. Detailed discovery and account access come after you agree on a project." },
  { q: "When will the first BOT go live?", a: `Build timing depends on the workflow, integrations and account access. We confirm the timeline in your proposal. There is no payment to submit a proposal request.` },
  { q: "Can the BOTS act without my approval?", a: "Sending, publishing, changing ads and writing to connected systems require an authorized human approval. BOTS can prepare work and recommendations; they cannot approve their own actions." },
  { q: "What if something needs attention?", a: "The system records activity and surfaces issues for review. Monitoring, maintenance, escalation and support expectations are defined in the agreed operating scope." },
  { q: "Can you work with our in-house team?", a: "Yes. We build and operate the agreed BOT workflows while your team manages customer relationships, approval decisions and business priorities." },
  { q: "Who owns the business accounts?", a: "Your business accounts and customer relationships remain yours. Data handling, access, contract terms and the handover process are agreed before launch." },
];

export default function HowItWorksPage() {
  return <><JsonLd data={[faqLd(FAQ), breadcrumbLd([{ name: "Home", path: "/" }, { name: "How it works", path: "/how-it-works" }])]} /><Header /><main>
    <section className="section-pad border-b border-[var(--border)]"><Container><p className="eyebrow mb-5">The process</p><div className="system-intro"><h1 className="display-hero max-w-[18ch]">A defined process.<br /><span className="em-green">A connected system.</span></h1><div><p className="body-lg max-w-[44ch]">Start with one useful workflow. Agree on what it should do, connect it to your tools and test it before a monitored launch.</p><ProposalLink className="btn btn-primary mt-7">{PROPOSAL_OFFER.cta}</ProposalLink></div></div></Container></section>
    <BotWorkflowStory />
    <section className="section-pad border-b border-[var(--border)] bg-[var(--bg-alt)]"><Container><h2 className="display-xl mb-10">From discovery<br />to ongoing operation.</h2><ol className="delivery-rows">{PHASES.map(([title, copy], index) => <li key={title}><span>0{index + 1}</span><h3 className="display-lg">{title}</h3><p className="body-base">{copy}</p></li>)}</ol></Container></section>
    <section className="section-pad workforce-governance on-dark"><Container><div className="system-intro"><h2 className="display-xl max-w-[20ch]">Control is part<br />of the design.</h2><div><p className="body-lg text-ink-200 max-w-[45ch]">Access is defined by organization and role. Work that changes connected systems waits for human approval. BOT ACTIVITY records runs, decisions and outcomes for review.</p><p className="body-sm text-ink-400 mt-5">Architecture and operating approach. Your proposal defines the controls, integrations and support included in your deployment.</p></div></div></Container></section>
    <section className="section-pad border-b border-[var(--border)]"><Container><div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-10 lg:gap-16"><h2 className="display-xl">Before you start.</h2><FaqAccordion items={FAQ} /></div></Container></section>
    <section id="audit" className="section-pad"><Container><div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 lg:gap-16"><div><p className="eyebrow mb-5">Step one · Request a proposal</p><h2 className="display-xl">Find the right<br />starting workflow.</h2><p className="body-lg mt-5 max-w-[43ch]">Tell us where your business gets stuck. Your answers help us define fit, scope and the next step.</p></div><AuditForm source="how-it-works" /></div></Container></section>
  </main><Footer /></>;
}
