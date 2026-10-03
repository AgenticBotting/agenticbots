import Link from "next/link";
import { requirePortalPage } from "@/server/auth/guard";
import { portalData, portalReport } from "@/server/views/portal";
import { BotWork, SectionHead } from "@/components/platform/portal";
import { ColumnChart, MetricExplorer } from "@/components/platform/charts";
import { num, shortDate } from "@/lib/platform/format";

export const metadata = { title: "Reports" };

const RANGES = [7, 30, 90] as const;

function change(total: number, previous: number): { text: string; dir: "up" | "down" | "flat" } {
  if (previous === 0) return { text: total > 0 ? "new" : "—", dir: "flat" };
  const pct = Math.round(((total - previous) / previous) * 100);
  return { text: `${pct > 0 ? "+" : ""}${pct}%`, dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

function hours(h: number): string {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} days`;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { org } = await requirePortalPage();
  const asked = Number((await searchParams).days);
  const days = (RANGES as readonly number[]).includes(asked) ? asked : 30;
  const [rep, d] = await Promise.all([portalReport(org, days), portalData(org)]);
  const decided = rep.approvals.approved + rep.approvals.denied + rep.approvals.expired;
  const approvalRate = decided ? Math.round((rep.approvals.approved / decided) * 100) : null;
  const runsTotal = rep.runs.completed + rep.runs.failed;
  const taskRate = runsTotal ? Math.round((rep.runs.completed / runsTotal) * 100) : null;

  return (
    <>
      <div className="pf-dash-head">
        <div>
          <h1>Reports</h1>
          <p className="lede">Counts of real work your Bots reported. No projections — revenue appears here only once a connected system reports it.</p>
        </div>
        <nav className="pf-range" aria-label="Report period">
          {RANGES.map((r) => (
            <Link key={r} href={`/portal/reports?days=${r}`} aria-current={r === days ? "page" : undefined} scroll={false}>
              {r} days
            </Link>
          ))}
        </nav>
      </div>

      <section className="pf-section" aria-label="Results over time">
        <MetricExplorer dates={rep.dates} series={rep.series} periodLabel={rep.periodLabel} maxTabs={6} />
      </section>

      <div className="pf-dash-split even">
        <section className="pf-section pf-card">
          <SectionHead title="Work by Bot" />
          <BotWork bots={d.bots} cards={rep.bots} />
        </section>
        <section className="pf-section pf-card">
          <SectionHead title="Updates by week" />
          <ColumnChart
            label="Bot updates per week"
            labels={rep.weekly.map((w) => shortDate(w.weekStart))}
            values={rep.weekly.map((w) => w.activities)}
          />
          <p className="pf-note">Each bar is one week of Bot updates. The darkest bar is the current week.</p>
        </section>
      </div>

      <section className="pf-section" aria-label="Decisions, requests and reliability">
        <SectionHead title="Decisions, requests and reliability" />
        <div className="pf-kpis">
          <div className="pf-kpi">
            <span className="l">Approval rate</span>
            {approvalRate === null ? (
              <span className="s">No decisions in this period yet.</span>
            ) : (
              <>
                <span className="v">{approvalRate}%</span>
                <div className="pf-meter" aria-hidden="true"><span style={{ width: `${approvalRate}%` }} /></div>
                <span className="s">{num(rep.approvals.approved)} approved, {num(rep.approvals.denied)} declined, {num(rep.approvals.expired)} expired</span>
              </>
            )}
          </div>
          <div className="pf-kpi">
            <span className="l">Typical time to decide</span>
            {rep.approvalMedianHours === null ? (
              <span className="s">Shown once you have decided on something.</span>
            ) : (
              <>
                <span className="v">{hours(rep.approvalMedianHours)}</span>
                <span className="s">Median time from a Bot asking to your decision</span>
              </>
            )}
          </div>
          <div className="pf-kpi">
            <span className="l">Requests</span>
            <span className="v">{num(rep.requests.completed)}</span>
            <span className="s">completed in this period, {num(rep.requests.open)} still open, {num(rep.requests.submitted)} new</span>
          </div>
          <div className="pf-kpi">
            <span className="l">Tasks finished</span>
            <span className="v">{taskRate === null ? "—" : `${taskRate}%`}</span>
            <div className="pf-meter" aria-hidden="true"><span style={{ width: `${taskRate ?? 0}%` }} /></div>
            <span className="s">{num(rep.runs.completed)} of {num(runsTotal)} Bot tasks completed</span>
          </div>
          <div className="pf-kpi">
            <span className="l">Scheduled work</span>
            <span className="v">{rep.automations.successRatePct === null ? "—" : `${rep.automations.successRatePct}%`}</span>
            <div className="pf-meter" aria-hidden="true"><span style={{ width: `${rep.automations.successRatePct ?? 0}%` }} /></div>
            <span className="s">of {num(rep.automations.runs)} scheduled runs finished successfully</span>
          </div>
        </div>
      </section>

      <section className="pf-section" aria-label="All results">
        <SectionHead title="All results" />
        {rep.series.length === 0 ? (
          <p className="pf-muted">No results reported in this period.</p>
        ) : (
          <div className="pf-table-wrap">
            <table className="pf-table text-[14px]">
              <thead><tr><th>Result</th><th className="num">{rep.periodLabel}</th><th className="num">Prior {days} days</th><th className="num">Change</th></tr></thead>
              <tbody>
                {rep.series.map((s) => {
                  const c = change(s.total, s.previous);
                  return (
                    <tr key={s.key}>
                      <td>{s.label}</td>
                      <td className="num font-semibold">{num(s.total)}</td>
                      <td className="num pf-muted">{num(s.previous)}</td>
                      <td className={`num pf-change ${c.dir}`}>{c.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="pf-note">Period: {shortDate(rep.from.slice(0, 10))} to {shortDate(rep.to.slice(0, 10))}. Results are sums of numbers your Bots reported when they finished work.</p>
      </section>
    </>
  );
}
