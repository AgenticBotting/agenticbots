/**
 * The capability band under the hero.
 *
 * These are targets a full deployment is built to hit, not measured
 * client results — we are new and say so in the band itself. The framing
 * is confident rather than apologetic: this is what the system does when
 * it is running, stated plainly, with the caveat owned up front instead
 * of buried in a footnote.
 *
 * Swap in verified numbers when the first client reports them, and the
 * eyebrow changes from "built to do" to "does".
 */
const PROOF = [
  { v: "38", unit: "%", l: "More jobs booked", sub: "Inside the first 60 days" },
  { v: "41", unit: "s", l: "To the first reply", sub: "Any hour, any day" },
  { v: "6.2", unit: "k", l: "Agent actions a week", sub: "Every one of them logged" },
  { v: "0", unit: "", l: "Leads left overnight", sub: "Nights, weekends, holidays" },
];

export function ProofBar() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
      <div className="container-site section-pad-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <p className="eyebrow">What a full deployment is built to do</p>
          <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Targets · not client results · we are new and say so
          </p>
        </div>

        <dl className="mt-9 grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] border-y border-[var(--border)]">
          {PROOF.map((p) => (
            <div key={p.l} className="bg-[var(--bg-alt)] py-8 pr-6 lg:pl-8 first:lg:pl-0">
              <dt className="flex items-baseline">
                <span className="text-[clamp(2.5rem,4.4vw,3.5rem)] font-semibold tracking-[-0.045em] leading-[0.9] tabular-nums text-[var(--foreground)]">
                  {p.v}
                </span>
                {p.unit && (
                  <span className="text-[clamp(1.4rem,2.2vw,1.9rem)] font-semibold tracking-[-0.03em] leading-none text-[var(--accent-text)]">
                    {p.unit}
                  </span>
                )}
              </dt>
              <dd className="mt-4">
                <span className="block text-[15px] font-semibold tracking-[-0.015em] leading-snug">
                  {p.l}
                </span>
                <span className="block body-sm mt-1">{p.sub}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
