import "server-only";
import type { Approval } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import { can, type Actor } from "@/server/auth/policy";
import { correlationId as newCorrelationId, nowIso } from "@/server/ids";
import { adapterFor, resolveTarget } from "@/server/runtime";
import { sanitizeRuntimeError } from "@/server/runtime/errors";
import { conflict, notFound } from "@/server/errors";
import { redactSecrets } from "@/server/redact";
import { assertExecutable, audit } from "./common";
import { startRun, syncRun } from "./runs";

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
  if (approval.status !== "pending") throw conflict("This approval was already decided.");
  if (approval.expiresAt && Date.parse(approval.expiresAt) < Date.now()) {
    const tx = new Tx(r);
    tx.patch("approvals", approval, { status: "expired", resolvedAt: nowIso() });
    await tx.commit();
    throw conflict("Approval expired.");
  }
  const org = await r.get("organizations", approval.orgId);
  if (!org) throw notFound("Approval");
  if (decision === "approve") assertExecutable(org);

  const correlationId = newCorrelationId();
  const bot = await r.get("bots", approval.botId);
  if (!bot) throw notFound("Approval");

  if (approval.kind === "runtime" && approval.runId) {
    const run = await r.get("runs", approval.runId);
    const runtime = await r.get("runtimes", bot.runtimeId);
    if (run?.runtimeRunId && runtime) {
      try {
        const target = await resolveTarget(runtime, bot);
        const adapter = adapterFor(runtime);
        if (decision === "approve") await adapter.approveRun(target, run.runtimeRunId, approval.runtimeRequestId);
        else await adapter.denyRun(target, run.runtimeRunId, approval.runtimeRequestId);
      } catch (e) {
        const s = sanitizeRuntimeError(e, correlationId);
        throw conflict(s.client === "Task could not be completed." ? "The run could not be resumed. AgenticBots has been notified." : s.client);
      }
    }
  }

  const tx = new Tx(r);
  const next = tx.patch("approvals", approval, {
    status: decision === "approve" ? "approved" : "denied",
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

  if (approval.kind === "runtime" && approval.runId) {
    await syncRun(r, approval.runId).catch(() => undefined);
  }
  // A deliverable approval releases the prepared work: start the execution
  // run, keyed on the approval so a double click can never send twice.
  if (approval.kind === "deliverable" && decision === "approve" && bot.status !== "disabled") {
    await startRun(r, { id: actor.user.id, name: actor.user.name }, {
      botId: bot.id,
      task: `Carry out the approved action: ${approval.title}. Approved preview: ${approval.preview ?? "(see request)"}`,
      idempotencyKey: `approval-${approval.id}`,
      requestId: approval.requestId,
    }).catch(() => undefined);
  }
  return next;
}

/** Called by the sync job: pending approvals past their expiry are
 *  expired, and the runtime is told "deny" so nothing proceeds by default. */
export async function expireApprovals(r: Repository): Promise<number> {
  const pending = (await r.list("approvals")).filter(
    (a) => a.status === "pending" && a.expiresAt && Date.parse(a.expiresAt) < Date.now(),
  );
  for (const a of pending) {
    if (a.kind === "runtime" && a.runId) {
      const [run, bot] = await Promise.all([r.get("runs", a.runId), r.get("bots", a.botId)]);
      const runtime = bot ? await r.get("runtimes", bot.runtimeId) : null;
      if (run?.runtimeRunId && bot && runtime) {
        await adapterFor(runtime)
          .denyRun(await resolveTarget(runtime, bot), run.runtimeRunId, a.runtimeRequestId)
          .catch(() => undefined);
      }
    }
    const tx = new Tx(r);
    tx.patch("approvals", a, { status: "expired", resolvedAt: nowIso(), resolutionNote: "Expired without a decision" });
    await tx.commit();
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
