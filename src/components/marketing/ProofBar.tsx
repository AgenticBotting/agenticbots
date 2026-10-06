/**
 * The capability band under the hero.
 *
 * A compact statement of the controls present in a managed deployment.
 * It intentionally avoids synthetic targets while client proof develops.
 */
const PROOF = [
  { v: "Defined", l: "Operating mandate", sub: "Inputs, owners and acceptance criteria" },
  { v: "Scoped", l: "System authority", sub: "Access and boundaries agreed before launch" },
  { v: "Approved", l: "External action", sub: "Human control where the policy requires it" },
  { v: "Recorded", l: "BOT ACTIVITY", sub: "Runs, decisions and exceptions remain reviewable" },
];

export function ProofBar() {
  return (
    <section className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
      <div className="container-site section-pad-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <p className="eyebrow">Control model</p>
          <p className="mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
            The operating standard for a managed deployment
          </p>
        </div>

        <dl className="mt-9 grid grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] border-y border-[var(--border)]">
          {PROOF.map((p) => (
            /* The left padding used to be lg-only, so on the 2-up mobile grid
               there was none — column one read fine against the container edge
               but column two sat flush on the divider. Pad the even cells on
               mobile; at lg the first cell still runs flush so the numerals
               line up with the eyebrow above them. */
            <div
              key={p.l}
              className="bg-[var(--bg-alt)] py-8 pl-0 pr-5 even:pl-5 lg:pl-8 lg:pr-6 lg:first:pl-0"
            >
              <dt className="flex items-baseline">
                <span className="text-[clamp(1.6rem,3vw,2.4rem)] font-semibold tracking-[-0.04em] leading-[0.95] text-[var(--foreground)]">{p.v}</span>
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
