import { requirePortalPage } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";
import { portalData, portalReport } from "@/server/views/portal";
import { ApprovalCard, BotGrid, Feed, Results, SectionHead } from "@/components/platform/portal";
import { RequestBox } from "@/components/platform/RequestBox";

export const metadata = { title: "Overview" };

export default async function PortalOverview() {
  const { actor, org, preview } = await requirePortalPage();
  const [d, report] = await Promise.all([portalData(org), portalReport(org, 30)]);
  const pending = d.approvals.filter((a) => a.status === "pending");
  const canDecide = can(actor, "portal.approvals.resolve", org.id);
  return (
    <>
      <h1>{org.name}</h1>
      <p className="lede">What your Bots did in the last 30 days, what needs your decision, and how to ask for more.</p>

      {d.notices.map((n, i) => <div key={i} className="pf-banner watch mt-5" role="status">{n}</div>)}

      <section className="pf-section" aria-label="Results">
        <SectionHead title="Results, last 30 days" href="/portal/reports" linkLabel="Full report" />
        <Results results={report.results} />
      </section>

      {pending.length > 0 && (
        <section className="pf-section" aria-label="Needs your approval">
          <SectionHead title={`Needs your approval (${pending.length})`} href="/portal/approvals" linkLabel="See all" />
          {pending.slice(0, 2).map((a) => <ApprovalCard key={a.id} a={a} readOnly={preview} canDecide={canDecide} />)}
        </section>
      )}

      <section className="pf-section">
        <RequestBox disabled={preview} compact />
      </section>

      <section className="pf-section" aria-label="Your Bots">
        <SectionHead title="Your Bots" />
        <BotGrid bots={d.bots} />
      </section>

      <section className="pf-section" aria-label="Recent activity">
        <SectionHead title="Recent activity" href="/portal/activity" linkLabel="All activity" />
        <Feed items={d.activity.slice(0, 7)} />
      </section>
    </>
  );
}
