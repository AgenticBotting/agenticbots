import { cn } from "@/lib/utils";

/**
 * Hero product surface — the fleet, not one customer.
 *
 * The previous version showed a named roofing lead in Miami Beach, which
 * coded the whole page as a tool for tradespeople. This reads as control-plane
 * telemetry: an executive sees a system, an owner sees it working.
 */

const FLEET = [
  { i: "09", name: "Speed-to-Lead", live: true, count: "1,284" },
  { i: "01", name: "Ads", live: true, count: "412" },
  { i: "10", name: "CRM", live: true, count: "3,940" },
  { i: "04", name: "Email", live: true, count: "866" },
  { i: "08", name: "Outbound", live: false, count: "—" },
];

const FOOTER = [
  ["median first response", "41s"],
  ["actions executed today", "6,502"],
  ["escalated to a human", "37"],
];

export function PipelineMockup() {
  return (
    <div className="card overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between gap-4 px-5 h-11 border-b border-[var(--border)] bg-[var(--bg-alt)]">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-signal-500 animate-pulse-dot" />
          <span className="mono text-[11px] uppercase tracking-[0.11em] text-[var(--text-body)]">
            Active
          </span>
        </span>
        <span className="mono text-[11px] tracking-[0.04em] text-[var(--text-muted)]">
          13 bots · 4 running
        </span>
      </div>

      {/* Fleet */}
      <ul>
        {FLEET.map((b, i) => (
          <li
            key={b.i}
            className={cn(
              "grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3",
              i > 0 && "border-t border-[var(--border)]",
              !b.live && "opacity-45"
            )}
          >
            <span className="mono text-[11.5px] tabular-nums text-[var(--text-muted)]">{b.i}</span>
            <span className="text-[14px] font-medium tracking-[-0.012em]">{b.name}</span>
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                b.live ? "bg-signal-500" : "bg-[var(--border-strong)]"
              )}
            />
            <span className="mono text-[12px] tabular-nums text-[var(--text-secondary)] w-[68px] text-right">
              {b.count}
            </span>
          </li>
        ))}
      </ul>

      {/* Telemetry */}
      <dl className="border-t border-[var(--border)] bg-[var(--bg-alt)] px-5 py-4 space-y-2">
        {FOOTER.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="mono text-[11px] tracking-[0.04em] text-[var(--text-muted)]">{label}</dt>
            <dd className="mono text-[12.5px] tabular-nums font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
