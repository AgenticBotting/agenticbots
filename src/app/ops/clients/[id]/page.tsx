import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { can } from "@/server/auth/policy";
import { lookups } from "@/server/services/lookups";
import { BOT_CATALOG } from "@/config/bot-catalog";
import { INTEGRATIONS } from "@/config/integrations";
import { clientBillingStatus, deriveInvoiceStatus, outstandingCents, suspensionEligibility } from "@/server/billing/domain";
import { PageHead, Panel, KV, Stats, Stat, Tabs, Banner, BotName, When, Empty, Table } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionButton, ActionForm, ConfirmAction, SubmitButton } from "@/components/platform/actions";
import { AuditTable, AutomationsTable, BotsTable, IncidentsTable, IntegrationsTable, InvoicesTable, RequestsTable, RunsTable, ApprovalsTable } from "@/components/platform/lists";
import { money, usd, compact, dateTime } from "@/lib/platform/format";
import { NoteBox } from "@/components/platform/NoteBox";
import { AutomationForm } from "@/components/platform/forms";
import * as A from "../../actions";

export const metadata = { title: "Client" };

const TABS = ["overview", "bots", "runs", "requests", "automations", "approvals", "integrations", "infrastructure", "credentials", "usage", "billing", "monitoring", "audit", "settings"] as const;
type Tab = (typeof TABS)[number];
const LABEL: Record<Tab, string> = {
  overview: "Overview", bots: "Bots", runs: "Runs", requests: "Requests", automations: "Automations", approvals: "Approvals",
  integrations: "Integrations", infrastructure: "Infrastructure", credentials: "Credentials", usage: "Usage & Cost", billing: "Billing",
  monitoring: "Monitoring", audit: "Audit Log", settings: "Settings",
};

