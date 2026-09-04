"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMask } from "@/components/ui";
import { ALL_CATEGORIES, categoryHref } from "@/lib/catalog";
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

export type ConveyorItem = {
  key: string;
  label: string;
  meta?: string;
  href?: string;
};

const CHIP =
  "group flex shrink-0 items-center gap-3 border border-[var(--border)] bg-white px-5 py-3.5 transition-colors";
const ICON =
  "text-ink-300 group-hover:text-accent-500 transition-colors duration-200";

function Chip({ item, hidden }: { item: ConveyorItem; hidden?: boolean }) {
  const body = (
    <>
      <LogoMask art="mark" height={22} className={ICON} />
      <span className="h-7 w-px shrink-0 bg-[var(--border)]" aria-hidden="true" />
      <span className="whitespace-nowrap">
        <span className="block text-[14.5px] font-semibold tracking-[-0.015em] leading-none">
          {item.label}
        </span>
        {item.meta && (
          <span className="mono text-[9.5px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
            {item.meta}
          </span>
        )}
      </span>
    </>
  );

  if (!item.href) {
    return (
      <span className={cn(CHIP, !item.meta && "py-4")} aria-hidden={hidden || undefined}>
        {body}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      className={cn(CHIP, "hover:border-ink-950")}
    >
      {body}
    </Link>
  );
}

function Belt({
  items,
  reverse,
  seconds,
}: {
  items: ConveyorItem[];
  reverse?: boolean;
  seconds: number;
}) {
  const run = (hidden: boolean) =>
    items.map((it) => <Chip key={`${hidden ? "dup" : "run"}-${it.key}`} item={it} hidden={hidden} />);

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

/** Shared shell: two belts, opposite directions, paused on hover/focus. */
function Conveyor({ items, speeds = [44, 52] }: { items: ConveyorItem[]; speeds?: [number, number] }) {
  const motionOk = useMotionOk();
  const top = items.filter((_, i) => i % 2 === 0);
  const bottom = items.filter((_, i) => i % 2 === 1);

  if (!motionOk) {
    return (
      <div className="flex flex-wrap gap-3">
        {items.map((it) => <Chip key={it.key} item={it} />)}
      </div>
    );
  }
  return (
    <div className="bot-conveyor space-y-3">
      <Belt items={top} seconds={speeds[0]} />
      <Belt items={bottom} seconds={speeds[1]} reverse />
    </div>
  );
}

function useMotionOk() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setOk(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return ok;
}

/**
 * The work itself, on a belt. Fed from a bot's real capability list, so a
 * PPC page shows PPC work and nothing else — the roster conveyor answers
 * "what do you sell", this one answers "what will it actually do".
 */
export function TaskConveyor({ tasks }: { tasks: string[] }) {
  return (
    <Conveyor
      items={tasks.map((t, i) => ({ key: `${i}-${t}`, label: t }))}
      speeds={[52, 61]}
    />
  );
}

export function BotConveyor() {
  return (
    <Conveyor
      items={ALL_CATEGORIES.map((c) => ({
        key: `${c.pillar}-${c.slug}`,
        label: c.botName,
        meta: c.name,
        href: categoryHref(c),
      }))}
    />
  );
}
