import "server-only";
import { requireExecutionRelease } from "@/server/security/release-gates";
import type { Approval } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import { can, type Actor } from "@/server/auth/policy";
import { correlationId as newCorrelationId, nowIso } from "@/server/ids";
import { botRuntime } from "@/server/runtime";
import { sanitizeRuntimeError } from "@/server/runtime/runtime-errors";
import { conflict, notFound } from "@/server/errors";
import { redactSecrets } from "@/server/redact";
import { assertExecutable, audit, SYSTEM } from "./common";
import { syncRun } from "./runs";

/**
 * Approval resolution. Ownership is checked against the approval's own
 * organization: a client can only decide approvals in their organization,
 * addressed to clients; operators can decide any approval they can see.
 */
export async function resolveApproval(
  r: Repository,
  actor: Actor,
  approvalId: string,
  decision: "approve" | "deny",
  note?: string,
): Promise<Approval> {
  const approval = await r.get("approvals", approvalId);
  if (!approval) throw notFound("Approval");
  const isOperator = can(actor, "ops.approvals.resolve", approval.orgId);
  const isClient = can(actor, "portal.approvals.resolve", approval.orgId) && approval.audience === "client";
  if (!isOperator && !isClient) throw notFound("Approval");
  if (!["approve", "deny"].includes(decision)) throw conflict("Choose approve or deny.");
  if (approval.kind === "runtime" && decision === "approve") requireExecutionRelease();
  if (approval.status !== "pending") throw conflict("This approval was already decided.");
  if (approval.expiresAt && Date.parse(approval.expiresAt) < Date.now()) {
    const tx = new Tx(r);
    tx.patch("approvals", approval, { status: "expired", resolvedAt: nowIso() });
    audit(tx, SYSTEM, { action: "approval.expire", orgId: approval.orgId, targetType: "approval", targetId: approval.id, correlationId: newCorrelationId() });
    await tx.commit();
    throw conflict("Approval expired.");
  }
  const org = await r.get("organizations", approval.orgId);
  if (!org) throw notFound("Approval");
  if (decision === "approve") assertExecutable(org);

  const correlationId = newCorrelationId();
  const bot = await r.get("bots", approval.botId);
  if (!bot) throw notFound("Approval");

  const run = approval.runId ? await r.get("runs", approval.runId) : null;
  const runtime = await r.get("runtimes", bot.runtimeId);
  if (bot.orgId !== approval.orgId || (run && (run.orgId !== approval.orgId || run.botId !== bot.id))) throw notFound("Approval");
  if (approval.kind === "runtime" && (!run?.runtimeRunId || !runtime || runtime.orgId !== approval.orgId || !approval.runtimeApprovalId)) throw conflict("This action has no verifiable runtime request. Refresh the BOT RUN before deciding.");

  const tx = new Tx(r);
  const next = tx.patch("approvals", approval, {
    status: decision === "approve" ? "approved" : "denied",
    executionState: approval.kind === "runtime" ? "dispatching" : "not_applicable",
    resolvedBy: actor.user.id,
    resolvedAt: nowIso(),
    resolutionNote: note ? redactSecrets(note, 500) : undefined,
  });
  if (approval.runId) {
    const run = await r.get("runs", approval.runId);
    if (run) tx.patch("runs", run, { approvalState: decision === "approve" ? "approved" : "denied" });
  }
  tx.insert("activity_events", {
    orgId: approval.orgId,
    at: nowIso(),
    botId: approval.botId,
    runId: approval.runId,
    requestId: approval.requestId,
    text: `${decision === "approve" ? "Approved" : "Declined"}: ${approval.title}`,
    visibility: "client",
  });
  audit(tx, actor, {
    action: `approval.${decision}`,
    orgId: approval.orgId,
    targetType: "approval",
    targetId: approval.id,
    correlationId,
    detail: approval.title,
  });
  await tx.commit();

  if (approval.kind === "runtime" && run?.runtimeRunId && runtime) {
    let acknowledged = false;
    let executionError: string | undefined;
    try {
      const rt = botRuntime(runtime, bot);
      if (decision === "approve") await rt.approveBotRun(run.runtimeRunId, approval.runtimeApprovalId);
      else await rt.denyBotRun(run.runtimeRunId, approval.runtimeApprovalId);
      acknowledged = true;
    } catch (e) { executionError = sanitizeRuntimeError(e, correlationId).operator; }
    // Persist the outcome separately. If storage fails after dispatch, the
    // durable dispatching state remains visible and is never auto-retried.
    const done = new Tx(r);
    const result = done.patch("approvals", next, { executionState: acknowledged ? "acknowledged" : "unknown", executionError });
    audit(done, actor, { action: acknowledged ? "approval.dispatch.acknowledged" : "approval.dispatch.unknown", orgId: approval.orgId, targetType: "approval", targetId: approval.id, correlationId, result: acknowledged ? "success" : "failure" });
    await done.commit();
    if (!acknowledged) throw conflict("Your decision was recorded, but execution is unconfirmed. Review the BOT RUN before any retry.");
    await syncRun(r, run.id).catch(() => undefined);
    return result;
  }
  // Accepting a draft never grants an LLM permission to invent a new send/write.
  // Execution requires an exact, expiring runtime request with its own approval.
  return next;
}

