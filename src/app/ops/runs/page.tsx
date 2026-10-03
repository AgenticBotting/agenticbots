import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks } from "@/components/platform/ui";
import { RunsTable } from "@/components/platform/lists";
import { isActive } from "@/server/services/runs";

export const metadata = { title: "Runs" };

export default async function RunsPage({ searchParams }: { searchParams: Promise<{ status?: string; bot?: string; client?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  let runs = (await r.list("runs", { limit: 500 })).filter((x) => L.visible(x.orgId));
  if (sp.status === "active") runs = runs.filter((x) => isActive(x.status));
  else if (sp.status === "failed") runs = runs.filter((x) => x.status === "failed" || x.status === "interrupted");
  else if (sp.status) runs = runs.filter((x) => x.status === sp.status);
  if (sp.bot) runs = runs.filter((x) => x.botId === sp.bot);
  if (sp.client) runs = runs.filter((x) => x.orgId === sp.client);
  const q = (s: string) => `/ops/runs?${new URLSearchParams({ ...(sp.client ? { client: sp.client } : {}), ...(sp.bot ? { bot: sp.bot } : {}), ...(s ? { status: s } : {}) })}`;
  return (
    <>
      <PageHead title="Runs" description="Every Bot Run. Open one for its timeline, usage and runtime identifiers." />
      <FilterLinks current={sp.status ?? ""} items={[
        { key: "", label: "All", href: q("") }, { key: "active", label: "Active", href: q("active") },
        { key: "waiting_for_approval", label: "Waiting for approval", href: q("waiting_for_approval") },
        { key: "failed", label: "Failed", href: q("failed") }, { key: "completed", label: "Completed", href: q("completed") },
        { key: "cancelled", label: "Cancelled", href: q("cancelled") },
      ]} />
      <form className="pf-filters">
        <input type="hidden" name="status" value={sp.status ?? ""} />
        <select name="client" defaultValue={sp.client ?? ""} className="field" aria-label="Client"><option value="">All clients</option>{L.orgList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <button className="btn btn-outline" type="submit">Apply</button>
      </form>
      <Panel flush><RunsTable runs={runs} names={{ orgs: L.orgs, bots: L.bots }} /></Panel>
    </>
  );
}
