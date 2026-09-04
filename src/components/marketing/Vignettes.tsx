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
      {/* your message — centered on the same axis as the plan */}
      <rect x="16" y="53" width="128" height="62" fill="var(--background)" stroke="var(--border-strong)" />
      <text x="28" y="71" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--text-muted)">YOU, IN 2 MINUTES</text>
      <rect x="28" y="80" width="98" height="6" fill="var(--color-ink-100)" />
      <rect x="28" y="92" width="74" height="6" fill="var(--color-ink-100)" />
      <rect x="28" y="104" width="58" height="6" fill="var(--color-ink-100)" />
      {/* the wire across */}
      <path d="M144 84 C 166 84, 170 84, 192 84" fill="none" stroke="var(--color-accent-500)" strokeWidth="1.5" />
      <circle cx="192" cy="84" r="2.5" fill="var(--color-accent-500)" />
      {/* the plan back */}
      <rect x="192" y="38" width="112" height="92" fill="var(--background)" stroke="var(--border-strong)" />
      <rect x="192" y="38" width="112" height="18" fill="var(--bg-tint)" />
      <text x="204" y="50" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--accent-text)">YOUR-BOT-PLAN.PDF</text>
      {[66, 84, 102].map((y, i) => (
        <g key={y}>
          <rect x="204" y={y} width="9" height="9" fill="var(--color-accent-500)" opacity={1 - i * 0.28} />
          <rect x="220" y={y + 1.5} width={68 - i * 14} height="6" fill="var(--color-ink-100)" />
        </g>
      ))}
      <text x="204" y="123" fontSize="7.5" fontFamily="var(--font-mono)" fill="var(--text-muted)">BACK IN 1 BUSINESS DAY</text>
    </svg>
  );
}

/** Step 2 — the bot at the center of everything you offer. */
export function VignetteBuild() {
  const left = [
    { t: "PPC", y: 32 }, { t: "SEO", y: 84 }, { t: "SMS", y: 136 },
  ];
  const right = [
    { t: "Email", y: 32 }, { t: "CRM", y: 84 }, { t: "Pages", y: 136 },
  ];
  return (
    <svg viewBox="0 0 320 168" className={frame} aria-hidden="true">
      {left.map((n) => (
        <g key={n.t}>
          <path d={`M92 ${n.y} C 118 ${n.y}, 116 84, 126 84`} fill="none"
            stroke="var(--color-accent-500)" strokeWidth="1.4" opacity="0.75" />
          <rect x="34" y={n.y - 13} width="58" height="26" fill="var(--background)" stroke="var(--border-strong)" />
          <text x="63" y={n.y + 3.5} textAnchor="middle" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--text-secondary)">{n.t}</text>
          <circle cx="92" cy={n.y} r="2.5" fill="var(--color-accent-500)" />
        </g>
      ))}
      {right.map((n) => (
        <g key={n.t}>
          <path d={`M228 ${n.y} C 202 ${n.y}, 204 84, 194 84`} fill="none"
            stroke="var(--color-accent-500)" strokeWidth="1.4" opacity="0.75" />
          <rect x="228" y={n.y - 13} width="58" height="26" fill="var(--background)" stroke="var(--border-strong)" />
          <text x="257" y={n.y + 3.5} textAnchor="middle" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--text-secondary)">{n.t}</text>
          <circle cx="228" cy={n.y} r="2.5" fill="var(--color-accent-500)" />
        </g>
      ))}
      {/* the bot — a circle, the hub of the wheel */}
      <circle cx="160" cy="84" r="36" fill="var(--color-ink-950)" />
      <g transform="translate(139 77) scale(0.42)">
        <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="var(--color-accent-500)" />
      </g>
      <text x="160" y="103" textAnchor="middle" fontSize="6.5" fontFamily="var(--font-mono)" fill="var(--color-ink-300)" letterSpacing="1">
        YOUR BOT
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
      <rect x="52" y="20" width="216" height="120" fill="var(--background)" stroke="var(--border-strong)" />
      <rect x="52" y="20" width="216" height="20" fill="var(--bg-alt)" />
      <text x="66" y="33.5" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--text-secondary)">THIS WEEK</text>
      <text x="254" y="33.5" textAnchor="end" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--accent-text)">5 BOOKED</text>
      {cells.map(({ c, r, on }) => (
        <rect
          key={`${c}-${r}`}
          x={66 + c * 28} y={50 + r * 21} width="20" height="13"
          fill={on ? "var(--color-accent-500)" : "var(--color-ink-50)"}
          stroke={on ? "none" : "var(--border)"}
        />
      ))}
      {/* the one that just landed */}
      <g>
        <rect x="136" y="106" width="126" height="26" fill="var(--color-ink-950)" />
        <path d="M146 119 l3.5 3.5 6-7" fill="none" stroke="var(--color-accent-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="162" y="122.5" fontSize="8.5" fontFamily="var(--font-mono)" fill="#FFFFFF">Thu 10:00 — booked</text>
      </g>
    </svg>
  );
}
