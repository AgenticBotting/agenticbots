import Link from "next/link";
import { BOT_VIEWBOX, BOT_BODY_PATH, BOT_EYE_PATHS } from "@/components/ui/BotFace";
import { ALL_SERVICES, serviceHref } from "@/lib/catalog";

/**
 * The fleet, all at once — a status-board view of all thirteen bots
 * running simultaneously, rather than a diagram of how one of them works.
 * `SignalFlow` explains the loop; this is what it looks like turned on.
 *
 * Every animation is CSS-only and desynced by a per-index negative delay
 * (index * -0.4s / -0.55s), so the row reads as thirteen independent
 * processes rather than one motion repeated thirteen times. The delay is
 * derived from array index, not randomness, so SSR output is stable and
 * there is no hydration mismatch. `prefers-reduced-motion` turns all
 * three animation classes off (globals.css).
 */
export function FleetSwarm() {
  return (
    <ul
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-[var(--border)] border border-[var(--border)]"
      aria-label="All thirteen agentic bots, running"
    >
      {ALL_SERVICES.map((s, i) => (
        <li key={s.serviceSlug} className="flex">
          <Link href={serviceHref(s)} className="group card-cell w-full flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span
                className="swarm-bot inline-flex text-ink-950 group-hover:text-[var(--accent-text)] transition-colors"
                style={{ animationDelay: `${i * -0.4}s` }}
                aria-hidden="true"
              >
                <svg viewBox={BOT_VIEWBOX} width="26">
                  <path d={BOT_BODY_PATH} fill="currentColor" />
                  <g fill="var(--background)">
                    {BOT_EYE_PATHS.map((d) => <path key={d} d={d} />)}
                  </g>
                </svg>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="swarm-dot h-1.5 w-1.5 rounded-full bg-accent-500"
                  style={{ animationDelay: `${i * -0.55}s` }}
                  aria-hidden="true"
                />
                <span className="mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Running
                </span>
              </span>
            </div>

            <span className="display-md !text-[14.5px] group-hover:text-[var(--accent-text)] transition-colors">
              {s.botName}
            </span>

            {/* Two capability lines, opposite animation phase, in the same
                box — the cell quietly swaps its own status line forever. */}
            <span className="relative h-[15px] mt-0.5" aria-hidden="true">
              <span
                className="swarm-line absolute inset-0 mono text-[10.5px] leading-[15px] text-[var(--text-muted)] truncate"
                style={{ animationDelay: `${i * -0.5}s` }}
              >
                {s.capabilities[0]}
              </span>
              <span
                className="swarm-line absolute inset-0 mono text-[10.5px] leading-[15px] text-[var(--text-muted)] truncate"
                style={{ animationDelay: `${i * -0.5 - 3.5}s` }}
              >
                {s.capabilities[1] ?? s.capabilities[0]}
              </span>
            </span>
            {/* The real (unanimated) line for anyone reading with a screen
                reader or reduced motion — the two above are decorative. */}
            <span className="sr-only">{s.capabilities.slice(0, 2).join(" · ")}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
