import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout";
import { Container, Logo } from "@/components/ui";
import { BotPlanForm } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Get your bot plan",
  description:
    "Tell us what you sell and where it is getting stuck. We map which bots fix it and send the plan back within one business day — free, no call required.",
  alternates: { canonical: "/plan" },
};

const INCLUDED = [
  { t: "Where you are leaking", b: "The specific points between a lead arriving and a job closing where you are losing people." },
  { t: "Which bots fix it", b: "Named, in priority order, with what each one connects to in your existing stack." },
  { t: "What it is worth", b: "A rough number on what each fix is worth against your current volume — so you can judge the order." },
  { t: "What it takes", b: "Build time, what we need from you, and what it costs to run. No surprises later." },
];

export default function PlanPage() {
  return (
    <>
      {/* Minimal chrome — nothing competing with the form. */}
      <header className="border-b border-[var(--border)]">
        <Container>
          <div className="flex items-center justify-between h-[72px]">
            <Logo variant="dark" height={30} />
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[13.5px] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to site
            </Link>
          </div>
        </Container>
      </header>

      <main className="bg-[var(--bg-alt)]">
        <Container className="py-14 sm:py-20">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-start">
            <div>
              <p className="eyebrow mb-5">Free · one business day</p>
              <h1 className="display-hero text-balance">Get your <span className="em-green">bot plan.</span></h1>
              <p className="body-lg mt-6 max-w-[44ch] text-pretty">
                Five questions. We read every one, map your business against the thirteen
                bots, and send back a written plan. No call required to get it.
              </p>

              <ul className="mt-10 space-y-6">
                {INCLUDED.map((i) => (
                  <li key={i.t} className="flex gap-4">
                    <Check className="w-4.5 h-4.5 mt-1 shrink-0 text-[var(--accent-text)]" strokeWidth={2.5} />
                    <span>
                      <span className="block display-md">{i.t}</span>
                      <span className="block body-sm mt-1">{i.b}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="body-sm mt-10 pt-8 border-t border-[var(--border)] max-w-[44ch]">
                The plan is yours to keep. If you want to build it in-house, or hand it
                to someone else, that is a fine outcome.
              </p>
            </div>

            <BotPlanForm source="plan-page" className="bg-white" />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
