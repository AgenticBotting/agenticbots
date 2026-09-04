import { cn } from "@/lib/utils";

/**
 * The implementation timeline. One grid carries both the rail and the
 * copy, so nodes sit exactly on their column edges — nothing floats.
 * Each phase owns a duration bar; "Tune" fades right because it never ends.
 */

const PHASES = [
  { n: "01", span: "Days 1–4", title: "Audit", line: "Every lead path traced; leaks ranked by cost. You keep the map.", bar: "34%" },
  { n: "02", span: "Weeks 1–2", title: "Connect", line: "First bot built on your real intake, wired into your stack.", bar: "62%" },
  { n: "03", span: "Weeks 2–3", title: "Launch", line: "Live in monitored mode; every action reviewed daily.", bar: "48%" },
  { n: "04", span: "Ongoing", title: "Tune", line: "Weekly passes; the next bot only after this one proves out.", bar: "100%" },
];

export function Timeline() {
  return (
    <div>
      {/* Rail + copy share one grid — alignment is structural, not tuned. */}
      <div className="hidden sm:grid grid-cols-4 gap-x-10" aria-hidden="true">
        {PHASES.map((p, i) => (
          <div key={p.title} className="relative h-8">
            {/* the continuous line — each cell extends across its own gap */}
            <span className={cn(
              "absolute top-1/2 -translate-y-1/2 left-0 h-px bg-[var(--border-strong)]",
              i < 3 ? "-right-10" : "right-0"
            )} />
            {/* the phase's duration bar */}
            <span
              className={cn(
                "absolute top-1/2 -translate-y-1/2 left-0 h-[3px]",
                i === 3
                  ? "bg-gradient-to-r from-ink-950 via-ink-950 to-transparent"
                  : "bg-ink-950"
              )}
              style={{ width: p.bar }}
            />
            {/* the node, pinned to the column edge the title sits on */}
            <span className={cn(
              "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-0 h-3.5 w-3.5 border-2 border-ink-950",
              i === 3 ? "bg-accent-500" : "bg-white"
            )} />
          </div>
        ))}
      </div>
      <div className="hidden sm:flex justify-between -mt-1 mb-9" aria-hidden="true">
        <span className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">wk 0</span>
        <span className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">wk 12 →</span>
      </div>

      <ol className="grid sm:grid-cols-4 gap-x-10 gap-y-8">
        {PHASES.map((p) => (
          <li key={p.title} className="border-l-2 border-ink-950 pl-4 sm:border-0 sm:pl-0">
            <p className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
              {p.n} · {p.span}
            </p>
            <h3 className="display-md mt-2">{p.title}</h3>
            <p className="text-[14px] leading-snug text-[var(--text-secondary)] mt-1.5 max-w-[26ch]">{p.line}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
