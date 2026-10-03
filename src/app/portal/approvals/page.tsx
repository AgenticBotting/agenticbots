import { requirePortalPage } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";
import { portalData } from "@/server/views/portal";
import { ApprovalList, SectionHead } from "@/components/platform/portal";

export const metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const { actor, org, preview } = await requirePortalPage();
  const d = await portalData(org);
  const pending = d.approvals.filter((a) => a.status === "pending");
  const past = d.approvals.filter((a) => a.status !== "pending").slice(0, 20);
  const canDecide = can(actor, "portal.approvals.resolve", org.id);
  return (
    <>
      <h1>Approvals</h1>
      <p className="lede">Nothing is sent, published or changed in your accounts until you approve it here.</p>
      <section className="pf-section">
        <SectionHead title={pending.length ? `Waiting for you (${pending.length})` : "Nothing waiting for you"} />
        {pending.length === 0 && <p className="pf-muted">When a Bot prepares something that leaves your business — an email, a post, an ad change — it will wait here for you.</p>}
        {pending.length > 0 && <ApprovalList items={pending} readOnly={preview} canDecide={canDecide} />}
      </section>
      {past.length > 0 && (
        <section className="pf-section">
          <SectionHead title="Decided" />
          <ApprovalList items={past} readOnly canDecide={false} />
        </section>
      )}
    </>
  );
}
