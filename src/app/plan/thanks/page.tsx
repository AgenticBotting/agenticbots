import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Request received",
  description: "What to expect after submitting a BOT implementation proposal request.",
  alternates: { canonical: "/plan/thanks" },
  robots: { index: false, follow: false },
};

const NEXT = [
  { n: "01", t: "We read it", b: "We review your goals, team, tools and investment range." },
  { n: "02", t: "We map it", b: "We assess the starting workflow, responsibilities and connection requirements." },
  { n: "03", t: "You get the plan", b: "We follow up about fit, scope and next steps. Work begins only after agreement." },
];

export default function ThanksPage() {
  return (
    <>
      <Header />
      <main>
        <Container className="py-20 sm:py-28">
          <div className="max-w-[54ch]">
            <span className="flex h-11 w-11 items-center justify-center rounded-none bg-[var(--bg-tint)] border border-[var(--border-tint)] text-[var(--accent-text)]">
              <Check className="w-5 h-5" strokeWidth={2.5} />
            </span>
            <h1 className="display-hero mt-7 text-balance">Your request.<br /><span className="em-green">The next step.</span></h1>
            <p className="body-lg mt-5">
              After you submit a proposal request, our team reviews the brief and follows up by email. No payment is required to request a proposal.
            </p>
          </div>

          <ol className="mt-14 grid sm:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded-none overflow-hidden">
            {NEXT.map((s) => (
              <li key={s.n} className="bg-white p-7">
                <span className="text-[12px] text-[var(--accent-text)] mono">
                  {s.n}
                </span>
                <h2 className="display-md mt-3">{s.t}</h2>
                <p className="body-sm mt-2">{s.b}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-wrap gap-4">
            <ButtonLink href="/marketing" variant="outline">
              Browse the bots
              <ArrowRight className="w-4 h-4" />
            </ButtonLink>
            <Link
              href="/blog"
              className="btn btn-outline"
            >
              Read the blog
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
