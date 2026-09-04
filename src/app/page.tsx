import Link from "next/link";
import { ArrowRight, Plug, Rocket, LineChart, Check } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Reveal, SectionHeader, ButtonLink, BrandMark } from "@/components/ui";
import { BotPlanForm, PipelineMockup, StatBand, FaqAccordion, PlanCta, BotScrollList, ProofBar, ProblemDiagram, SecurityBlock } from "@/components/marketing";
import { CATALOG } from "@/lib/catalog";

/* ───────────────────────────────  HERO  ─────────────────────────────── */

function Hero() {
  return (
    <section className="relative border-b border-[var(--border)] overflow-hidden">
      <Container className="py-14 sm:py-18">
        <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-12 lg:gap-20 items-center">
          <Reveal>
            <p className="eyebrow mb-6">
              Agentic infrastructure <span className="eyebrow-dim">· 13 bots · marketing + sales</span>
            </p>
            <h1 className="display-hero max-w-[16ch] text-balance">
              Bots that get you customers.
            </h1>
            <p className="body-lg mt-5 max-w-[50ch] text-pretty">
              We build and run the bots that find your customers and follow up until
              they buy — ads, search, content, email, outreach and CRM. Marketing and
              sales work, executed continuously.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PlanCta source="home-hero" />
              <Link
                href="/how-it-works"
                className="text-[15px] font-semibold tracking-[-0.01em] border-b-2 border-[var(--border-strong)] pb-0.5 hover:border-ink-950 transition-colors"
              >
                See how it works
              </Link>
            </div>
            <p className="body-base mt-5 max-w-[50ch]">
              Deployed the same way for a three-hundred-person revenue org and a
              three-truck shop. The leak is in the same place in both.
            </p>
            <dl className="mt-9 pt-7 border-t border-[var(--border)] grid grid-cols-3 gap-8 max-w-[480px]">
              {[
                { v: "41s", u: "median", l: "First response" },
                { v: "24/7", u: "coverage", l: "Nights and weekends" },
                { v: "14d", u: "to live", l: "First bot in production" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="flex items-baseline gap-1.5">
                    <span className="text-[1.375rem] font-semibold tracking-[-0.03em] tabular-nums">
                      {s.v}
                    </span>
                    <span className="mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      {s.u}
                    </span>
                  </dt>
                  <dd className="body-xs mt-2 leading-snug">{s.l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.1}>
            <PipelineMockup />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ──────────────────────────  WHAT A BOT DOES  ───────────────────────── */

const HOW_PLAIN = [
  {
    n: "01",
    title: "It watches",
    body: "Your ads, your inbox, your forms, your phone, your CRM. Everywhere a customer might show up or a deal might stall.",
  },
  {
    n: "02",
    title: "It acts",
    body: "Answers the lead, writes the follow-up, fixes the bid, books the call, updates the record — in seconds, by the rules you set.",
  },
  {
    n: "03",
    title: "It reports",
    body: "You get one plain-English view of what it did, what it cost, and what came back. No dashboard archaeology.",
  },
];

function WhatABotDoes() {
  return (
    <section className="section-pad border-b border-[var(--border)]">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow="In plain english"
            title={<>A bot is just work that <span className="em-green">happens without you.</span></>}
            copy="Not a chatbot on your website. A worker that watches your business, does the repetitive part correctly every time, and tells you what happened. It does not call in sick and it does not forget step four."
          />
        </Reveal>

        <div className="mt-14 grid md:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded-none overflow-hidden">
          {HOW_PLAIN.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="bg-white h-full p-7 sm:p-8">
                <span
                  className="text-[12px] text-[var(--accent-text)] mono"
                >
                  {s.n}
                </span>
                <h3 className="display-lg mt-4">{s.title}</h3>
                <p className="body-base mt-3">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────────────  THE PILLARS  ─────────────────────────── */

function Pillars() {
  return (
    <section className="relative overflow-hidden section-pad bg-[var(--bg-alt)] border-b border-[var(--border)]">
      <BrandMark className="-right-24 top-10" size={560} />
      <Container className="relative">
        <Reveal>
          <SectionHeader
            eyebrow="Two halves of one problem"
            title={<>Getting found, and <span className="em-green">getting paid.</span></>}
            copy="Marketing bots create the demand. Sales bots capture it. Most businesses are leaking on one side or the other — usually both."
          />
        </Reveal>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {CATALOG.map((pillar, i) => (
            <Reveal key={pillar.slug} delay={i * 0.08}>
              <Link
                href={`/${pillar.slug}`}
                className="card card-hover group block h-full p-8 sm:p-10"
              >
                <p className="eyebrow">{pillar.tagline}</p>
                <h3 className="display-xl mt-3">{pillar.name}</h3>
                <p className="body-base mt-4 max-w-[44ch]">{pillar.intro}</p>

                <ul className="mt-7 flex flex-wrap gap-2">
                  {pillar.categories.map((c) => (
                    <li key={c.slug} className="chip">
                      {c.botName}
                    </li>
                  ))}
                </ul>

                <span className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-[var(--accent-text)]">
                  Explore {pillar.name.toLowerCase()} bots
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────────  BOT INDEX  ──────────────────────────── */

function BotRoster() {
  return (
    <section className="section-pad border-b border-[var(--border)]">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow="The full roster"
            title="Thirteen bots. Pick the ones that fix your bottleneck."
            copy="Nobody buys all thirteen. A two-person shop and a Fortune 500 team both start the same way — one bot on the worst bottleneck, proven, then the next."
          />
        </Reveal>
        <div className="mt-14">
          <BotScrollList />
        </div>
      </Container>
    </section>
  );
}

/* ───────────────────────────  HOW IT WORKS  ─────────────────────────── */

const BUILD_STEPS = [
  { icon: LineChart, title: "Audit", body: "We look at where leads come from, what happens to them, and where they die. You get the map whether or not you hire us." },
  { icon: Plug, title: "Connect", body: "Bots wire into the tools you already run — your CRM, calendar, phone, ad accounts and inbox. Nothing gets replaced." },
  { icon: Rocket, title: "Launch", body: "First bots go live in monitored mode against real traffic, so edge cases get caught before a customer hits one." },
  { icon: Check, title: "Tune", body: "Weekly passes on what the bots did and what it produced. Rules tightened, budget moved, new bots added as the last one proves out." },
];

function HowItWorks() {
  return (
    <section className="section-pad bg-[var(--bg-alt)] border-b border-[var(--border)]">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow="How we work"
            title="Four steps, first bot live in about two weeks."
          />
        </Reveal>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BUILD_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.title} delay={i * 0.07}>
                <div className="card h-full p-7">
                  <span className="flex h-9 w-9 items-center justify-center rounded-none bg-ink-950 text-white">
                    <Icon className="w-4 h-4" />
                  </span>
                  <p
                    className="mt-5 text-[12px] text-[var(--text-muted)] mono"
                  >
                    0{i + 1}
                  </p>
                  <h3 className="display-md mt-1.5">{s.title}</h3>
                  <p className="body-sm mt-2.5">{s.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10">
            <ButtonLink href="/how-it-works" variant="outline">
              See the full process
              <ArrowRight className="w-4 h-4" />
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ──────────────────────────────  FAQ  ───────────────────────────────── */

const HOME_FAQ = [
  { q: "What exactly am I buying?", a: "A set of bots built around how your business actually works, wired into the tools you already pay for, and run continuously. Not software you have to configure on a weekend — a system we build, launch and keep tuned." },
  { q: "Do I have to replace my current tools?", a: "No. Bots plug into the CRM, calendar, phone system, ad accounts and email platform you already use. Replacing your stack is almost never the right first move." },
  { q: "How fast does something go live?", a: "The audit takes a few days. The first bot is typically live in monitored mode inside two weeks, and fully autonomous a couple of weeks after that." },
  { q: "Are we too small — or too big — for this?", a: "Neither. A two-truck contractor and a 400-person sales organisation lose customers the same way: nobody answered fast enough and nobody followed up. Small teams usually see the faster lift because there is nobody covering nights. Large teams see the bigger number, because the leak is multiplied across every rep." },
  { q: "What if I only need one thing fixed?", a: "That is the normal starting point. Pick the single bot that addresses your worst bottleneck, prove it, then add. Nobody should buy thirteen bots on day one." },
  { q: "Who owns everything you build?", a: "You do. The accounts, the data, the sequences, the automations. If we part ways, it all stays with you and keeps running." },
];

function Faq() {
  return (
    <section className="section-pad border-b border-[var(--border)]">
      <Container>
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16">
          <Reveal>
            <SectionHeader eyebrow="Questions" title="The things people ask first." />
          </Reveal>
          <Reveal delay={0.08}>
            <FaqAccordion items={HOME_FAQ} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────────────  FINAL CTA  ───────────────────────────── */

function FinalCta() {
  return (
    <section className="section-pad">
      <Container>
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
          <Reveal>
            <p className="eyebrow mb-4">Start here</p>
            <h2 className="display-xl text-balance">
              Tell us where it is leaking. We will map the bots that plug it.
            </h2>
            <p className="body-lg mt-5 max-w-[46ch]">
              You get a written plan: which bots, in what order, wired to what, and what
              each one is worth. Free, and yours to keep even if you build it yourself.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "One business day turnaround",
                "No call required to get the plan",
                "No obligation, no sales sequence",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-[14.5px] text-[var(--text-secondary)]">
                  <Check className="w-4 h-4 text-[var(--accent-text)]" strokeWidth={2.5} />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.08}>
            <BotPlanForm source="home-final" />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProofBar />
        <ProblemDiagram />
        <WhatABotDoes />
        <Pillars />
        <BotRoster />
        <StatBand
          eyebrow="What changes"
          title="The gap between a lead arriving and someone doing something about it."
          metrics={[
            { value: "<60s", label: "First response to any inbound lead, any hour" },
            { value: "24/7", label: "Nights, weekends and holidays covered" },
            { value: "0", label: "Leads that go unfollowed because someone got busy" },
          ]}
        />
        <HowItWorks />
        <SecurityBlock />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
