/**
 * Proof strip under the hero (audit fix #3).
 *
 * ILLUSTRATIVE DATA — these are the targets the systems are built to
 * hit, not measured client results. The on-screen label says exactly
 * that and must keep saying it until verified figures replace these.
 */
const PROOF = [
  { v: "38%", l: "target lift in booked leads, first 60 days" },
  { v: "41s", l: "first-response target, any hour of the week" },
  { v: "6.2k", l: "agent actions a week at full deployment" },
  { v: "0", l: "leads left for an unanswered night or weekend" },
];

export function ProofBar() {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-alt)]">
      <div className="container-site">
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {PROOF.map((p, i) => (
            <div
              key={p.l}
              className={
                "flex items-baseline gap-3 py-5 px-1 " +
                (i > 0 ? "lg:border-l lg:border-[var(--border)] lg:pl-8" : "")
              }
            >
              <dt className="text-[1.25rem] font-semibold tracking-[-0.03em] tabular-nums shrink-0">
                {p.v}
              </dt>
              <dd className="body-xs leading-snug">{p.l}</dd>
            </div>
          ))}
        </dl>
        <p className="mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)] pb-3 -mt-1">
          Illustrative — targets the fleet is built to hit, not client results
        </p>
      </div>
    </div>
  );
}
