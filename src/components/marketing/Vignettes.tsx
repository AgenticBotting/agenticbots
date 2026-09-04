import { BOT_PATH } from "@/components/ui/BotFace";

/**
 * Coded "images" — the photo slots from a classic landing wireframe,
 * drawn instead of shot. Inline SVG scenes in the brand system: hairline
 * boxes, mono micro-labels, accent green as the signal. Zero image
 * requests, retina-perfect, recolor with the tokens.
 *
 * All decorative: aria-hidden, meaning carried by adjacent copy.
 */

const frame = "w-full h-auto block";

/** Step 1 — you tell us → a plan comes back. */
export function VignetteAsk() {
  return (
    <svg viewBox="0 0 320 168" className={frame} aria-hidden="true">
      {/* your message */}
      <rect x="18" y="30" width="128" height="62" fill="var(--background)" stroke="var(--border-strong)" />
      <text x="30" y="48" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--text-muted)">YOU, IN 2 MINUTES</text>
      <rect x="30" y="57" width="98" height="6" fill="var(--color-ink-100)" />
      <rect x="30" y="69" width="74" height="6" fill="var(--color-ink-100)" />
      <rect x="30" y="81" width="58" height="6" fill="var(--color-ink-100)" />
      {/* the wire across */}
      <path d="M146 61 C 172 61, 168 84, 192 84" fill="none" stroke="var(--color-accent-500)" strokeWidth="1.5" />
      <circle cx="192" cy="84" r="2.5" fill="var(--color-accent-500)" />
      {/* the plan back */}
      <rect x="192" y="46" width="112" height="92" fill="var(--background)" stroke="var(--border-strong)" />
      <rect x="192" y="46" width="112" height="18" fill="var(--bg-tint)" />
      <text x="204" y="58" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--accent-text)">YOUR-BOT-PLAN.PDF</text>
      {[74, 92, 110].map((y, i) => (
        <g key={y}>
          <rect x="204" y={y} width="9" height="9" fill="var(--color-accent-500)" opacity={1 - i * 0.28} />
          <rect x="220" y={y + 1.5} width={68 - i * 14} height="6" fill="var(--color-ink-100)" />
        </g>
      ))}
      <text x="204" y="131" fontSize="7.5" fontFamily="var(--font-mono)" fill="var(--text-muted)">BACK IN 1 BUSINESS DAY</text>
    </svg>
  );
}

/** Step 2 — the bot, wired into the tools you already use. */
export function VignetteBuild() {
  const tools = [
    { t: "CRM", x: 30, y: 34 },
    { t: "Ads", x: 30, y: 118 },
    { t: "Calendar", x: 238, y: 34 },
    { t: "Email", x: 238, y: 118 },
  ];
  return (
    <svg viewBox="0 0 320 168" className={frame} aria-hidden="true">
      {tools.map((n) => (
        <g key={n.t}>
          <path
            d={`M${n.x + 34} ${n.y + 10} C 160 ${n.y + 10}, ${n.x < 100 ? 120 : 200} 84, 160 84`}
            fill="none" stroke="var(--color-accent-500)" strokeWidth="1.4" opacity="0.75"
          />
          <rect x={n.x - 26} y={n.y - 3} width="60" height="26" fill="var(--background)" stroke="var(--border-strong)" />
          <text x={n.x + 4} y={n.y + 13} textAnchor="middle" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--text-secondary)">{n.t}</text>
          <circle cx={n.x + 34} cy={n.y + 10} r="2.5" fill="var(--color-accent-500)" />
        </g>
      ))}
      {/* the bot at center */}
      <rect x="118" y="58" width="84" height="52" fill="var(--color-ink-950)" />
      <g transform="translate(134 71) scale(0.52)">
        <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="var(--color-accent-500)" />
      </g>
      <text x="160" y="102" textAnchor="middle" fontSize="7" fontFamily="var(--font-mono)" fill="var(--color-ink-300)" letterSpacing="1">
        YOUR BOT
      </text>
      <text x="160" y="152" textAnchor="middle" fontSize="7.5" fontFamily="var(--font-mono)" fill="var(--text-muted)">
        LIVE IN ~2 WEEKS · NOTHING REPLACED
      </text>
    </svg>
  );
}

/** Step 3 — the calendar fills; nothing slips through. */
export function VignetteBooked() {
  const cells: { c: number; r: number; on?: boolean }[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 7; c++)
      cells.push({ c, r, on: [9, 12, 16, 19, 24].includes(r * 7 + c) });
  return (
    <svg viewBox="0 0 320 168" className={frame} aria-hidden="true">
      <rect x="52" y="22" width="216" height="118" fill="var(--background)" stroke="var(--border-strong)" />
      <rect x="52" y="22" width="216" height="20" fill="var(--bg-alt)" />
      <text x="64" y="35.5" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--text-secondary)">THIS WEEK</text>
      <text x="256" y="35.5" textAnchor="end" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--accent-text)">5 BOOKED</text>
      {cells.map(({ c, r, on }) => (
        <rect
          key={`${c}-${r}`}
          x={64 + c * 28} y={52 + r * 21} width="20" height="13"
          fill={on ? "var(--color-accent-500)" : "var(--color-ink-50)"}
          stroke={on ? "none" : "var(--border)"}
        />
      ))}
      {/* the one that just landed */}
      <g>
        <rect x="140" y="112" width="126" height="26" fill="var(--color-ink-950)" />
        <path d="M150 125 l3.5 3.5 6-7" fill="none" stroke="var(--color-accent-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="166" y="128.5" fontSize="8.5" fontFamily="var(--font-mono)" fill="#FFFFFF">Thu 10:00 — booked</text>
      </g>
    </svg>
  );
}
