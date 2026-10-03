import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel } from "@/components/platform/ui";
import { BotsTable } from "@/components/platform/lists";
import { BOT_CATALOG } from "@/config/bot-catalog";

export const metadata = { title: "Bots" };

export default async function BotsPage({ searchParams }: { searchParams: Promise<{ client?: string; type?: string; status?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  const runs = await r.list("runs", { limit: 300 });
  let bots = [...L.bots.values()];
  if (sp.client) bots = bots.filter((b) => b.orgId === sp.client);
  if (sp.type) bots = bots.filter((b) => b.typeKey === sp.type);
  if (sp.status === "error") bots = bots.filter((b) => b.status === "error" || !!b.errorState);
  else if (sp.status) bots = bots.filter((b) => b.status === sp.status);
  return (
    <>
      <PageHead title="Bots" description="Every Bot across every client. Open one to run it, change its model, skills or integration access." />
      <form className="pf-filters">
        <select name="client" defaultValue={sp.client ?? ""} className="field" aria-label="Client"><option value="">All clients</option>{L.orgList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <select name="type" defaultValue={sp.type ?? ""} className="field" aria-label="Bot type"><option value="">All Bot types</option>{BOT_CATALOG.map((t) => <option key={t.key} value={t.key}>{t.displayName}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} className="field" aria-label="Status"><option value="">Any status</option><option value="active">Active</option><option value="working">Working</option><option value="monitoring">Monitoring</option><option value="disabled">Disabled</option><option value="error">Has error</option><option value="provisioning">Provisioning</option></select>
        <button type="submit" className="btn btn-outline">Apply</button>
      </form>
      <Panel flush><BotsTable bots={bots} names={{ orgs: L.orgs, bots: L.bots }} runs={new Map(runs.map((x) => [x.id, x]))} /></Panel>
    </>
  );
}
