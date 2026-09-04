import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd } from "@/components/JsonLd";
import { Container, Reveal, SectionHeader, BrandMark, Section, MediaSlot } from "@/components/ui";
import { BotPlanForm, BotFactory, FaqAccordion, PlanCta, BotOrbit, BotConveyor, ProofBar, VideoSection, LeadMagnet, AgentTrace, AgentField, VignetteAsk, VignetteBuild, VignetteBooked } from "@/components/marketing";
import { CATALOG } from "@/lib/catalog";

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
              Marketing + sales <span className="eyebrow-dim">· run by bots, watched by you</span>
            </p>
            <h1 className="display-hero max-w-[16ch] text-balance">
              Agentic bots get you customers.
            </h1>
            <p className="body-lg mt-5 max-w-[48ch] text-pretty">
              We build bots that answer every lead, follow up on every quote, and
              keep your ads and CRM working — every hour, including the ones you
              are asleep for.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <BotOrbit>
                <PlanCta source="home-hero" />
              </BotOrbit>
              <Link
                href="/how-it-works"
                className="text-[15px] font-semibold tracking-[-0.01em] border-b-2 border-[var(--border-strong)] pb-0.5 hover:border-ink-950 transition-colors"
              >
                See how it works
              </Link>
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
            <BotFactory />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ─────────────────────────  THREE PLAIN STEPS  ──────────────────────── */

