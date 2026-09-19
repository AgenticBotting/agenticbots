import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Container } from "@/components/ui";
import { LessonPreview } from "@/components/course/LessonPreview";
import { ALL_LESSONS, COURSE } from "@/lib/course";
import { LESSON_BODIES, hasBody } from "@/lib/course-content";

/**
 * One lesson.
 *
 * This page is static and public. Free lessons render in full — they are
 * the best advertisement the course has, and someone who reads one and
 * finds it useful is most of the way to buying.
 *
 * A paid lesson shows its summary and a buy panel, and its body is not in
 * this page at all. Buyers read the real thing at /course/portal/<slug>,
 * where entitlement is checked server-side. Keeping the two apart is what
 * lets every marketing page stay static.
 */

export function generateStaticParams() {
  return ALL_LESSONS.map((lesson) => ({ lesson: lesson.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lesson: string }>;
}): Promise<Metadata> {
  const { lesson: slug } = await params;
  const lesson = ALL_LESSONS.find((l) => l.slug === slug);
  if (!lesson) return {};

  return {
    // The root layout already appends "| AgenticBots"; adding the course
    // name here too pushed every lesson title past the 70-char gate.
    title: lesson.title,
    description: lesson.summary,
    alternates: { canonical: `/course/${lesson.slug}` },
    // Only the free previews should be in the index; a locked page ranks
    // on its own title and disappoints whoever clicks it.
    robots: lesson.free ? undefined : { index: false, follow: true },
  };
}

export default async function LessonPage({ params }: { params: Promise<{ lesson: string }> }) {
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
          <Link href="/course" className="body-xs hover:text-[var(--accent-text)]">
            ← {COURSE.title}
          </Link>

          <p className="eyebrow mt-6">
            {lesson.module} · {lesson.moduleTitle} <span className="eyebrow-dim">· {lesson.minutes} min</span>
          </p>
          <h1 className="display-xl mt-3 text-balance">{lesson.title}</h1>
          <p className="body-lg mt-3 text-pretty">{lesson.summary}</p>

          <div className="mt-8">
            <LessonPreview
              title={lesson.title}
              free={!!lesson.free}
              written={hasBody(lesson.slug)}
              blocks={lesson.free ? LESSON_BODIES[lesson.slug] ?? [] : []}
            />
          </div>

          {next && (
            <div className="mt-12 pt-6 border-t border-[var(--border)] flex items-baseline justify-between gap-4">
              <span className="body-xs">Next</span>
              <Link href={`/course/${next.slug}`} className="text-[15px] font-semibold hover:text-[var(--accent-text)] text-right">
                {next.title} →
              </Link>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
