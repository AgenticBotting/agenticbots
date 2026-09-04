import { BOT_PATH } from "@/components/ui/BotFace";

/**
 * The city graphic: the bot circle at center, real local places wired in
 * around it. Geometry is collision-proof: labels live in fixed side
 * rails that can never reach the circle, long names truncate, and the
 * city name sits UNDER the circle instead of inside it.
 */

const CIRCLE = { cx: 160, cy: 88, r: 32 };
const RAIL_W = 104;

const SLOTS = [
  { side: "L" as const, y: 40 },
  { side: "R" as const, y: 40 },
  { side: "L" as const, y: 104 },
  { side: "R" as const, y: 104 },
  { side: "T" as const, y: 18 },
];

function fit(label: string): string {
  return label.length > 17 ? label.slice(0, 16).trimEnd() + "…" : label;
}

export function CityVignette({ name, stateAbbr, labels }: {
  name: string; stateAbbr: string; labels: string[];
}) {
  const items = labels.slice(0, 5);
  return (
    <svg viewBox="0 0 320 212" className="w-full h-auto block" aria-hidden="true">
      {items.map((raw, i) => {
        const slot = SLOTS[i];
        const label = fit(raw);
        const w = Math.min(label.length * 5.6 + 18, RAIL_W);
        let bx: number, attachX: number, attachY: number;
        if (slot.side === "T") {
          bx = 160 - w / 2;
          attachX = 160;
          attachY = slot.y + 11;
        } else if (slot.side === "L") {
          bx = 16;
          attachX = bx + w;
          attachY = slot.y;
        } else {
          bx = 304 - w;
          attachX = bx;
          attachY = slot.y;
        }
        const toX = slot.side === "T" ? 160 : slot.side === "L" ? CIRCLE.cx - CIRCLE.r : CIRCLE.cx + CIRCLE.r;
        const toY = slot.side === "T" ? CIRCLE.cy - CIRCLE.r : CIRCLE.cy + (slot.y < CIRCLE.cy ? -12 : 12);
        const path = slot.side === "T"
          ? `M${attachX} ${attachY} L160 ${toY}`
          : `M${attachX} ${attachY} C ${(attachX + toX) / 2} ${attachY}, ${(attachX + toX) / 2} ${toY}, ${toX} ${toY}`;
        return (
          <g key={raw}>
            <path d={path} fill="none" stroke="var(--color-accent-500)" strokeWidth="1.3" opacity="0.7" />
            <circle cx={attachX} cy={attachY} r="2.2" fill="var(--color-accent-500)" />
            <rect x={bx} y={slot.y - 11} width={w} height="22" fill="var(--background)" stroke="var(--border-strong)" />
            <text x={bx + w / 2} y={slot.y + 3.5} textAnchor="middle" fontSize="8"
              fontFamily="var(--font-mono)" fill="var(--text-secondary)">{label}</text>
          </g>
        );
      })}

      <circle cx={CIRCLE.cx} cy={CIRCLE.cy} r={CIRCLE.r} fill="var(--color-ink-950)" />
      <g transform={`translate(${CIRCLE.cx - 21} ${CIRCLE.cy - 7}) scale(0.42)`}>
        <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="var(--color-accent-500)" />
      </g>

      {/* The city name — under the circle, never squeezed inside it. */}
      <text x="160" y="152" textAnchor="middle" fontSize="10" fontWeight="600"
        fontFamily="var(--font-geist-sans)" fill="var(--foreground)" letterSpacing="0.5">
        {name.toUpperCase()}
      </text>
      <text x="160" y="196" textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)"
        fill="var(--text-muted)" letterSpacing="0.6">
        {items.length} AREAS WIRED · {stateAbbr}
      </text>
    </svg>
  );
}
