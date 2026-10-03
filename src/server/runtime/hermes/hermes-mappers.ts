import "server-only";
import type {
  AutomationStatus,
  BotEventType,
  BotRunEvent,
  RunStatus,
  RuntimeAutomation,
  RuntimeBotRun,
  RuntimeCapabilities,
  RuntimeConversation,
  RuntimeHealthReport,
  RuntimeSkill,
  RuntimeToolset,
  Usage,
} from "../runtime-types";
import { HERMES_PINNED_VERSION, type HermesCapabilities, type HermesEvent, type HermesJob, type HermesJson, type HermesRun } from "./hermes-types";

/**
 * Hermes → AgenticBots translation tables.
 *
 *   profile  → Bot            session → Conversation
 *   run      → Bot Run        job     → Automation
 *   tool.*   → bot.action.*   gateway → Runtime
 *
 * Version compatibility lives here too: field aliases from older/newer
 * Hermes builds are accepted in one place so nothing else ever branches
 * on an engine version.
 */

const s = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const n = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const b = (v: unknown): boolean => v === true;
const iso = (v: unknown): string | undefined => {
  if (typeof v === "number") return new Date(v > 1e12 ? v : v * 1000).toISOString();
  if (typeof v === "string" && v) return v;
  return undefined;
};
/** Rows may arrive bare or wrapped (`{data: []}`, `{sessions: []}` …) depending on version. */
export function rowsOf(data: unknown, ...keys: string[]): HermesJson[] {
  if (Array.isArray(data)) return data as HermesJson[];
  if (!data || typeof data !== "object") return [];
  for (const k of [...keys, "data"]) {
    const v = (data as HermesJson)[k];
    if (Array.isArray(v)) return v as HermesJson[];
  }
  return [];
}

export function mapUsage(u: unknown): Usage | undefined {
  if (!u || typeof u !== "object") return undefined;
  const x = u as HermesJson;
  return {
    inputTokens: n(x.input_tokens ?? x.prompt_tokens),
    outputTokens: n(x.output_tokens ?? x.completion_tokens),
    cacheReadTokens: n(x.cache_read_tokens),
    cacheWriteTokens: n(x.cache_write_tokens),
  };
}

const RUN_STATUS: Record<string, RunStatus> = {
  queued: "queued",
  started: "running",
  running: "running",
  stopping: "running",
  waiting_for_approval: "waiting_for_approval",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
  canceled: "cancelled",
  interrupted: "interrupted",
};

export function mapRunStatus(v: unknown): RunStatus {
  return (typeof v === "string" && RUN_STATUS[v]) || "running";
}

export function mapRun(runtimeRunId: string, d: HermesRun | undefined): RuntimeBotRun {
  const runtime = d?.runtime ?? {};
  const approval = d?.approval;
  return {
    runtimeRunId,
    status: mapRunStatus(d?.status),
    output: s(d?.output),
    usage: mapUsage(d?.usage),
    provider: s(runtime.provider),
    model: s(runtime.model) ?? s(d?.model),
    error: s(d?.error),
    stopping: d?.status === "stopping" || d?.shutdown_requested_at !== undefined,
    pendingApproval: approval
      ? { approvalId: s(approval.request_id), description: s(approval.description) ?? "Action needs approval", detail: s(approval.command) }
      : undefined,
  };
}

const EVENT_MAP: Record<string, BotEventType> = {
  "run.queued": "bot.run.queued",
  "run.started": "bot.run.started",
  "tool.started": "bot.action.started",
  "tool.completed": "bot.action.completed",
  "tool.failed": "bot.action.completed",
  "message.interim": "bot.message",
  "approval.request": "bot.approval.requested",
  "approval.responded": "bot.approval.resolved",
  "run.completed": "bot.run.completed",
  "run.failed": "bot.run.failed",
  "run.cancelled": "bot.run.cancelled",
  "run.interrupted": "bot.run.interrupted",
  // Everything else (deltas, progress, sub-agents, stopping) → bot.other.
};

export function mapEvent(e: HermesEvent): BotRunEvent {
  const raw = s(e.event) ?? "unknown";
  const type = EVENT_MAP[raw] ?? "bot.other";
  return {
    type,
    sourceEvent: raw,
    at: iso(e.timestamp) ?? new Date().toISOString(),
    action: s(e.tool),
    preview: s(e.preview),
    durationS: typeof e.duration === "number" ? e.duration : undefined,
    error: raw === "tool.failed" ? true : typeof e.error === "boolean" ? e.error : undefined,
    text: s(e.text) ?? s(e.output) ?? (typeof e.error === "string" ? e.error : undefined),
    usage: mapUsage(e.usage),
    approval:
      type === "bot.approval.requested"
        ? { approvalId: s(e.request_id), description: s(e.description) ?? s(e.command) ?? "Action needs approval" }
        : undefined,
  };
}

