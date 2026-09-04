import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd, breadcrumbLd } from "@/components/JsonLd";
import { Container, Reveal, SectionHeader, ButtonLink } from "@/components/ui";
import { BotPlanForm, FaqAccordion } from "@/components/marketing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Build once, then run monthly. Transparent tiers for one bot, a connected system, or full marketing and sales coverage.",
  alternates: { canonical: "/pricing" },
};

const TIERS = [
  {
    name: "One Bot",
    tag: "Fix the worst leak",
    build: "$4,500",
    run: "$1,200/mo",
    body: "A single bot, built against your process and run continuously. The right start for almost everyone.",
    features: [
      "One bot of your choice",
      "Audit and leak map included",
      "Connected to your existing stack",
      "Monitored launch, then autonomous",
      "Weekly tuning pass",
      "Monthly plain-language report",
    ],
    cta: "Get your bot plan",
    featured: false,
  },
  {
    name: "Growth System",
    tag: "Most common",
    build: "$12,000",
    run: "$3,500/mo",
    body: "Three to five bots working as one system — demand on one side, capture on the other, sharing the same data.",
    features: [
      "3–5 bots across marketing and sales",
      "Everything in One Bot",
      "Cross-bot routing and shared context",
      "Conversion tracking rebuilt end to end",
      "Unified reporting across every channel",
      "Twice-weekly tuning passes",
      "Named contact, same-day response",
    ],
    cta: "Get your bot plan",
    featured: true,
  },
  {
    name: "Full Coverage",
    tag: "Marketing + sales",
    build: "From $25,000",
    run: "From $7,500/mo",
    body: "The whole roster, or as much of it as your business needs. For teams replacing an agency and an ops hire at once.",
    features: [
      "Up to all 13 bots",
      "Everything in Growth System",
      "RevOps forecasting and handoff workflows",
      "Custom integrations and internal tooling",
      "Quarterly strategy sessions",
      "Daily monitoring and priority escalation",
    ],
    cta: "Get your bot plan",
    featured: false,
  },
];

const FAQ = [
  { q: "Is ad spend included?", a: "No. You pay Google, Meta and everyone else directly, so your spend stays yours and fully visible. Our fee is for building and running the bots on top of it." },
  { q: "Why a build fee and a monthly fee?", a: "The build is real work — audit, integration, testing. The monthly covers running the bots, the tuning passes and the infrastructure. Splitting them keeps both honest." },
  { q: "Am I locked in?", a: "No. The build is a one-time project; the monthly run is month to month. If it is not producing you should be able to walk, and everything we built stays with you." },
  { q: "What if I need something not on the list?", a: "Custom integrations and internal tooling are common in Full Coverage and available as add-ons elsewhere. Ask in your bot plan request." },
  { q: "Do you work with agencies?", a: "Yes, on a white-label basis. The bots run under your brand and your client relationship stays yours." },
  { q: "How is this cheaper than hiring?", a: "One competent marketing hire plus one ops hire runs well past $150k a year, works forty hours a week, and takes vacation. Compare against that, not against software." },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd data={[faqLd(FAQ), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }])]} />
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-16 sm:py-20">
            <Reveal>
              <p className="eyebrow mb-5">Pricing</p>
              <h1 className="display-hero max-w-[16ch] text-balance">
                Build once. <span className="em-green">Then it runs.</span>
              </h1>
              <p className="body-lg mt-6 max-w-[54ch] text-pretty">
                A one-time build fee for the work of getting a bot right, then a monthly
                fee to run and tune it. No per-seat pricing, no percentage of your ad
                spend, no lock-in.
              </p>
            </Reveal>
          </Container>
        </section>

        <section className="section-pad-sm border-b border-[var(--border)]">
          <Container>
            <div className="grid lg:grid-cols-3 gap-6">
              {TIERS.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.07}>
                  <div
                    className={cn(
                      "card h-full flex flex-col p-8",
                      t.featured && "border-ink-950 border-2 shadow-lift"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="eyebrow !mb-0">{t.tag}</p>
                      {t.featured && (
                        <span className="chip !bg-[var(--bg-tint)] !border-[var(--border-tint)] !text-[var(--accent-ink)]">
                          popular
                        </span>
                      )}
                    </div>

                    <h2 className="display-xl mt-4">{t.name}</h2>
                    <p className="body-sm mt-3 min-h-[4.5rem]">{t.body}</p>

                    <div className="mt-6 pt-6 border-t border-[var(--border)]">
                      <p className="text-[2rem] font-semibold tracking-[-0.035em] leading-none tabular-nums">{t.build}</p>
                      <p className="body-sm mt-2">one-time build</p>
                      <p
                        className="mt-4 text-[15px] font-semibold text-[var(--foreground)] mono"
                      >
                        + {t.run}
                      </p>
                      <p className="body-sm mt-1">to run and tune</p>
                    </div>

                    <ul className="mt-7 space-y-3 flex-1">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-[14px] text-[var(--text-secondary)]">
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--accent-text)]" strokeWidth={2.5} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <ButtonLink
                      href="/plan"
                      variant={t.featured ? "primary" : "outline"}
                      className="mt-8 w-full"
                    >
                      {t.cta}
                      <ArrowRight className="w-4 h-4" />
                    </ButtonLink>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <p className="body-sm mt-8 text-center max-w-[62ch] mx-auto">
                Prices are starting points, not quotes. What you actually pay depends on
                how many bots, how messy the data is, and how many systems they touch —
                all of which your bot plan spells out before you commit to anything.
              </p>
            </Reveal>
          </Container>
        </section>

        <section className="section-pad border-b border-[var(--border)]">
          <Container>
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16">
              <Reveal>
                <SectionHeader eyebrow="Questions" title="What people ask about price." />
              </Reveal>
              <Reveal delay={0.08}>
                <FaqAccordion items={FAQ} />
              </Reveal>
            </div>
          </Container>
        </section>

        <section className="section-pad">
          <Container>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
              <Reveal>
                <SectionHeader
                  eyebrow="Before you pick a tier"
                  title="Get the plan first. It is free."
                  copy="You should not be choosing a tier from a pricing page. Tell us where it is leaking and we will tell you which bots you actually need — which is often fewer than you think."
                />
              </Reveal>
              <Reveal delay={0.08}>
                <BotPlanForm source="pricing" />
              </Reveal>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
