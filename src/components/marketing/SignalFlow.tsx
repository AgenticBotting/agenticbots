import { BOT_PATH } from "@/components/ui/BotFace";

/**
 * The system, as one drawing: every way a customer arrives, through the
 * bot, to every outcome — with the work flowing along the wires.
 * Replaces three prose cards; the copy is now captions on the diagram.
 */

const INPUTS = ["missed call", "web form", "ad click", "email reply", "dm"];
const OUTPUTS = ["booked call", "quote sent", "crm updated", "follow-up queued", "report"];

const W = 1120, H = 460;
const CX = W / 2, CY = H / 2 - 10;

function wire(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export function SignalFlow() {
  const inY = (i: number) => 52 + i * 82;
  const outY = (i: number) => 52 + i * 82;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
        aria-label="Diagram: missed calls, web forms, ad clicks, email replies and DMs flow into the bot, which watches, acts and reports — producing booked calls, sent quotes, updated CRM records, queued follow-ups and one report.">
        <defs>
          {/* Work travels the wires: a dash sliding along each path. */}
          <style>{`
            .wire { stroke: var(--border-strong); stroke-width: 1.25; fill: none; }
            .pulse { stroke: var(--color-accent-500); stroke-width: 2; fill: none;
                     stroke-dasharray: 14 380; stroke-linecap: round;
                     animation: flow 3.8s linear infinite; }
            @keyframes flow { to { stroke-dashoffset: -394; } }
            @media (prefers-reduced-motion: reduce) { .pulse { animation: none; stroke-dasharray: none; opacity: .5; } }
          `}</style>
        </defs>

        {/* Wires in, wires out */}
        {INPUTS.map((_, i) => (
          <g key={`in${i}`}>
            <path className="wire" d={wire(172, inY(i), CX - 96, CY)} />
            <path className="pulse" style={{ animationDelay: `${i * 0.7}s` }} d={wire(172, inY(i), CX - 96, CY)} />
          </g>
        ))}
        {OUTPUTS.map((_, i) => (
          <g key={`out${i}`}>
            <path className="wire" d={wire(CX + 96, CY, W - 172, outY(i))} />
            <path className="pulse" style={{ animationDelay: `${1.9 + i * 0.7}s` }} d={wire(CX + 96, CY, W - 172, outY(i))} />
          </g>
        ))}

        {/* Inputs */}
        {INPUTS.map((t, i) => (
          <g key={t}>
            <rect x="20" y={inY(i) - 17} width="152" height="34" fill="var(--background)" stroke="var(--border-strong)" />
            <circle cx="40" cy={inY(i)} r="3" fill="var(--text-muted)" />
            <text x="54" y={inY(i) + 4} fontSize="12.5" fontFamily="var(--font-mono)" fill="var(--text-body)">{t}</text>
          </g>
        ))}

        {/* The bot */}
        <g transform={`translate(${CX - 96} ${CY - 62})`}>
          <rect width="192" height="124" fill="var(--color-ink-950)" />
          <g transform="translate(51 26) scale(0.9)" >
            <path fillRule="evenodd" clipRule="evenodd" d={BOT_PATH} fill="var(--color-accent-500)" />
          </g>
          <text x="96" y="86" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--color-ink-300)" letterSpacing="1.5">
            WATCHES · ACTS
          </text>
          <text x="96" y="104" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--color-ink-300)" letterSpacing="1.5">
            · REPORTS
          </text>
        </g>

        {/* Outputs */}
        {OUTPUTS.map((t, i) => (
          <g key={t}>
            <rect x={W - 172} y={outY(i) - 17} width="152" height="34" fill="var(--bg-tint)" stroke="var(--border-tint)" />
            <text x={W - 152} y={outY(i) + 4} fontSize="12.5" fontFamily="var(--font-mono)" fill="var(--accent-text)">{t}</text>
          </g>
        ))}
      </svg>

      {/* The three-beat caption row — all that remains of the old prose. */}
      <dl className="mt-8 grid sm:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] grid-frame">
        {[
          ["01 · watches", "Your ads, inbox, forms, phone and CRM — every hour."],
          ["02 · acts", "Replies, books, bids and logs in seconds, by your rules."],
          ["03 · reports", "One plain-English view of what it did and what came back."],
        ].map(([t, b]) => (
          <div key={t} className="card-cell px-6 py-5">
            <dt className="mono text-[11px] uppercase tracking-[0.11em] text-[var(--accent-text)]">{t}</dt>
            <dd className="text-[14px] leading-snug text-[var(--text-body)] mt-1.5">{b}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
