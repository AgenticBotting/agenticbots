import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks } from "@/components/platform/ui";
import { IntegrationsTable } from "@/components/platform/lists";
import { ActionButton } from "@/components/platform/actions";
import * as A from "../actions";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ status?: string; client?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  let rows = (await r.list("integrations")).filter((i) => L.visible(i.orgId));
  if (sp.client) rows = rows.filter((i) => i.orgId === sp.client);
  if (sp.status === "problems") rows = rows.filter((i) => i.status === "needs_attention" || i.status === "disconnected");
  else if (sp.status) rows = rows.filter((i) => i.status === sp.status);
  return (
    <>
      <PageHead title="Integrations" description="Client systems the Bots use. A connection is only ever shown as connected after a check or a recorded manual verification. Add new ones from the client's page." />
      <FilterLinks current={sp.status ?? ""} items={[{ key: "", label: "All", href: "/ops/integrations" }, { key: "problems", label: "Problems", href: "/ops/integrations?status=problems" }, { key: "connected", label: "Connected", href: "/ops/integrations?status=connected" }, { key: "not_configured", label: "Not configured", href: "/ops/integrations?status=not_configured" }]} />
      <Panel flush>
        <IntegrationsTable items={rows} names={{ orgs: L.orgs, bots: L.bots }} actions={(i) => <ActionButton action={A.checkIntegrationAction} hidden={{ integrationId: i.id }} label="Check" variant="ghost" pendingLabel="Checking…" />} />
      </Panel>
    </>
  );
}
