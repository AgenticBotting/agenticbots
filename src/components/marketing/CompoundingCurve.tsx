/**
 * The compounding curve — what changes between paying someone to do the work
 * monthly and having an agent do it continuously.
 *
 * Hand-rolled SVG, matching Charts.tsx: no chart library (either costs
 * 40–90KB gzipped against a 150KB route budget), SSR-safe by construction,
 * animated by CSS only, with a visually-hidden table for screen readers.
 *
 * Colour: the baseline is deliberately the recessive neutral and the agent
 * series the accent — state encoding, not categorical identity. Measured
 * separation is ΔE 23.8 normal / 21.6 deutan, comfortably clear. Both sit
 * under 3:1 against white, which obliges visible relief, so both series
 * carry a direct end label and the table below is real.
 *
 * ILLUSTRATIVE — the shape is the argument, not the numbers. Labelled as
 * such in-UI, matching ProofBar's "targets, not client results" honesty.
 */

import { BOT_VIEWBOX, BOT_BODY_PATH, BOT_EYE_PATHS } from "@/components/ui/BotFace";

const W = 900;
const H = 265;
const PAD = { t: 26, r: 118, b: 38, l: 46 };
const WEEKS = 12;
const MAX = 260;

const x = (week: number) => PAD.l + ((week - 1) * (W - PAD.l - PAD.r)) / (WEEKS - 1);
const y = (v: number) => H - PAD.b - (v / MAX) * (H - PAD.t - PAD.b);

/** Manual effort plateaus: someone does the pass, then gets busy. */
const MANUAL = [100, 104, 101, 106, 103, 107, 104, 108, 105, 109, 106, 110];

/** The agent ramps once it is live, then keeps compounding because the loop
 *  never stops running. `liveWeek` comes from the service's own
 *  implementationWeeks, so each service draws its own curve. */
function agentSeries(liveWeek: number): number[] {
  return Array.from({ length: WEEKS }, (_, i) => {
    const week = i + 1;
    if (week < liveWeek) return 100 - (week - 1) * 2; // build phase, slight dip
    const t = week - liveWeek;
    return Math.round(96 + 155 * (1 - Math.exp(-t / 3.4)));
  });
}

const line = (vals: number[]) =>
  vals.map((v, i) => `${i ? "L" : "M"}${x(i + 1).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

const area = (vals: number[]) =>
  `${line(vals)} L${x(WEEKS).toFixed(1)} ${y(0).toFixed(1)} L${x(1).toFixed(1)} ${y(0).toFixed(1)} Z`;

export function CompoundingCurve({
  botName,
  liveWeek = 2,
}: {
  botName: string;
  liveWeek?: number;
}) {
  const agent = agentSeries(liveWeek);
  const uid = `cc-${botName.replace(/\W/g, "")}`;
  const endAgent = agent[WEEKS - 1];
  const endManual = MANUAL[WEEKS - 1];

  return (
    <figure className="card p-6 sm:p-8">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-6">
        <span className="display-md">Why it compounds</span>
        <span className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
          Illustrative · shape, not numbers
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        /* No overflow-visible: every label sits inside the viewBox, so it
           bought nothing and let the travelling bot escape the frame — 39px
           of sideways scroll on the whole document at 390px. */
        className="w-full h-auto"
        role="img"
        aria-label={`Area chart. Doing the work manually stays flat near an index of 100 across twelve weeks. ${botName} dips slightly during the build, goes live in week ${liveWeek}, then compounds to about ${endAgent} by week 12.`}
      >
        <defs>
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id={`${uid}-wipe`}>
            {/* Width animates 0 → full, so the area draws in left to right. */}
            <rect x="0" y="0" height={H} className="cc-wipe" />
          </clipPath>
        </defs>

        {/* Recessive grid */}
        {[0, 65, 130, 195, 260].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
            <text
              x={PAD.l - 10}
              y={y(v) + 3.5}
              textAnchor="end"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="var(--text-muted)"
            >
              {v}
            </text>
          </g>
        ))}

        {/* The week it goes live — the only annotation that earns its ink. */}
        <line
          x1={x(liveWeek)}
          x2={x(liveWeek)}
          y1={y(MAX)}
          y2={y(0)}
          stroke="var(--border-strong)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <text
          x={x(liveWeek) + 7}
          y={y(MAX) + 2}
          fontSize="10"
          fontFamily="var(--font-mono)"
          className="uppercase"
          letterSpacing="0.08em"
          fill="var(--text-muted)"
        >
          live · wk {liveWeek}
        </text>

        <g clipPath={`url(#${uid}-wipe)`}>
          <path d={area(agent)} fill={`url(#${uid}-fill)`} />
          <path d={line(MANUAL)} fill="none" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="5 5" />
          <path
            d={line(agent)}
            fill="none"
            stroke="var(--color-accent-500)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* End markers, ≥8px hit size */}
          <circle cx={x(WEEKS)} cy={y(endAgent)} r="4.5" fill="var(--color-accent-500)" stroke="var(--background)" strokeWidth="2" />
          <circle cx={x(WEEKS)} cy={y(endManual)} r="4" fill="var(--border-strong)" stroke="var(--background)" strokeWidth="2" />
        </g>

        {/* The bot walks the curve it is drawing. Same offset-path trick
            BotOrbit uses on the buttons, pointed at the series path — so the
            motion is the data, not decoration laid over it. */}
        <g
          className="cc-crawler"
          style={{ offsetPath: `path("${line(agent)}")`, offsetRotate: "auto" }}
          aria-hidden="true"
        >
          <svg viewBox={BOT_VIEWBOX} width="20" overflow="visible">
            <path d={BOT_BODY_PATH} fill="var(--color-accent-600)" />
            <g fill="var(--background)">
              {BOT_EYE_PATHS.map((d) => <path key={d} d={d} />)}
            </g>
          </svg>
        </g>

        {/* Direct labels — the contrast relief the palette check requires.
            Text uses --accent-text, never the 2.89:1 fill colour. */}
        <text x={x(WEEKS) + 12} y={y(endAgent) - 2} fontSize="13" fontWeight="600" fill="var(--accent-text)">
          {botName}
        </text>
        <text x={x(WEEKS) + 12} y={y(endAgent) + 14} fontSize="11" fontFamily="var(--font-mono)" fill="var(--text-muted)">
          ×{(endAgent / 100).toFixed(1)}
        </text>
        <text x={x(WEEKS) + 12} y={y(endManual) + 4} fontSize="12" fontWeight="500" fill="var(--text-secondary)">
          By hand
        </text>

        <text x={PAD.l} y={H - 12} fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-muted)">wk 1</text>
        <text x={W - PAD.r} y={H - 12} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-muted)">wk 12</text>
      </svg>

      {/* Wrapped rather than `sr-only` on the <table> itself: a table with
          auto layout expands past the 1px sr-only width, so the "hidden"
          data table pushes the whole document sideways. A div holds it. */}
      <div className="sr-only"><table>
        <caption>Indexed output per week — manual versus {botName}</caption>
        <thead><tr><th>Week</th><th>By hand</th><th>{botName}</th></tr></thead>
        <tbody>
          {MANUAL.map((m, i) => (
            <tr key={i}><td>{i + 1}</td><td>{m}</td><td>{agent[i]}</td></tr>
          ))}
        </tbody>
      </table></div>
    </figure>
  );
}
