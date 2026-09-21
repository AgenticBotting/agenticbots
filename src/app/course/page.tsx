import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Play, FileCode, FileText, ListChecks, X } from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { JsonLd, faqLd, breadcrumbLd } from "@/components/JsonLd";
import { Container, Reveal, SectionHeader, ButtonLink } from "@/components/ui";
import { FaqAccordion } from "@/components/marketing";
import { TerminalDemo } from "@/components/course/TerminalDemo";
import { CourseHero } from "@/components/course/CourseHero";
import { ZRow } from "@/components/course/ZRow";
import { CostChart, ConfigScene, ReportScene, GuardrailScene, RepoScene } from "@/components/course/CourseArt";
import { BuyBar } from "@/components/course/BuyBar";
import { Prose } from "@/components/course/Prose";
import { COURSE, MODULES, COURSE_STATS, FAQS } from "@/lib/course";
import { LESSON_BODIES } from "@/lib/course-content";

/**
 * The course sales page.
 *
 * Structured the way a course page has to be — hook, proof, stakes, the
 * offer, objections, close, with the buy button never more than a thumb
 * away — but with two rules most pages in this genre break:
 *
 *  1. No invented proof. There are no testimonials because there are no
 *     students yet, and saying that plainly beats a wall of stock-photo
 *     quotes nobody believes. What stands in for social proof is the
 *     product: the full syllabus, a real terminal session, and an entire
 *     lesson printed on the page.
 *  2. No manufactured scarcity. No countdown, no "3 seats left" on a
 *     digital file. The only urgency claimed is the launch price, and
 *     that one is true.
 *
 * White throughout, per the house rule on lead-gen pages: the dark bands
 * belong to the header, the footer and the terminal.
 */

const PRICE = (COURSE.priceCents / 100).toFixed(0);

export const metadata: Metadata = {
  title: "Programmatic Google Ads with Claude Code",
  description:
    "Build, launch and run a Google Ads account from the terminal using the API and Claude Code. 17 lessons, the working repo, lifetime updates. $49.",
  alternates: { canonical: "/course" },
  openGraph: {
    title: "Programmatic Google Ads with Claude Code",
    description: "Run a Google Ads account from the terminal — built, launched and managed through the API.",
    type: "website",
  },
};

const ASSET_ICON = { video: Play, repo: FileCode, template: FileText, checklist: ListChecks } as const;

/** The offer, itemised. */
const INCLUDED = [
  { thing: `${COURSE_STATS.lessons} written lessons with copy-paste code`, detail: "Every command, every gotcha, in Node and Python" },
  { thing: `${COURSE_STATS.videos} video walkthroughs`, detail: "The steps where watching beats reading" },
  { thing: "The complete repo", detail: "auth · build · report · daily · guardrails" },
  { thing: "A Claude Code skill for Google Ads", detail: "Account context and the commands it is allowed to run" },
  { thing: "Campaign templates and a query cookbook", detail: "The GAQL you would otherwise spend a week finding" },
  { thing: "Application and pre-launch checklists", detail: "Including the token application wording that gets approved" },
  { thing: "Updates when the API changes", detail: "Lessons get rewritten; you pay nothing again" },
];

