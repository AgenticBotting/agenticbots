import "server-only";
import type { Bot, Organization, Run, RunStatus, Runtime, ResultMetric } from "@/lib/platform/types";
import { TERMINAL_RUN_STATUSES } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { correlationId as newCorrelationId, nowIso } from "@/server/ids";
import { adapterFor, demoAdapter, resolveTarget } from "@/server/runtime";
import type { RuntimeEvent } from "@/server/runtime/adapter";
import { sanitizeRuntimeError } from "@/server/runtime/errors";
import { translateEvent } from "@/server/runtime/translate";
import { clientSafe, redactSecrets } from "@/server/redact";
import { conflict, invalid, notFound } from "@/server/errors";
import { assertExecutable, assertPermission, audit, getScoped, SYSTEM, type ActorRef } from "./common";
import { estimateCost, recordRunUsage, ZERO_USAGE } from "./usage";
import { raiseIncident } from "./incidents";
import { isResultMetric } from "@/lib/platform/metrics";
import { getBotType } from "@/config/bot-catalog";

const ACTIVE: RunStatus[] = ["queued", "running", "waiting_for_approval"];
export const isActive = (s: RunStatus) => ACTIVE.includes(s);
export const isTerminal = (s: RunStatus) => TERMINAL_RUN_STATUSES.includes(s);

async function loadContext(r: Repository, botId: string) {
  const bot = await r.get("bots", botId);
  if (!bot) throw notFound("Bot");
  const [org, runtime] = await Promise.all([r.get("organizations", bot.orgId), r.get("runtimes", bot.runtimeId)]);
  if (!org || !runtime) throw notFound("Bot");
  return { bot, org, runtime };
}

export interface StartRunInput {
  botId: string;
  task: string;
  idempotencyKey: string;
  requestId?: string;
  conversationId?: string;
  automationId?: string;
  instructions?: string;
}

/**
 * Start a Bot Run. Safe to call twice with the same idempotency key (double
 * click, browser retry, server retry): the second call returns the first
 * run instead of starting duplicate work, both here and on the runtime.
 */
