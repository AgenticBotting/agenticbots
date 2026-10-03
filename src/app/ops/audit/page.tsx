import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { can } from "@/server/auth/policy";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, Empty } from "@/components/platform/ui";
import { AuditTable } from "@/components/platform/lists";

export const metadata = { title: "Audit Log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ client?: string; action?: string }> }) {
  const actor = await requireOperatorPage();
  if (!can(actor, "ops.audit.read")) return <Empty title="You do not have access to the audit log" />;
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  let rows = (await r.list("audit_logs", { limit: 1000 })).filter((a) => !a.orgId || L.visible(a.orgId));
  if (sp.client) rows = rows.filter((a) => a.orgId === sp.client);
  if (sp.action) rows = rows.filter((a) => a.action.includes(sp.action!));
  return (
    <>
      <PageHead title="Audit Log" description="Who did what, to which client, with what result. Append-only; secrets are never recorded." />
      <form className="pf-filters">
        <select name="client" defaultValue={sp.client ?? ""} className="field" aria-label="Client"><option value="">All clients</option>{L.orgList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <input name="action" defaultValue={sp.action} className="field" placeholder="Action contains (e.g. billing, suspend)" aria-label="Action" />
        <button className="btn btn-outline">Filter</button>
      </form>
      <Panel flush><AuditTable rows={rows.slice(0, 300)} names={{ orgs: L.orgs }} /></Panel>
    </>
  );
}
