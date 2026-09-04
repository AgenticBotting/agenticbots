/**
 * The implementation timeline as a horizontal rail — week ticks, four
 * nodes, one line each. Replaces four prose cards.
 */

const PHASES = [
  { span: "Days 1–4", title: "Audit", line: "Every lead path traced; leaks ranked by cost. You keep the map.", pos: 4 },
  { span: "Weeks 1–2", title: "Connect", line: "First bot built on your real intake, wired into your stack.", pos: 32 },
  { span: "Weeks 2–3", title: "Launch", line: "Live in monitored mode; every action reviewed daily.", pos: 60 },
  { span: "Ongoing", title: "Tune", line: "Weekly passes; the next bot only after this one proves out.", pos: 88 },
];

export function Timeline() {
  return (
    <div>
      {/* The rail */}
      <div className="relative h-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--border-strong)]" />
        {/* week ticks */}
        {Array.from({ length: 13 }, (_, i) => (
          <div key={i} className="absolute top-1/2 -translate-y-1/2 h-2 w-px bg-[var(--border-strong)]"
            style={{ left: `${(i / 12) * 100}%` }} />
        ))}
        {PHASES.map((p, i) => (
          <div key={p.title} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${p.pos}%` }}>
            <div className={i === 3
              ? "h-4 w-4 border-2 border-ink-950 bg-accent-500"
              : "h-4 w-4 border-2 border-ink-950 bg-white"} />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1 mb-8" aria-hidden="true">
        <span className="mono text-[10px] text-[var(--text-muted)]">wk 0</span>
        <span className="mono text-[10px] text-[var(--text-muted)]">wk 12</span>
      </div>

      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {PHASES.map((p, i) => (
          <li key={p.title}>
            <p className="mono text-[10.5px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
              {String(i + 1).padStart(2, "0")} · {p.span}
            </p>
            <h3 className="display-md mt-2">{p.title}</h3>
            <p className="text-[14px] leading-snug text-[var(--text-secondary)] mt-1.5">{p.line}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
