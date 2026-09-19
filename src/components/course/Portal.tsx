"use client";

import Link from "next/link";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@convex/_generated/api";
import { MODULES, COURSE_STATS, COURSE } from "@/lib/course";
import { CourseSignIn } from "./CourseSignIn";
import { Check, Lock, Play, FileCode, FileText, ListChecks, ArrowRight } from "lucide-react";

/**
 * The course portal.
 *
 * Three states, and it says which one you are in rather than making you
 * guess: signed out, signed in without a purchase, and signed in with
 * access. The middle one is the one most portals handle badly — a person
 * who paid with a different email needs to be told that, not shown an
 * empty page.
 *
 * Progress is per lesson and stored server-side, so it follows someone
 * from their laptop to the machine they are actually building on.
 */

const ASSET_ICON = { video: Play, repo: FileCode, template: FileText, checklist: ListChecks } as const;

export function Portal() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const access = useQuery(api.course.access, isAuthenticated ? {} : "skip");
  const markComplete = useMutation(api.course.markComplete);
  const { signOut } = useAuthActions();

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <span className="inline-block h-6 w-6 border-2 border-[var(--border-strong)] border-t-[var(--color-accent-500)] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[400px] py-6">
        <CourseSignIn />
      </div>
    );
  }

  if (!access) {
    return <p className="meta py-20 text-center">Loading your course…</p>;
  }

  /* Signed in, but nothing bought on this account. */
  if (!access.hasAccess) {
    return (
      <div className="mx-auto max-w-[520px] py-10 text-center">
        <h1 className="display-xl">No course on this account</h1>
        <p className="body-base mt-3 text-pretty">
          You are signed in as <strong>{access.email}</strong>, and there is no purchase attached
          to it. If you bought the course with a different email, sign in with that one — access
          follows the email you paid with.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/course/checkout" className="btn btn-primary">
            Get the course — ${(COURSE.priceCents / 100).toFixed(0)}
          </Link>
          <button className="btn btn-outline" onClick={() => void signOut()}>
            Sign in as someone else
          </button>
        </div>
      </div>
    );
  }

  const completed = new Set(access.completed);
  const done = completed.size;
  const percent = Math.round((done / COURSE_STATS.lessons) * 100);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your course</p>
          <h1 className="display-xl mt-2 max-w-[22ch] text-balance">{COURSE.title}</h1>
          <p className="body-sm mt-2">
            {done} of {COURSE_STATS.lessons} lessons done
            {access.isStaff && " · staff view"}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => void signOut()}>Sign out</button>
      </div>

      {/* Progress as one segment per lesson: at a glance it is obvious
          how much is left, without a percentage doing the talking. */}
      <div className="flex gap-0.5 mt-5" aria-label={`${percent}% complete`}>
        {Array.from({ length: COURSE_STATS.lessons }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1"
            style={{ background: i < done ? "var(--color-accent-500)" : "var(--bg-sunk, #F1F4EF)" }}
          />
        ))}
      </div>

      <div className="mt-10 space-y-10">
        {MODULES.map((module) => (
          <section key={module.number}>
            <div className="flex items-baseline gap-3">
              <span className="mono text-[11px] text-[var(--text-muted)]">{module.number}</span>
              <h2 className="display-lg">{module.title}</h2>
            </div>
            <p className="body-sm mt-1.5">{module.outcome}</p>

            <ul className="mt-4 border-t border-[var(--border)]">
              {module.lessons.map((lesson) => {
                const isDone = completed.has(lesson.slug);
                return (
                  <li
                    key={lesson.slug}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 border-b border-[var(--border)]"
                  >
                    <button
                      onClick={() => void markComplete({ lesson: lesson.slug, done: !isDone })}
                      className={`h-5 w-5 shrink-0 border grid place-items-center transition-colors ${
                        isDone
                          ? "bg-[var(--color-accent-500)] border-[var(--color-accent-700)]"
                          : "border-[var(--border-strong)] hover:border-[var(--color-accent-500)]"
                      }`}
                      aria-label={isDone ? `Mark "${lesson.title}" not done` : `Mark "${lesson.title}" done`}
                    >
                      {isDone && <Check className="w-3 h-3 text-[var(--color-ink-950)]" strokeWidth={3} />}
                    </button>

                    <Link href={`/course/portal/${lesson.slug}`} className="flex-1 min-w-[240px] group">
                      <span className={`text-[15px] font-semibold tracking-[-0.015em] group-hover:text-[var(--accent-text)] ${isDone ? "text-[var(--text-muted)]" : ""}`}>
                        {lesson.title}
                      </span>
                      <span className="block body-sm mt-0.5">{lesson.summary}</span>
                    </Link>

                    <span className="flex items-center gap-2.5 shrink-0">
                      {lesson.assets?.map((asset) => {
                        const Icon = ASSET_ICON[asset.kind];
                        return (
                          <span key={asset.label} className="flex items-center gap-1 body-xs" title={asset.label}>
                            <Icon className="w-3.5 h-3.5" />
                            {asset.kind}
                          </span>
                        );
                      })}
                      <span className="mono text-[11px] text-[var(--text-muted)] w-[38px] text-right">
                        {lesson.minutes}m
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Downloads live with the lessons that use them, but the repo is
          the thing people come back for, so it gets its own row. */}
      <section className="mt-12 border border-[var(--border)] bg-[var(--bg-alt)] p-6">
        <p className="eyebrow">The repo</p>
        <h2 className="display-md mt-2">Everything, ready to clone</h2>
        <p className="body-sm mt-2 max-w-[60ch]">
          Auth, the campaign builder, the reporting scripts, the Claude Code skill and the
          guardrails — the same code the lessons build, in one place. Updated when the API
          changes.
        </p>
        <Link href="/course/repo" className="btn btn-outline mt-4">
          Get the repo <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </>
  );
}

/** Shown on a locked lesson page. */
export function LockedNotice({ title }: { title: string }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--bg-alt)] p-8 text-center">
      <span className="mx-auto mb-4 grid h-10 w-10 place-items-center border border-[var(--border-strong)]">
        <Lock className="w-4 h-4 text-[var(--text-muted)]" />
      </span>
      <h2 className="display-md">{title} is part of the course</h2>
      <p className="body-sm mt-2 max-w-[44ch] mx-auto">
        Two lessons are free to read. The rest come with the course — one payment, lifetime
        access, including updates when the API changes.
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
