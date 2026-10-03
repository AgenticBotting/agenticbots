import Link from "next/link";
import { requirePortalPage } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";
import { portalData, portalReport } from "@/server/views/portal";
import { ApprovalList, BotGrid, Feed, SectionHead } from "@/components/platform/portal";
import { MetricExplorer } from "@/components/platform/charts";
import { RequestBox } from "@/components/platform/RequestBox";

export const metadata = { title: "Overview" };

export default async function PortalOverview() {
  const { actor, org, preview } = await requirePortalPage();
  const [d, report] = await Promise.all([portalData(org), portalReport(org, 30)]);
  const pending = d.approvals.filter((a) => a.status === "pending");
  const canDecide = can(actor, "portal.approvals.resolve", org.id);
  return (
    <>
      <div className="pf-dash-head">
        <div>
          <h1>{org.name}</h1>
          <p className="lede">What your Bots got done in the last 30 days, and what is waiting for you.</p>
        </div>
        <Link href="/portal/reports" className="btn btn-outline">Open full report</Link>
      </div>

      {d.notices.map((n, i) => <div key={i} className="pf-banner watch mt-5" role="status">{n}</div>)}

      <section className="pf-section" aria-label="Results">
        <MetricExplorer dates={report.dates} series={report.series} periodLabel="Last 30 days" />
      </section>

      <div className="pf-dash-split">
        <section className="pf-section" aria-label="Waiting for your approval">
          <SectionHead title={pending.length ? `Waiting for your approval` : "Nothing waiting for you"} count={pending.length || undefined} href="/portal/approvals" linkLabel="All approvals" />
          {pending.length > 0 ? (
            <ApprovalList items={pending.slice(0, 3)} readOnly={preview} canDecide={canDecide} />
          ) : (
            <p className="pf-empty">When a Bot prepares something that leaves your business — an email, a post, an ad change — it waits here for your decision.</p>
          )}
        </section>

        <section className="pf-section" aria-label="Recent activity">
          <SectionHead title="Recent activity" href="/portal/activity" linkLabel="All activity" />
          <Feed items={d.activity.slice(0, 8)} compact />
        </section>
      </div>

      <section className="pf-section" aria-label="Your Bots">
        <SectionHead title="Your Bots" />
        <BotGrid bots={d.bots} cards={report.bots} days={30} />
      </section>

      <section className="pf-section">
        <RequestBox disabled={preview} compact />
      </section>
    </>
  );
}