export default function CoursePage() {
  const sampleLesson = LESSON_BODIES["developer-token"]?.slice(0, 6) ?? [];

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
            offers: { "@type": "Offer", price: PRICE, priceCurrency: "USD", category: "Paid" },
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
        <CourseHero
          price={PRICE}
          lessons={COURSE_STATS.lessons}
          hours={Math.round(COURSE_STATS.minutes / 60)}
        />

        {/* ── The Z ───────────────────────────────────────────────
            Four bands, each one a module's artefact and the argument
            for it, sides alternating, every one ending in a link. */}

        <ZRow
          tint
          eyebrow="The maths"
          title={<>What this work costs you <span className="em-green">right now</span></>}
          body="The daily review is the job, and it is the part everyone outsources. These are the going rates for having somebody else do it — and what it costs to own the thing that does it instead."
          points={[
            "Pays for itself the first time it catches a wasted search term",
            "The session on this page found $63 of waste in one day",
            "No retainer, no notice period, no monthly invoice",
          ]}
          art={<CostChart />}
          cta={{ href: "/course/checkout", label: `Get it for $${PRICE}` }}
        />

        <ZRow
          flip
          eyebrow="Module 02"
          title={<>Your account, as a file you can <span className="em-green">version control</span></>}
          body="Describe the campaign once — budget, locations, ad groups, keywords, ads — and build it with one command. Change the file, run it again, and the account follows. Delete a keyword in a diff instead of hunting for it in the interface."
          points={[
            "Batched creates, with a validate-only run that spends nothing",
            "Naming conventions that make the later automation possible",
            "Rebuild the same structure across thirty accounts in a loop",
          ]}
          art={<ConfigScene />}
          cta={{ href: "/course/developer-token", label: "Read a lesson free", quiet: true }}
        />

        <ZRow
          tint
          eyebrow="Module 03"
          title={<>Yesterday, explained <span className="em-green">before you open the laptop</span></>}
          body="Spend, calls, cost per call and what actually changed — written in plain English by Claude Code, not assembled by you from four dashboard tabs. It arrives at six in the morning whether you remember to ask for it or not."
          points={[
            "GAQL queries that return the numbers that mean something",
            "Offline conversion imports, so it optimises to booked work",
            "One email, no dashboard to log into",
          ]}
          art={<ReportScene />}
          cta={{ href: "/course/checkout", label: `Get the course — $${PRICE}` }}
        />

        <ZRow
          eyebrow="Module 04"
          title={<>The daily review, done <span className="em-green">whether you do it or not</span></>}
          body="Claude Code reads every search term from yesterday, tells you which ones are waste and why, and applies the negatives. Budget follows what converts. Ad variants test continuously. This is the retainer, replaced."
          points={[
            "Search-term review with the reasoning attached, every morning",
            "Budget moved between campaigns inside limits you set",
            "New ad variants tested against your current best",
          ]}
          art={<TerminalDemo />}
          cta={{ href: "/course/checkout", label: `Get the course — $${PRICE}` }}
        />

        <ZRow
          flip
          eyebrow="Module 05"
          title={<>Guardrails, so you can actually <span className="em-green">leave it running</span></>}
          body="Limits live in your code, not in a prompt — that distinction is the whole difference between automation you trust and automation you babysit. Safe changes apply themselves; anything expensive queues for a thirty-second review."
          points={[
            "Hard caps an agent cannot cross, whatever it decides",
            "An approval queue for the changes that should need a human",
            "Every action logged with its reasoning, reviewable later",
          ]}
          art={<GuardrailScene />}
          cta={{ href: "/course/checkout", label: "Start building today" }}
        />

        {/* ── Outcome ─────────────────────────────────────────── */}
        <section className="border-b border-[var(--border)]">
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

        {/* ── Curriculum ──────────────────────────────────────── */}
        <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
          <Container className="section-pad-sm">
            <SectionHeader
              eyebrow={`Curriculum · ${COURSE_STATS.modules} modules · ${COURSE_STATS.lessons} lessons`}
              title="Every lesson, in the open"
              copy="No mystery bonuses, no locked syllabus. Two are free to read right now."
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

                    <ul className="border-t border-[var(--border)] bg-[var(--background)]">
                      {module.lessons.map((lesson) => (
                        <li
                          key={lesson.slug}
                          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3.5 border-b border-[var(--border)]"
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
                              <Link
                                href={`/course/${lesson.slug}`}
                                className="ml-2 mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent-text)] border border-[var(--border-tint)] bg-[var(--bg-tint)] px-1.5 py-0.5 hover:bg-[var(--color-accent-100)]"
                              >
                                Read free
                              </Link>
                            )}
                            <span className="block body-sm mt-0.5 text-pretty">{lesson.summary}</span>
                          </span>

                          <span className="flex items-center gap-2 shrink-0">
                            {lesson.assets?.map((asset) => {
                              const Icon = ASSET_ICON[asset.kind];
                              return (
                                <span key={asset.label} className="flex items-center gap-1 body-xs" title={asset.label}>
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

        {/* ── Show the goods ──────────────────────────────────── */}
        <section className="border-b border-[var(--border)]">
          <Container className="section-pad-sm">
            <SectionHeader
              eyebrow="A sample, not a summary"
              title="This is what a lesson reads like"
              copy="The opening of lesson two, printed in full. Judge the writing before you pay for it."
            />
            <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_280px] gap-8 lg:gap-12">
              <div className="border border-[var(--border)] p-6 sm:p-8">
                <p className="eyebrow">02 · Developer token, OAuth and the test account</p>
                <div className="mt-5">
                  <Prose blocks={sampleLesson} />
                </div>
                <div className="mt-6 pt-5 border-t border-[var(--border)] flex flex-wrap items-center gap-3">
                  <Link href="/course/developer-token" className="btn btn-outline btn-sm">
                    Read this one in full — free
                  </Link>
                  <span className="body-xs">No email required.</span>
                </div>
              </div>

              <aside className="lg:sticky lg:top-24 lg:self-start">
                <p className="eyebrow">Why it is written this way</p>
                <p className="body-sm mt-3 text-pretty">
                  Every lesson gives you the exact command, the exact wording, and the specific
                  thing that will go wrong. This one includes the application text that gets
                  approved, and the OAuth setting that silently kills your refresh token after
                  seven days.
                </p>
                <p className="body-sm mt-3 text-pretty">
                  That second one costs most people an afternoon, debugging an error message that
                  says nothing about the cause.
                </p>
              </aside>
            </div>
          </Container>
        </section>

        {/* ── The offer ───────────────────────────────────────── */}
        <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
          <Container className="section-pad-sm">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-14 items-start">
              <div>
                <SectionHeader eyebrow="Everything included" title={`What $${PRICE} buys`} align="left" />
                <div className="mt-6">
                  <RepoScene />
                </div>
                <ul className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
                  {INCLUDED.map((item) => (
                    <li key={item.thing} className="flex gap-3 py-3.5">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-[var(--accent-text)]" strokeWidth={2.5} />
                      <span>
                        <span className="block text-[15px] font-semibold tracking-[-0.015em]">{item.thing}</span>
                        <span className="block body-sm mt-0.5">{item.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="border border-[var(--border-strong)] bg-[var(--background)] p-6 lg:sticky lg:top-24">
                <p className="eyebrow">Launch price</p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-[42px] font-semibold tracking-[-0.045em] leading-none">${PRICE}</span>
                  <span className="body-sm">one time</span>
                </p>
                <p className="body-sm mt-3 text-pretty">
                  It goes up once every video walkthrough is recorded. Buy now and those arrive
                  free — that is what lifetime access means here.
                </p>
                <ButtonLink href="/course/checkout" variant="primary" className="mt-5 w-full justify-center">
                  Get the course <ArrowRight className="w-4 h-4" />
                </ButtonLink>

                <div className="mt-5 pt-5 border-t border-[var(--border)]">
                  <p className="text-[14px] font-semibold">30-day refund</p>
                  <p className="body-sm mt-1 text-pretty">
                    Email inside 30 days and we send it back. No form, no &quot;what did you not
                    like&quot;, no keeping a processing fee.
                  </p>
                </div>
              </aside>
            </div>
          </Container>
        </section>

        {/* ── Qualify ─────────────────────────────────────────── */}
        <section className="border-b border-[var(--border)]">
          <Container className="section-pad-sm">
            <SectionHeader
              eyebrow="Honestly"
              title="Who should not buy this"
              copy="A $49 course should tell you when to keep your money."
            />
            <div className="mt-8 grid lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
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
              <div className="bg-[var(--background)] p-6">
                <p className="eyebrow">Not for</p>
                <ul className="mt-4 space-y-2.5">
                  {COURSE.notFor.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14.5px] leading-snug text-[var(--text-secondary)]">
                      <X className="w-4 h-4 mt-0.5 shrink-0 text-[var(--text-muted)]" strokeWidth={2.5} />
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

        {/* ── Who made it ─────────────────────────────────────── */}
        <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
          <Container className="section-pad-sm">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:gap-14 items-start">
              <div>
                <p className="eyebrow">Who is teaching this</p>
                <h2 className="display-xl mt-3 max-w-[22ch] text-balance">
                  We run these scripts on our own accounts, every morning.
                </h2>
                <p className="body-base mt-4 max-w-[62ch] text-pretty">
                  AgenticBots builds and runs agentic marketing and sales systems for businesses —
                  the same bots, the same guardrails, the same audit log. The Google Ads half of
                  that work is what this course is: not a theory of automation, but the scripts
                  that run against live accounts with real budgets on them.
                </p>
                <p className="body-base mt-3 max-w-[62ch] text-pretty">
                  Nothing here is aspirational. Every lesson is something already in production,
                  written down in the order you would need to build it yourself.
                </p>
                <Link href="/about" className="btn btn-outline mt-5">About AgenticBots</Link>
              </div>

              {/* No testimonials — and saying so beats faking them. */}
              <aside className="border border-[var(--border)] bg-[var(--background)] p-6">
                <p className="eyebrow">No testimonials yet</p>
                <p className="body-sm mt-3 text-pretty">
                  This is a new course, so there are no student quotes on this page. There will
                  not be invented ones either.
                </p>
                <p className="body-sm mt-3 text-pretty">
                  What is here instead: the complete syllabus, a real terminal session, and a
                  whole lesson to read before you pay. Judge it on that.
                </p>
              </aside>
            </div>
          </Container>
        </section>

        {/* ── Objections ──────────────────────────────────────── */}
        <section className="border-b border-[var(--border)]">
          <Container className="section-pad-sm">
            <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-8 lg:gap-14">
              <SectionHeader eyebrow="Questions" title="Before you buy" align="left" />
              <FaqAccordion items={FAQS.map((f) => ({ q: f.q, a: f.a }))} />
            </div>
          </Container>
        </section>

        {/* ── Close ───────────────────────────────────────────── */}
        <section>
          <Container className="section-pad-sm">
            <div id="buy-closer" className="mx-auto max-w-[660px] text-center">
              <h2 className="display-xl text-balance">
                One afternoon of setup. <span className="em-green">Then it runs every day.</span>
              </h2>
              <p className="body-base mt-4 text-pretty">
                {COURSE_STATS.lessons} lessons, {COURSE_STATS.videos} walkthroughs, the working
                repo and every update. One payment of ${PRICE}, yours for good, refundable for
                thirty days.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink href="/course/checkout" variant="primary">
                  Get the course — ${PRICE} <ArrowRight className="w-4 h-4" />
                </ButtonLink>
                <Link href="/course/why-the-api" className="btn btn-outline">Read lesson one free</Link>
              </div>
              <p className="body-xs mt-4">
                Already bought it?{" "}
                <Link href="/course/portal" className="underline hover:text-[var(--accent-text)]">Sign in</Link>
              </p>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
      <BuyBar price={PRICE} />
    </>
  );
}