/** Called by the sync job: pending approvals past their expiry are
 *  expired, and the runtime is told "deny" so nothing proceeds by default. */
export async function expireApprovals(r: Repository): Promise<number> {
  const pending = (await r.list("approvals")).filter(
    (a) => a.status === "pending" && a.expiresAt && Date.parse(a.expiresAt) < Date.now(),
  );
  for (const a of pending) {
    const tx = new Tx(r);
    tx.patch("approvals", a, { status: "expired", resolvedAt: nowIso(), resolutionNote: "Expired without a decision" });
    audit(tx, SYSTEM, { action: "approval.expire", orgId: a.orgId, targetType: "approval", targetId: a.id, correlationId: newCorrelationId() });
    await tx.commit();
    if (a.kind === "runtime" && a.runId) {
      const [run, bot] = await Promise.all([r.get("runs", a.runId), r.get("bots", a.botId)]);
      const runtime = bot ? await r.get("runtimes", bot.runtimeId) : null;
      if (run?.runtimeRunId && bot && runtime) {
        await botRuntime(runtime, bot)
          .denyBotRun(run.runtimeRunId, a.runtimeApprovalId)
          .catch(() => undefined);
      }
    }

  }
  return pending.length;
}

/** Operator creates a deliverable approval for the client (e.g. drafted
 *  emails ready to send). */
export async function createDeliverableApproval(
  r: Repository,
  actor: Actor,
  input: Pick<Approval, "orgId" | "botId" | "category" | "title" | "explanation" | "expectedImpact" | "risk" | "preview" | "requestId"> & { audience?: Approval["audience"] },
): Promise<Approval> {
  if (!can(actor, "ops.approvals.resolve", input.orgId)) throw notFound();
  const bot = await r.get("bots", input.botId);
  if (!bot || bot.orgId !== input.orgId) throw notFound("Bot");
  const tx = new Tx(r);
  const a = tx.insert("approvals", {
    ...input,
    kind: "deliverable",
    status: "pending",
    audience: input.audience ?? "client",
    requestedAt: nowIso(),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600_000).toISOString(),
  });
  if (input.requestId) {
    const req = await r.get("requests", input.requestId);
    if (req && req.orgId === input.orgId) {
      tx.patch("requests", req, { linkedApprovalIds: [...req.linkedApprovalIds, a.id] });
    }
  }
  audit(tx, actor, { action: "approval.create", orgId: input.orgId, targetType: "approval", targetId: a.id, correlationId: newCorrelationId(), detail: input.title });
  await tx.commit();
  return a;
}
