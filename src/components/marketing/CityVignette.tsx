import { BOT_PATH } from "@/components/ui/BotFace";
import type { City } from "@/lib/geo/schema";

/**
 * The city graphic, generated from real data: the bot circle at center,
 * this metro's actual business districts wired in around it. Every city
 * page gets art that is genuinely its own, because the districts are.
 */

const SLOTS: { x: number; y: number; anchor: "start" | "end" }[] = [
  { x: 44, y: 52, anchor: "start" },
  { x: 276, y: 52, anchor: "end" },
  { x: 32, y: 128, anchor: "start" },
  { x: 288, y: 128, anchor: "end" },
  { x: 160, y: 26, anchor: "start" }, // top-center, handled specially
];

export function CityVignette({ city }: { city: City }) {
  const districts = city.districts.slice(0, 5);
  return (
    <svg viewBox="0 0 320 200" className="w-full h-auto block" aria-hidden="true">
      {districts.map((d, i) => {
        const slot = SLOTS[i];
        const w = Math.min(d.length * 5.6 + 18, 118);
        const isTop = i === 4;
        const bx = isTop ? 160 - w / 2 : slot.anchor === "start" ? slot.x : slot.x - w;
        const by = isTop ? slot.y - 11 : slot.y - 11;
        const cxAttach = slot.anchor === "start" && !isTop ? bx + w : bx;
        const attachX = isTop ? 160 : cxAttach;
        const attachY = isTop ? slot.y + 11 : slot.y;
        return (
          <g key={d}>
            <path
              d={isTop
                ? `M${attachX} ${attachY} C 160 ${attachY + 22}, 160 ${100 - 42}, 160 ${100 - 40}`
                : `M${attachX} ${attachY} C 160 ${attachY}, ${attachX < 160 ? 124 : 196} 100, ${attachX < 160 ? 122 : 198} 100`}
              fill="none" stroke="var(--color-accent-500)" strokeWidth="1.3" opacity="0.7"
            />
            <circle cx={attachX} cy={attachY} r="2.2" fill="var(--color-accent-500)" />
            <rect x={bx} y={by} width={w} height="22" fill="var(--background)" stroke="var(--border-strong)" />
            <text x={bx + w / 2} y={by + 14.5} textAnchor="middle" fontSize="8"
              fontFamily="var(--font-mono)" fill="var(--text-secondary)">{d}</text>
          </g>
        );
      })}

      <circle cx="160" cy="100" r="40" fill="var(--color-ink-950)" />
      <g transform="translate(137 91) scale(0.46)">
        <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="var(--color-accent-500)" />
      </g>
      <text x="160" y="121" textAnchor="middle" fontSize="7" fontFamily="var(--font-mono)"
        fill="var(--color-ink-300)" letterSpacing="1">
        {city.name.toUpperCase().slice(0, 14)}
      </text>

      <text x="160" y="188" textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)"
        fill="var(--text-muted)" letterSpacing="0.6">
        {districts.length} DISTRICTS WIRED · {city.stateAbbr}
      </text>
    </svg>
  );
}
