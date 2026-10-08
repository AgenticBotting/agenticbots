import { ProposalLink } from "@/components/marketing/ProposalLink";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd, breadcrumbLd } from "@/components/JsonLd";
import { Container } from "@/components/ui/Container";
import { AuditForm } from "@/components/marketing/AuditForm";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { PricingCards } from "@/components/marketing/PricingCards";
import { PROPOSAL_OFFER, PRICING_FAQ, MARKETING_PLANS, formatPlanPrice } from "@/config/marketing-offer";

const [entry, growth] = MARKETING_PLANS;

export const metadata: Metadata = {
  title: "Pricing — One BOT, Growth System & Enterprise",
  description: `One BOT: ${formatPlanPrice(entry.setup)} setup and ${formatPlanPrice(entry.monthly)}/month. Growth System: from ${formatPlanPrice(growth.setup)} setup and ${formatPlanPrice(growth.monthly)}/month. Custom Enterprise BOTS, capacity and integrations.`,
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return <><JsonLd data={[faqLd(PRICING_FAQ), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }])]} /><Header /><main>
    <section className="section-pad border-b border-[var(--border)]"><Container><p className="eyebrow mb-5">One BOT → Growth System → Enterprise</p><div className="system-intro"><h1 className="display-hero max-w-[17ch]">Start focused.<br /><span className="em-green">Grow connected.</span></h1><div><p className="body-lg max-w-[43ch]">A one-time setup to build the system around your business. A monthly retainer to operate, maintain and improve it.</p><ProposalLink className="inline-flex items-center gap-2 text-[14px] font-semibold mt-6">Find your starting point <ArrowRight size={16} /></ProposalLink></div></div></Container></section>
    <section className="section-pad border-b border-[var(--border)]"><Container><h2 className="sr-only">Choose your starting scope</h2><PricingCards /></Container></section>
    <section className="section-pad bg-[var(--bg-alt)] border-b border-[var(--border)]"><Container><div className="system-intro"><h2 className="display-xl max-w-[18ch]">Real work goes<br />into the setup.</h2><p className="body-lg max-w-[43ch]">A useful BOT needs a defined process, the right connections and a tested set of boundaries. These are the deliverables your proposal scopes.</p></div><ol className="delivery-rows">{[
      ["Workflow discovery", "Map the process, define the starting workflow and agree on acceptance criteria."],
      ["Configuration & connections", "Configure the BOTS, connect the agreed tools and establish access and approval rules."],
      ["Testing & monitored launch", "Test the workflow, review the behavior and roll out with monitoring and a clear handover."],
    ].map(([title, description], index) => <li key={title}><span>0{index + 1}</span><h3 className="display-lg">{title}</h3><p className="body-base">{description}</p></li>)}</ol></Container></section>
    <section className="section-pad workforce-governance on-dark"><Container><div className="system-intro"><h2 className="display-xl max-w-[19ch]">The retainer keeps<br />the system working.</h2><ul className="space-y-4 max-w-[47ch]">{["Monitoring and issue handling for the agreed workflows", "Maintenance and tuning as your process evolves", "Activity reporting and a regular results review", "Expansion planned and quoted before new work begins"].map((text) => <li key={text} className="flex items-start gap-3 text-ink-200"><Check size={17} className="shrink-0 text-accent-400 mt-1" />{text}</li>)}</ul></div></Container></section>
    <section className="section-pad border-b border-[var(--border)]"><Container><div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-10 lg:gap-16"><h2 className="display-xl max-w-[19ch]">Know what<br />you are buying.</h2><FaqAccordion items={PRICING_FAQ} /></div></Container></section>
    <section id="audit" className="section-pad"><Container><div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 lg:gap-16 items-start"><div><p className="eyebrow mb-5">{PROPOSAL_OFFER.name}</p><h2 className="display-xl max-w-[18ch]">Find the right<br />starting workflow.</h2><p className="body-lg mt-5 max-w-[43ch]">Share your priorities, team, tools and investment range. We review fit before recommending an implementation scope.</p><p className="body-sm mt-6">No payment required to request a proposal.</p></div><AuditForm source="pricing" /></div></Container></section>
  </main><Footer /></>;
}
