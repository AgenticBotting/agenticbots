import type { Metadata } from "next";
import { Search, Plug, Rocket, RefreshCw } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Reveal, SectionHeader } from "@/components/ui";
import { BotPlanForm, StatBand, FaqAccordion, PlanCta } from "@/components/marketing";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Audit, connect, launch, tune. How AgenticBots gets your first bot live in about two weeks and keeps it improving.",
  alternates: { canonical: "/how-it-works" },
};

const PHASES = [
  {
    icon: Search,
    n: "01",
    t: "Audit",
    lead: "Days 1–4",
    b: "We map every way a customer can reach you and everything that happens after. Ad accounts, forms, phone, inbox, CRM stages. The output is a written picture of where people are dropping out and what each drop is costing.",
    bullets: [
      "90 days of ad, form and call data reviewed",
      "Every lead path traced end to end",
      "Leaks ranked by what fixing them is worth",
      "You keep the map either way",
    ],
  },
  {
    icon: Plug,
    n: "02",
    t: "Connect",
    lead: "Week 1–2",
    b: "The first bot gets built against your actual process — the questions you ask, the info you capture, the stages you use — then wired into the tools you already run. Nothing gets replaced and nothing gets migrated.",
    bullets: [
      "Built from your real intake process, not a template",
      "Connected to your CRM, calendar, phone and ad accounts",
      "Escalation rules defined before launch",
      "You approve the behavior before it touches a lead",
    ],
  },
  {
    icon: Rocket,
    n: "03",
    t: "Launch",
    lead: "Week 2–3",
    b: "It goes live in monitored mode against real traffic. Every action is logged and reviewed daily for the first two weeks, so edge cases get caught by us rather than by a customer.",
    bullets: [
      "Monitored mode before full autonomy",
      "Daily review for the first two weeks",
      "Rollback available at any point",
      "Handoff to a human on anything unclear",
    ],
  },
  {
    icon: RefreshCw,
    n: "04",
    t: "Tune",
    lead: "Ongoing",
    b: "Weekly passes on what the bot did and what came back. Rules tightened, budget shifted, copy revised. When the first bot is holding, the next one gets scoped.",
    bullets: [
      "Weekly optimization against real results",
      "One plain-language report, not a dashboard",
      "New bots added only once the last proves out",
      "Everything we build stays yours",
    ],
  },
];

const FAQ = [
  { q: "What do you need from me to start?", a: "Read access to your ad accounts, CRM and analytics, plus about an hour of your time to walk through how leads actually get handled today. That is enough for the audit." },
  { q: "What if the audit says we do not need bots?", a: "Then it says that. Sometimes the fix is a tracking problem or a staffing problem, and we will tell you. You keep the map." },
  { q: "How long until the first bot is fully autonomous?", a: "Usually three to four weeks total — a few days of audit, one to two weeks of build, and about two weeks in monitored mode before it runs on its own." },
  { q: "Do you work month to month?", a: "Yes. Builds are scoped as a project; the ongoing run and tuning is monthly with no long lock-in. If it is not producing, you should be able to leave." },
  { q: "What happens if a bot does something wrong?", a: "Every action is logged, escalation rules are set before launch, and rollback is available at any point. In monitored mode nothing reaches a customer without review." },
  { q: "Can you work with our in-house team?", a: "Often the best setup. We build and run the bots; your team keeps the relationships and the judgment calls the bots hand off." },
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-16 sm:py-20">
            <Reveal>
              <p className="eyebrow mb-5">The process</p>
              <h1 className="display-hero max-w-[16ch] text-balance">
                First bot live in <span className="em-green">about two weeks.</span>
              </h1>
              <p className="body-lg mt-6 max-w-[54ch] text-pretty">
                No six-month discovery phase. We find the biggest leak, build the bot that
                plugs it, run it in monitored mode until it is safe, then let it work.
              </p>
              <div className="mt-9">
                <PlanCta source="how-it-works-hero" />
              </div>
            </Reveal>
          </Container>
        </section>

        <section className="section-pad border-b border-[var(--border)]">
          <Container>
            <div className="space-y-px bg-[var(--border)] border border-[var(--border)] rounded-none overflow-hidden">
              {PHASES.map((p, i) => {
                const Icon = p.icon;
                return (
                  <Reveal key={p.n} delay={i * 0.05}>
                    <div className="bg-white grid lg:grid-cols-[auto_1fr_1fr] gap-8 lg:gap-12 p-8 sm:p-10">
                      <div className="lg:w-32">
                        <span className="flex h-10 w-10 items-center justify-center rounded-none bg-ink-950 text-white">
                          <Icon className="w-4.5 h-4.5" />
                        </span>
                        <p
                          className="mt-4 text-[12px] text-[var(--text-muted)] mono"
                        >
                          {p.n} · {p.lead}
                        </p>
                      </div>
                      <div>
                        <h2 className="display-xl">{p.t}</h2>
                        <p className="body-base mt-4 max-w-[46ch]">{p.b}</p>
                      </div>
                      <ul className="space-y-3 lg:pt-2">
                        {p.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-start gap-3 text-[14px] text-[var(--text-secondary)]"
                          >
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent-text)]" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>

        <StatBand
          eyebrow="What to expect"
          title="Slow enough to be safe. Fast enough to matter."
          metrics={[
            { value: "4 days", label: "Audit turnaround, start to written map" },
            { value: "2 wks", label: "Typical build to first bot in monitored mode" },
            { value: "Weekly", label: "Tuning passes for as long as it runs" },
          ]}
        />

        <section className="section-pad border-b border-[var(--border)]">
          <Container>
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16">
              <Reveal>
                <SectionHeader eyebrow="Questions" title="Before you start." />
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
                  eyebrow="Step zero"
                  title="It starts with the audit."
                  copy="Tell us what you sell and where it is getting stuck. The map comes back within one business day, free, and it is yours regardless of what you do next."
                />
              </Reveal>
              <Reveal delay={0.08}>
                <BotPlanForm source="how-it-works" />
              </Reveal>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
