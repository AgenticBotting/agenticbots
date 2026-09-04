import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { Container, Reveal } from "@/components/ui";
import { BlogOptin } from "@/components/marketing";
import { SORTED_POSTS } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Plain writing on agentic marketing and sales — what works, what does not, and what the hype leaves out.",
  alternates: { canonical: "/blog" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function BlogIndexPage() {
  const [lead, ...rest] = SORTED_POSTS;

  return (
    <>
      <Header />
      <main>
        {/* Centered masthead */}
        <section className="border-b border-[var(--border)]">
          <Container className="py-16 sm:py-20">
            <div className="mx-auto max-w-[52ch] text-center">
              <p className="eyebrow mb-5">Writing</p>
              <h1 className="display-hero text-balance">
                No hype, <span className="em-green">no hedging.</span>
              </h1>
              <p className="body-lg mt-6 text-pretty">
                What we have actually seen work across marketing and sales automation,
                including the parts vendors leave out.
              </p>
            </div>
          </Container>
        </section>

        {/* Lead article */}
        {lead && (
          <section className="border-b border-[var(--border)]">
            <Container className="py-14">
              <Reveal>
                <Link href={`/blog/${lead.slug}`} className="group block mx-auto max-w-[720px] text-center">
                  <span className="flex items-center justify-center gap-3 mb-5">
                    <span className="chip">{lead.category}</span>
                    <span className="body-xs">
                      {formatDate(lead.date)} · {lead.readMinutes} min read
                    </span>
                  </span>
                  <h2 className="display-xl text-balance group-hover:text-[var(--accent-text)] transition-colors">
                    {lead.title}
                  </h2>
                  <p className="body-lg mt-5 text-pretty">{lead.excerpt}</p>
                  <span className="mt-7 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--accent-text)]">
                    Read it
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </Reveal>
            </Container>
          </section>
        )}

        {/* The rest, centered list */}
        {rest.length > 0 && (
          <section className="section-pad-sm border-b border-[var(--border)]">
            <Container>
              <ul className="mx-auto max-w-[720px] border-t border-[var(--border)]">
                {rest.map((p, i) => (
                  <Reveal key={p.slug} delay={Math.min(i, 5) * 0.05}>
                    <li className="border-b border-[var(--border)]">
                      <Link href={`/blog/${p.slug}`} className="group block py-9 text-center">
                        <span className="flex items-center justify-center gap-3 mb-3">
                          <span className="chip">{p.category}</span>
                          <span className="body-xs">
                            {formatDate(p.date)} · {p.readMinutes} min read
                          </span>
                        </span>
                        <span className="block display-lg text-balance group-hover:text-[var(--accent-text)] transition-colors">
                          {p.title}
                        </span>
                        <span className="block body-base mt-3 mx-auto max-w-[60ch]">{p.excerpt}</span>
                      </Link>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </Container>
          </section>
        )}

        {/* Centered lead gen */}
        <section className="section-pad">
          <Container>
            <BlogOptin source="blog-index" className="mx-auto max-w-[820px]" />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
