import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks, Table, When, Empty } from "@/components/platform/ui";
import { IncidentsTable } from "@/components/platform/lists";
import { ActionButton } from "@/components/platform/actions";
import * as A from "../actions";

export const metadata = { title: "Monitoring" };

export default async function MonitoringPage({ searchParams }: { searchParams: Promise<{ status?: string; correlation?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  let incidents = (await r.list("incidents")).filter((i) => L.visible(i.orgId));
  const status = sp.status ?? "open";
  if (status === "open") incidents = incidents.filter((i) => i.status === "open" || i.status === "investigating");
  else if (status !== "all") incidents = incidents.filter((i) => i.status === status);
  const cor = sp.correlation?.trim();
  // Internal log view: run events, deployment events and audit records searchable by correlation id.
  const [runs, events, deployments, audits] = await Promise.all([r.list("runs", { limit: 400 }), r.list("run_events", { limit: 400 }), r.list("deployment_events", { limit: 100 }), r.list("audit_logs", { limit: 200 })]);
  const runIds = new Set(runs.filter((x) => L.visible(x.orgId) && (!cor || x.correlationId === cor)).map((x) => x.id));
  const logLines = [
    ...events.filter((e) => L.visible(e.orgId) && runIds.has(e.runId) && (e.kind === "error" || cor)).map((e) => ({ at: e.at, kind: e.kind === "error" ? "Bot execution error" : "Bot execution", text: e.operatorText, cor: runs.find((x) => x.id === e.runId)?.correlationId, org: e.orgId })),
    ...deployments.filter((d) => L.visible(d.orgId) && (!cor || d.correlationId === cor)).map((d) => ({ at: d.createdAt, kind: d.status === "failed" ? "Deployment failure" : "Deployment", text: `${d.kind}: ${d.detail}`, cor: d.correlationId, org: d.orgId })),
    ...audits.filter((a) => (!a.orgId || L.visible(a.orgId)) && a.result !== "success" && (!cor || a.correlationId === cor)).map((a) => ({ at: a.createdAt, kind: "Action failure", text: `${a.action} ${a.detail ?? ""}`, cor: a.correlationId, org: a.orgId ?? "" })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 80);
  return (
    <>
      <PageHead title="Monitoring" description="Incidents dedupe by problem and target. Clients only ever see a plain sentence such as “Google Ads connection needs attention.”" />
      <FilterLinks current={status} items={["open", "resolved", "ignored", "all"].map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1), href: `/ops/monitoring?status=${s}` }))} />
      <Panel flush>
        <IncidentsTable incidents={incidents} names={{ orgs: L.orgs, bots: L.bots }} actions={(i) => i.status === "open" || i.status === "investigating" ? (
          <div className="flex flex-col gap-1">
            <ActionButton action={A.incidentStatusAction} hidden={{ incidentId: i.id, status: "investigating" }} label="Investigating" variant="ghost" />
            <ActionButton action={A.incidentStatusAction} hidden={{ incidentId: i.id, status: "resolved" }} label="Resolve" variant="ghost" />
            <ActionButton action={A.incidentStatusAction} hidden={{ incidentId: i.id, status: "ignored" }} label="Ignore" variant="ghost" />
          </div>
        ) : null} />
      </Panel>
      <Panel title="Logs" sub="Execution errors, deployments and failed actions. Secrets are redacted before anything is stored." flush className="mt-4">
        <form className="pf-filters pf-panel-body"><input name="correlation" defaultValue={cor} className="field pf-mono" placeholder="Correlation ID (cor_…)" aria-label="Correlation ID" /><button className="btn btn-outline">Search</button></form>
        <Table head={["When", "Type", "Client", "Line", "Correlation"]} empty={<Empty title="No log lines" />}>
          {logLines.map((l, i) => <tr key={i}><td><When iso={l.at} /></td><td className="pf-small">{l.kind}</td><td className="pf-small">{L.orgs.get(l.org)}</td><td className="pf-small">{l.text}</td><td className="pf-mono pf-muted">{l.cor}</td></tr>)}
        </Table>
      </Panel>
    </>
  );
}
