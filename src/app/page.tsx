import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd } from "@/components/JsonLd";
import { Container, Reveal, Section } from "@/components/ui";
import { REGIONS, regionSlug } from "@/lib/geo/regions";
import { cn } from "@/lib/utils";
import { FaqAccordion, BotOrbit, AgentTrace, AuditForm, LeakCalculator, HeroClock, VignetteAsk, VignetteBuild, VignetteBooked } from "@/components/marketing";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* ───────────────────────────────  HERO  ─────────────────────────────── */

function Hero() {
  return (
    <HeroClock>
      <p className="eyebrow mb-5">For residential and commercial contractors</p>
      <h1 className="display-mega !text-[clamp(3.1rem,6.4vw,6.25rem)] max-w-[10.5ch] text-balance">
        Every lead answered in 60&nbsp;seconds.
      </h1>
      <p className="body-lg mt-6 max-w-[44ch] text-pretty">
        Our bots text back every call, form and quote request in under a minute, follow
        up until the job is booked, and log it all to your CRM. Nights and weekends
        included. Installed in 14 days.
      </p>
      <div className="mt-8 cta-row">
        <BotOrbit>
          <a href="#audit" className="btn btn-primary h-[52px] px-6 text-[15px]">
            Get my free lead leak audit
            <ArrowRight className="w-4 h-4" />
          </a>
        </BotOrbit>
        <a
          href="#demo"
          className="self-start text-[15px] font-semibold tracking-[-0.01em] border-b-2 border-[var(--border-strong)] pb-0.5 hover:border-ink-950 transition-colors"
        >
          Watch a full booking
        </a>
      </div>
    </HeroClock>
  );
}

/* ─────────────────────────  THREE PLAIN STEPS  ──────────────────────── */

const SIMPLE_STEPS = [
  { day: "Day 0", t: "We secret-shop your leads", d: "An after-hours call, a form, a quote request, all timed. Your scorecard lands two days later.", Art: VignetteAsk },
  { day: "Day 3", t: "We wire it into your business", d: "Your phone line, website forms, calendar and CRM. Nothing for you to replace.", Art: VignetteBuild },
  { day: "Day 14", t: "Every lead gets answered", d: "Live and monitored from the first call, nights and weekends included.", Art: VignetteBooked },
];

