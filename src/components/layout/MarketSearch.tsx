"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { ALL_CITIES, ALL_STATES } from "@/lib/geo/dataset";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Typeahead over 924 cities + 51 states, inside the Service Areas menu.
 *
 * SEO note: this filters in memory and renders real <a> links — the
 * crawlable region → state → city tree below it is untouched, and no
 * query-string URL is ever created (the plan's crawl-trap rule).
 */

type Hit =
  | { kind: "city"; label: string; sub: string; href: string }
  | { kind: "state"; label: string; sub: string; href: string };

function search(q: string): Hit[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];

  const cityHits: { hit: Hit; rank: number }[] = [];
  for (const c of ALL_CITIES) {
    const name = c.city.toLowerCase();
    const rank = name.startsWith(needle) ? 0 : name.includes(needle) ? 1 : -1;
    if (rank < 0) continue;
    cityHits.push({
      rank: rank + (c.tier - 1) * 0.1, // tier-1 first within each match class
      hit: {
        kind: "city",
        label: `${c.city}, ${c.state_abbr}`,
        sub: `${c.metro} metro`,
        href: `/markets/${c.state_slug}/${c.city_slug}`,
      },
    });
  }
  const stateHits: { hit: Hit; rank: number }[] = ALL_STATES
    .filter((s) => s.name.toLowerCase().includes(needle))
    .map((s) => ({
      rank: s.name.toLowerCase().startsWith(needle) ? 0 : 1,
      hit: {
        kind: "state",
        label: s.name,
        sub: `all ${ALL_CITIES.filter((c) => c.state_slug === s.slug).length} cities`,
        href: `/markets/${s.slug}`,
      },
    }));

  return [...stateHits, ...cityHits]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 10)
    .map((x) => x.hit);
}

export function MarketSearch({
  onNavigate,
  dark = false,
}: {
  onNavigate: () => void;
  dark?: boolean;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => search(q), [q]);

  function go(hit: Hit) {
    track("market_searched", { query: q, picked: hit.label });
    setQ("");
    onNavigate();
  }

  return (
    <div className="relative">
      <div className={cn(
        "flex items-center gap-3 border px-4 h-12",
        dark ? "border-ink-600 bg-ink-800" : "border-[var(--border-strong)] bg-white"
      )}>
        <Search className={cn("w-4 h-4 shrink-0", dark ? "text-ink-400" : "text-[var(--text-muted)]")} />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && q) { e.stopPropagation(); setQ(""); }
            if (e.key === "Enter" && hits[0]) {
              e.preventDefault();
              go(hits[0]);
              window.location.assign(hits[0].href);
            }
          }}
          placeholder="Search your city or state…"
          aria-label="Search markets"
          className={cn(
            "w-full bg-transparent outline-none text-[14.5px]",
            dark ? "text-white placeholder:text-ink-400" : "text-[var(--text-body)] placeholder:text-[var(--text-muted)]"
          )}
        />
        {q && (
          <button
            type="button"
            onClick={() => { setQ(""); inputRef.current?.focus(); }}
            className={cn("mono text-[10px] uppercase tracking-[0.08em]", dark ? "text-ink-400" : "text-[var(--text-muted)]")}
          >
            clear
          </button>
        )}
      </div>

      {hits.length > 0 && (
        <ul className={cn(
          "absolute inset-x-0 top-full z-10 border border-t-0 shadow-mega max-h-[320px] overflow-y-auto",
          dark ? "border-ink-600 bg-ink-900" : "border-[var(--border-strong)] bg-white"
        )}>
          {hits.map((h) => (
            <li key={h.href}>
              <Link
                href={h.href}
                onClick={() => go(h)}
                className={cn(
                  "group flex items-center justify-between gap-4 px-4 py-3 transition-colors",
                  dark ? "hover:bg-ink-800" : "hover:bg-[var(--bg-alt)]"
                )}
              >
                <span className="min-w-0 flex items-baseline gap-2.5">
                  <span className={cn("text-[14px] font-medium truncate", dark ? "text-white" : "")}>{h.label}</span>
                  <span className={cn("mono text-[10.5px] shrink-0", dark ? "text-ink-400" : "text-[var(--text-muted)]")}>
                    {h.sub}
                  </span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[var(--accent-text)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && hits.length === 0 && (
        <p className={cn("absolute inset-x-0 top-full z-10 border border-t-0 px-4 py-3 text-[13px] shadow-mega",
          dark ? "border-ink-600 bg-ink-900 text-ink-400" : "border-[var(--border-strong)] bg-white text-[var(--text-secondary)]")}>
          No match — we still cover it. Tell us where you are and we&apos;ll confirm on your free plan.
        </p>
      )}
    </div>
  );
}
