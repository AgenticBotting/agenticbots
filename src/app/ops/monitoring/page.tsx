import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, FilterLinks, Table, When, Empty } from "@/components/platform/ui";
import { Avatar, SegBar } from "@/components/platform/viz";
import { Status } from "@/components/platform/status";
import { titleCase } from "@/lib/platform/format";
import { ActionButton } from "@/components/platform/actions";
import * as A from "../actions";

export const metadata = { title: "Monitoring" };

export default async function MonitoringPage({ searchParams }: { searchParams: Promise<{ status?: string; correlation?: string }> }) {
  const actor = await requireOperatorPage();
  const sp = await searchParams;
  const r = await repo();
  const L = await lookups(r, actor);
  const allInc = (await r.list("incidents")).filter((i) => L.visible(i.orgId));
  let incidents = allInc;
  const openInc = allInc.filter((i) => i.status === "open" || i.status === "investigating");
  const SEV = { critical: 0, high: 1, medium: 2, low: 3 } as const;
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
      <Panel className="mb-4">
        <SegBar
          label="Open incidents by severity"
          items={[
            { label: "Critical", value: openInc.filter((i) => i.severity === "critical").length, tone: "bad" },
            { label: "High", value: openInc.filter((i) => i.severity === "high").length, tone: "bad" },
            { label: "Medium", value: openInc.filter((i) => i.severity === "medium").length, tone: "watch" },
            { label: "Low", value: openInc.filter((i) => i.severity === "low").length, tone: "quiet" },
          ]}
        />
      </Panel>
      <FilterLinks current={status} items={["open", "resolved", "ignored", "all"].map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1), href: `/ops/monitoring?status=${s}`, count: s === "open" ? openInc.length : s === "all" ? allInc.length : allInc.filter((i) => i.status === s).length }))} />
      {incidents.length === 0 ? <Panel><Empty title={status === "open" ? "No open incidents" : "No incidents"}>{status === "open" ? "Every runtime, integration and account looks healthy." : null}</Empty></Panel> : (
        <div className="pf-incidents">
          {[...incidents].sort((a, b) => SEV[a.severity] - SEV[b.severity] || b.lastSeenAt.localeCompare(a.lastSeenAt)).map((i) => {
            const tone = i.severity === "critical" || i.severity === "high" ? "bad" : i.severity === "medium" ? "watch" : "quiet";
            const open = i.status === "open" || i.status === "investigating";
            return (
              <article key={i.id} id={`incident-${i.id}`} className={`pf-incident edge-${tone}`}>
                <div className="main">
                  <div className="top">
                    <Status value={i.severity} />
                    <span className="pf-badge">{titleCase(i.type)}</span>
                    <Status value={i.status} />
                    <span className="occ">{i.occurrences}×</span>
                  </div>
                  <h3>{i.title}</h3>
                  <p className="detail">{i.detail}</p>
                  {i.clientMessage && <p className="client"><span>Client sees</span>“{i.clientMessage}”</p>}
                  <div className="meta">
                    <span className="inline-flex items-center gap-1.5"><Avatar name={L.orgs.get(i.orgId) ?? ""} size="sm" />{L.orgs.get(i.orgId)}</span>
                    <span>First seen <When iso={i.firstSeenAt} /></span>
                    <span>Last seen <When iso={i.lastSeenAt} /></span>
                    <span className="pf-mono">{i.correlationIds.slice(-1)[0]}</span>
                  </div>
                </div>
                {open && (
                  <div className="acts">
                    {i.status !== "investigating" && <ActionButton action={A.incidentStatusAction} hidden={{ incidentId: i.id, status: "investigating" }} label="Investigating" variant="outline" />}
                    <ActionButton action={A.incidentStatusAction} hidden={{ incidentId: i.id, status: "resolved" }} label="Resolve" variant="primary" />
                    <ActionButton action={A.incidentStatusAction} hidden={{ incidentId: i.id, status: "ignored" }} label="Ignore" variant="ghost" />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <Panel title="Logs" sub="Execution errors, deployments and failed actions. Secrets are redacted before anything is stored." flush className="mt-4">
        <form className="pf-filters pf-panel-body"><input name="correlation" defaultValue={cor} className="field pf-mono" placeholder="Correlation ID (cor_…)" aria-label="Correlation ID" /><button className="btn btn-outline">Search</button></form>
        <Table head={["When", "Type", "Client", "Line", "Correlation"]} empty={<Empty title="No log lines" />}>
          {logLines.map((l, i) => <tr key={i}><td><When iso={l.at} /></td><td className="pf-small">{l.kind}</td><td className="pf-small">{L.orgs.get(l.org)}</td><td className="pf-small">{l.text}</td><td className="pf-mono pf-muted">{l.cor}</td></tr>)}
        </Table>
      </Panel>
    </>
  );
}