export async function startRun(r: Repository, actor: Actor | ActorRef, input: StartRunInput): Promise<Run> {
  const task = input.task.trim();
  if (task.length < 3) throw invalid("Describe the task in a few words.");
  if (task.length > 4000) throw invalid("Task is too long (4,000 characters max).");
  if (!/^[A-Za-z0-9_.:-]{8,128}$/.test(input.idempotencyKey)) throw invalid("Invalid idempotency key.");

  const { bot, org, runtime } = await loadContext(r, input.botId);
  if ("user" in actor) assertPermission(actor, "ops.runs.control", bot.orgId);
  assertExecutable(org);
  if (bot.status === "disabled") throw conflict(`${bot.name} is disabled. Enable it before starting work.`);
  if (bot.status === "provisioning") throw conflict(`${bot.name} is still being deployed.`);

  const existing = (await r.list("runs", { orgId: org.id, where: { idempotencyKey: input.idempotencyKey } }))[0];
  if (existing) return existing;

  const correlationId = newCorrelationId();
  const startedBy = "user" in actor ? actor.user.id : actor.id;
  let tx = new Tx(r);
  let run = tx.insert("runs", {
    orgId: org.id,
    botId: bot.id,
    task,
    status: "queued",
    requestId: input.requestId,
    conversationId: input.conversationId,
    automationId: input.automationId,
    idempotencyKey: input.idempotencyKey,
    correlationId,
    startedBy,
    usage: ZERO_USAGE,
    estimatedCostUsd: 0,
    approvalState: "none",
    eventCursor: 0,
    provider: bot.provider,
    model: bot.model,
  });
  audit(tx, actor, { action: "run.start", orgId: org.id, targetType: "run", targetId: run.id, correlationId, detail: `${bot.name}: ${task.slice(0, 120)}` });
  await tx.commit();

  try {
    const target = await resolveTarget(runtime, bot);
    let conversationRuntimeId: string | undefined;
    if (input.conversationId) {
      const conv = await r.get("conversations", input.conversationId);
      if (!conv || conv.orgId !== org.id || conv.botId !== bot.id) throw notFound("Conversation");
      conversationRuntimeId = conv.runtimeSessionId;
    }
    const res = await adapterFor(runtime).startBotRun(target, {
      task,
      instructions: input.instructions ?? bot.instructions,
      conversationRuntimeId,
      idempotencyKey: input.idempotencyKey,
      correlationId,
      provider: bot.provider === "demo" ? undefined : bot.provider,
      model: bot.provider === "demo" ? undefined : bot.model,
      reasoning: bot.reasoning,
    });
    tx = new Tx(r);
    run = tx.patch("runs", run, { runtimeRunId: res.runtimeRunId, status: "running", startedAt: nowIso() });
    tx.patch("bots", bot, { currentRunId: run.id, status: "working", lastActivityAt: nowIso() });
    if (input.requestId) {
      const req = await r.get("requests", input.requestId);
      if (req && req.orgId === org.id) {
        tx.patch("requests", req, {
          linkedRunIds: Array.from(new Set([...req.linkedRunIds, run.id])),
          assignedBotIds: Array.from(new Set([...req.assignedBotIds, bot.id])),
          status: req.status === "submitted" || req.status === "reviewing" ? "in_progress" : req.status,
        });
      }
    }
    await tx.commit();
  } catch (e) {
    const s = sanitizeRuntimeError(e, correlationId);
    tx = new Tx(r);
    run = tx.patch("runs", run, { status: "failed", failureReason: `${s.code}: ${s.operator}`, endedAt: nowIso() });
    tx.patch("bots", bot, { errorState: { code: s.code, message: s.operator, at: nowIso(), correlationId } });
    tx.insert("run_events", {
      orgId: org.id, runId: run.id, seq: 1, at: nowIso(), kind: "error",
      clientText: s.client, operatorText: `Could not start: ${s.operator}`,
    });
    await tx.commit();
    await raiseIncident(r, {
      orgId: org.id, type: s.code === "provider_failure" ? "provider_failure" : "runtime_offline",
      severity: "high", title: `${bot.name} could not start a run`, detail: s.operator, correlationId,
      target: runtime.id, botId: bot.id, runId: run.id, runtimeId: runtime.id,
    });
  }
  return run;
}

/** Bring one run up to date with the runtime: status, events, usage,
 *  approvals. Idempotent; safe to call from page loads, SSE and the sync job. */
export async function syncRun(r: Repository, runId: string, events?: RuntimeEvent[]): Promise<Run> {
  let run = await r.get("runs", runId);
  if (!run) throw notFound("Run");
  if (isTerminal(run.status) || !run.runtimeRunId) return run;
  const { bot, org, runtime } = await loadContext(r, run.botId);
  const adapter = adapterFor(runtime);

  let state;
  try {
    const target = await resolveTarget(runtime, bot);
    state = await adapter.getRun(target, run.runtimeRunId);
    if (!events && adapter.kind === "demo") events = demoAdapter().eventsSoFar(run.runtimeRunId);
  } catch (e) {
    const s = sanitizeRuntimeError(e, run.correlationId);
    const tx = new Tx(r);
    tx.patch("runs", run, { lastSyncedAt: nowIso() });
    await tx.commit();
    if (s.code === "runtime_not_found") {
      return finalize(r, run, bot, org, runtime, { status: "interrupted", error: "Runtime no longer knows this run (restart?)" });
    }
    return run;
  }

  if (events?.length) run = await ingestEvents(r, run, events);

  if (state.status === "waiting_for_approval" && state.pendingApproval) {
    await ensureRuntimeApproval(r, run, bot, state.pendingApproval);
    run = (await r.get("runs", run.id)) ?? run;
  }

  if (isTerminal(state.status)) {
    return finalize(r, run, bot, org, runtime, {
      status: state.status,
      output: state.output,
      usage: state.usage,
      provider: state.provider,
      model: state.model,
      error: state.error,
    });
  }

  if (state.status !== run.status) {
    const tx = new Tx(r);
    run = tx.patch("runs", run, { status: state.status, lastSyncedAt: nowIso() });
    await tx.commit();
  }
  return run;
}

