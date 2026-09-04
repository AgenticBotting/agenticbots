import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Request received",
  description: "Your bot plan request is in the queue — here is what happens next.",
  robots: { index: false, follow: false },
};

const NEXT = [
  { n: "01", t: "We read it", b: "Every request is reviewed by a person, usually same day." },
  { n: "02", t: "We map it", b: "Your business gets matched against the thirteen bots and put in priority order." },
  { n: "03", t: "You get the plan", b: "Written, in your inbox, within one business day. Call optional." },
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
            <h1 className="display-hero mt-7 text-balance">Request <span className="em-green">received.</span></h1>
            <p className="body-lg mt-5">
              Your bot plan is in the queue. Here is exactly what happens next.
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
