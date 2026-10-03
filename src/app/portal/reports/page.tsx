import { requirePortalPage } from "@/server/auth/guard";
import { portalReport } from "@/server/views/portal";
import { Results, SectionHead } from "@/components/platform/portal";
import { dateLabel, num } from "@/lib/platform/format";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { org } = await requirePortalPage();
  const days = [7, 30, 90].includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const rep = await portalReport(org, days);
  const max = Math.max(1, ...rep.weekly.map((w) => w.activities));
  return (
    <>
      <h1>Reports</h1>
      <p className="lede">Counts of real work from your Bots and your requests. No projections — revenue appears here only once a connected system reports it.</p>
      <form className="pf-filters mt-6">
        <label className="sr-only" htmlFor="days">Period</label>
        <select id="days" name="days" defaultValue={String(days)} className="field"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>
        <button className="btn btn-outline">Show</button>
      </form>
      <section className="pf-section"><SectionHead title={`Results — ${rep.periodLabel.toLowerCase()}`} /><Results results={rep.results} /></section>

      <section className="pf-section">
        <SectionHead title="Work by Bot" />
        {rep.workByBot.length === 0 ? <p className="pf-muted">No Bot work in this period.</p> : (
          <div className="pf-table-wrap"><table className="pf-table text-[14px]"><thead><tr><th>Bot</th><th className="num">Activities</th><th className="num">Completed tasks</th></tr></thead>
            <tbody>{rep.workByBot.map((w) => <tr key={w.botId}><td>{w.botName}</td><td className="num">{w.activities}</td><td className="num">{w.completedRuns}</td></tr>)}</tbody></table></div>
        )}
      </section>

      <section className="pf-section">
        <SectionHead title="Activity by week" />
        <div className="grid gap-2" role="list">
          {rep.weekly.map((w) => (
            <div key={w.weekStart} role="listitem" className="grid grid-cols-[110px_1fr_40px] gap-3 items-center text-[14px]">
              <span className="pf-muted">Week of {dateLabel(w.weekStart)}</span>
              <div className="pf-bar"><span style={{ width: `${(w.activities / max) * 100}%` }} /></div>
              <span className="text-right tabular-nums">{w.activities}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="pf-section">
        <SectionHead title="Requests, approvals and automations" />
        <div className="pf-results">
          <div className="pf-result"><div className="v">{num(rep.requests.completed)}</div><div className="l">Requests completed ({rep.requests.open} open)</div></div>
          <div className="pf-result"><div className="v">{num(rep.approvals.approved)}</div><div className="l">Actions you approved ({rep.approvals.denied} declined)</div></div>
          <div className="pf-result"><div className="v">{rep.automations.successRatePct === null ? "—" : `${rep.automations.successRatePct}%`}</div><div className="l">Scheduled work that finished successfully</div></div>
        </div>
      </section>
    </>
  );
}