/**
 * Store translated events with monotonically increasing sequence numbers.
 *   snapshot: `events` is the run's full history so far (demo runtime) —
 *             anything at or below the cursor was already stored.
 *   append:   `events` are new deliveries from a live stream (the real
 *             runtime's event stream is consume-once).
 */
export async function ingestEvents(
  r: Repository,
  run: Run,
  events: RuntimeEvent[],
  mode: "snapshot" | "append" = "snapshot",
): Promise<Run> {
  const fresh = mode === "snapshot" ? events.slice(run.eventCursor) : events;
  if (fresh.length === 0) return run;
  const tx = new Tx(r);
  let seq = run.eventCursor;
  for (const e of fresh) {
    seq += 1;
    const t = translateEvent(e);
    if (!t) continue;
    tx.insert("run_events", {
      orgId: run.orgId,
      runId: run.id,
      seq,
      at: e.at,
      kind: t.kind,
      clientText: t.clientText ? clientSafe(t.clientText, 160) : undefined,
      operatorText: redactSecrets(t.operatorText, 600),
      technical: t.technical,
    });
  }
  const next = tx.patch("runs", run, { eventCursor: seq, lastSyncedAt: nowIso() });
  await tx.commit();
  return next;
}

async function ensureRuntimeApproval(
  r: Repository,
  run: Run,
  bot: Bot,
  pending: { requestId?: string; description: string; detail?: string },
): Promise<void> {
  const open = (await r.list("approvals", { orgId: run.orgId, where: { runId: run.id } })).find((a) => a.status === "pending");
  if (open) return;
  const tx = new Tx(r);
  const type = getBotType(bot.typeKey);
  const sendsExternally = type?.defaultCapabilities.includes("external_send");
  tx.insert("approvals", {
    orgId: run.orgId,
    botId: bot.id,
    runId: run.id,
    requestId: run.requestId,
    kind: "runtime",
    category: sendsExternally ? "external_send" : "runtime_action",
    title: clientSafe(pending.description, 140) || "Action needs approval",
    explanation: `${bot.name} paused before an action that needs a human decision.`,
    expectedImpact: sendsExternally ? "Messages will be sent from your connected account." : "The Bot will continue its task.",
    risk: sendsExternally ? "medium" : "low",
    preview: pending.detail ? clientSafe(pending.detail, 400) : undefined,
    status: "pending",
    // Runtime-level approvals (commands, tool trust) are decided by AgenticBots;
    // business sends are decided by the client.
    audience: sendsExternally ? "client" : "operator",
    requestedAt: nowIso(),
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    runtimeRequestId: pending.requestId,
  });
  tx.patch("runs", run, { approvalState: "pending", status: "waiting_for_approval" });
  await tx.commit();
}

/** Parse counts a Bot reports with a line like:  METRICS {"prospects_researched": 38}
 *  Unknown keys are ignored; nothing is inferred. */
export function parseMetrics(output: string | undefined): { key: ResultMetric; value: number }[] {
  if (!output) return [];
  const m = output.match(/METRICS\s*(\{[^\n]{2,400}\})/);
  if (!m) return [];
  try {
    const obj = JSON.parse(m[1]) as Record<string, unknown>;
    return Object.entries(obj)
      .filter(([k, v]) => isResultMetric(k) && typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1_000_000)
      .map(([k, v]) => ({ key: k as ResultMetric, value: Math.round(v as number) }));
  } catch {
    return [];
  }
}

