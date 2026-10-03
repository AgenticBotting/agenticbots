import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd } from "@/components/JsonLd";
import { Container, Reveal, SectionHeader, Section, MediaSlot } from "@/components/ui";
import { REGIONS, regionSlug } from "@/lib/geo/regions";
import { FaqAccordion, BotOrbit, AgentTrace, AuditForm, LeakCalculator, LeadInbox, StepScorecard, StepConnected, StepBooked } from "@/components/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* ───────────────────────────────  HERO  ─────────────────────────────── */

function Hero() {
  return (
    <section className="relative border-b border-[var(--border)] overflow-hidden">
      <Container className="py-14 sm:py-18">
        <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-12 lg:gap-20 items-center">
          <Reveal>
            <p className="eyebrow mb-6">
              For contractors <span className="eyebrow-dim">· residential and commercial</span>
            </p>
            <h1 className="display-hero max-w-[16ch] text-balance">
              Every lead answered in 60 seconds.
            </h1>
            <p className="body-lg mt-5 max-w-[48ch] text-pretty">
              Our bots text back every call, form and quote request in under a
              minute, follow up until the job is booked, and log it all to your
              CRM — nights and weekends included. Installed in 14 days.
            </p>
            <div className="mt-8 cta-row">
              <BotOrbit>
                <a href="#audit" className="btn btn-primary">
                  Get my free lead leak audit
                  <ArrowRight className="w-4 h-4" />
                </a>
              </BotOrbit>
              <a
                href="#demo"
                className="text-[15px] font-semibold tracking-[-0.01em] border-b-2 border-[var(--border-strong)] pb-0.5 hover:border-ink-950 transition-colors"
              >
                Watch a bot book a job
              </a>
            </div>
            <dl className="mt-9 pt-8 border-t border-[var(--border)] grid grid-cols-3 gap-6 max-w-[520px]">
              {[
                { v: "41", u: "s", l: "To the first reply" },
                { v: "24/7", u: "", l: "Nights and weekends" },
                { v: "14", u: "d", l: "To your first bot live" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="flex items-baseline">
                    <span className="text-[clamp(1.9rem,3vw,2.5rem)] font-semibold tracking-[-0.045em] leading-[0.9] tabular-nums text-[var(--foreground)]">
                      {s.v}
                    </span>
                    {s.u && (
                      <span className="text-[clamp(1.1rem,1.6vw,1.4rem)] font-semibold tracking-[-0.03em] leading-none text-[var(--accent-text)]">
                        {s.u}
                      </span>
                    )}
                  </dt>
                  <dd className="text-[13.5px] font-medium tracking-[-0.01em] mt-3 leading-snug text-[var(--text-body)]">
                    {s.l}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.1}>
            <LeadInbox />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────  THREE PLAIN STEPS  ──────────────────────── */

const SIMPLE_STEPS = [
  { n: "01", t: "We secret-shop your leads", d: "We call after hours, fill out your form and time the reply. You get a scorecard showing exactly where jobs slip away.", Art: StepScorecard },
  { n: "02", t: "We install the system", d: "Wired into your phone line, website forms, calendar and CRM. Live in 14 days, monitored from day one.", Art: StepConnected },
  { n: "03", t: "Every lead gets worked", d: "Answered in under a minute, followed up until it books, and reported to you every month.", Art: StepBooked },
];

function HowSimple() {
  return (
    <Section
      id="how"
      variant="light"
      eyebrow="How it works"
      heading="Three steps. No jargon."
    >
      <div className="grid md:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
        {SIMPLE_STEPS.map(({ n, t, d, Art }) => (
          <div key={n} className="card-cell flex flex-col">
            {/* The image slot from the wireframe — drawn, not photographed. */}
            <div className="border-b border-[var(--border)] bg-[var(--bg-alt)] p-5">
              <Art />
            </div>
            <div className="p-7">
              <p className="mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--accent-text)]">Step {n}</p>
              <h3 className="display-lg mt-2">{t}</h3>
              <p className="body-base mt-2.5">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─────────────────────────  LIVE DEMO + RESULTS  ───────────────────── */

function DemoSection() {
  const WATCH = [
    { t: "+0.8s", w: "It shows its thinking", d: "You can read why it did what it did." },
    { t: "+5.0s", w: "It reads the situation", d: "An urgent customer gets offered times, not more questions." },
    { t: "+13.6s", w: "It knows its limits", d: "Anything about price goes to you, not the bot." },
  ];
  return (
    <section id="demo" className="section-pad bg-[var(--bg-alt)] border-b border-[var(--border)]">
      <Container>
        <div className="grid lg:grid-cols-[0.42fr_0.58fr] gap-12 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-32">
            <Reveal>
              <p className="eyebrow mb-4">
                See a bot run <span className="eyebrow-dim">· simulated, step for step</span>
              </p>
              <h2 className="display-xl text-balance">Watch a missed call become a booked job.</h2>
              <p className="body-lg mt-5 max-w-[40ch]">
                A real booking flow, step by step, at ~10× real time. Every action is logged where you can see it.
              </p>
              <ol className="mt-9 border-t border-[var(--border)]">
                {WATCH.map((x) => (
                  <li key={x.t} className="grid grid-cols-[56px_1fr] gap-4 py-4 border-b border-[var(--border)]">
                    <span className="mono text-[11.5px] tabular-nums text-[var(--accent-text)] pt-0.5">{x.t}</span>
                    <span>
                      <span className="block text-[14.5px] font-medium tracking-[-0.01em]">{x.w}</span>
                      <span className="block text-[13px] text-[var(--text-secondary)] mt-0.5">{x.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
          <Reveal delay={0.08}>
            <AgentTrace />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ──────────────────────────────  FAQ  ───────────────────────────────── */

const HOME_FAQ = [
  { q: "What exactly am I buying?", a: "A speed-to-lead system built around how your business runs: every call, form and quote request answered in under a minute, followed up until it books, and logged to your CRM. We build it, run it and keep it tuned. Not software you configure on a weekend." },
  { q: "What does it cost?", a: "Setup is a one-time fee, then a monthly retainer that covers monitoring, tuning and a monthly results report. Systems start at $2,500 a month. Your audit shows what the leak is worth first, so you can judge the math before you spend anything." },
  { q: "Do I have to replace my current tools?", a: "No. Bots plug into the CRM, calendar, phone system, ad accounts and email platform you already use. Replacing your stack is almost never the right first move." },
  { q: "How fast does something go live?", a: "The audit takes a few days. The first bot is typically live in monitored mode inside two weeks, and fully autonomous a couple of weeks after that." },
  { q: "Is my business a fit?", a: "It works best for residential and commercial contractors getting at least 25 new leads a month with jobs worth $1,000 or more. Below that, the system costs more than the leak. The audit tells you which side of that line you are on." },
  { q: "Who owns what?", a: "You own your customers, your data, your phone numbers and your ad accounts, always. We run the operating system on top of them. If you leave, your contacts and history export to you in full." },
];

function Faq() {
  return (
    <section className="section-pad border-b border-[var(--border)]">
      <Container>
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-32">
            <Reveal>
              <SectionHeader eyebrow="Questions" title="The things people ask first." />
              <div className="mt-10 border border-[var(--border)] bg-[var(--bg-alt)] p-6 max-w-[380px]">
                <p className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
                  Not answered here?
                </p>
                <a href="mailto:hello@agenticbots.dev" className="display-md mt-2 block hover:text-[var(--accent-text)] transition-colors">
                  hello@agenticbots.dev
                </a>
                <p className="body-xs mt-2">A person replies within one business day.</p>
              </div>
            </Reveal>
          </div>
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
    <section id="audit" className="section-pad scroll-mt-28">
      <Container>
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
          <Reveal>
            <p className="eyebrow mb-4">Free lead leak audit</p>
            <h2 className="display-xl text-balance">
              Find out how many jobs you are losing before you hear the phone ring.
            </h2>
            <p className="body-lg mt-5 max-w-[46ch]">
              We test your business the way a new customer would: an after-hours call, a
              website form, a quote request. Then we send you a short scorecard with your real
              response times and what they are costing you.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Scorecard back in two business days",
                "No call required to get it",
                "Yours to keep, whether or not we work together",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-[14.5px] text-[var(--text-secondary)]">
                  <Check className="w-4 h-4 text-[var(--accent-text)]" strokeWidth={2.5} />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.08}>
            <AuditForm source="home-final" />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────── */


/* ────────────────────────────  CALCULATOR  ─────────────────────────── */

function Calculator() {
  return (
    <Section
      id="calculator"
      variant="light"
      eyebrow="Lead leak calculator"
      heading={<>What slow replies <span className="em-green">cost you.</span></>}
      sub="Most contractors call back when they get a minute. By then the customer has called someone else. Put in your numbers."
    >
      <LeakCalculator />
    </Section>
  );
}

/* ──────────────────────────  WHO THIS IS FOR  ───────────────────────── */

const WHO = [
  { id: "W-01", label: "Residential crew at a customer's home", spec: "1600×1200 · horizontal · real crew, real truck, natural light. No stock handshakes.", who: "Residential contractors", eg: "Roofing · HVAC · plumbing · electrical · remodeling", d: "Homeowners call three companies and hire whoever answers first. Your bot is first, every time." },
  { id: "W-02", label: "Commercial estimator on a job site", spec: "1600×1200 · horizontal · hard hat, plans, a phone in hand.", who: "Commercial contractors", eg: "GCs · specialty trades · facilities services", d: "Bid requests, follow-ups and RFQs worked the same day, so no project goes cold waiting on an estimator." },
];

function WhoFor() {
  return (
    <Section
      variant="alt"
      eyebrow="Who this is for"
      heading={<>Built for contractors <span className="em-green">who are on the job.</span></>}
      sub="You can't answer the phone from a roof or a job walk. That's exactly when leads come in."
    >
      <div className="grid sm:grid-cols-2 gap-8 max-w-[920px]">
        {WHO.map((t) => (
          <div key={t.id}>
            <MediaSlot id={t.id} ratio="4 / 3" label={t.label} spec={t.spec} />
            <p className="display-lg mt-5">{t.who}</p>
            <p className="mono text-[11px] uppercase tracking-[0.08em] text-[var(--accent-text)] mt-1.5">{t.eg}</p>
            <p className="body-base mt-3 max-w-[44ch]">{t.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ──────────────────────────  FOUNDING CLIENTS  ──────────────────────── */

function FoundingClients() {
  return (
    <section id="founding" className="border-b border-ink-700 bg-ink-950 on-dark scroll-mt-28">
      <Container className="section-pad-sm">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="eyebrow-dark mb-4">Founding clients</p>
            <h2 className="display-xl text-balance">
              Three spots. <span className="em-green-dark">Reduced setup.</span>
            </h2>
            <p className="body-lg mt-5 max-w-[46ch] text-ink-300">
              We&apos;re taking on our first three contractors at a reduced setup fee. In return, we
              publish your before-and-after numbers as a case study. Same system, same monthly
              price, same guarantee.
            </p>
            <a href="#audit" className="btn btn-on-dark mt-8">
              Start with the free audit <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="border border-ink-700 bg-ink-900">
            <div className="flex items-center justify-between gap-4 border-b border-ink-700 px-5 h-11">
              <span className="mono text-[10.5px] uppercase tracking-[0.11em] text-ink-300">Founding spots</span>
              <span className="flex items-center gap-2 mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
                <span className="h-1.5 w-1.5 bg-[var(--color-accent-400)] animate-pulse-dot" />
                3 of 3 open
              </span>
            </div>
            <ul className="px-5 py-4 space-y-3">
              {[
                ["Reduced setup fee", "Founding rate"],
                ["Monthly retainer", "Standard"],
                ["Booked-appointment guarantee", "Included"],
                ["Published case study", "Required"],
              ].map(([k, v]) => (
                <li key={k} className="flex items-baseline justify-between gap-4 border-b border-ink-800 pb-3 last:border-b-0 last:pb-0">
                  <span className="text-[14px] text-ink-200">{k}</span>
                  <span className="mono text-[10.5px] uppercase tracking-[0.08em] text-accent-400 shrink-0">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────────────  PRICING ANCHOR  ───────────────────────── */

function PricingAnchor() {
  return (
    <section className="section-pad-sm border-b border-[var(--border)] bg-[var(--bg-alt)]">
      <Container>
        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <p className="eyebrow mb-3">Pricing</p>
            <p className="display-xl text-balance max-w-[24ch]">
              Systems start at <span className="em-green">$2,500 a month.</span>
            </p>
            <p className="body-base mt-4 max-w-[58ch]">
              One-time setup, then a monthly retainer for monitoring, tuning and reporting. If the
              system doesn&apos;t hit the booked-appointment target we agree on, your first month is on us.
            </p>
          </div>
          <Link href="/pricing" className="btn btn-outline">
            See pricing <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────────────  FULL SYSTEM  ─────────────────────────── */

function FullSystem() {
  return (
    <section className="border-t border-[var(--border)]">
      <Container className="py-10 space-y-8">
        <div>
          <p className="eyebrow mb-3">Service areas</p>
          <p className="body-base max-w-[62ch]">
            We set up speed-to-lead systems for contractors across the country. Find your market:
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <li key={r}>
                <Link
                  href={`/markets/region/${regionSlug(r)}`}
                  className="inline-flex px-3.5 py-2 border border-[var(--border)] text-[13.5px] font-medium hover:border-ink-950 transition-colors"
                >
                  {r}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/markets" className="inline-flex px-3.5 py-2 text-[13.5px] font-semibold text-[var(--accent-text)]">
                All markets →
              </Link>
            </li>
          </ul>
        </div>
        <div className="pt-8 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
          <p className="body-sm max-w-[62ch]">
            Speed-to-lead is where we start. Once it&apos;s running, clients add ads, reviews,
            reactivation and reporting.
          </p>
          <Link href="/services" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--accent-text)] hover:gap-2.5 transition-all">
            See the full system <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={[faqLd(HOME_FAQ)]} />
      <Header />
      <main>
        <Hero />
        <DemoSection />
        <Calculator />
        <HowSimple />
        <WhoFor />
        <FoundingClients />
        <PricingAnchor />
        <Faq />
        <FinalCta />
        <FullSystem />
      </main>
      <Footer />
    </>
  );
}
