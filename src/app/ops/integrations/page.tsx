import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks, When, Empty } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionButton } from "@/components/platform/actions";
import { Avatar, SegBar } from "@/components/platform/viz";
import * as A from "../actions";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ status?: string; client?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  const all = (await r.list("integrations")).filter((i) => L.visible(i.orgId));
  let rows = all;
  if (sp.client) rows = rows.filter((i) => i.orgId === sp.client);
  const problem = (s: string) => s === "needs_attention" || s === "disconnected";
  if (sp.status === "problems") rows = rows.filter((i) => problem(i.status));
  else if (sp.status) rows = rows.filter((i) => i.status === sp.status);
  const RANK: Record<string, number> = { needs_attention: 0, disconnected: 1, connected: 2, not_configured: 3 };
  const groups = new Map<string, typeof rows>();
  for (const i of rows) groups.set(i.orgId, [...(groups.get(i.orgId) ?? []), i]);
  const ordered = [...groups.entries()].sort((a, b) => b[1].filter((i) => problem(i.status)).length - a[1].filter((i) => problem(i.status)).length);
  return (
    <>
      <PageHead title="Integrations" description="Client systems the Bots use. A connection is only ever shown as connected after a check or a recorded manual verification. Add new ones from the client's page." />
      <Panel className="mb-4">
        <SegBar
          label="Integrations by status"
          items={[
            { label: "Connected", value: all.filter((i) => i.status === "connected").length, tone: "good", href: "/ops/integrations?status=connected" },
            { label: "Needs attention", value: all.filter((i) => i.status === "needs_attention").length, tone: "watch", href: "/ops/integrations?status=problems" },
            { label: "Disconnected", value: all.filter((i) => i.status === "disconnected").length, tone: "bad", href: "/ops/integrations?status=problems" },
            { label: "Not configured", value: all.filter((i) => i.status === "not_configured").length, tone: "quiet", href: "/ops/integrations?status=not_configured" },
          ]}
        />
      </Panel>
      <FilterLinks current={sp.status ?? ""} items={[
        { key: "", label: "All", href: "/ops/integrations", count: all.length },
        { key: "problems", label: "Problems", href: "/ops/integrations?status=problems", count: all.filter((i) => problem(i.status)).length },
        { key: "connected", label: "Connected", href: "/ops/integrations?status=connected", count: all.filter((i) => i.status === "connected").length },
        { key: "not_configured", label: "Not configured", href: "/ops/integrations?status=not_configured", count: all.filter((i) => i.status === "not_configured").length },
      ]} />
      {ordered.length === 0 ? <Panel><Empty title="No integrations match" /></Panel> : (
        <div className="pf-grid">
          {ordered.map(([orgId, list]) => (
            <Panel
              key={orgId}
              flush
              title={<span className="inline-flex items-center gap-2.5"><Avatar name={L.orgs.get(orgId) ?? ""} size="sm" /><Link href={`/ops/clients/${orgId}?tab=integrations`} className="hover:underline">{L.orgs.get(orgId)}</Link></span>}
              action={<span className="pf-small pf-muted">{list.filter((i) => i.status === "connected").length} of {list.length} connected</span>}
            >
              <ul className="pf-intlist">
                {[...list].sort((a, b) => RANK[a.status] - RANK[b.status]).map((i) => (
                  <li key={i.id} className={problem(i.status) ? `edge-${i.status === "disconnected" ? "bad" : "watch"}` : undefined}>
                    <span className="logo" aria-hidden="true">{i.displayName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2)}</span>
                    <div className="body">
                      <div className="t">{i.displayName}</div>
                      <div className="m">
                        <span>{i.botIds.length ? i.botIds.map((id) => L.bots.get(id)?.name).filter(Boolean).join(", ") : "No Bots have access"}</span>
                        {i.secretRef && <span className="pf-mono">{i.secretRef.split("/").slice(-2).join("/")}</span>}
                      </div>
                      {i.lastError && <div className="err">{i.lastError}</div>}
                    </div>
                    <div className="st"><Status value={i.status} /><div className="pf-small pf-muted">checked <When iso={i.lastCheckAt} /></div></div>
                    <ActionButton action={A.checkIntegrationAction} hidden={{ integrationId: i.id }} label="Check" variant="outline" pendingLabel="Checking…" />
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
