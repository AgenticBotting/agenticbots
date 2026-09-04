"use client";

import { useEffect, useState } from "react";
import { BOT_PATH } from "@/components/ui/BotFace";

/**
 * The hero scene: bots roll off the line and go to work.
 *
 * A factory on the left keeps producing; each unit travels the spine,
 * turns off at its station, and the desk it reaches comes alive — screen
 * fills, indicator goes green, work starts. It is the whole pitch in one
 * loop: you do not hire, you deploy, and the thing arrives already
 * knowing its job.
 *
 * Coded rather than rendered: it is a few KB, it is sharp at any size,
 * and it never has to be re-exported when a station is renamed.
 *
 * Motion is CSS `offset-path` along the routed lines, so the browser owns
 * the animation. With `prefers-reduced-motion` the scene renders in its
 * finished state — every station staffed and lit — which says the same
 * thing without moving.
 */

const W = 560;
const H = 400;

/* Orthogonal routing: out of the bay, along the spine, then a turn into
   the station. Reads as a production line, and is exactly the path each
   bot animates along. */
const BAY = { x: 146, y: 250 };
const SPINE = 236;
const DESK_X = 326;
const DESK_W = 216;

/** The default four, for pages that are not about one bot in particular. */
const DEFAULT_STATIONS = [
  { label: "Answering calls", meta: "24/7 · in seconds" },
  { label: "Following up", meta: "Every single quote" },
  { label: "Running ads", meta: "Reviewed daily" },
  { label: "Updating the CRM", meta: "Nobody has to ask" },
];

const ROW_Y = [64, 152, 240, 328];

const CYCLE = 11;
const route = (y: number) => `M ${BAY.x} ${BAY.y} H ${SPINE} V ${y} H ${DESK_X - 4}`;

