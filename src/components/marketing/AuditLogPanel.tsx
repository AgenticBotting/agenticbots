/**
 * A slice of the audit trail — the governance story shown, not told.
 */
const LOG = [
  { t: "14:02:11", a: "sms.send", d: "lead #48210 · template: qualify-2", s: "ok" },
  { t: "14:02:14", a: "crm.update", d: "stage → Estimates · evidence: meeting_held", s: "ok" },
  { t: "14:07:53", a: "bid.adjust", d: "campaign 7 · -12% · reason: cpl > target", s: "ok" },
  { t: "14:11:20", a: "escalate.human", d: "pricing question · routed → Marco", s: "handoff" },
  { t: "14:11:21", a: "action.blocked", d: "discount request · outside authority", s: "blocked" },
  { t: "14:19:07", a: "email.send", d: "quote follow-up #3 · stops on booking", s: "ok" },
];

export function AuditLogPanel() {
  return (
    <div className="rounded-[var(--radius)] border border-ink-700 bg-ink-950 on-dark">
      <div className="flex items-center justify-between px-5 h-11 border-b border-ink-700">
        <span className="mono text-[11px] uppercase tracking-[0.11em] text-ink-300">audit.log</span>
        <span className="mono text-[10.5px] text-ink-500">every action · every reason</span>
      </div>
      <ul className="px-5 py-4 space-y-2.5">
        {LOG.map((l) => (
          <li key={l.t} className="grid grid-cols-[58px_1fr_auto] gap-3 items-baseline">
            <span className="mono text-[11px] tabular-nums text-ink-500">{l.t}</span>
            <span className="min-w-0">
              <span className="mono text-[12px] text-ink-200">{l.a}</span>
              <span className="block text-[11.5px] text-ink-400 truncate">{l.d}</span>
            </span>
            <span className={
              l.s === "ok" ? "mono text-[10px] uppercase text-accent-400"
              : l.s === "handoff" ? "mono text-[10px] uppercase text-ink-300"
              : "mono text-[10px] uppercase text-caution"
            }>
              {l.s}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