const SIMPLE_STEPS = [
  { n: "01", t: "Tell us what's stuck", d: "Two minutes. You get a free written plan back in one business day — no call, no pressure.", Art: VignetteAsk },
  { n: "02", t: "We build your bots", d: "Wired into the tools you already use. First one is working in about two weeks.", Art: VignetteBuild },
  { n: "03", t: "Customers stop slipping through", d: "Every call answered, every quote followed up, day and night. You see everything it does.", Art: VignetteBooked },
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
            <div className="border-b border-[var(--border)] bg-[var(--bg-alt)] px-4 pt-5 pb-3">
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

/* ─────────────────────────────  BOT INDEX  ──────────────────────────── */

function BotRoster() {
  return (
    <section className="relative section-pad bg-[var(--bg-alt)] border-b border-[var(--border)]">
      {/* Watermark clips in its own layer — overflow-hidden on the section
          itself would break the roster's position:sticky panel. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <BrandMark className="-right-24 top-10" size={560} />
      </div>
      <Container className="relative">
        <Reveal>
          <SectionHeader
            eyebrow="The full roster"
            title="Thirteen bots. Yours starts with one."
            copy="Some get you found. Some make sure nobody slips through. Start with the one that fixes what hurts most."
          />
        </Reveal>

        {/* The fleet in one glance. The full catalog lives on the pillar
            pages below — the homepage should not try to be an index. */}
        <div className="mt-12 -mx-5 sm:-mx-8">
          <BotConveyor />
        </div>
        {/* The two pillars, one line each — the old two-card section, folded in. */}
        <div className="mt-12 grid sm:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] max-w-[860px]">
          {CATALOG.map((p) => (
            <Link key={p.slug} href={`/${p.slug}`} className="group card-cell px-6 py-4 flex items-center justify-between gap-4">
              <span>
                <span className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--accent-text)]">{p.tagline}</span>
                <span className="block display-md group-hover:text-[var(--accent-text)] transition-colors">
                  {p.name} <span className="text-[var(--text-muted)] font-normal">· {p.categories.length} bots</span>
                </span>
              </span>
              <ArrowRight className="w-4 h-4 shrink-0 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>

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
              <p className="eyebrow mb-4">
                See a bot run <span className="eyebrow-dim">· simulated, step for step</span>
              </p>
              <h2 className="display-xl text-balance">Watch how a bot handles a lead.</h2>
              <p className="body-lg mt-5 max-w-[40ch]">
                Tool calls and reasoning visible, scrubbable, at ~10× real time.
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

/* ───────────────────────────  HOW IT WORKS  ─────────────────────────── */

/* ─────────────────────────────  THE FIELD  ─────────────────────────── */

function FieldBand() {
  return (
    <section className="bg-ink-900 on-dark border-b border-ink-700">
      <div className="h-px rule-agent opacity-60" />
      <Container className="section-pad-sm">
        <div className="max-w-[52ch]">
          <p className="eyebrow mb-4">
            What &ldquo;every hour&rdquo; looks like <span className="eyebrow-dim">· live</span>
          </p>
          <h2 className="display-xl text-balance">
            Hundreds of little jobs, done the moment they appear.
          </h2>
        </div>

        <div className="mt-10 border border-ink-700 bg-ink-950 px-4 pt-4 pb-2">
          <AgentField height={250} />
        </div>

        <dl className="mt-8 grid gap-px sm:grid-cols-3 border border-ink-700 bg-ink-700">
          {[
            { value: "<60s", label: "First response to any lead, any hour" },
            { value: "24/7", label: "Nights, weekends and holidays covered" },
            { value: "0", label: "Leads that go unfollowed because someone got busy" },
          ].map((m) => (
            <div key={m.label} className="bg-ink-800 px-6 py-6">
              <dt className="text-[1.75rem] font-semibold tracking-[-0.035em] leading-none tabular-nums text-accent-400">
                {m.value}
              </dt>
              <dd className="mt-2.5 text-[13.5px] leading-snug text-ink-300">{m.label}</dd>
            </div>
          ))}
        </dl>
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
  { q: "Who owns everything you build?", a: "You do. The accounts, the data, the sequences, the automations. If we part ways, it all stays with you and keeps running." },
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

function PlanPreview() {
  const ROWS = [
    { i: "09", n: "Speed-to-Lead Bot", why: "worst leak first", bar: "82%" },
    { i: "01", n: "Ads Bot", why: "wasted spend", bar: "58%" },
    { i: "10", n: "CRM Bot", why: "foundation for both", bar: "40%" },
  ];
  return (
    <figure className="mt-10 max-w-[400px] border border-[var(--border)] bg-white" aria-hidden="true">
      <div className="flex items-center justify-between px-5 h-10 border-b border-[var(--border)] bg-[var(--bg-alt)]">
        <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-secondary)]">your-bot-plan.pdf</span>
        <span className="mono text-[10px] text-[var(--text-muted)]">1 page</span>
      </div>
      <div className="px-5 py-4">
        <p className="text-[13px] font-semibold tracking-[-0.01em]">Build order — by what it&apos;s worth</p>
        <ul className="mt-3 space-y-2.5">
          {ROWS.map((r) => (
            <li key={r.i} className="grid grid-cols-[24px_1fr] gap-2.5 items-center">
              <span className="mono text-[10.5px] tabular-nums text-[var(--text-muted)]">{r.i}</span>
              <span>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] font-medium">{r.n}</span>
                  <span className="mono text-[10px] text-[var(--text-muted)]">{r.why}</span>
                </span>
                <span className="mt-1 block h-[5px] bg-[var(--bg-alt)]">
                  <span className="block h-full bg-accent-500" style={{ width: r.bar }} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="px-5 py-2.5 border-t border-[var(--border)] mono text-[10px] text-[var(--text-muted)]">
        sample layout · yours is built from your numbers
      </figcaption>
    </figure>
  );
}

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
            <PlanPreview />
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


/* ──────────────────────────  WHO THIS IS FOR  ───────────────────────── */

/* The site sells to a plumber and to a VP of growth. Nothing on the page
   showed either of them. Faces and job sites do the work that another
   paragraph of copy cannot. */
const TRADES = [
  { id: "W-01", label: "Home-service crew on a job", spec: "1200×1500 · vertical · real crew, real van, natural light. No stock handshakes.", who: "Home services", eg: "Plumbing · HVAC · roofing · electrical" },
  { id: "W-02", label: "Owner on the phone in a truck", spec: "1200×1500 · vertical · the moment a lead comes in and nobody can answer.", who: "Owner-operators", eg: "The person who is also doing four other jobs" },
  { id: "W-03", label: "Ops lead at a desk, two screens", spec: "1200×1500 · vertical · CRM visible but unreadable. Focus on the person.", who: "Multi-location", eg: "Franchise groups · regional operators" },
  { id: "W-04", label: "Marketing lead presenting", spec: "1200×1500 · vertical · a meeting, not a boardroom cliché.", who: "In-house teams", eg: "The growth lead who needs headcount they cannot hire" },
];

function WhoFor() {
  return (
    <Section
      variant="alt"
      eyebrow="Who this is for"
      heading={<>Built for the people <span className="em-green">answering the phone.</span></>}
      sub="Whether you run three trucks or three regions, the failure is the same: leads arrive faster than anyone can work them."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {TRADES.map((t) => (
          <div key={t.id}>
            <MediaSlot id={t.id} ratio="4 / 5" label={t.label} spec={t.spec} />
            <p className="display-md mt-4">{t.who}</p>
            <p className="body-sm mt-1.5">{t.eg}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────────  IN THEIR WORDS  ───────────────────────── */

/* The audit's biggest conversion gap and the biggest design gap have the
   same fix: real people. Copy stays empty until real quotes exist. */
const VOICES = [
  { id: "V-01", role: "Owner, plumbing company", place: "Awaiting first client quote" },
  { id: "V-02", role: "Marketing lead, HVAC group", place: "Awaiting first client quote" },
  { id: "V-03", role: "VP Growth, services platform", place: "Awaiting first client quote" },
];

function Voices() {
  return (
    <Section
      variant="light"
      eyebrow="In their words"
      heading="The part we cannot write ourselves."
      sub="These slots stay empty until real clients fill them. Nothing here is invented."
    >
      <div className="grid md:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
        {VOICES.map((v) => (
          <div key={v.id} className="card-cell p-7">
            <MediaSlot
              id={v.id}
              ratio="1 / 1"
              label="Client headshot"
              spec="800×800 · square · real person, plain background, eyes to camera."
              className="w-20"
            />
            <p className="body-base mt-5 text-[var(--text-muted)] italic">
              &ldquo;Quote goes here — one specific thing that changed, in their words, with a number
              they are willing to stand behind.&rdquo;
            </p>
            <p className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--text-muted)] mt-5">
              {v.role} · {v.place}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={[faqLd(HOME_FAQ)]} />
      <Header />
      <main>
        <Hero />
        <ProofBar />
        <HowSimple />
        <VideoSection
          heading={<>Ninety seconds, <span className="em-green">start to booked.</span></>}
          sub="One missed call, handled end to end. No slides, no diagrams — just the thing running."
        />
        <WhoFor />
        <BotRoster />
        <DemoSection />
        <FieldBand />
        <Voices />
        <LeadMagnet source="home" />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
