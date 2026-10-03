import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { can } from "@/server/auth/policy";
import { isActive, isTerminal, syncRun } from "@/server/services/runs";
import { PageHead, Panel, KV, Banner, BotName } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionButton, ActionForm, ConfirmAction, SubmitButton } from "@/components/platform/actions";
import { LiveRun } from "@/components/platform/LiveRun";
import { compact, dateTime, duration, num, usd } from "@/lib/platform/format";
import * as A from "../../actions";

export const metadata = { title: "Run" };

export default async function RunDetail({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireOperatorPage();
  const { id } = await params;
  const r = await repo();
  let run = await r.get("runs", id);
  if (!run || !can(actor, "ops.view", run.orgId)) notFound();
  if (isActive(run.status)) run = await syncRun(r, id).catch(() => run!);
  const [bot, org, events, approvals, request] = await Promise.all([
    r.get("bots", run.botId), r.get("organizations", run.orgId),
    r.list("run_events", { orgId: run.orgId, where: { runId: id }, order: "asc" }),
    r.list("approvals", { orgId: run.orgId, where: { runId: id } }),
    run.requestId ? r.get("requests", run.requestId) : null,
  ]);
  const runtime = bot ? await r.get("runtimes", bot.runtimeId) : null;
  const pending = approvals.filter((a) => a.status === "pending");

  return (
    <>
      <PageHead
        title={run.task.length > 90 ? `${run.task.slice(0, 90)}…` : run.task}
        crumbs={[{ href: "/ops/runs", label: "Runs" }, { href: `/ops/clients/${run.orgId}`, label: org?.name ?? "Client" }]}
        description={<span className="inline-flex gap-4 items-center flex-wrap"><Status value={run.status} />{bot && <BotName typeKey={bot.typeKey} name={bot.name} href={`/ops/bots/${bot.id}`} />}</span>}
        actions={
          <>
            {bot && <Link className="btn btn-outline" href={`/ops/bots/${bot.id}`}>Open Bot</Link>}
            <Link className="btn btn-outline" href={`/ops/clients/${run.orgId}`}>Open client</Link>
            {request && <Link className="btn btn-outline" href={`/ops/requests/${request.id}`}>Open request</Link>}
            <Link className="btn btn-outline" href={`/ops/monitoring?correlation=${run.correlationId}`}>Open logs</Link>
            {isActive(run.status) && <ActionButton action={A.syncRunAction} hidden={{ runId: id }} label="Refresh" variant="ghost" />}
            {isActive(run.status) && (
              <ConfirmAction action={A.stopRunAction} hidden={{ runId: id }} label="Stop run" title="Stop this run?" body="The runtime stops the Bot at its next safe point. Work already done is kept; nothing pending is sent." confirmLabel="Stop run" />
            )}
            {isTerminal(run.status) && run.status !== "completed" && <ActionButton action={A.retryRunAction} hidden={{ runId: id }} label="Retry" variant="primary" />}
          </>
        }
      />
      {pending.map((a) => (
        <Banner key={a.id} tone="watch" action={
          <div className="flex gap-2">
            <ActionButton action={A.resolveApprovalAction} hidden={{ approvalId: a.id, decision: "approve" }} label="Approve" variant="primary" />
            <ActionButton action={A.resolveApprovalAction} hidden={{ approvalId: a.id, decision: "deny" }} label="Deny" />
          </div>
        }>
          <strong>Waiting for approval ({a.audience === "client" ? "client decides" : "AgenticBots decides"}):</strong> {a.title}
          {a.preview && <div className="pf-small mt-1 whitespace-pre-wrap">{a.preview}</div>}
        </Banner>
      ))}
      {run.failureReason && <Banner tone="bad"><strong>Failure:</strong> {run.failureReason} <span className="pf-mono">{run.correlationId}</span></Banner>}

      <div className="pf-grid pf-grid-main">
        <div className="pf-grid">
          <Panel title="Technical timeline" sub="Operator view — sanitized, secrets redacted">
            <LiveRun runId={id} active={isActive(run.status)} initial={events.map((e) => ({ seq: e.seq, at: e.at, kind: e.kind, text: e.operatorText }))} />
          </Panel>
          <Panel title="What the client sees">
            <ol className="pf-timeline">
              {events.filter((e) => e.clientText).map((e) => <li key={e.id}><time>{new Date(e.at).toLocaleTimeString()}</time><span>{e.clientText}</span></li>)}
              {events.every((e) => !e.clientText) && <li><span /><span className="pf-muted">Nothing client-facing yet.</span></li>}
            </ol>
          </Panel>
          {run.resultSummary && <Panel title="Result"><p className="whitespace-pre-wrap text-[14px]">{run.resultSummary}</p></Panel>}
        </div>
        <div className="pf-grid">
          <Panel title="Run">
            <KV rows={[
              ["Run ID", <span key="i" className="pf-mono">{run.id}</span>],
              ["Correlation ID", <span key="c" className="pf-mono">{run.correlationId}</span>],
              ["Runtime run ID", <span key="rr" className="pf-mono">{run.runtimeRunId ?? "—"}</span>],
              ["Runtime session", <span key="rs" className="pf-mono">{run.conversationId ?? "—"}</span>],
              ["Runtime", runtime ? <span key="rt">{runtime.kind === "hermes" ? "Hermes" : "Demo"} {runtime.engineVersion} · profile <span className="pf-mono">{bot?.runtimeProfile}</span></span> : "—"],
              ["Idempotency key", <span key="k" className="pf-mono">{run.idempotencyKey}</span>],
              ["Started", dateTime(run.startedAt ?? run.createdAt)],
              ["Ended", dateTime(run.endedAt)],
              ["Duration", duration(run.startedAt, run.endedAt)],
              ["Approval", <Status key="a" value={run.approvalState === "none" ? "none" : run.approvalState} />],
            ]} />
          </Panel>
          <Panel title="Usage">
            <KV rows={[
              ["Provider / model", <span key="m">{run.provider}/<span className="pf-mono">{run.model}</span></span>],
              ["Input tokens", num(run.usage.inputTokens)],
              ["Output tokens", num(run.usage.outputTokens)],
              ["Cache reads / writes", `${compact(run.usage.cacheReadTokens)} / ${compact(run.usage.cacheWriteTokens)}`],
              ["Estimated cost", usd(run.estimatedCostUsd, 4)],
            ]} />
          </Panel>
          <Panel title="Operator notes">
            <ActionForm action={A.runNotesAction} hidden={{ runId: id }}>
              <textarea name="notes" className="field" rows={3} defaultValue={run.operatorNotes} aria-label="Operator notes" />
              <div><SubmitButton variant="outline">Save notes</SubmitButton></div>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
