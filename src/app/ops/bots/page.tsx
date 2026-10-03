import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel } from "@/components/platform/ui";
import { SegBar } from "@/components/platform/viz";
import { BotsTable } from "@/components/platform/lists";
import { BOT_CATALOG } from "@/config/bot-catalog";

export const metadata = { title: "Bots" };

export default async function BotsPage({ searchParams }: { searchParams: Promise<{ client?: string; type?: string; status?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  const runs = await r.list("runs", { limit: 300 });
  const all = [...L.bots.values()];
  let bots = all;
  const count = (f: (b: (typeof all)[number]) => boolean) => all.filter(f).length;
  if (sp.client) bots = bots.filter((b) => b.orgId === sp.client);
  if (sp.type) bots = bots.filter((b) => b.typeKey === sp.type);
  if (sp.status === "attention") bots = bots.filter((b) => b.status === "degraded" || b.status === "offline" || !!b.errorState);
  else if (sp.status) bots = bots.filter((b) => b.status === sp.status);
  return (
    <>
      <PageHead title="Bots" description="Every Bot across every client. Open one to run it, change its model, skills or integration access." />
      <Panel className="mb-4">
        <SegBar
          label="Bots by status"
          items={[
            { label: "Working", value: count((b) => b.status === "working"), tone: "live", href: "/ops/bots?status=working" },
            { label: "Active", value: count((b) => b.status === "active" || b.status === "idle"), tone: "good", href: "/ops/bots?status=active" },
            { label: "Needs attention", value: count((b) => b.status === "degraded" || b.status === "offline" || !!b.errorState), tone: "bad", href: "/ops/bots?status=attention" },
            { label: "Setting up", value: count((b) => b.status === "provisioning"), tone: "watch", href: "/ops/bots?status=provisioning" },
            { label: "Disabled", value: count((b) => b.status === "disabled"), tone: "quiet", href: "/ops/bots?status=disabled" },
          ]}
        />
      </Panel>
      <form className="pf-filters">
        <select name="client" defaultValue={sp.client ?? ""} className="field" aria-label="Client"><option value="">All clients</option>{L.orgList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        <select name="type" defaultValue={sp.type ?? ""} className="field" aria-label="Bot type"><option value="">All Bot types</option>{BOT_CATALOG.map((t) => <option key={t.key} value={t.key}>{t.displayName}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} className="field" aria-label="Status"><option value="">Any status</option><option value="active">Active</option><option value="working">Working</option><option value="idle">Idle</option><option value="disabled">Disabled</option><option value="offline">Offline</option><option value="degraded">Degraded</option><option value="attention">Needs attention</option><option value="provisioning">Provisioning</option></select>
        <button type="submit" className="btn btn-outline">Apply</button>
      </form>
      <Panel flush><BotsTable bots={bots} names={{ orgs: L.orgs, bots: L.bots }} runs={new Map(runs.map((x) => [x.id, x]))} groupByClient={!sp.client} /></Panel>
    </>
  );
}
