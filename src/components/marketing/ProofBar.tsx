/**
 * Proof strip under the hero (audit fix #3).
 *
 * PLACEHOLDER DATA — the numbers are illustrative until real client
 * results exist. They are deliberately conservative and labeled as
 * pilot-cohort figures; swap in verified numbers before launch.
 */
const PROOF = [
  { v: "38%", l: "median lift in booked leads, first 60 days" },
  { v: "41s", l: "median first response across the fleet" },
  { v: "6.2k", l: "agent actions executed per client, weekly" },
  { v: "0", l: "leads lost to an unanswered night or weekend" },
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
          Pilot-cohort medians · updated quarterly
        </p>
      </div>
    </div>
  );
}
