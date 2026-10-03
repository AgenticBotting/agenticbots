import Link from "next/link";
import type {
  Approval, AuditLog, AutomationJob, Bot, Incident, Integration, Invoice, Run, WorkRequest,
} from "@/lib/platform/types";
import { BotName, Empty, Table, When } from "./ui";
import { Status } from "./status";
import { compact, duration, money, shortId, titleCase, usd } from "@/lib/platform/format";
import { REQUEST_STATUS_LABEL } from "@/server/views/client";

type Names = { orgs?: Map<string, string>; bots?: Map<string, Bot> };

export function RunsTable({ runs, names, showClient = true }: { runs: Run[]; names: Names; showClient?: boolean }) {
  return (
    <Table head={["Run", "Bot", ...(showClient ? ["Client"] : []), "Task", "Status", "Started", "Duration", "Tokens", "Est. cost"]} empty={<Empty title="No runs yet" />}>
      {runs.map((r) => {
        const bot = names.bots?.get(r.botId);
        return (
          <tr key={r.id}>
            <td><Link className="row-link pf-mono" href={`/ops/runs/${r.id}`}>{shortId(r.id)}</Link></td>
            <td>{bot ? <BotName typeKey={bot.typeKey} name={bot.name} /> : "—"}</td>
            {showClient && <td>{names.orgs?.get(r.orgId)}</td>}
            <td><div className="pf-trunc">{r.task}</div>{r.failureReason && <div className="pf-small text-[var(--color-danger)] pf-trunc">{r.failureReason}</div>}</td>
            <td><Status value={r.status} />{r.approvalState === "pending" && <div className="pf-small pf-muted">approval pending</div>}</td>
            <td><When iso={r.startedAt ?? r.createdAt} /></td>
            <td>{duration(r.startedAt, r.endedAt)}</td>
            <td className="num">{compact(r.usage.inputTokens + r.usage.outputTokens)}</td>
            <td className="num">{usd(r.estimatedCostUsd, 3)}</td>
          </tr>
        );
      })}
    </Table>
  );
}

export function BotsTable({ bots, names, showClient = true, runs }: { bots: Bot[]; names: Names; showClient?: boolean; runs?: Map<string, Run> }) {
  return (
    <Table head={["Bot", ...(showClient ? ["Client"] : []), "Status", "Current run", "Model", "Integrations", "Last activity", "Error"]} empty={<Empty title="No Bots deployed" />}>
      {bots.map((b) => (
        <tr key={b.id}>
          <td><BotName typeKey={b.typeKey} name={b.name} href={`/ops/bots/${b.id}`} /></td>
          {showClient && <td>{names.orgs?.get(b.orgId)}</td>}
          <td><Status value={b.status} /></td>
          <td>{b.currentRunId ? <Link className="underline pf-small" href={`/ops/runs/${b.currentRunId}`}>{runs?.get(b.currentRunId)?.task.slice(0, 40) ?? "Open run"}</Link> : <span className="pf-muted">—</span>}</td>
          <td className="pf-small">{b.provider}/<span className="pf-mono">{b.model}</span></td>
          <td className="num">{b.integrationIds.length}</td>
          <td><When iso={b.lastActivityAt} /></td>
          <td className="pf-small">{b.errorState ? <span className="text-[var(--color-danger)]">{b.errorState.code}</span> : <span className="pf-muted">—</span>}</td>
        </tr>
      ))}
    </Table>
  );
}

export function RequestsTable({ requests, names, showClient = true }: { requests: WorkRequest[]; names: Names & { users?: Map<string, string> }; showClient?: boolean }) {
  return (
    <Table head={["Request", ...(showClient ? ["Client"] : []), "Priority", "Status", "Assigned", "Submitted"]} empty={<Empty title="No requests" />}>
      {requests.map((q) => (
        <tr key={q.id}>
          <td><Link className="row-link" href={`/ops/requests/${q.id}`}>{q.title}</Link></td>
          {showClient && <td>{names.orgs?.get(q.orgId)}</td>}
          <td><Status value={q.priority === "urgent" ? "critical" : q.priority === "high" ? "high" : "low"} label={titleCase(q.priority)} /></td>
          <td><Status value={q.status} label={REQUEST_STATUS_LABEL[q.status]} /></td>
          <td className="pf-small">{q.assignedOperatorId ? names.users?.get(q.assignedOperatorId) ?? "Operator" : <span className="pf-muted">Unassigned</span>}{q.assignedBotIds.length > 0 && <div className="pf-muted">{q.assignedBotIds.map((id) => names.bots?.get(id)?.name).filter(Boolean).join(", ")}</div>}</td>
          <td><When iso={q.submittedAt} /></td>
        </tr>
      ))}
    </Table>
  );
}

