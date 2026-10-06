import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui/Container";
import { AuditForm } from "@/components/marketing/AuditForm";

export const metadata: Metadata = {
  title: "About AgenticBots",
  description: "A managed BOT workforce for contractors. Defined workflows, human approval and a clear record of the work.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  ["Start with useful work", "We begin with a defined business process. You agree on the scope and acceptance criteria before a BOT is built."],
  ["Keep people in control", "BOTS prepare work. Authorized people approve messages, publishing, ad changes and writes to connected systems."],
  ["Show the activity", "BOT RUNS, decisions and outcomes are recorded so you can review the work and understand what is waiting for attention."],
  ["Operate the system", "The engagement includes monitoring, maintenance and tuning. New workflows are scoped before they are added."],
];

export default function AboutPage() {
  return <><Header /><main>
    <section className="section-pad border-b border-[var(--border)]"><Container><p className="eyebrow mb-5">About AgenticBots</p><h1 className="display-hero max-w-[20ch]">More attention<br />for the work<br /><span className="em-green">behind your business.</span></h1><p className="body-lg mt-6 max-w-[57ch]">Contractors have customers to serve and work to deliver. AgenticBots connects the marketing, sales and customer operations that need attention while you run the business.</p></Container></section>
    <section className="section-pad border-b border-[var(--border)]"><Container><div className="system-intro"><div><p className="eyebrow mb-5">The people behind the work</p><h2 className="display-xl">Led by Nick Thomson.</h2></div><div><p className="body-lg max-w-[45ch]">You should know who is responsible for the system you are buying. Start a conversation with AgenticBots about your process, your tools and what you need to improve.</p><a href="mailto:hello@agenticbots.dev" className="inline-flex items-center gap-2 font-semibold mt-6">hello@agenticbots.dev <ArrowRight size={16} /></a></div></div></Container></section>
    <section className="section-pad border-b border-[var(--border)] bg-[var(--bg-alt)]"><Container><h2 className="display-xl mb-10">How we operate.</h2><ol className="delivery-rows">{PRINCIPLES.map(([title, copy], index) => <li key={title}><span>0{index + 1}</span><h3 className="display-lg">{title}</h3><p className="body-base">{copy}</p></li>)}</ol></Container></section>
    <section className="section-pad border-b border-[var(--border)]"><Container><div className="system-intro"><h2 className="display-xl max-w-[20ch]">Trust grows<br />with evidence.</h2><div><p className="body-lg max-w-[45ch]">We are building our first client case studies. Our website demonstrations are fictional examples; they show the approach and do not represent measured client results.</p><p className="body-base mt-5 max-w-[48ch]">Before a build, your proposal defines the workflow, access rules, deliverables and costs. During operation, BOT ACTIVITY provides a record to review.</p><Link href="/how-it-works" className="inline-flex items-center gap-2 font-semibold mt-6">See the process <ArrowRight size={16} /></Link></div></div></Container></section>
    <section id="audit" className="section-pad"><Container><div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 lg:gap-16"><div><h2 className="display-xl">Start with a useful<br />first workflow.</h2><p className="body-lg mt-5 max-w-[43ch]">The free BOT opportunity audit identifies a starting point for your business. Initial recommendations within two business days.</p></div><AuditForm source="about" /></div></Container></section>
  </main><Footer /></>;
}
