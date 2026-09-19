import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Play, FileCode, FileText, ListChecks } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd, breadcrumbLd } from "@/components/JsonLd";
import { Container, Reveal, SectionHeader, ButtonLink } from "@/components/ui";
import { FaqAccordion } from "@/components/marketing";
import { COURSE, MODULES, COURSE_STATS, FAQS } from "@/lib/course";

/**
 * The course landing page.
 *
 * A $49 product has to answer "what exactly do I get" faster than a
 * $4,500 one, so the curriculum is on the page in full — every lesson,
 * every runtime — and two lessons are readable before buying. Hiding the
 * syllabus is how a cheap product reads as a gamble.
 *
 * White throughout, per the house rule on lead-gen pages: the dark band
 * belongs to the header and footer.
 */

const PRICE = (COURSE.priceCents / 100).toFixed(0);

export const metadata: Metadata = {
  title: "Programmatic Google Ads with Claude Code",
  description:
    "Build, launch and run a Google Ads account from the terminal using the API and Claude Code. Written steps, working scripts, the repo to clone. $49.",
  alternates: { canonical: "/course" },
  openGraph: {
    title: "Programmatic Google Ads with Claude Code",
    description:
      "Run a Google Ads account from the terminal — built, launched and managed through the API.",
    type: "website",
  },
};

const ASSET_ICON = {
  video: Play,
  repo: FileCode,
  template: FileText,
  checklist: ListChecks,
} as const;