export function AutomationsTable({ jobs, names, showClient = true, actions }: { jobs: AutomationJob[]; names: Names; showClient?: boolean; actions?: (j: AutomationJob) => React.ReactNode }) {
  return (
    <Table head={["Automation", "Bot", ...(showClient ? ["Client"] : []), "Schedule", "Status", "Last run", "Next run", ""]} empty={<Empty title="No automations" />}>
      {jobs.map((j) => {
        const bot = names.bots?.get(j.botId);
        return (
          <tr key={j.id}>
            <td><strong className="text-[var(--foreground)]">{j.name}</strong><div className="pf-small pf-muted pf-trunc">{j.prompt}</div>{j.lastError && <div className="pf-small text-[var(--color-danger)]">{j.lastError}</div>}</td>
            <td>{bot ? <BotName typeKey={bot.typeKey} name={bot.name} href={`/ops/bots/${bot.id}`} /> : "—"}</td>
            {showClient && <td>{names.orgs?.get(j.orgId)}</td>}
            <td>{j.scheduleLabel}<div className="pf-mono pf-muted">{j.schedule}</div></td>
            <td><Status value={j.status} />{j.consecutiveFailures > 0 && <div className="pf-small pf-muted">{j.consecutiveFailures} failures in a row</div>}</td>
            <td><When iso={j.lastRunAt} />{j.lastStatus && <div className="pf-small"><Status value={j.lastStatus} /></div>}</td>
            <td><When iso={j.nextRunAt} /></td>
            <td>{actions?.(j)}</td>
          </tr>
        );
      })}
    </Table>
  );
}

export function IntegrationsTable({ items, names, showClient = true, actions }: { items: Integration[]; names: Names; showClient?: boolean; actions?: (i: Integration) => React.ReactNode }) {
  return (
    <Table head={["Integration", ...(showClient ? ["Client"] : []), "Status", "Credential", "Bots with access", "Last check", ""]} empty={<Empty title="No integrations" />}>
      {items.map((i) => (
        <tr key={i.id}>
          <td><strong className="text-[var(--foreground)]">{i.displayName}</strong><div className="pf-small pf-muted">{i.provider}{i.metadata.toolset ? ` · tool connection “${i.metadata.toolset}”` : ""}</div>{i.lastError && <div className="pf-small text-[var(--color-danger)]">{i.lastError}</div>}</td>
          {showClient && <td>{names.orgs?.get(i.orgId)}</td>}
          <td><Status value={i.status} />{i.verifiedBy && i.status === "connected" && <div className="pf-small pf-muted">verified by {i.verifiedBy}</div>}</td>
          <td className="pf-small">{i.secretRef ? <span className="pf-mono">{i.secretRef.split("/").slice(-2).join("/")}</span> : <span className="pf-muted">none</span>}</td>
          <td className="pf-small">{i.botIds.map((id) => names.bots?.get(id)?.name).filter(Boolean).join(", ") || <span className="pf-muted">none</span>}</td>
          <td><When iso={i.lastCheckAt} /></td>
          <td>{actions?.(i)}</td>
        </tr>
      ))}
    </Table>
  );
}

