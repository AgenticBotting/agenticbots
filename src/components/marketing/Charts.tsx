/**
 * Chart primitives (Phase 5). Hand-rolled SVG rather than Recharts/visx:
 * we render three static-data charts, and either library costs 40–90KB
 * gzipped against a 150KB route budget. SSR-safe by construction, animated
 * by CSS only, each with a visually-hidden table for screen readers.
 *
 * ILLUSTRATIVE DATA — labeled as such in-UI until real client series exist.
 */

const decay = [420, 396, 350, 287, 231, 196, 178, 171, 166, 158, 155, 151];

export function CplDecayChart() {
  const W = 560, H = 220, P = 36;
  const max = 450;
  const x = (i: number) => P + (i * (W - P * 2)) / (decay.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - P * 2);
  const path = decay.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join(" ");

  return (
    <figure className="card p-6 sm:p-7">
      <figcaption className="flex items-baseline justify-between gap-4 mb-4">
        <span className="display-md">Cost per lead across implementation</span>
        <span className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">illustrative</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
        aria-label="Line chart: cost per lead falls from $420 in week 1 to $151 by week 12, with the steepest drop in weeks 3 to 6.">
        {[100, 200, 300, 400].map((v) => (
          <g key={v}>
            <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={P - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-muted)">${v}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="var(--color-accent-500)" strokeWidth="2.25" />
        {decay.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === decay.length - 1 ? 4 : 2.25}
            fill={i === decay.length - 1 ? "var(--color-accent-500)" : "var(--background)"}
            stroke="var(--color-accent-500)" strokeWidth="1.5" />
        ))}
        <text x={x(11)} y={y(151) - 12} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--accent-text)" fontFamily="var(--font-geist-sans)">$151</text>
        <text x={P} y={H - 8} fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-muted)">wk 1</text>
        <text x={W - P} y={H - 8} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-muted)">wk 12</text>
      </svg>
      <table className="sr-only">
        <caption>Cost per lead by week</caption>
        <thead><tr><th>Week</th><th>Cost per lead</th></tr></thead>
        <tbody>{decay.map((v, i) => <tr key={i}><td>{i + 1}</td><td>${v}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

const pairs = [
  { label: "Leads answered <60s", before: 22, after: 98, unit: "%" },
  { label: "Quotes followed up", before: 41, after: 100, unit: "%" },
  { label: "CRM records current", before: 34, after: 96, unit: "%" },
];

export function BeforeAfterChart() {
  return (
    <figure className="card p-6 sm:p-7">
      <figcaption className="flex items-baseline justify-between gap-4 mb-5">
        <span className="display-md">Before / after deployment</span>
        <span className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">illustrative</span>
      </figcaption>
      <div className="space-y-5" role="img"
        aria-label="Bar chart comparing before and after agent deployment: leads answered under 60 seconds rise from 22% to 98%; quotes followed up from 41% to 100%; CRM records current from 34% to 96%.">
        {pairs.map((p) => (
          <div key={p.label}>
            <p className="text-[13px] font-medium tracking-[-0.01em] mb-2">{p.label}</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="h-3 bg-[var(--border-strong)]" style={{ width: `${p.before * 0.82}%` }} />
                <span className="mono text-[11px] tabular-nums text-[var(--text-muted)]">{p.before}{p.unit} before</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 bg-accent-500" style={{ width: `${p.after * 0.82}%` }} />
                <span className="mono text-[11px] tabular-nums font-medium text-[var(--accent-text)]">{p.after}{p.unit} after</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Metrics before and after agent deployment</caption>
        <thead><tr><th>Metric</th><th>Before</th><th>After</th></tr></thead>
        <tbody>{pairs.map((p) => <tr key={p.label}><td>{p.label}</td><td>{p.before}{p.unit}</td><td>{p.after}{p.unit}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
