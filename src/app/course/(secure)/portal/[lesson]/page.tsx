import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { ReadLesson } from "@/components/course/ReadLesson";
import { ALL_LESSONS, COURSE } from "@/lib/course";
import { LESSON_BODIES, hasBody } from "@/lib/course-content";

/**
 * Reading a lesson as a buyer.
 *
 * Separate from the public /course/[lesson] page on purpose: that one is
 * static and sells the course, this one checks entitlement and serves
 * the body. Trying to be both would make every marketing page dynamic.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PortalLessonPage({
  params,
}: {
  params: Promise<{ lesson: string }>;
}) {
  const { lesson: slug } = await params;
  const lesson = ALL_LESSONS.find((l) => l.slug === slug);
  if (!lesson) notFound();

  const index = ALL_LESSONS.findIndex((l) => l.slug === slug);
  const next = ALL_LESSONS[index + 1] ?? null;

  return (
    <>
      <Header />
      <main>
        <Container className="py-10 sm:py-14 max-w-[760px]">
          <Link href="/course/portal" className="body-xs hover:text-[var(--accent-text)]">
            ← All lessons
          </Link>

          <p className="eyebrow mt-6">
            {lesson.module} · {lesson.moduleTitle} <span className="eyebrow-dim">· {lesson.minutes} min</span>
          </p>
          <h1 className="display-xl mt-3 text-balance">{lesson.title}</h1>
          <p className="body-lg mt-3 text-pretty">{lesson.summary}</p>

          <div className="mt-8">
            <ReadLesson
              slug={lesson.slug}
              title={lesson.title}
              free={!!lesson.free}
              written={hasBody(lesson.slug)}
              blocks={LESSON_BODIES[lesson.slug] ?? []}
            />
          </div>

          {next && (
            <div className="mt-12 pt-6 border-t border-[var(--border)] flex items-baseline justify-between gap-4">
              <span className="body-xs">Next</span>
              <Link
                href={`/course/portal/${next.slug}`}
                className="text-[15px] font-semibold hover:text-[var(--accent-text)] text-right"
              >
                {next.title} →
              </Link>
            </div>
          )}

          <p className="body-xs mt-8">{COURSE.title}</p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