export default function CoursePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Course", path: "/course" },
          ]),
          faqLd(FAQS.map((f) => ({ q: f.q, a: f.a }))),
          {
            "@context": "https://schema.org",
            "@type": "Course",
            name: COURSE.title,
            description: COURSE.summary,
            provider: { "@type": "Organization", name: "AgenticBots", url: "https://agenticbots.dev" },
            offers: {
              "@type": "Offer",
              price: PRICE,
              priceCurrency: "USD",
              category: "Paid",
            },
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "Online",
              courseWorkload: `PT${Math.round(COURSE_STATS.minutes / 60)}H`,
            },
          },
        ]}
      />
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="border-b border-[var(--border)]">
          <Container className="py-14 sm:py-20">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-10 lg:gap-14 items-start">
              <Reveal>
                <p className="eyebrow">
                  Course · <span className="eyebrow-dim">{COURSE_STATS.lessons} lessons · {Math.round(COURSE_STATS.minutes / 60)} hours</span>
                </p>
                <h1 className="display-hero mt-4 max-w-[20ch] text-balance">
                  Run Google Ads <span className="em-green">from the terminal.</span>
                </h1>
                <p className="body-lg mt-5 max-w-[56ch] text-pretty">{COURSE.tagline}</p>
                <p className="body-base mt-4 max-w-[62ch] text-pretty">{COURSE.summary}</p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <ButtonLink href="/course/checkout" variant="primary">
                    Get the course — ${PRICE} <ArrowRight className="w-4 h-4" />
                  </ButtonLink>
                  <Link href="/course/why-the-api" className="btn btn-outline">
                    Read a lesson first
                  </Link>
                </div>
                <p className="body-xs mt-3">
                  One payment. Lifetime access, including updates when the API changes. 30-day refund.
                </p>
              </Reveal>

              {/* What you get, as a card rather than a bullet list — it is
                  the thing people scroll back up to check. */}
              <Reveal delay={0.08}>
                <aside className="border border-[var(--border)] bg-[var(--bg-alt)] p-6">
                  <p className="eyebrow">What you get</p>
                  <ul className="mt-4 space-y-2.5">
                    {[
                      `${COURSE_STATS.lessons} written lessons with copy-paste code`,
                      `${COURSE_STATS.videos} video walkthroughs`,
                      "The full repo — auth, build, report, guardrails",
                      "A Claude Code skill wired for Google Ads",
                      "Campaign templates, query cookbook, checklists",
                      "Updates when the API changes",
                    ].map((item) => (
                      <li key={item} className="flex gap-2.5 text-[14.5px] leading-snug">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--accent-text)]" strokeWidth={2.5} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 pt-5 border-t border-[var(--border-strong)] flex items-baseline gap-2">
                    <span className="text-[34px] font-semibold tracking-[-0.04em] leading-none">${PRICE}</span>
                    <span className="body-sm">one time</span>
                  </div>
                  <ButtonLink href="/course/checkout" variant="primary" className="mt-4 w-full justify-center">
                    Get the course
                  </ButtonLink>
                </aside>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ── What you will be able to do ──────────────────────── */}
        <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
          <Container className="section-pad-sm">
            <SectionHeader
              eyebrow="By the end"
              title="What you will have running"
              copy="Not concepts. Things that exist in your account when you finish."
            />
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[var(--border)] border border-[var(--border)]">
              {COURSE.outcomes.map((outcome, index) => (
                <div key={outcome} className="bg-[var(--background)] p-5">
                  <span className="mono text-[11px] text-[var(--accent-text)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[14px] leading-snug mt-2 text-pretty">{outcome}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── Curriculum ───────────────────────────────────────── */}
        <section className="border-b border-[var(--border)]">
          <Container className="section-pad-sm">
            <SectionHeader
              eyebrow={`Curriculum · ${COURSE_STATS.modules} modules`}
              title="Every lesson, listed"
              copy="Two are free to read before you buy."
            />

            <div className="mt-8 space-y-8">
              {MODULES.map((module) => (
                <Reveal key={module.number}>
                  <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-5 lg:gap-10">
                    <div className="lg:sticky lg:top-24 lg:self-start">
                      <span className="mono text-[11px] text-[var(--text-muted)]">{module.number}</span>
                      <h3 className="display-md mt-1">{module.title}</h3>
                      <p className="body-sm mt-2 text-pretty">{module.outcome}</p>
                    </div>

                    <ul className="border-t border-[var(--border)]">
                      {module.lessons.map((lesson) => (
                        <li
                          key={lesson.slug}
                          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3.5 border-b border-[var(--border)]"
                        >
                          <span className="flex-1 min-w-[260px]">
                            <span className="text-[15px] font-semibold tracking-[-0.015em]">
                              {lesson.free ? (
                                <Link href={`/course/${lesson.slug}`} className="hover:text-[var(--accent-text)]">
                                  {lesson.title}
                                </Link>
                              ) : (
                                lesson.title
                              )}
                            </span>
                            {lesson.free && (
                              <span className="ml-2 mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent-text)] border border-[var(--border-tint)] bg-[var(--bg-tint)] px-1.5 py-0.5">
                                Free
                              </span>
                            )}
                            <span className="block body-sm mt-0.5 text-pretty">{lesson.summary}</span>
                          </span>

                          <span className="flex items-center gap-2 shrink-0">
                            {lesson.assets?.map((asset) => {
                              const Icon = ASSET_ICON[asset.kind];
                              return (
                                <span
                                  key={asset.label}
                                  className="flex items-center gap-1 body-xs"
                                  title={asset.label}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  {asset.kind === "video" ? "video" : asset.kind}
                                </span>
                              );
                            })}
                            <span className="mono text-[11px] text-[var(--text-muted)] w-[42px] text-right">
                              {lesson.minutes}m
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* ── Who it is for, and who it is not ─────────────────── */}
        <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
          <Container className="section-pad-sm">
            <div className="grid lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
              <div className="bg-[var(--background)] p-6">
                <p className="eyebrow">Built for</p>
                <ul className="mt-4 space-y-2.5">
                  {COURSE.audience.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14.5px] leading-snug">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--accent-text)]" strokeWidth={2.5} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Saying who it is not for is what makes the rest credible. */}
              <div className="bg-[var(--background)] p-6">
                <p className="eyebrow">Not for</p>
                <ul className="mt-4 space-y-2.5">
                  {COURSE.notFor.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14.5px] leading-snug text-[var(--text-secondary)]">
                      <span className="mt-2 h-px w-3 shrink-0 bg-[var(--border-strong)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[var(--background)] p-6">
                <p className="eyebrow">You will need</p>
                <ul className="mt-4 space-y-2.5">
                  {COURSE.requirements.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14.5px] leading-snug">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-[var(--color-accent-500)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="border-b border-[var(--border)]">
          <Container className="section-pad-sm">
            <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-8 lg:gap-14">
              <SectionHeader eyebrow="Questions" title="The ones people ask" align="left" />
              <FaqAccordion items={FAQS.map((f) => ({ q: f.q, a: f.a }))} />
            </div>
          </Container>
        </section>

        {/* ── Close ────────────────────────────────────────────── */}
        <section>
          <Container className="section-pad-sm">
            <div className="mx-auto max-w-[640px] text-center">
              <h2 className="display-xl text-balance">
                Stop paying a retainer for <span className="em-green">work a script does.</span>
              </h2>
              <p className="body-base mt-4 text-pretty">
                {COURSE_STATS.lessons} lessons, {COURSE_STATS.videos} walkthroughs and the working repo.
                One payment of ${PRICE}, yours for good.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink href="/course/checkout" variant="primary">
                  Get the course — ${PRICE} <ArrowRight className="w-4 h-4" />
                </ButtonLink>
                <Link href="/course/why-the-api" className="btn btn-outline">Read a lesson first</Link>
              </div>
              <p className="body-xs mt-4">
                Already bought it? <Link href="/course/portal" className="underline hover:text-[var(--accent-text)]">Sign in</Link>
              </p>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}