async function finalize(
  r: Repository,
  run: Run,
  bot: Bot,
  org: Organization,
  runtime: Runtime,
  res: { status: RunStatus; output?: string; usage?: Run["usage"]; provider?: string; model?: string; error?: string },
): Promise<Run> {
  // Re-read inside finalize so two concurrent syncs cannot both settle it.
  const fresh = await r.get("runs", run.id);
  if (!fresh || isTerminal(fresh.status)) return fresh ?? run;
  run = fresh;

  const providers = await r.list("provider_configurations");
  const usage = res.usage ?? ZERO_USAGE;
  const provider = res.provider ?? run.provider;
  const model = res.model ?? run.model;
  const cost = estimateCost(usage, provider, model, providers);
  const failed = res.status === "failed" || res.status === "interrupted";
  const summary = res.output ? redactSecrets(res.output.replace(/METRICS\s*\{[^\n]*\}/, "").trim(), 1200) : undefined;

  const tx = new Tx(r);
  const next = tx.patch("runs", run, {
    status: res.status,
    endedAt: nowIso(),
    usage,
    provider,
    model,
    estimatedCostUsd: cost.usd,
    resultSummary: summary,
    failureReason: failed ? redactSecrets(res.error ?? "Run did not finish", 400) : undefined,
    approvalState: run.approvalState === "pending" ? "denied" : run.approvalState,
  });
  const currentBot = await r.get("bots", bot.id);
  if (currentBot) {
    tx.patch("bots", currentBot, {
      currentRunId: currentBot.currentRunId === run.id ? undefined : currentBot.currentRunId,
      status: currentBot.status === "working" ? "active" : currentBot.status,
      lastActivityAt: nowIso(),
      lastResult: res.status === "completed" && summary ? clientSafe(summary, 200) : currentBot.lastResult,
      ...(failed ? { errorState: { code: "run_failed", message: redactSecrets(res.error ?? "Run failed", 300), at: nowIso(), correlationId: run.correlationId } } : {}),
    });
  }
  await recordRunUsage(r, tx, { orgId: org.id, botId: bot.id, usage, costUsd: cost.usd, failed });

  if (res.status === "completed") {
    const metrics = parseMetrics(res.output);
    tx.insert("activity_events", {
      orgId: org.id,
      at: nowIso(),
      botId: bot.id,
      runId: run.id,
      requestId: run.requestId,
      text: `${bot.name} completed: ${clientSafe(summary?.split(/(?<=\.)\s/)[0] ?? run.task, 180)}`,
      visibility: "client",
      metrics: metrics.length ? metrics : undefined,
    });
  } else if (failed) {
    tx.insert("activity_events", {
      orgId: org.id, at: nowIso(), botId: bot.id, runId: run.id,
      text: `${bot.name} run did not finish — AgenticBots is looking into it.`, visibility: "internal",
    });
  }
  // Expire any approval still pending on a run that ended.
  for (const a of (await r.list("approvals", { orgId: org.id, where: { runId: run.id } })).filter((x) => x.status === "pending")) {
    tx.patch("approvals", a, { status: "expired", resolvedAt: nowIso(), resolutionNote: "Run ended before a decision" });
  }
  tx.patch("organizations", org, { lastActivityAt: nowIso() });
  audit(tx, SYSTEM, { action: `run.${res.status}`, orgId: org.id, targetType: "run", targetId: run.id, correlationId: run.correlationId });
  await tx.commit();

  if (failed) {
    const recent = (await r.list("runs", { orgId: org.id, where: { botId: bot.id }, limit: 10 })).filter(
      (x) => x.status === "failed" && Date.parse(x.updatedAt) > Date.now() - 3600_000,
    );
    await raiseIncident(r, {
      orgId: org.id,
      type: recent.length >= 3 ? "run_failure_spike" : "provider_failure",
      severity: recent.length >= 3 ? "high" : "medium",
      title: recent.length >= 3 ? `${bot.name}: repeated run failures` : `${bot.name}: run failed`,
      detail: redactSecrets(res.error ?? "Run did not finish", 400),
      correlationId: run.correlationId,
      target: bot.id,
      botId: bot.id,
      runId: run.id,
      runtimeId: runtime.id,
    });
  }
  return next;
}

