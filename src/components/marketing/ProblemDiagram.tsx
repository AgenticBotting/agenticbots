import { Section } from "@/components/ui";

/**
 * The problem, stated as an engineering problem (audit fix #10):
 * the tools exist, the wiring doesn't. Pure SVG — no chart lib.
 */

const TOOLS = ["CRM", "Ads", "Email", "Phone", "Forms", "Calendar", "Chat", "Analytics", "Billing", "Sheets", "Slack", "Reviews", "DMs", "Site"];

function Tangle() {
  // Deterministic scatter of tool nodes with crossing lines.
  const pts = TOOLS.map((t, i) => ({
    t,
    x: 40 + (i % 5) * 88 + ((i * 37) % 23),
    y: 30 + Math.floor(i / 5) * 74 + ((i * 53) % 19),
  }));
  return (
    <svg viewBox="0 0 480 260" className="w-full h-auto" role="img"
      aria-label={`${TOOLS.length} disconnected tools with tangled point-to-point connections`}>
      {pts.map((a, i) =>
        pts.slice(i + 1).filter((_, j) => (i * 7 + j) % 3 === 0).map((b) => (
          <line key={a.t + b.t} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="var(--border-strong)" strokeWidth="1" opacity="0.55" />
        ))
      )}
      {pts.map((p) => (
        <g key={p.t}>
          <rect x={p.x - 26} y={p.y - 11} width="52" height="22" fill="var(--background)" stroke="var(--border-strong)" />
          <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="9.5"
            fontFamily="var(--font-mono)" fill="var(--text-secondary)">{p.t}</text>
        </g>
      ))}
    </svg>
  );
}

function Orchestrated() {
  const left = ["CRM", "Ads", "Email", "Phone", "Forms", "Calendar", "Analytics"];
  return (
    <svg viewBox="0 0 480 260" className="w-full h-auto" role="img"
      aria-label="The same tools connected through one agent layer, flowing to booked revenue">
      {left.map((t, i) => {
        const y = 34 + i * 32;
        return (
          <g key={t}>
            <rect x="14" y={y - 11} width="76" height="22" fill="var(--background)" stroke="var(--border-strong)" />
            <text x="52" y={y + 3.5} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--text-secondary)">{t}</text>
            <path d={`M90 ${y} C 140 ${y}, 150 130, 196 130`} fill="none" stroke="var(--color-accent-500)" strokeWidth="1.4" opacity="0.8" />
          </g>
        );
      })}
      <rect x="190" y="102" width="132" height="56" fill="var(--color-ink-950)" />
      <text x="256" y="125" textAnchor="middle" fontSize="11" fontWeight="600" fill="#FFFFFF" fontFamily="var(--font-geist-sans)">agent layer</text>
      <text x="256" y="141" textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill="var(--color-accent-300)">13 bots · shared context</text>
      {["booked calls", "sent quotes", "clean records", "one report"].map((t, i) => {
        const y = 58 + i * 40;
        return (
          <g key={t}>
            <path d={`M322 130 C 356 130, 356 ${y}, 388 ${y}`} fill="none" stroke="var(--color-accent-500)" strokeWidth="1.4" opacity="0.8" />
            <rect x="388" y={y - 11} width="80" height="22" fill="var(--bg-tint)" stroke="var(--border-tint)" />
            <text x="428" y={y + 3.5} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--accent-text)">{t}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function ProblemDiagram() {
  return (
    <Section
      id="problem"
      variant="light"
      eyebrow={<>The actual problem <span className="eyebrow-dim">· engineering, not effort</span></>}
      heading="The tools already exist. The wiring doesn't."
      sub="Every business already pays for the stack. What's missing is the layer that makes fourteen disconnected tools behave like one system — reading each other, acting on each other, reporting as one."
    >
      <div className="grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)]">
        <figure className="card-cell p-7">
          <figcaption className="mono text-[11px] uppercase tracking-[0.11em] text-[var(--text-muted)] mb-5">
            Today — 14 tools, point-to-point
          </figcaption>
          <Tangle />
        </figure>
        <figure className="card-cell p-7">
          <figcaption className="mono text-[11px] uppercase tracking-[0.11em] text-[var(--accent-text)] mb-5">
            With the agent layer
          </figcaption>
          <Orchestrated />
        </figure>
      </div>
    </Section>
  );
}
