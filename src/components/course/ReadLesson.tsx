"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import { LockedNotice } from "./Portal";
import { Prose } from "./Prose";
import type { Block } from "@/lib/course-content";

/**
 * Decides what a buyer sees on a lesson page inside the portal.
 *
 * Entitlement is checked against Convex before any body renders. The
 * public /course/[lesson] page never mounts this — it is static and
 * ships only free bodies — so a locked lesson's content is not sitting
 * in a marketing page's source for someone to read with devtools open.
 *
 * A lesson that has not been written yet says so, for buyers too. The
 * curriculum sells the whole thing, so silence on an empty page reads as
 * something broken.
 */
export function ReadLesson({
  slug,
  title,
  free,
  written,
  blocks,
}: {
  slug: string;
  title: string;
  free: boolean;
  written: boolean;
  blocks: Block[];
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const access = useQuery(api.course.lesson, free ? "skip" : isAuthenticated ? { slug, free } : "skip");

  if (free) {
    return written ? <Prose blocks={blocks} /> : <BeingWritten />;
  }

  if (isLoading || (isAuthenticated && access === undefined)) {
    return <p className="meta py-8">Checking your access…</p>;
  }

  if (!isAuthenticated || access?.locked) {
    return <LockedNotice title={title} />;
  }

  // Access confirmed by the server. Bodies for paid lessons are served
  // from Convex once they are written; until then this is the honest
  // state a buyer sees.
  return written ? <Prose blocks={blocks} /> : <BeingWritten />;
}

function BeingWritten() {
  return (
    <div className="border border-[var(--border)] bg-[var(--bg-alt)] p-7">
      <p className="eyebrow">Being written</p>
      <p className="body-base mt-3 max-w-[54ch] text-pretty">
        This lesson is still being recorded. Everyone who owns the course gets an email as each
        one lands — no extra charge, ever, including when the API changes and lessons get
        rewritten.
      </p>
    </div>
  );
}