export function mapAutomationStatus(j: HermesJob): AutomationStatus {
  if (j.enabled === false || j.state === "paused") return "paused";
  if (j.state === "error" || j.state === "failed" || n(j.consecutive_failures) >= 2) return "failed";
  return "active";
}

export function mapJob(j: HermesJob): RuntimeAutomation {
  const sched = j.schedule;
  return {
    runtimeAutomationId: s(j.id) ?? s(j.job_id) ?? "",
    name: s(j.name) ?? "",
    schedule: typeof sched === "string" ? sched : (s(sched?.expr) ?? s(j.schedule_display) ?? ""),
    status: mapAutomationStatus(j),
    lastRunAt: iso(j.last_run_at),
    lastResult: j.last_status === "ok" ? "succeeded" : j.last_status === "error" ? "failed" : undefined,
    nextRunAt: iso(j.next_run_at),
    lastError: s(j.last_error),
  };
}

export function mapCapabilities(d: HermesCapabilities | undefined): RuntimeCapabilities {
  const f = (d?.features ?? {}) as HermesJson;
  const endpoints = (d?.endpoints ?? {}) as HermesJson;
  const reported: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(f)) if (typeof v === "boolean") reported[k] = v;
  reported.pinned_version = !d?.version || d.version.replace(/^v/, "") === HERMES_PINNED_VERSION;
  const has = (k: string) => b(f[k]) || k in endpoints;
  return {
    runs: b(f.run_submission),
    runEvents: b(f.run_events_sse),
    runStop: b(f.run_stop),
    runApproval: has("run_approval"),
    // Idempotency-Key is part of the runs contract in the pinned version.
    idempotency: b(f.run_submission),
    conversations: Object.keys(f).some((k) => k.startsWith("session_")) || "session_create" in endpoints,
    // The jobs API is in the pinned route table but not advertised as a
    // feature flag; the contract test probes it.
    automations: true,
    skills: has("skills"),
    toolsets: has("toolsets"),
    detailedHealth: true,
    eventReplay: false,
    reported,
  };
}

export function mapHealth(d: HermesJson | undefined): RuntimeHealthReport {
  const ok = s(d?.status) === "ok";
  return { status: ok ? "healthy" : "degraded", ready: ok, checks: [{ name: "liveness", status: s(d?.status) ?? "unknown" }], checkedAt: new Date().toISOString() };
}

export function mapDetailedHealth(d: HermesJson | undefined): RuntimeHealthReport {
  const status = s(d?.status) ?? "unknown";
  const readiness = (d?.readiness ?? {}) as HermesJson;
  const checksRaw = readiness.checks;
  const checks: { name: string; status: string }[] = [];
  if (Array.isArray(checksRaw)) {
    for (const c of checksRaw) if (c && typeof c === "object") checks.push({ name: s((c as HermesJson).name) ?? "check", status: s((c as HermesJson).status) ?? "unknown" });
  } else if (checksRaw && typeof checksRaw === "object") {
    for (const [k, v] of Object.entries(checksRaw as HermesJson)) {
      checks.push({ name: k, status: typeof v === "object" && v ? (s((v as HermesJson).status) ?? "unknown") : String(v) });
    }
  }
  const healthy = status === "ok" || status === "ready" || status === "healthy";
  return {
    status: healthy ? "healthy" : "degraded",
    ready: healthy,
    checks,
    activeRuns: typeof readiness.active_runs === "number" ? readiness.active_runs : undefined,
    checkedAt: new Date().toISOString(),
  };
}

export function mapConversation(row: HermesJson, title?: string): RuntimeConversation {
  const sess = ((row.session as HermesJson) ?? row) as HermesJson;
  return { runtimeConversationId: s(sess.id) ?? s(sess.session_id) ?? "", title: s(sess.title) ?? title };
}

export function mapMessages(rows: HermesJson[]): NonNullable<RuntimeConversation["messages"]> {
  return rows
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", text: s(m.content) ?? "", at: iso(m.timestamp) }));
}

export function mapSkill(r: HermesJson): RuntimeSkill {
  return { name: s(r.name) ?? "", description: s(r.description), category: s(r.category) };
}

export function mapToolset(r: HermesJson): RuntimeToolset {
  return {
    name: s(r.name) ?? "",
    label: s(r.label),
    enabled: r.enabled !== false,
    tools: Array.isArray(r.tools) ? (r.tools as unknown[]).filter((x): x is string => typeof x === "string") : [],
  };
}

export function firstModelAlias(d: HermesJson | undefined): string | undefined {
  const first = Array.isArray(d?.data) ? (d.data[0] as HermesJson) : undefined;
  return s(first?.id);
}