export async function stopRun(r: Repository, actor: Actor, runId: string): Promise<Run> {
  const run = await getScoped(r, "runs", runId, actor, "ops.runs.control");
  if (isTerminal(run.status)) return run;
  const { bot, runtime } = await loadContext(r, run.botId);
  const correlationId = newCorrelationId();
  if (run.runtimeRunId) {
    try {
      await adapterFor(runtime).stopRun(await resolveTarget(runtime, bot), run.runtimeRunId);
    } catch (e) {
      const s = sanitizeRuntimeError(e, correlationId);
      if (s.code !== "runtime_not_found") throw e;
    }
  }
  const tx = new Tx(r);
  audit(tx, actor, { action: "run.stop", orgId: run.orgId, targetType: "run", targetId: run.id, correlationId });
  await tx.commit();
  // The runtime settles the run as cancelled; reflect it now if it already has.
  return syncRun(r, run.id);
}

export async function retryRun(r: Repository, actor: Actor, runId: string): Promise<Run> {
  const run = await getScoped(r, "runs", runId, actor, "ops.runs.control");
  if (!isTerminal(run.status) || run.status === "completed") throw conflict("Only failed, cancelled or interrupted runs can be retried.");
  return startRun(r, actor, {
    botId: run.botId,
    task: run.task,
    requestId: run.requestId,
    conversationId: run.conversationId,
    idempotencyKey: `retry-${run.id}-${Date.now().toString(36)}`,
  });
}

/** Operator-side approval decisions are made through approvals.ts. */
export async function activeRunsFor(r: Repository, orgId?: string): Promise<Run[]> {
  const rows = await r.list("runs", orgId ? { orgId } : {});
  return rows.filter((x) => isActive(x.status));
}

export async function setRunNotes(r: Repository, actor: Actor, runId: string, notes: string): Promise<void> {
  const run = await getScoped(r, "runs", runId, actor, "ops.notes.write");
  const tx = new Tx(r);
  tx.patch("runs", run, { operatorNotes: redactSecrets(notes, 4000) });
  audit(tx, actor, { action: "run.notes", orgId: run.orgId, targetType: "run", targetId: run.id, correlationId: newCorrelationId() });
  await tx.commit();
}

/**
 * Pull new events for a live run for up to `budgetMs`. Demo runtime: the
 * full history is replayed and de-duplicated by cursor. Real runtime: its
 * event stream is consume-once, so events are appended as they arrive and
 * the run's status is reconciled by polling at the end.
 */
export async function pumpRun(r: Repository, runId: string, budgetMs = 20_000, signal?: AbortSignal): Promise<Run> {
  let run = await r.get("runs", runId);
  if (!run) throw notFound("Run");
  if (isTerminal(run.status) || !run.runtimeRunId) return run;
  const { bot, runtime } = await loadContext(r, run.botId);
  const adapter = adapterFor(runtime);
  if (adapter.kind === "demo") return syncRun(r, runId);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), budgetMs);
  signal?.addEventListener("abort", () => ctrl.abort());
  const buffer: RuntimeEvent[] = [];
  try {
    const target = await resolveTarget(runtime, bot);
    for await (const e of adapter.streamRunEvents(target, run.runtimeRunId, ctrl.signal)) {
      buffer.push(e);
      if (buffer.length >= 10 || ["run.completed", "run.failed", "run.cancelled", "approval.requested"].includes(e.type)) {
        run = await ingestEvents(r, run, buffer.splice(0), "append");
      }
      if (["run.completed", "run.failed", "run.cancelled", "run.interrupted"].includes(e.type)) break;
    }
  } catch {
    // Stream dropped: status polling below still reconciles the run.
  } finally {
    clearTimeout(timer);
  }
  if (buffer.length) run = await ingestEvents(r, run, buffer, "append");
  return syncRun(r, runId);
}
