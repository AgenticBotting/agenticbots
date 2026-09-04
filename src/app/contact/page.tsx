import type { Metadata } from "next";
import { Mail, Clock, FileText } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Reveal } from "@/components/ui";
import { BotPlanForm } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with AgenticBots. One business day response, every time.",
  alternates: { canonical: "/contact" },
};

const FACTS = [
  { icon: Mail, t: "hello@agenticbots.dev", b: "The fastest way to reach a person." },
  { icon: Clock, t: "One business day", b: "Every enquiry gets a real reply, not an autoresponder." },
  { icon: FileText, t: "No call required", b: "You can get the full bot plan without ever booking a meeting." },
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
                <h1 className="display-hero text-balance">Talk to <span className="em-green">a person.</span></h1>
                <p className="body-lg mt-6 max-w-[44ch] text-pretty">
                  The form on the right is the fastest route — it gives us enough to come
                  back with something useful rather than a scheduling link.
                </p>

                <ul className="mt-10 space-y-6">
                  {FACTS.map((f) => {
                    const Icon = f.icon;
                    return (
                      <li key={f.t} className="flex gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center  rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--accent-text)]">
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
