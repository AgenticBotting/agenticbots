import Link from "next/link";
import { Lock } from "lucide-react";
import { COURSE } from "@/lib/course";
import { Prose } from "./Prose";
import type { Block } from "@/lib/course-content";

/**
 * The public view of a lesson.
 *
 * A server component with no client JavaScript: free lessons render
 * their blocks, paid ones render a buy panel and nothing else. There is
 * no gate to defeat here because the content was never sent.
 */
export function LessonPreview({
  title,
  free,
  written,
  blocks,
}: {
  title: string;
  free: boolean;
  written: boolean;
  blocks: Block[];
}) {
  if (free) {
    return written ? (
      <Prose blocks={blocks} />
    ) : (
      <p className="body-base">This preview is being written. Check back shortly.</p>
    );
  }

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-alt)] p-8 text-center">
      <span className="mx-auto mb-4 grid h-10 w-10 place-items-center border border-[var(--border-strong)]">
        <Lock className="w-4 h-4 text-[var(--text-muted)]" />
      </span>
      <h2 className="display-md">{title} is part of the course</h2>
      <p className="body-sm mt-2 max-w-[46ch] mx-auto">
        Two lessons are free to read in full. The rest come with the course — one payment,
        lifetime access, including updates when the API changes.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/course/checkout" className="btn btn-primary">
          Get the course — ${(COURSE.priceCents / 100).toFixed(0)}
        </Link>
        <Link href="/course/portal" className="btn btn-outline">I already bought it</Link>
      </div>
    </div>
  );
}
