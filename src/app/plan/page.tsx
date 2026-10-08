import { HeroHeading } from "@/components/ui/HeroHeading";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/layout";
import { Container, Logo } from "@/components/ui";
import { AuditForm } from "@/components/marketing";
import { PROPOSAL_OFFER } from "@/config/marketing-offer";

export const metadata: Metadata = {
  title: "Request a BOT implementation proposal",
  description:
    "Request a BOT implementation proposal around your goals, tools, team, budget and timeline. No payment required.",
  alternates: { canonical: "/plan" },
};

const INCLUDED = [
  { t: "The operating constraint", b: "The point in the customer or commercial workflow that deserves executive attention." },
  { t: "The recommended mandate", b: "The service scope and BOT configuration that provide the strongest defensible starting point." },
  { t: "The control requirements", b: "The systems, data, authority and approvals that must be defined before implementation." },
  { t: "The next decision", b: "The discovery steps required for a proposal to confirm implementation timing and commercial scope." },
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
              <p className="eyebrow mb-5">{PROPOSAL_OFFER.name}</p>
              <HeroHeading text="Define the first" accent="BOT mandate." />
              <p className="body-lg mt-6 max-w-[44ch] text-pretty">
                Share your goals, current tools, team and investment range in a short guided intake. We review fit, then follow up about scope and the next step.
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
                No payment is required to submit a proposal request. Implementation begins only after scope, timing and commercial terms are agreed.
              </p>
            </div>

            <AuditForm source="plan-page" className="bg-white" />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
