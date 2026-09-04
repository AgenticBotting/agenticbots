"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BotFace } from "@/components/ui";
import { ALL_CATEGORIES, categoryHref, type Category } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * The roster as a conveyor: two belts of bots drifting in opposite
 * directions, which is the fleet idea stated in one glance instead of
 * 1,100px of scrolling list.
 *
 * The two obvious failure modes are designed out:
 *   · a moving target is hard to click — both belts stop on hover and on
 *     keyboard focus, so anything you reach for holds still;
 *   · motion can read decorative — every item is a real link with a hover
 *     state, and the section still ends on the two pillar pages.
 *
 * The belt is the list rendered twice and translated by exactly -50%, so
 * the loop is seamless. The second copy is inert to assistive tech and to
 * the tab order — it is the same thirteen links, not twenty-six.
 */

function Belt({
  bots,
  reverse,
  seconds,
}: {
  bots: Category[];
  reverse?: boolean;
  seconds: number;
}) {
  const run = (hidden: boolean) =>
    bots.map((c) => (
      <Link
        key={`${hidden ? "dup" : "run"}-${c.pillar}-${c.slug}`}
        href={categoryHref(c)}
        tabIndex={hidden ? -1 : undefined}
        aria-hidden={hidden || undefined}
        className="group flex shrink-0 items-center gap-3 border border-[var(--border)] bg-white px-5 py-3.5 hover:border-ink-950 transition-colors"
      >
        <BotFace className="w-6 h-[7px] shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] transition-colors" />
        <span className="whitespace-nowrap">
          <span className="block text-[14.5px] font-semibold tracking-[-0.015em] leading-none">
            {c.botName}
          </span>
          <span className="mono text-[9.5px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
            {c.name}
          </span>
        </span>
      </Link>
    ));

  return (
    <div
      className={cn("bot-belt flex w-max gap-3", reverse && "bot-belt-reverse")}
      style={{ animationDuration: `${seconds}s` }}
    >
      {run(false)}
      {run(true)}
    </div>
  );
}

export function BotConveyor() {
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionOk(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* Split so the two belts are not the same thirteen in the same order. */
  const top = ALL_CATEGORIES.filter((_, i) => i % 2 === 0);
  const bottom = ALL_CATEGORIES.filter((_, i) => i % 2 === 1);

  if (!motionOk) {
    return (
      <div className="flex flex-wrap gap-3">
        {ALL_CATEGORIES.map((c) => (
          <Link
            key={`${c.pillar}-${c.slug}`}
            href={categoryHref(c)}
            className="group flex items-center gap-3 border border-[var(--border)] bg-white px-5 py-3.5 hover:border-ink-950 transition-colors"
          >
            <BotFace className="w-6 h-[7px] shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] transition-colors" />
            <span>
              <span className="block text-[14.5px] font-semibold tracking-[-0.015em] leading-none">
                {c.botName}
              </span>
              <span className="mono text-[9.5px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
                {c.name}
              </span>
            </span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="bot-conveyor space-y-3">
      <Belt bots={top} seconds={44} />
      <Belt bots={bottom} seconds={52} reverse />
    </div>
  );
}
