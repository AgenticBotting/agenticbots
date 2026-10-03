import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks } from "@/components/platform/ui";
import { ApprovalsTable } from "@/components/platform/lists";
import { ActionButton } from "@/components/platform/actions";
import * as A from "../actions";

export const metadata = { title: "Approvals" };

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const status = sp.status ?? "pending";
  const r = await repo();
  const L = await lookups(r, actor);
  const all = (await r.list("approvals")).filter((a) => L.visible(a.orgId));
  let rows = all;
  if (status !== "all") rows = rows.filter((a) => a.status === status);
  return (
    <>
      <PageHead title="Approvals" description="Sends, publishing, ad changes and CRM writes wait here. Clients decide their own business actions; AgenticBots decides runtime-level ones." />
      <FilterLinks current={status} items={["pending", "approved", "denied", "expired", "all"].map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1), href: `/ops/approvals?status=${s}`, count: s === "all" ? all.length : all.filter((a) => a.status === s).length }))} />
      <Panel flush>
        <ApprovalsTable approvals={rows} names={{ orgs: L.orgs, bots: L.bots }} actions={(a) => a.status === "pending" ? (
          <div className="flex gap-1.5">
            <ActionButton action={A.resolveApprovalAction} hidden={{ approvalId: a.id, decision: "approve" }} label={a.audience === "client" ? "Approve for client" : "Approve"} variant="primary" />
            <ActionButton action={A.resolveApprovalAction} hidden={{ approvalId: a.id, decision: "deny" }} label="Deny" variant="ghost" />
          </div>
        ) : null} />
      </Panel>
    </>
  );
}
