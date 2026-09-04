"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BotIndex } from "@/components/ui";
import { ALL_CATEGORIES, categoryHref } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/**
 * The roster, one bot at a time.
 *
 * Thirteen identical cards in a grid was noise — the eye had nowhere to
 * land. This pins a detail panel on the left while the list scrolls past
 * on the right; whichever row is nearest the middle of the viewport drives
 * the panel.
 *
 * No scroll-jacking: the page scrolls at its normal rate, an
 * IntersectionObserver just reports which row is centred. On mobile the
 * panel is dropped and the rows are plain links.
 */
export function BotScrollList() {
  const [active, setActive] = useState(0);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const rows = rowRefs.current.filter(Boolean) as HTMLLIElement[];
    if (!rows.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Pick whichever intersecting row sits closest to the middle.
        const mid = window.innerHeight / 2;
        let best = -1;
        let bestDist = Infinity;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const r = e.boundingClientRect;
          const d = Math.abs(r.top + r.height / 2 - mid);
          if (d < bestDist) {
            bestDist = d;
            best = rows.indexOf(e.target as HTMLLIElement);
          }
        }
        if (best >= 0) setActive(best);
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
    );

    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  const current = ALL_CATEGORIES[active];

  return (
    <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-20">
      {/* Pinned detail */}
      <div className="hidden lg:block">
        <div className="sticky top-32">
          <div key={current.slug} className="animate-fade-up">
              <BotIndex index={current.index} size="lg" />
              <p className="mono text-[11px] uppercase tracking-[0.11em] text-[var(--text-muted)] mt-7">
                {current.pillar} · {current.name}
              </p>
              <h3 className="display-xl mt-3">{current.botName}</h3>
              <p className="body-lg mt-4 max-w-[38ch]">{current.outcome}</p>
              <p className="body-sm mt-4 max-w-[42ch]">{current.blurb}</p>
              <Link
                href={categoryHref(current)}
                className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--accent-text)] hover:gap-3 transition-all"
              >
                Open {current.botName}
                <ArrowRight className="w-4 h-4" />
              </Link>
          </div>

          <div className="mt-12 flex items-center gap-3">
            <span className="mono text-[11px] tabular-nums text-[var(--text-muted)]">
              {String(active + 1).padStart(2, "0")} / {ALL_CATEGORIES.length}
            </span>
            <span className="relative h-px flex-1 bg-[var(--border)]">
              <span
                className="absolute inset-y-0 left-0 bg-ink-950 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${((active + 1) / ALL_CATEGORIES.length) * 100}%` }}
              />
            </span>
          </div>
        </div>
      </div>

      {/* The list */}
      <ul className="border-t border-[var(--border)]">
        {ALL_CATEGORIES.map((c, i) => (
          <li
            key={`${c.pillar}-${c.slug}`}
            ref={(el) => { rowRefs.current[i] = el; }}
            className="border-b border-[var(--border)]"
          >
            <Link
              href={categoryHref(c)}
              className={cn(
                "group grid grid-cols-[auto_1fr_auto] items-center gap-5 py-6 lg:py-7 transition-opacity duration-300",
                i === active ? "lg:opacity-100" : "lg:opacity-[0.55] hover:lg:opacity-80"
              )}
            >
              <span className={cn(
                "mono text-[12px] tabular-nums w-6",
                i === active ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"
              )}>
                {c.index}
              </span>
              <span className="min-w-0">
                <span className="block display-lg">{c.botName}</span>
                <span className="block body-sm mt-1">{c.name}</span>
              </span>
              <ArrowRight
                className={cn(
                  "w-4 h-4 shrink-0 transition-transform",
                  i === active ? "translate-x-0" : "-translate-x-1",
                  "group-hover:translate-x-0.5"
                )}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
