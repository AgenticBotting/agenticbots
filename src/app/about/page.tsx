import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { Container, Reveal, SectionHeader } from "@/components/ui";
import { BotPlanForm, StatBand } from "@/components/marketing";

export const metadata: Metadata = {
  title: "About",
  description:
    "We build and run the bots that get businesses customers. No account managers, no six-month discovery, no jargon.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  { t: "One leak at a time", b: "We do not sell you thirteen bots on day one. We find the single worst leak, plug it, prove it, then talk about the next one." },
  { t: "Everything stays yours", b: "The accounts, the data, the sequences, the automations. If we part ways it all keeps running without us. That is the point." },
  { t: "Logs over promises", b: "Every action a bot takes is logged and reviewable. If we cannot show you what it did and why, we should not have shipped it." },
  { t: "Plain language", b: "You should be able to read our reports without a glossary. If an explanation needs jargon to survive, it is usually hiding something." },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-[var(--border)]">
          <Container className="py-16 sm:py-20">
            <Reveal>
              <p className="eyebrow mb-5">About us</p>
              <h1 className="display-hero max-w-[18ch] text-balance">
                We build the bots. <span className="em-green">You keep the customers.</span>
              </h1>
              <p className="body-lg mt-6 max-w-[56ch] text-pretty">
                AgenticBots exists because the gap between a lead arriving and someone
                doing something about it is the most expensive gap in most businesses —
                and it is closable with software that does not sleep.
              </p>
            </Reveal>
          </Container>
        </section>

        <section className="section-pad border-b border-[var(--border)]">
          <Container>
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16">
              <Reveal>
                <SectionHeader eyebrow="How we operate" title="Four things we do not bend on." />
              </Reveal>
              <Reveal delay={0.08}>
                <div className="grid sm:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-none overflow-hidden">
                  {PRINCIPLES.map((p, i) => (
                    <div key={p.t} className="bg-white p-7">
                      <span
                        className="text-[12px] text-[var(--accent-text)] mono"
                      >
                        0{i + 1}
                      </span>
                      <h3 className="display-md mt-3">{p.t}</h3>
                      <p className="body-sm mt-2.5">{p.b}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </Container>
        </section>

        <StatBand
          eyebrow="What we are not"
          title="No account managers, no six-month discovery, no percentage of your ad spend."
          metrics={[
            { value: "Direct", label: "You talk to the people who build it" },
            { value: "4 days", label: "Audit turnaround, not four weeks" },
            { value: "Yours", label: "Every account and automation we touch" },
          ]}
        />

        <section className="section-pad">
          <Container>
            <BotPlanForm source="about" />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