export default async function ClientDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const actor = await requireOperatorPage();
  const { id } = await params;
  const tab = (TABS as readonly string[]).includes((await searchParams).tab ?? "") ? ((await searchParams).tab as Tab) : "overview";
  const r = await repo();
  if (!can(actor, "ops.view", id)) notFound();
  const org = await r.get("organizations", id);
  if (!org) notFound();

  const [bots, runs, requests, jobs, approvals, integrations, runtimes, agreements, invoicesRaw, payments, rollups, incidents, audits, deployments, memberships, notes, users] = await Promise.all([
    r.list("bots", { orgId: id, order: "asc" }), r.list("runs", { orgId: id }), r.list("requests", { orgId: id }), r.list("automation_jobs", { orgId: id }),
    r.list("approvals", { orgId: id }), r.list("integrations", { orgId: id }), r.list("runtimes", { orgId: id }), r.list("service_agreements", { orgId: id }),
    r.list("invoices", { orgId: id }), r.list("payments", { orgId: id }), r.list("usage_rollups", { orgId: id }), r.list("incidents", { orgId: id }),
    r.list("audit_logs", { orgId: id, limit: 100 }), r.list("deployment_events", { orgId: id }), r.list("memberships", { orgId: id }),
    r.list("operator_notes", { orgId: id, where: { targetType: "client", targetId: id } }), r.list("users"),
  ]);
  const L = await lookups(r, actor);
  const names = { orgs: L.orgs, bots: L.bots, users: L.users };
  const runtime = runtimes[0];
  const invoices = invoicesRaw.map((i) => ({ ...i, status: deriveInvoiceStatus(i) }));
  const agreement = agreements.find((a) => a.status !== "terminated" && a.status !== "completed");
  const billingStatus = clientBillingStatus(invoices);
  const elig = suspensionEligibility(agreement, invoices);
  const month = new Date().toISOString().slice(0, 7);
  const monthRoll = rollups.filter((u) => u.period === month);
  const modelCost = monthRoll.reduce((s, u) => s + u.modelCostUsd, 0);
  const openIncidents = incidents.filter((i) => i.status === "open" || i.status === "investigating");
  const runMap = new Map(runs.map((x) => [x.id, x]));
  const canBilling = can(actor, "ops.billing.write", id);
  const suspended = org.status === "suspended";
  const deployedTypes = new Set(bots.map((b) => b.typeKey));
  const tabHref = (t: Tab) => `/ops/clients/${id}${t === "overview" ? "" : `?tab=${t}`}`;
  const counts: Partial<Record<Tab, number>> = {
    bots: bots.length, approvals: approvals.filter((a) => a.status === "pending").length,
    requests: requests.filter((q) => !["completed", "declined"].includes(q.status)).length, monitoring: openIncidents.length,
  };

  const suspendFields = (
    <>
      <label className="pf-label">Reason
        <select name="reason" className="field" defaultValue={elig.eligible ? "billing" : "manual"}>
          <option value="billing">Billing</option>
          <option value="manual">Manual</option>
          <option value="security">Security (adds a security hold)</option>
          <option value="contract_ended">Contract ended</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="pf-label">Note for the record<textarea name="note" className="field" rows={2} /></label>
    </>
  );

  return (
    <>
      <PageHead
        title={org.name}
        crumbs={[{ href: "/ops/clients", label: "Clients" }]}
        description={<span className="inline-flex flex-wrap gap-x-4 gap-y-1 items-center"><Status value={org.status} />{agreement && <span>{money(agreement.monthlyValueCents)}/month</span>}<span className="pf-mono">{org.tenantId}</span></span>}
        actions={
          <>
            <form action={A.openPortalPreview.bind(null, org.id)}><button className="btn btn-outline" type="submit">Open client portal view</button></form>
            {runtime && <ActionButton action={A.refreshHealthAction} hidden={{ runtimeId: runtime.id }} label="Refresh health" pendingLabel="Checking…" />}
            {runtime && !suspended && (
              <ConfirmAction action={A.restartRuntimeAction} hidden={{ runtimeId: runtime.id }} variant="outline" label="Restart runtime" title={`Restart ${org.name}'s runtime?`}
                body="Active runs are interrupted and marked as such; scheduled work resumes after the restart. Storage is untouched." confirmLabel="Restart runtime" />
            )}
            {suspended ? (
              <ConfirmAction action={A.reactivateClientAction} hidden={{ orgId: org.id }} variant="primary" label="Reactivate client" title={`Reactivate ${org.name}?`}
                body="Starts the runtime, waits for its health check, verifies capabilities, then lets Bots resume with their existing memory, automations and history." confirmLabel="Reactivate" />
            ) : (
              <ConfirmAction action={A.suspendClientAction} hidden={{ orgId: org.id }} label="Suspend client" title={`Suspend ${org.name}?`} fields={suspendFields}
                body={<>New work is blocked immediately and active runs are stopped. The runtime service stops through Systems Manager. <strong>Storage is preserved</strong>: memory, sessions, skills, automations and configuration all survive.</>} confirmLabel="Suspend client" />
            )}
          </>
        }
      />

      {org.eligibleForReactivation && (
        <Banner tone="good"><strong>PAYMENT RECEIVED — CLIENT ELIGIBLE FOR REACTIVATION.</strong> Nothing restarts automatically. Reactivate when you are ready.</Banner>
      )}
      {suspended && org.suspension && (
        <Banner tone="bad"><strong>Suspended ({org.suspension.reason.replace("_", " ")})</strong> {org.suspension.note ? `— ${org.suspension.note}` : ""} <span className="pf-small">since {dateTime(org.suspension.at)}</span></Banner>
      )}
      {!suspended && elig.eligible && (
        <Banner tone="watch"><strong>{elig.worstDaysPastDue} days past due — eligible for suspension.</strong> {agreement?.autoSuspendEnabled ? "Auto-suspend is enabled on this agreement." : "Auto-suspend is off: your call. Consider contacting the client first."}</Banner>
      )}
      {(org.holds.manual || org.holds.security) && (
        <Banner tone="bad"><strong>Hold in place:</strong> {[org.holds.manual && "manual", org.holds.security && "security"].filter(Boolean).join(", ")}. Clear it under Settings before reactivating.</Banner>
      )}

      <Tabs current={tab} items={TABS.map((t) => ({ key: t, label: LABEL[t], href: tabHref(t), count: counts[t] }))} />

      {tab === "overview" && (
        <>
          <Stats>
            <Stat value={bots.filter((b) => b.status !== "disabled").length} label="Enabled Bots" href={tabHref("bots")} />
            <Stat value={runs.filter((x) => ["queued", "running", "waiting_for_approval"].includes(x.status)).length} label="Current Bot Runs" href={tabHref("runs")} />
            <Stat value={runs.filter((x) => x.status === "failed").length} label="Failed runs" href={tabHref("runs")} tone={runs.some((x) => x.status === "failed") ? "watch" : undefined} />
            <Stat value={counts.approvals ?? 0} label="Pending approvals" href={tabHref("approvals")} />
            <Stat value={counts.requests ?? 0} label="Open requests" href={tabHref("requests")} />
            <Stat value={usd(modelCost + (runtime?.estimatedMonthlyCostUsd ?? 0), 0)} label="Est. operating cost (mo)" href={tabHref("usage")} />
          </Stats>
          <div className="pf-grid pf-grid-main">
            <div className="pf-grid">
              <Panel title="Company and agreement">
                <KV rows={[
                  ["Company", <>{org.name}{org.website && <div className="pf-small pf-muted">{org.website}</div>}</>],
                  ["Primary contact", org.primaryContactName ? `${org.primaryContactName} · ${org.primaryContactEmail ?? ""}` : "—"],
                  ["Service agreement", agreement ? <>{agreement.name} <Status value={agreement.status} /></> : <Link className="underline" href={tabHref("billing")}>Create one</Link>],
                  ["Monthly contract value", agreement ? money(agreement.monthlyValueCents) : "—"],
                  ["Billing", <><Status value={billingStatus} /> {outstandingCents(invoices) > 0 && <span className="pf-small">· {money(outstandingCents(invoices))} outstanding</span>}</>],
                  ["Account", <Status key="a" value={org.status} />],
                ]} />
              </Panel>
              <Panel title="Bots" flush action={<Link href={tabHref("bots")} className="pf-small underline">Manage</Link>}>
                <BotsTable bots={bots} names={names} showClient={false} runs={runMap} />
              </Panel>
              <Panel title="Recent runs" flush action={<Link href={tabHref("runs")} className="pf-small underline">All runs</Link>}>
                <RunsTable runs={runs.slice(0, 6)} names={names} showClient={false} />
              </Panel>
            </div>
            <div className="pf-grid">
              <Panel title="Runtime health">
                {runtime ? (
                  <KV rows={[
                    ["Runtime", <Status key="h" value={runtime.health} />],
                    ["Ready", runtime.ready ? "Yes — capabilities verified" : "No"],
                    ["Server", <span key="s">{runtime.ec2State ?? "unknown"} <span className="pf-muted pf-small">{runtime.instanceType}</span></span>],
                    ["Private connectivity", <Status key="t" value={runtime.tunnel} />],
                    ["Last heartbeat", <When key="w" iso={runtime.lastHeartbeatAt} />],
                    ["Automations", jobs.some((j) => j.status === "failing") ? <Status key="f" value="failing" label={`${jobs.filter((j) => j.status === "failing").length} failing`} /> : `${jobs.length} healthy`],
                    ["Integrations", integrations.some((i) => i.status === "needs_attention") ? <Status key="i" value="needs_attention" /> : `${integrations.filter((i) => i.status === "connected").length} connected`],
                  ]} />
                ) : <Empty title="No runtime record" />}
              </Panel>
              <Panel title="Open incidents" flush>
                <Table head={["Incident", "Seen"]} empty={<Empty title="None" />}>
                  {openIncidents.map((i) => <tr key={i.id}><td><Status value={i.severity} /> {i.title}</td><td><When iso={i.lastSeenAt} /></td></tr>)}
                </Table>
              </Panel>
              <Panel title="Internal notes" sub="Never shown to the client">
                <NoteBox orgId={org.id} targetType="client" targetId={org.id} notes={notes} />
              </Panel>
            </div>
          </div>
        </>
      )}

      {tab === "bots" && (
        <div className="pf-grid">
          <Panel title="Deployed Bots" flush><BotsTable bots={bots} names={names} showClient={false} runs={runMap} /></Panel>
          {can(actor, "ops.provisioning", id) && (
            <Panel title="Deploy a Bot" sub="Creates the Bot from its template: its own runtime profile and key, default skills, approval rules, then a health check.">
              <ActionForm action={A.provisionBotAction} hidden={{ orgId: org.id }} className="max-w-xl">
                <label className="pf-label">Bot
                  <select name="typeKey" className="field" required>
                    {BOT_CATALOG.filter((t) => !deployedTypes.has(t.key)).map((t) => <option key={t.key} value={t.key}>{t.displayName} — {t.shortDescription}</option>)}
                  </select>
                </label>
                <div><SubmitButton disabled={suspended}>Deploy Bot</SubmitButton></div>
              </ActionForm>
            </Panel>
          )}
        </div>
      )}

      {tab === "runs" && <Panel flush><RunsTable runs={runs} names={names} showClient={false} /></Panel>}

      {tab === "requests" && <Panel flush><RequestsTable requests={requests} names={names} showClient={false} /></Panel>}

      {tab === "automations" && (
        <div className="pf-grid">
          <Panel flush><AutomationsTable jobs={jobs} names={names} showClient={false} actions={(j) => <AutomationControls id={j.id} status={j.status} />} /></Panel>
          <Panel title="Create automation" sub="Scheduled work for one Bot. Clients see the results, never the schedule syntax.">
            <AutomationForm bots={bots.filter((b) => b.status !== "disabled")} disabled={suspended} />
          </Panel>
        </div>
      )}

      {tab === "approvals" && (
        <div className="pf-grid">
          <Panel flush><ApprovalsTable approvals={approvals} names={names} showClient={false} actions={(a) => a.status === "pending" ? <ApprovalButtons id={a.id} /> : null} /></Panel>
          <Panel title="Send prepared work for approval" sub="E.g. drafted emails, a content piece, an ad change. Approving starts the execution run.">
            <ActionForm action={A.createApprovalAction} hidden={{ orgId: org.id }} resetOnSuccess className="max-w-2xl">
              <div className="pf-form-row">
                <label className="pf-label">Bot<select name="botId" className="field">{bots.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
                <label className="pf-label">Kind<select name="category" className="field"><option value="external_send">Send messages</option><option value="publish">Publish content</option><option value="ad_change">Change ads</option><option value="crm_update">Update CRM</option><option value="destructive">Delete or overwrite data</option></select></label>
                <label className="pf-label">Risk<select name="risk" className="field"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
              </div>
              <label className="pf-label">Title (what will happen)<input name="title" className="field" required placeholder="Send 12 follow-up emails for open estimates" /></label>
              <label className="pf-label">Plain-English explanation<textarea name="explanation" className="field" rows={2} required /></label>
              <label className="pf-label">Expected impact<input name="expectedImpact" className="field" required /></label>
              <label className="pf-label">Preview <span className="hint">Shown to the client exactly as written.</span><textarea name="preview" className="field" rows={4} /></label>
              <div><SubmitButton>Send for approval</SubmitButton></div>
            </ActionForm>
          </Panel>
        </div>
      )}

      {tab === "integrations" && (
        <div className="pf-grid">
          <Panel flush><IntegrationsTable items={integrations} names={names} showClient={false} actions={(i) => <IntegrationControls id={i.id} />} /></Panel>
          <Panel title="Add integration" sub="Credentials live in Secrets Manager. Paste the secret's path, never the secret.">
            <ActionForm action={A.createIntegrationAction} hidden={{ orgId: org.id }} resetOnSuccess className="max-w-2xl">
              <div className="pf-form-row">
                <label className="pf-label">System<select name="provider" className="field">{INTEGRATIONS.map((i) => <option key={i.key} value={i.key}>{i.displayName}</option>)}</select></label>
                <label className="pf-label">Display name <span className="hint">optional</span><input name="displayName" className="field" /></label>
              </div>
              <label className="pf-label">Secret reference <span className="hint">agenticbots/prod/tenants/{org.tenantId}/integrations/&lt;name&gt;</span><input name="secretRef" className="field pf-mono" /></label>
              <label className="pf-label">Runtime tool connection name <span className="hint">The connection name configured on the Bot — enables automated checks.</span><input name="toolset" className="field pf-mono" /></label>
              <div><SubmitButton>Add integration</SubmitButton></div>
            </ActionForm>
          </Panel>
        </div>
      )}

      {tab === "infrastructure" && runtime && (
        <div className="pf-grid pf-grid-2">
          <Panel title="Runtime">
            <KV rows={[
              ["Engine", <span key="e">{runtime.kind === "demo" ? "Demo runtime" : "Hermes Agent"} <span className="pf-mono">{runtime.engineVersion}</span></span>],
              ["Image digest", <span key="d" className="pf-mono">{runtime.engineDigest ?? "not pinned yet"}</span>],
              ["Runtime bundle", runtime.runtimeVersion],
              ["Region", runtime.region],
              ["EC2 instance", <span key="i" className="pf-mono">{runtime.instanceId ?? "not provisioned"}</span>],
              ["EC2 state", runtime.ec2State ?? "unknown"],
              ["Health", <Status key="h" value={runtime.health} />],
              ["Deployment", <Status key="dp" value={runtime.deploymentState} />],
              ["Disk used", runtime.diskUsedPct !== undefined ? `${runtime.diskUsedPct}%` : "—"],
              ["Private connectivity", <Status key="t" value={runtime.tunnel} />],
              ["Backups", <span key="b">{runtime.backup.status} · last <When iso={runtime.backup.lastSnapshotAt} /> · {runtime.backup.retentionDays}d retention</span>],
              ["Last restart", <When key="r" iso={runtime.lastRestartAt} />],
              ["Capabilities", runtime.capabilities ? Object.entries(runtime.capabilities).filter(([, v]) => v).map(([k]) => k).join(", ") : "—"],
              ["Last error", runtime.lastError ? <span key="le" className="text-[var(--color-danger)]">{runtime.lastError.message} <span className="pf-mono">{runtime.lastError.correlationId}</span></span> : "none"],
            ]} />
          </Panel>
          <div className="pf-grid">
            <Panel title="Provisioning" sub="Run from your computer with AWS access (see docs/BEGINNER_SETUP.md)">
              <pre className="pf-mono whitespace-pre-wrap bg-[var(--bg-alt)] p-3 text-[12px]">{`npm run ops -- tenant:plan --tenant ${org.tenantId}
ALLOW_CLOUD_CHANGES=1 npm run ops -- tenant:provision --tenant ${org.tenantId}
npm run ops -- tenant:status --tenant ${org.tenantId}`}</pre>
            </Panel>
            <Panel title="Deployment history" flush>
              <Table head={["Change", "Status", "When"]} empty={<Empty title="No deployments" />}>
                {deployments.map((d) => <tr key={d.id}><td className="pf-small">{d.kind.replace(/_/g, " ")} — {d.detail}</td><td><Status value={d.status} /></td><td><When iso={d.createdAt} /></td></tr>)}
              </Table>
            </Panel>
          </div>
        </div>
      )}

      {tab === "credentials" && (
        <Panel title="Credential status" sub="References and presence only. Secret values are never loaded into this screen." flush>
          <Table head={["Owner", "Secret reference", "Status"]}>
            {runtime && <tr><td>Runtime endpoint + private connectivity</td><td className="pf-mono">{runtime.endpointRef}</td><td><Status value={runtime.tunnel === "connected" ? "present" : "unknown"} /></td></tr>}
            {bots.map((b) => <tr key={b.id}><td>{b.name} runtime key</td><td className="pf-mono">{b.credentialRef}</td><td><Status value={b.credentialStatus} /></td></tr>)}
            {integrations.map((i) => <tr key={i.id}><td>{i.displayName}</td><td className="pf-mono">{i.secretRef ?? "—"}</td><td><Status value={i.secretRef ? (i.status === "connected" ? "present" : i.status) : "missing"} /></td></tr>)}
          </Table>
        </Panel>
      )}

      {tab === "usage" && (
        <Panel title={`Usage this month (${month})`} sub="Model cost uses operator-entered rates; infrastructure is the instance estimate." flush>
          <Table head={["Bot", "Runs", "Failed", "Input tokens", "Output tokens", "Cache reads", "Est. cost"]} empty={<Empty title="No usage yet this month" />}>
            {monthRoll.map((u) => {
              const b = L.bots.get(u.botId);
              return <tr key={u.id}><td>{b ? <BotName typeKey={b.typeKey} name={b.name} /> : "—"}</td><td className="num">{u.runs}</td><td className="num">{u.failedRuns}</td><td className="num">{compact(u.usage.inputTokens)}</td><td className="num">{compact(u.usage.outputTokens)}</td><td className="num">{compact(u.usage.cacheReadTokens)}</td><td className="num">{usd(u.modelCostUsd)}</td></tr>;
            })}
            <tr><td><strong>Infrastructure</strong></td><td colSpan={5} className="pf-small pf-muted">{runtime?.instanceType} runtime, storage and snapshots</td><td className="num">{usd(runtime?.estimatedMonthlyCostUsd ?? 0)}</td></tr>
            {agreement && <tr><td><strong>Estimated gross margin</strong></td><td colSpan={5} className="pf-small pf-muted">Contract value minus estimated costs — internal only</td><td className="num"><strong>{usd(agreement.monthlyValueCents / 100 - modelCost - (runtime?.estimatedMonthlyCostUsd ?? 0), 0)}</strong></td></tr>}
          </Table>
        </Panel>
      )}

      {tab === "billing" && (
        <div className="pf-grid">
          <Stats>
            <Stat value={agreement ? money(agreement.monthlyValueCents) : "—"} label="Monthly contract value" />
            <Stat value={<Status value={billingStatus} />} label="Payment status" />
            <Stat value={money(outstandingCents(invoices))} label="Outstanding" tone={billingStatus === "past_due" ? "bad" : undefined} />
            <Stat value={agreement ? `${agreement.gracePeriodDays} days` : "—"} label="Grace period" />
            <Stat value={agreement?.autoSuspendEnabled ? "On" : "Off"} label="Auto-suspend" />
          </Stats>
          <div className="pf-grid pf-grid-main">
            <Panel title="Invoices" flush action={canBilling && agreement ? <Link className="btn btn-primary" href={`/ops/billing/new-invoice?client=${org.id}`}>Create invoice</Link> : null}>
              <InvoicesTable invoices={invoices} names={names} showClient={false} />
              <div className="pf-panel-body pf-small pf-muted">{payments.length} payment record{payments.length === 1 ? "" : "s"}. Open an invoice to record an ACH or wire payment.</div>
            </Panel>
            <Panel title={agreement ? "Service agreement" : "Create service agreement"}>
              {agreement ? (
                <>
                  <KV rows={[
                    ["Agreement", agreement.name], ["Monthly value", money(agreement.monthlyValueCents)], ["Implementation fee", money(agreement.implementationFeeCents)],
                    ["Frequency", agreement.billingFrequency], ["Terms", `Net ${agreement.paymentTermsDays}`], ["Preferred payment", agreement.preferredPaymentMethod.toUpperCase().replace("_", " ")],
                    ["Start", agreement.startDate], ["Renewal", agreement.renewalDate ?? "—"], ["Status", <Status key="s" value={agreement.status} />],
                    ["Auto-reactivate on payment", agreement.autoReactivateOnPayment ? "On" : "Off"],
                  ]} />
                  {canBilling && (
                    <ActionForm action={A.updateAgreementAction} hidden={{ agreementId: agreement.id, autoFlags: "1" }} className="mt-4">
                      <label className="pf-label">Grace period (days)<input name="gracePeriodDays" type="number" min={0} max={90} defaultValue={agreement.gracePeriodDays} className="field" /></label>
                      <label className="pf-check"><input type="checkbox" name="autoSuspendEnabled" defaultChecked={agreement.autoSuspendEnabled} /> Allow automatic suspension after the grace period</label>
                      <label className="pf-check"><input type="checkbox" name="autoReactivateOnPayment" defaultChecked={agreement.autoReactivateOnPayment} /> Allow automatic reactivation after full payment (billing suspensions only, no holds)</label>
                      <div><SubmitButton variant="outline">Save billing rules</SubmitButton></div>
                    </ActionForm>
                  )}
                </>
              ) : canBilling ? <AgreementForm orgId={org.id} orgName={org.name} /> : <Empty title="No agreement" />}
            </Panel>
          </div>
          <Panel title="Billing holds">
            <div className="flex flex-wrap gap-3">
              <ActionButton action={A.setHoldAction} hidden={{ orgId: org.id, hold: "billing", on: String(!org.holds.billing) }} label={org.holds.billing ? "Remove billing hold" : "Add billing hold"} />
              <span className="pf-small pf-muted self-center">A billing hold flags the account for follow-up. It never stops Bots by itself.</span>
            </div>
          </Panel>
        </div>
      )}

      {tab === "monitoring" && <Panel flush><IncidentsTable incidents={incidents} names={names} showClient={false} actions={(i) => i.status === "open" || i.status === "investigating" ? <IncidentControls id={i.id} /> : null} /></Panel>}

      {tab === "audit" && <Panel flush><AuditTable rows={audits} names={names} /></Panel>}

      {tab === "settings" && (
        <div className="pf-grid pf-grid-2">
          <Panel title="Company profile">
            <ActionForm action={A.updateClientAction} hidden={{ orgId: org.id }}>
              <label className="pf-label">Name<input name="name" className="field" defaultValue={org.name} /></label>
              <label className="pf-label">Industry<input name="industry" className="field" defaultValue={org.industry} /></label>
              <label className="pf-label">Website<input name="website" className="field" defaultValue={org.website} /></label>
              <div className="pf-form-row">
                <label className="pf-label">Primary contact<input name="contactName" className="field" defaultValue={org.primaryContactName} /></label>
                <label className="pf-label">Contact email<input name="contactEmail" className="field" defaultValue={org.primaryContactEmail} /></label>
              </div>
              <label className="pf-label">Time zone<input name="timezone" className="field" defaultValue={org.timezone} /></label>
              <div><SubmitButton variant="outline">Save</SubmitButton></div>
            </ActionForm>
          </Panel>
          <div className="pf-grid">
            <Panel title="Portal users" flush>
              <Table head={["Name", "Email", "Role", "Status"]} empty={<Empty title="No portal users yet" />}>
                {memberships.map((m) => {
                  const u = users.find((x) => x.id === m.userId);
                  return <tr key={m.id}><td>{u?.name}</td><td className="pf-small">{u?.email}</td><td>{m.role === "client_admin" ? "Client admin" : "Client member"}</td><td><Status value={u?.status} /></td></tr>;
                })}
              </Table>
            </Panel>
            <Panel title="Invite a portal user">
              <ActionForm action={A.inviteUserAction} hidden={{ orgId: org.id }} resetOnSuccess>
                <div className="pf-form-row">
                  <label className="pf-label">Name<input name="name" className="field" required /></label>
                  <label className="pf-label">Email<input name="email" type="email" className="field" required /></label>
                </div>
                <label className="pf-label">Role<select name="clientRole" className="field"><option value="client_admin">Client admin — can approve actions</option><option value="client_member">Client member — view and submit requests</option></select></label>
                <div><SubmitButton variant="outline">Create invitation</SubmitButton></div>
              </ActionForm>
            </Panel>
            <Panel title="Holds">
              <div className="flex flex-wrap gap-2">
                <ActionButton action={A.setHoldAction} hidden={{ orgId: org.id, hold: "manual", on: String(!org.holds.manual) }} label={org.holds.manual ? "Clear manual hold" : "Add manual hold"} />
                {actor.platformRole === "superadmin" || !org.holds.security ? (
                  <ActionButton action={A.setHoldAction} hidden={{ orgId: org.id, hold: "security", on: String(!org.holds.security) }} label={org.holds.security ? "Clear security hold" : "Add security hold"} />
                ) : null}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}

function AutomationControls({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <ActionButton action={A.automationAction} hidden={{ jobId: id, op: "run" }} label="Run now" variant="ghost" />
      <ActionButton action={A.automationAction} hidden={{ jobId: id, op: status === "paused" ? "resume" : "pause" }} label={status === "paused" ? "Resume" : "Pause"} variant="ghost" />
      <ConfirmAction action={A.automationAction} hidden={{ jobId: id, op: "delete" }} label="Delete" title="Delete this automation?" body="The schedule is removed from the runtime. Past runs stay in the history." confirmLabel="Delete automation" />
    </div>
  );
}

function ApprovalButtons({ id }: { id: string }) {
  return (
    <div className="flex gap-1.5">
      <ActionButton action={A.resolveApprovalAction} hidden={{ approvalId: id, decision: "approve" }} label="Approve" variant="primary" />
      <ActionButton action={A.resolveApprovalAction} hidden={{ approvalId: id, decision: "deny" }} label="Deny" variant="ghost" />
    </div>
  );
}

function IntegrationControls({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <ActionButton action={A.checkIntegrationAction} hidden={{ integrationId: id }} label="Check" variant="ghost" pendingLabel="Checking…" />
      <ConfirmAction action={A.setIntegrationStatusAction} hidden={{ integrationId: id, status: "connected" }} variant="outline" label="Mark verified"
        title="Record a manual verification" body="Only mark this connected if you have confirmed it works yourself. Your note is saved to the audit log."
        fields={<label className="pf-label">How did you verify it?<textarea name="evidence" className="field" rows={2} required minLength={10} /></label>} confirmLabel="Record as connected" />
      <ConfirmAction action={A.disconnectIntegrationAction} hidden={{ integrationId: id }} label="Disconnect" title="Disconnect this integration?" body="All Bots lose access immediately. The stored credential is not deleted." confirmLabel="Disconnect" />
    </div>
  );
}

function IncidentControls({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <ActionButton action={A.incidentStatusAction} hidden={{ incidentId: id, status: "investigating" }} label="Investigating" variant="ghost" />
      <ActionButton action={A.incidentStatusAction} hidden={{ incidentId: id, status: "resolved" }} label="Resolve" variant="ghost" />
      <ActionButton action={A.incidentStatusAction} hidden={{ incidentId: id, status: "ignored" }} label="Ignore" variant="ghost" />
    </div>
  );
}

function AgreementForm({ orgId, orgName }: { orgId: string; orgName: string }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <ActionForm action={A.createAgreementAction} hidden={{ orgId }}>
      <label className="pf-label">Agreement name<input name="name" className="field" defaultValue={`${orgName} — Managed Bot Operations`} required /></label>
      <div className="pf-form-row">
        <label className="pf-label">Monthly value ($)<input name="monthlyValue" className="field" inputMode="decimal" required placeholder="7,500" /></label>
        <label className="pf-label">Implementation fee ($)<input name="implementationFee" className="field" inputMode="decimal" placeholder="0" /></label>
        <label className="pf-label">Setup fee ($)<input name="setupFee" className="field" inputMode="decimal" placeholder="0" /></label>
      </div>
      <div className="pf-form-row">
        <label className="pf-label">Frequency<select name="billingFrequency" className="field"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option></select></label>
        <label className="pf-label">Terms (days)<input name="paymentTermsDays" type="number" min={0} max={120} defaultValue={5} className="field" /></label>
        <label className="pf-label">Preferred payment<select name="preferredPaymentMethod" className="field"><option value="ach">ACH</option><option value="wire">Wire</option><option value="bank_transfer">Bank transfer</option><option value="check">Check</option><option value="other">Other</option></select></label>
      </div>
      <div className="pf-form-row">
        <label className="pf-label">Start date<input name="startDate" type="date" defaultValue={today} className="field" required /></label>
        <label className="pf-label">Renewal date<input name="renewalDate" type="date" className="field" /></label>
        <label className="pf-label">Grace period (days)<input name="gracePeriodDays" type="number" defaultValue={7} min={0} max={90} className="field" /></label>
      </div>
      <label className="pf-check"><input type="checkbox" name="autoSuspendEnabled" /> Allow automatic suspension after the grace period (off is recommended)</label>
      <label className="pf-check"><input type="checkbox" name="autoReactivateOnPayment" /> Allow automatic reactivation after full payment</label>
      <label className="pf-label">Notes<textarea name="notes" className="field" rows={2} /></label>
      <div><SubmitButton>Create service agreement</SubmitButton></div>
    </ActionForm>
  );
}