export function IncidentsTable({ incidents, names, showClient = true, actions }: { incidents: Incident[]; names: Names; showClient?: boolean; actions?: (i: Incident) => React.ReactNode }) {
  return (
    <Table head={["Severity", "Incident", ...(showClient ? ["Client"] : []), "Type", "Status", "First seen", "Last seen", "Occurrences", ""]} empty={<Empty title="No incidents" />}>
      {incidents.map((i) => (
        <tr key={i.id} id={`incident-${i.id}`}>
          <td><Status value={i.severity} /></td>
          <td><strong className="text-[var(--foreground)]">{i.title}</strong><div className="pf-small pf-muted">{i.detail}</div><div className="pf-mono pf-muted">{i.correlationIds.slice(-1)[0]}</div>{i.clientMessage && <div className="pf-small">Client sees: “{i.clientMessage}”</div>}</td>
          {showClient && <td>{names.orgs?.get(i.orgId)}</td>}
          <td className="pf-small">{titleCase(i.type)}</td>
          <td><Status value={i.status} /></td>
          <td><When iso={i.firstSeenAt} /></td>
          <td><When iso={i.lastSeenAt} /></td>
          <td className="num">{i.occurrences}</td>
          <td>{actions?.(i)}</td>
        </tr>
      ))}
    </Table>
  );
}

export function ApprovalsTable({ approvals, names, showClient = true, actions }: { approvals: Approval[]; names: Names; showClient?: boolean; actions?: (a: Approval) => React.ReactNode }) {
  return (
    <Table head={["Requested action", "Bot", ...(showClient ? ["Client"] : []), "Decided by", "Risk", "Status", "Requested", ""]} empty={<Empty title="No approvals" />}>
      {approvals.map((a) => {
        const bot = names.bots?.get(a.botId);
        return (
          <tr key={a.id}>
            <td><strong className="text-[var(--foreground)]">{a.title}</strong><div className="pf-small pf-muted">{titleCase(a.category)} · {a.kind === "runtime" ? "run is paused" : "prepared work"}</div>{a.runId && <Link className="pf-small underline" href={`/ops/runs/${a.runId}`}>Open run</Link>}</td>
            <td>{bot ? <BotName typeKey={bot.typeKey} name={bot.name} /> : "—"}</td>
            {showClient && <td>{names.orgs?.get(a.orgId)}</td>}
            <td className="pf-small">{a.audience === "client" ? "Client" : "AgenticBots"}</td>
            <td><Status value={a.risk} /></td>
            <td><Status value={a.status} /></td>
            <td><When iso={a.requestedAt} /></td>
            <td>{actions?.(a)}</td>
          </tr>
        );
      })}
    </Table>
  );
}

export function AuditTable({ rows, names }: { rows: AuditLog[]; names: Names }) {
  return (
    <Table head={["When", "Actor", "Action", "Client", "Target", "Result", "Correlation"]} empty={<Empty title="No audit records" />}>
      {rows.map((a) => (
        <tr key={a.id}>
          <td><When iso={a.createdAt} /></td>
          <td>{a.actorName}</td>
          <td><span className="pf-mono">{a.action}</span>{a.detail && <div className="pf-small pf-muted pf-trunc">{a.detail}</div>}</td>
          <td className="pf-small">{a.orgId ? names.orgs?.get(a.orgId) : "—"}</td>
          <td className="pf-small">{a.targetType}{a.targetId ? <span className="pf-mono pf-muted"> {shortId(a.targetId)}</span> : null}</td>
          <td><Status value={a.result === "success" ? "succeeded" : "failed"} label={titleCase(a.result)} /></td>
          <td className="pf-mono pf-muted">{a.correlationId}</td>
        </tr>
      ))}
    </Table>
  );
}

export function InvoicesTable({ invoices, names, showClient = true }: { invoices: Invoice[]; names: Names; showClient?: boolean }) {
  return (
    <Table head={["Invoice", ...(showClient ? ["Client"] : []), "Issued", "Due", "Status", "Total", "Paid", "Balance"]} empty={<Empty title="No invoices yet" />}>
      {invoices.map((i) => (
        <tr key={i.id}>
          <td><Link className="row-link pf-mono" href={`/ops/billing/invoices/${i.id}`}>{i.invoiceNumber}</Link></td>
          {showClient && <td>{names.orgs?.get(i.orgId)}</td>}
          <td>{i.issueDate}</td>
          <td>{i.dueDate}</td>
          <td><Status value={i.status} /></td>
          <td className="num">{money(i.totalCents)}</td>
          <td className="num">{money(i.amountPaidCents)}</td>
          <td className="num"><strong>{money(i.balanceDueCents)}</strong></td>
        </tr>
      ))}
    </Table>
  );
}