function HowSimple() {
  return (
    <section id="how" className="section-pad border-b border-[var(--border)] scroll-mt-28">
      <Container>
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-6 lg:gap-16 items-end">
          <h2 className="display-xl max-w-[14ch] text-balance">From first audit to answering in 14 days.</h2>
          <p className="body-lg max-w-[48ch] lg:justify-self-end">
            No kickoff calls, no six-week onboarding. We test what you have, show you the gap, then close it.
          </p>
        </div>

        <ol className="mt-14 grid md:grid-cols-3 gap-10 md:gap-0 relative">
          {/* the timeline rail */}
          <span aria-hidden className="hidden md:block absolute left-0 right-0 top-[3.1rem] h-px bg-[var(--border-strong)]" />
          {SIMPLE_STEPS.map(({ day, t, d, Art }, i) => (
            <li key={day} className="relative md:pr-10">
              <p className="num-display text-[clamp(2.5rem,4vw,3.5rem)] text-ink-950">{day}</p>
              <span aria-hidden className={cn("hidden md:block absolute top-[2.75rem] left-0 h-3.5 w-3.5 border-[3px] border-white", i === 2 ? "bg-[var(--color-accent-500)]" : "bg-ink-950")} />
              <div className="mt-8 border border-[var(--border)] bg-[var(--bg-alt)] px-4 pt-4 pb-2"><Art /></div>
              <h3 className="display-lg mt-5">{t}</h3>
              <p className="body-base mt-2 max-w-[36ch]">{d}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
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
              <p className="eyebrow mb-4">The full booking, step by step</p>
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
              <h2 className="display-xl max-w-[12ch]">The things people ask first.</h2>
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
            <h2 className="display-xl text-balance max-w-[16ch]">
              Find out how many jobs you lose before the phone rings.
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
      heading="What slow replies cost you."
      sub="Most contractors call back when they get a minute. By then the customer has called someone else. Put in your numbers."
    >
      <LeakCalculator />
    </Section>
  );
}

/* ──────────────────────────  WHO THIS IS FOR  ───────────────────────── */

const WHO = [
  {
    who: "Residential",
    d: "Homeowners call three companies and hire whoever answers first. Your bot answers first.",
    trades: ["Roofing", "HVAC", "Plumbing", "Electrical", "Remodeling", "Pest control"],
  },
  {
    who: "Commercial",
    d: "Bid requests and RFQs worked the same day, so no project goes cold waiting on an estimator.",
    trades: ["General contractors", "Specialty trades", "Facilities", "Paving", "Glazing", "Fire protection"],
  },
];

function WhoFor() {
  return (
    <section id="who" className="section-pad bg-[var(--bg-alt)] border-b border-[var(--border)] scroll-mt-28">
      <Container>
        <h2 className="display-xl max-w-[16ch] text-balance">Built for the people on the roof, not at the desk.</h2>
        <p className="body-lg mt-5 max-w-[50ch]">
          You can&apos;t answer the phone from a ladder or a job walk. That&apos;s exactly when leads come in.
        </p>
        <div className="mt-14 grid md:grid-cols-2 gap-x-14 gap-y-14">
          {WHO.map((g) => (
            <div key={g.who}>
              <div className="pb-4 border-b-2 border-ink-950">
                <p className="display-lg">{g.who}</p>
              </div>
              <ul>
                {g.trades.map((t) => (
                  <li key={t} className="group flex items-center justify-between border-b border-[var(--border-strong)] py-2.5">
                    <span className="num-display text-[clamp(2rem,4.2vw,3.5rem)] text-ink-950 group-hover:text-[var(--accent-text)] transition-colors">{t}</span>
                    <span aria-hidden className="h-2.5 w-2.5 bg-[var(--color-accent-500)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </li>
                ))}
              </ul>
              <p className="body-base mt-5 max-w-[44ch]">{g.d}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ──────────────────────────  FOUNDING CLIENTS  ──────────────────────── */

function FoundingClients() {
  return (
    <section id="founding" className="bg-ink-950 on-dark scroll-mt-28 overflow-hidden">
      <Container className="section-pad">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">
          <div>
            <p className="eyebrow-dark eyebrow mb-4">Founding clients</p>
            <h2 className="display-xl text-balance max-w-[14ch]">Three spots at a reduced setup fee.</h2>
            <p className="body-lg mt-5 max-w-[44ch]">
              Same system, same monthly price, same guarantee. In return, we publish your
              before-and-after numbers as a case study.
            </p>
            <a href="#audit" className="btn btn-primary mt-9 h-[52px] px-6 text-[15px]">
              Claim a spot with the free audit <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <ol className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className="relative aspect-[3/4] border border-ink-700 bg-ink-900 p-4 flex flex-col justify-between">
                <span className="text-[12px] text-ink-400">Spot</span>
                <span className="num-display text-[clamp(5rem,11vw,9rem)] text-white">{n}</span>
                <span className="flex items-center gap-2 text-[13px] font-semibold text-accent-300">
                  <span className="h-2 w-2 bg-accent-400 animate-pulse-dot" /> Open
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────────────  PRICING ANCHOR  ───────────────────────── */

function PricingAnchor() {
  return (
    <section className="border-b border-[var(--border)] overflow-hidden">
      <Container className="section-pad">
        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-10 items-end">
          <div>
            <p className="eyebrow mb-3">Systems start at</p>
            <p className="num-display text-[clamp(5.5rem,17vw,15rem)] text-ink-950">
              $2,500<span className="text-[0.28em] text-[var(--text-muted)] tracking-normal">/mo</span>
            </p>
          </div>
          <div className="pb-4">
            <p className="body-lg max-w-[40ch]">
              One-time setup, then a monthly retainer for monitoring, tuning and reporting.
              Miss the booked-appointment target we agree on, and your first month is on us.
            </p>
            <Link href="/pricing" className="btn btn-outline mt-7">
              See pricing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
