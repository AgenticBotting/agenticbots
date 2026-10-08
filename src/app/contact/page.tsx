import { HeroHeading } from "@/components/ui/HeroHeading";
import type { Metadata } from "next";
import { Mail, Clock, FileText } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Reveal } from "@/components/ui";
import { BotPlanForm } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Contact",
  description: "Discuss a governed BOT operating mandate with AgenticBots.",
  alternates: { canonical: "/contact" },
};

const FACTS = [
  { icon: Mail, t: "Direct contact", b: "Write to hello@agenticbots.dev or use the operating brief." },
  { icon: Clock, t: "Decision context", b: "Share the priority, timing and constraint behind the request." },
  { icon: FileText, t: "A scoped next step", b: "Share your goals and constraints so we can review fit before proposing implementation." },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <section className="section-pad">
          <Container>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
              <Reveal>
                <p className="eyebrow mb-5">Contact</p>
                <HeroHeading text="Define the" accent="operating case." />
                <p className="body-lg mt-6 max-w-[44ch] text-pretty">
                  Give us the business priority, current systems and decision horizon. We use that context to evaluate a specific BOT mandate and document the next step.
                </p>

                <ul className="mt-10 space-y-6">
                  {FACTS.map((f) => {
                    const Icon = f.icon;
                    return (
                      <li key={f.t} className="flex gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--accent-text)]">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span>
                          <span className="block display-md">{f.t}</span>
                          <span className="block body-sm mt-1">{f.b}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
              <Reveal delay={0.08}>
                <BotPlanForm source="contact" />
              </Reveal>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
