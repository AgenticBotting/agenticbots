/**
 * The hero visual: a terminal, drawn rather than screenshotted.
 *
 * Course pages usually put a laptop mockup or a stock photo of someone
 * pointing at a whiteboard here. Neither says anything. What this
 * product actually looks like is a command and its output, so that is
 * what goes in the hero — and coded in SVG-free markup so it stays sharp
 * and weighs nothing.
 *
 * The content is real: this is what the module 04 script prints.
 */

const LINES: { kind: "cmd" | "out" | "ok" | "warn" | "dim"; text: string }[] = [
  { kind: "cmd", text: "claude run daily-review --account ridgeline" },
  { kind: "dim", text: "" },
  { kind: "dim", text: "Reading yesterday · 412 search terms · $284.17 spent" },
  { kind: "dim", text: "" },
  { kind: "warn", text: "12 terms flagged as waste — $63.40 (22% of spend)" },
  { kind: "out", text: '  "roofing jobs near me salary"   $18.22  · job seekers' },
  { kind: "out", text: '  "how to repair a roof yourself" $14.05  · DIY intent' },
  { kind: "out", text: '  "roofing companies hiring"      $11.80  · recruitment' },
  { kind: "dim", text: "  …9 more" },
  { kind: "dim", text: "" },
  { kind: "ok", text: "Applied 12 negatives to Ridgeline / Emergency Repair" },
  { kind: "ok", text: "Moved $40/day Brand → Emergency Repair (3.1x ROAS)" },
  { kind: "warn", text: "Held for review: pause 'Gutter Cleaning' — over cap" },
  { kind: "dim", text: "" },
  { kind: "dim", text: "Logged to changes.jsonl · 4.2s" },
];

const TONE = {
  cmd: "text-[var(--color-accent-300)]",
  out: "text-[var(--color-ink-200)]",
  ok: "text-[var(--color-accent-300)]",
  warn: "text-[#E8A13C]",
  dim: "text-[var(--color-ink-400)]",
} as const;

export function TerminalDemo() {
  return (
    <div className="min-w-0 border border-[var(--dark-border)] bg-[var(--color-ink-950)]">
      {/* Window chrome, minus the fake traffic lights — this is a
          terminal someone runs, not a screenshot of a Mac. */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--dark-border)]">
        <span className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-ink-400)]">
          module 04 · daily review
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-[var(--color-accent-500)]" />
          <span className="mono text-[10.5px] text-[var(--color-ink-400)]">live</span>
        </span>
      </div>

      <pre className="overflow-x-auto p-3.5 sm:p-4 text-[10.5px] sm:text-[12px] leading-[1.75]">
        <code className="mono">
          {LINES.map((line, index) => (
            <span key={index} className={`block ${TONE[line.kind]}`}>
              {line.kind === "cmd" ? `$ ${line.text}` : line.text || " "}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
