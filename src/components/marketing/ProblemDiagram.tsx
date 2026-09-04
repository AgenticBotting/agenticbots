import { Section } from "@/components/ui";

/**
 * The problem, stated as an engineering problem: the tools exist,
 * the wiring doesn't. Left panel is deliberately chaotic wiring on a
 * strictly ordered grid — chaos in the lines, never in the boxes.
 */

const GRID: (string | null)[][] = [
  ["CRM", "Ads", "Email", "Phone", "Forms"],
  ["Calendar", "Chat", "Billing", "Sheets", "Analytics"],
  [null, "Slack", "Reviews", "DMs", "Site"],
];
const COL_X = [66, 154, 242, 330, 418];
const ROW_Y = [46, 128, 210];

/* A fixed, art-directed set of crossings — enough to read as spaghetti,
   few enough to stay a drawing. */
const WIRES: [number, number, number, number][] = [
  [0, 0, 3, 2], [0, 0, 4, 1], [1, 0, 2, 2], [1, 0, 4, 2], [2, 0, 1, 1],
  [3, 0, 0, 1], [3, 0, 1, 2], [4, 0, 2, 1], [0, 1, 4, 2], [2, 1, 4, 0],
  [1, 1, 3, 2], [3, 1, 1, 2], [0, 1, 2, 2], [4, 1, 0, 0], [2, 2, 0, 0],
];

function Tangle() {
  return (
    <svg viewBox="0 0 480 256" className="w-full h-auto" role="img"
      aria-label="14 disconnected tools joined by tangled point-to-point connections">
      {WIRES.map(([c1, r1, c2, r2], i) => {
        const x1 = COL_X[c1], y1 = ROW_Y[r1], x2 = COL_X[c2], y2 = ROW_Y[r2];
        const bend = (i % 2 ? 26 : -22) + (i % 3) * 8;
        return (
          <path key={i} fill="none" stroke="var(--border-strong)" strokeWidth="1" opacity="0.6"
            d={`M${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + bend}, ${x2} ${y2}`} />
        );
      })}
      {GRID.flatMap((row, r) =>
        row.map((t, c) =>
          t && (
            <g key={t}>
              <rect x={COL_X[c] - 38} y={ROW_Y[r] - 14} width="76" height="28"
                fill="var(--background)" stroke="var(--border-strong)" />
              <text x={COL_X[c]} y={ROW_Y[r] + 4} textAnchor="middle" fontSize="10.5"
                fontFamily="var(--font-mono)" fill="var(--text-secondary)">{t}</text>
            </g>
          )
        )
      )}
    </svg>
  );
}

function Orchestrated() {
  const left = ["CRM", "Ads", "Email", "Phone", "Forms", "Calendar", "Analytics"];
  const right = ["booked calls", "sent quotes", "clean records", "one report"];
  const inY = (i: number) => 26 + i * 34;
  const outY = (i: number) => 47 + i * 54;
  return (
    <svg viewBox="0 0 480 256" className="w-full h-auto" role="img"
      aria-label="The same tools connected through one agent layer, flowing to booked revenue">
      {left.map((t, i) => (
        <g key={t}>
          <path d={`M108 ${inY(i)} C 150 ${inY(i)}, 158 128, 190 128`} fill="none"
            stroke="var(--color-accent-500)" strokeWidth="1.4" opacity="0.75" />
          <rect x="20" y={inY(i) - 13} width="88" height="26" fill="var(--background)" stroke="var(--border-strong)" />
          <text x="64" y={inY(i) + 3.5} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill="var(--text-secondary)">{t}</text>
        </g>
      ))}
      {right.map((t, i) => (
        <g key={t}>
          <path d={`M330 128 C 362 128, 356 ${outY(i)}, 380 ${outY(i)}`} fill="none"
            stroke="var(--color-accent-500)" strokeWidth="1.4" opacity="0.75" />
          <rect x="380" y={outY(i) - 13} width="82" height="26" fill="var(--bg-tint)" stroke="var(--border-tint)" />
          <text x="421" y={outY(i) + 3.5} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--accent-text)">{t}</text>
        </g>
      ))}
      <rect x="190" y="94" width="140" height="68" fill="var(--color-ink-950)" />
      <text x="260" y="122" textAnchor="middle" fontSize="13" fontWeight="600"
        fontFamily="var(--font-geist-sans)" fill="#FFFFFF">agent layer</text>
      <text x="260" y="142" textAnchor="middle" fontSize="8.5" fontFamily="var(--font-mono)"
        fill="var(--color-accent-300)" letterSpacing="0.5">13 BOTS · SHARED CONTEXT</text>
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
      sub="Every business already pays for the stack. What's missing is the layer that makes fourteen disconnected tools behave like one system."
    >
      <div className="grid md:grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] grid-frame">
        <figure className="card-cell p-7 flex flex-col">
          <figcaption className="mono text-[11px] uppercase tracking-[0.11em] text-[var(--text-muted)] mb-6">
            Today — 14 tools, point-to-point
          </figcaption>
          <div className="my-auto"><Tangle /></div>
        </figure>
        <figure className="card-cell p-7 flex flex-col">
          <figcaption className="mono text-[11px] uppercase tracking-[0.11em] text-[var(--accent-text)] mb-6">
            With the agent layer
          </figcaption>
          <div className="my-auto"><Orchestrated /></div>
        </figure>
      </div>
    </Section>
  );
}