export function BotFactory({
  place,
  stations,
  title,
}: {
  place?: string;
  /** Four jobs for this page's bot. Falls back to the fleet-level four. */
  stations?: { label: string; meta: string }[];
  /** Overrides the header line entirely. */
  title?: string;
}) {
  const STATIONS = (stations?.length ? stations : DEFAULT_STATIONS)
    .slice(0, 4)
    .map((st, i) => ({ ...st, y: ROW_Y[i] }));

  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionOk(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div className="card overflow-hidden shadow-lift">
      <div className="flex items-center justify-between gap-4 px-6 h-12 border-b border-[var(--border)] bg-[var(--bg-alt)]">
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 shrink-0 bg-accent-500 animate-pulse-dot" />
          <span className="text-[12.5px] font-semibold tracking-[-0.01em] truncate">
            {title ?? (place ? `Your fleet, working in ${place}` : "Your fleet, going to work")}
          </span>
        </span>
        <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)] shrink-0 hidden sm:block">
          Built · deployed · running
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" role="img"
        aria-label={`Bots leaving a factory and taking up four stations: ${STATIONS.map((st) => st.label.toLowerCase()).join(", ")}.`}>

        {/* ── Routing ── */}
        {STATIONS.map((s) => (
          <path key={s.y} d={route(s.y)} fill="none" stroke="var(--border)" strokeWidth="1.5" />
        ))}
        {/* Signal running the spine — the line is live even between units. */}
        {STATIONS.map((s, i) => (
          <path
            key={`live-${s.y}`}
            d={route(s.y)}
            fill="none"
            stroke="var(--color-accent-300)"
            strokeWidth="1.5"
            className={motionOk ? "factory-wire" : undefined}
            style={motionOk ? { animationDelay: `${i * (CYCLE / 4)}s`, animationDuration: `${CYCLE}s` } : { opacity: 0.5 }}
          />
        ))}

        {/* ── Factory ── */}
        <g>
          {/* Vents on the roof. */}
          {[40, 64, 88].map((x) => (
            <rect key={x} x={x} y={40} width="14" height="22" fill="var(--color-ink-100)" stroke="var(--border)" />
          ))}
          <rect x={22} y={62} width={124} height={286} fill="var(--bg-alt)" stroke="var(--border-strong)" strokeWidth="1.5" />
          <text x={84} y={88} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)"
            letterSpacing="1.4" fill="var(--text-muted)">ASSEMBLY</text>
          <line x1={22} y1={98} x2={146} y2={98} stroke="var(--border)" />

          {/* The mark, stamped on the building. */}
          <g transform="translate(40 118) scale(0.88)">
            <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="var(--color-ink-100)" />
          </g>

          {/* Build slots filling and emptying as units ship. */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={40}
              y={182 + i * 22}
              width={68}
              height={13}
              fill="var(--color-accent-500)"
              className={motionOk ? "factory-slot" : undefined}
              style={
                motionOk
                  ? { animationDelay: `${i * 0.9}s`, animationDuration: `${CYCLE / 2.4}s` }
                  : { opacity: 0.35 }
              }
            />
          ))}
          <text x={84} y={332} textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)"
            letterSpacing="0.4" fill="var(--text-muted)">YOUR STACK</text>

          {/* Bay door the units leave through. */}
          <rect x={120} y={228} width={26} height={44} fill="var(--color-accent-500)" opacity="0.16" />
          <line x1={146} y1={228} x2={146} y2={272} stroke="var(--color-accent-500)" strokeWidth="2.5" />
        </g>

        {/* ── Stations ── */}
        {STATIONS.map((s, i) => {
          const delay = i * (CYCLE / 4);
          const live = motionOk
            ? { animationDelay: `${delay}s`, animationDuration: `${CYCLE}s` }
            : undefined;
          return (
            <g key={s.label}>
              <rect x={DESK_X} y={s.y - 34} width={DESK_W} height={68} fill="#fff" stroke="var(--border-strong)" strokeWidth="1.5" />

              {/* Screen: fills in once the unit lands. */}
              <rect x={DESK_X + 14} y={s.y - 20} width={44} height={40} fill="var(--bg-alt)" stroke="var(--border)" />
              {[0, 1, 2].map((r) => (
                <rect
                  key={r}
                  x={DESK_X + 19}
                  y={s.y - 14 + r * 9}
                  width={34}
                  height={4}
                  fill="var(--color-accent-500)"
                  className={motionOk ? "station-line" : undefined}
                  style={motionOk ? { ...live, animationDelay: `${delay + r * 0.18}s` } : { opacity: 0.75 }}
                />
              ))}

              <text x={DESK_X + 72} y={s.y - 6} fontSize="13.5" fontWeight="600"
                fontFamily="var(--font-display)" letterSpacing="-0.3" fill="var(--foreground)">
                {s.label}
              </text>
              <text x={DESK_X + 72} y={s.y + 12} fontSize="9" fontFamily="var(--font-mono)"
                letterSpacing="0.4" fill="var(--text-muted)" className="station-meta">
                {s.meta.toUpperCase()}
              </text>

              {/* Station indicator. */}
              <circle
                cx={DESK_X + DESK_W - 14}
                cy={s.y - 20}
                r="3.5"
                fill="var(--color-accent-500)"
                className={motionOk ? "station-dot" : undefined}
                style={live ?? { opacity: 1 }}
              />
            </g>
          );
        })}

        {/* ── The units ── */}
        {STATIONS.map((s, i) =>
          motionOk ? (
            <g
              key={`bot-${s.y}`}
              className="factory-bot"
              style={{
                offsetPath: `path("${route(s.y)}")`,
                offsetRotate: "0deg",
                animationDelay: `${i * (CYCLE / 4)}s`,
                animationDuration: `${CYCLE}s`,
              }}
            >
              <g transform="translate(-11 -3.2) scale(0.22)">
                <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="var(--foreground)" />
              </g>
            </g>
          ) : (
            /* Parked at their stations — the same story, held still. */
            <g key={`bot-${s.y}`} transform={`translate(${DESK_X - 26} ${s.y - 3.2}) scale(0.22)`}>
              <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="var(--foreground)" />
            </g>
          )
        )}
      </svg>
    </div>
  );
}
