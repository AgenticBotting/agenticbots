import "server-only";
import type { RunStatus, Usage } from "@/lib/platform/types";
import type {
  AutomationInput,
  RuntimeAdapter,
  RuntimeAutomation,
  RuntimeCapabilities,
  RuntimeConversation,
  RuntimeEvent,
  RuntimeEventType,
  RuntimeHealthReport,
  RuntimeRunState,
  RuntimeSkill,
  RuntimeTarget,
  RuntimeToolset,
  StartRunInput,
} from "../adapter";
import { RuntimeError } from "../errors";
import { hermesFetch, readSse } from "./client";

/**
 * HermesRuntimeAdapter — translates AgenticBots operations into the
 * engine's API (pinned: see docs/research/HERMES_INTEGRATION.md).
 *
 *   Bot           -> profile  (/p/<profile>/ prefix, per-profile key)
 *   Bot Run       -> POST /v1/runs (+ Idempotency-Key)
 *   Conversation  -> /api/sessions (we supply our own session id)
 *   Automation    -> /api/jobs
 *   Action        -> tool.* events
 *
 * The adapter discovers capabilities first and refuses features the
 * running engine does not advertise, instead of assuming them.
 */

type J = Record<string, unknown>;

const s = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const n = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const b = (v: unknown): boolean => v === true;
const iso = (v: unknown): string | undefined => {
  if (typeof v === "number") return new Date(v > 1e12 ? v : v * 1000).toISOString();
  if (typeof v === "string" && v) return v;
  return undefined;
};

export function mapUsage(u: unknown): Usage | undefined {
  if (!u || typeof u !== "object") return undefined;
  const x = u as J;
  return {
    inputTokens: n(x.input_tokens ?? x.prompt_tokens),
    outputTokens: n(x.output_tokens ?? x.completion_tokens),
    cacheReadTokens: n(x.cache_read_tokens),
    cacheWriteTokens: n(x.cache_write_tokens),
  };
}

export function mapRunStatus(v: unknown): RunStatus {
  switch (v) {
    case "queued":
      return "queued";
    case "started":
    case "running":
    case "stopping":
      return "running";
    case "waiting_for_approval":
      return "waiting_for_approval";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "interrupted":
      return "interrupted";
    default:
      return "running";
  }
}

const EVENT_MAP: Record<string, RuntimeEventType> = {
  "run.queued": "run.queued",
  "run.started": "run.started",
  "message.started": "other",
  "tool.started": "action.started",
  "tool.progress": "other",
  "tool.completed": "action.completed",
  "tool.failed": "action.completed",
  "message.delta": "other",
  "message.interim": "message",
  "approval.request": "approval.requested",
  "approval.responded": "approval.resolved",
  "run.completed": "run.completed",
  "run.failed": "run.failed",
  "run.cancelled": "run.cancelled",
  "run.interrupted": "run.interrupted",
  "run.stopping": "other",
  "subagent.start": "other",
  "subagent.complete": "other",
};

export function mapEvent(e: J): RuntimeEvent {
  const raw = s(e.event) ?? "unknown";
  const type = EVENT_MAP[raw] ?? "other";
  return {
    type,
    raw,
    at: iso(e.timestamp) ?? new Date().toISOString(),
    action: s(e.tool),
    preview: s(e.preview),
    durationS: typeof e.duration === "number" ? e.duration : undefined,
    error: raw === "tool.failed" ? true : typeof e.error === "boolean" ? e.error : undefined,
    text: s(e.text) ?? s(e.output) ?? (typeof e.error === "string" ? e.error : undefined),
    usage: mapUsage(e.usage),
    approval:
      type === "approval.requested"
        ? { requestId: s(e.request_id), description: s(e.description) ?? s(e.command) ?? "Action needs approval" }
        : undefined,
  };
}

export class HermesRuntimeAdapter implements RuntimeAdapter {
  readonly kind = "hermes" as const;

  async getCapabilities(t: RuntimeTarget): Promise<RuntimeCapabilities> {
    const { data } = await hermesFetch<J>(t, "GET", "/v1/capabilities");
    const f = (data?.features ?? {}) as J;
    const endpoints = (data?.endpoints ?? {}) as J;
    const raw: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(f)) if (typeof v === "boolean") raw[k] = v;
    const has = (k: string) => b(f[k]) || k in endpoints;
    return {
      runs: b(f.run_submission),
      runEvents: b(f.run_events_sse),
      runStop: b(f.run_stop),
      runApproval: has("run_approval"),
      idempotency: b(f.run_submission), // Idempotency-Key is part of the runs contract (pinned version).
      conversations: Object.keys(f).some((k) => k.startsWith("session_")) || "session_create" in endpoints,
      // The jobs API is not advertised as a feature flag in the pinned
      // version but is part of its route table; the contract test probes it.
      automations: true,
      skills: "skills" in endpoints || has("skills"),
      toolsets: "toolsets" in endpoints || has("toolsets"),
      detailedHealth: true,
      raw,
    };
  }

  async getHealth(t: RuntimeTarget): Promise<RuntimeHealthReport> {
    const { data } = await hermesFetch<J>(t, "GET", "/health", { timeoutMs: 5000 });
    const ok = s(data?.status) === "ok";
    return { status: ok ? "healthy" : "degraded", ready: ok, checks: [{ name: "liveness", status: s(data?.status) ?? "unknown" }], checkedAt: new Date().toISOString() };
  }

  async getDetailedHealth(t: RuntimeTarget): Promise<RuntimeHealthReport> {
    const { data } = await hermesFetch<J>(t, "GET", "/health/detailed", { timeoutMs: 8000 });
    const status = s(data?.status) ?? "unknown";
    const readiness = (data?.readiness ?? {}) as J;
    const checksRaw = readiness.checks;
    const checks: { name: string; status: string }[] = [];
    if (Array.isArray(checksRaw)) {
      for (const c of checksRaw) if (c && typeof c === "object") checks.push({ name: s((c as J).name) ?? "check", status: s((c as J).status) ?? "unknown" });
    } else if (checksRaw && typeof checksRaw === "object") {
      for (const [k, v] of Object.entries(checksRaw as J)) {
        checks.push({ name: k, status: typeof v === "object" && v ? s((v as J).status) ?? "unknown" : String(v) });
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

  async listBots(t: RuntimeTarget, profiles: string[]) {
    const out: { profile: string; reachable: boolean }[] = [];
    for (const profile of profiles) {
      try {
        await hermesFetch(t.profile === profile ? t : { ...t, profile }, "GET", "/v1/models", { timeoutMs: 5000 });
        out.push({ profile, reachable: true });
      } catch {
        out.push({ profile, reachable: false });
      }
    }
    return out;
  }

  async getBot(t: RuntimeTarget) {
    const { data } = await hermesFetch<J>(t, "GET", "/v1/models", { timeoutMs: 5000 });
    const first = Array.isArray(data?.data) ? (data.data[0] as J) : undefined;
    return { profile: t.profile ?? "default", reachable: true, modelAlias: s(first?.id) };
  }

  async startBotRun(t: RuntimeTarget, input: StartRunInput) {
    const body: J = { input: input.task };
    if (input.instructions) body.instructions = input.instructions;
    if (input.conversationRuntimeId) body.session_id = input.conversationRuntimeId;
    if (input.model) body.model = input.model;
    if (input.provider) body.provider = input.provider;
    if (input.reasoning) body.model_options = { reasoning_effort: input.reasoning };
    const { data, headers } = await hermesFetch<J>(t, "POST", "/v1/runs", {
      body,
      headers: { "Idempotency-Key": input.idempotencyKey, "X-Correlation-Id": input.correlationId },
      timeoutMs: 20_000,
    });
    const runtimeRunId = s(data?.run_id);
    if (!runtimeRunId) throw new RuntimeError("runtime_bad_request", "Runtime did not return a run id");
    return { runtimeRunId, replayed: headers.get("Idempotency-Replayed") === "true" };
  }

  async getRun(t: RuntimeTarget, runtimeRunId: string): Promise<RuntimeRunState> {
    const { data } = await hermesFetch<J>(t, "GET", `/v1/runs/${encodeURIComponent(runtimeRunId)}`);
    const runtime = (data?.runtime ?? {}) as J;
    const approval = data?.approval as J | undefined;
    return {
      runtimeRunId,
      status: mapRunStatus(data?.status),
      output: s(data?.output),
      usage: mapUsage(data?.usage),
      provider: s(runtime.provider),
      model: s(runtime.model) ?? s(data?.model),
      error: s(data?.error),
      stopping: data?.status === "stopping" || data?.shutdown_requested_at !== undefined,
      pendingApproval: approval
        ? { requestId: s(approval.request_id), description: s(approval.description) ?? "Action needs approval", detail: s(approval.command) }
        : undefined,
    };
  }

  async *streamRunEvents(t: RuntimeTarget, runtimeRunId: string, signal?: AbortSignal): AsyncIterable<RuntimeEvent> {
    for await (const e of readSse(t, `/v1/runs/${encodeURIComponent(runtimeRunId)}/events`, signal)) {
      yield mapEvent(e);
    }
  }

  async stopRun(t: RuntimeTarget, runtimeRunId: string) {
    await hermesFetch(t, "POST", `/v1/runs/${encodeURIComponent(runtimeRunId)}/stop`, { body: {} });
  }

  async approveRun(t: RuntimeTarget, runtimeRunId: string, requestId?: string) {
    await hermesFetch(t, "POST", `/v1/runs/${encodeURIComponent(runtimeRunId)}/approval`, {
      body: { choice: "once", ...(requestId ? { request_id: requestId } : {}) },
    });
  }

  async denyRun(t: RuntimeTarget, runtimeRunId: string, requestId?: string) {
    await hermesFetch(t, "POST", `/v1/runs/${encodeURIComponent(runtimeRunId)}/approval`, {
      body: { choice: "deny", ...(requestId ? { request_id: requestId } : {}) },
    });
  }

  async listConversations(t: RuntimeTarget): Promise<RuntimeConversation[]> {
    const { data } = await hermesFetch<J | J[]>(t, "GET", "/api/sessions?limit=50");
    const rows = Array.isArray(data) ? data : ((data?.sessions ?? data?.data ?? []) as J[]);
    return rows.map((r) => ({ runtimeId: s(r.id) ?? s(r.session_id) ?? "", title: s(r.title) }));
  }

  async createConversation(t: RuntimeTarget, title: string): Promise<RuntimeConversation> {
    const { data } = await hermesFetch<J>(t, "POST", "/api/sessions", { body: { title } });
    const sess = ((data?.session as J) ?? data) as J;
    return { runtimeId: s(sess.id) ?? s(sess.session_id) ?? "", title };
  }

  async getConversation(t: RuntimeTarget, runtimeId: string): Promise<RuntimeConversation> {
    const id = encodeURIComponent(runtimeId);
    const [{ data: meta }, { data: msgs }] = await Promise.all([
      hermesFetch<J>(t, "GET", `/api/sessions/${id}`),
      hermesFetch<J | J[]>(t, "GET", `/api/sessions/${id}/messages`),
    ]);
    const rows = Array.isArray(msgs) ? msgs : ((msgs?.messages ?? msgs?.data ?? []) as J[]);
    return {
      runtimeId,
      title: s(((meta?.session as J) ?? meta)?.title),
      messages: rows
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", text: s(m.content) ?? "", at: iso(m.timestamp) })),
    };
  }

  private mapJob(j: J): RuntimeAutomation {
    const sched = j.schedule;
    return {
      runtimeJobId: s(j.id) ?? s(j.job_id) ?? "",
      name: s(j.name) ?? "",
      schedule: typeof sched === "string" ? sched : s((sched as J | undefined)?.expr) ?? s(j.schedule_display) ?? "",
      enabled: j.enabled !== false && j.state !== "paused",
      lastRunAt: iso(j.last_run_at),
      lastStatus: j.last_status === "ok" ? "succeeded" : j.last_status === "error" ? "failed" : undefined,
      nextRunAt: iso(j.next_run_at),
      lastError: s(j.last_error),
    };
  }

  async listAutomations(t: RuntimeTarget) {
    const { data } = await hermesFetch<J>(t, "GET", "/api/jobs?include_disabled=true");
    return ((data?.jobs ?? []) as J[]).map((j) => this.mapJob(j));
  }

  async createAutomation(t: RuntimeTarget, input: AutomationInput) {
    const { data } = await hermesFetch<J>(t, "POST", "/api/jobs", {
      body: { name: input.name, schedule: input.schedule, prompt: input.prompt, skills: input.skills, deliver: "local" },
    });
    return this.mapJob((data?.job ?? {}) as J);
  }

  async updateAutomation(t: RuntimeTarget, id: string, input: Partial<AutomationInput>) {
    const { data } = await hermesFetch<J>(t, "PATCH", `/api/jobs/${encodeURIComponent(id)}`, { body: input });
    return this.mapJob((data?.job ?? {}) as J);
  }

  async pauseAutomation(t: RuntimeTarget, id: string) {
    await hermesFetch(t, "POST", `/api/jobs/${encodeURIComponent(id)}/pause`, { body: {} });
  }
  async resumeAutomation(t: RuntimeTarget, id: string) {
    await hermesFetch(t, "POST", `/api/jobs/${encodeURIComponent(id)}/resume`, { body: {} });
  }
  async runAutomationNow(t: RuntimeTarget, id: string) {
    await hermesFetch(t, "POST", `/api/jobs/${encodeURIComponent(id)}/run`, { body: {} });
  }
  async deleteAutomation(t: RuntimeTarget, id: string) {
    await hermesFetch(t, "DELETE", `/api/jobs/${encodeURIComponent(id)}`);
  }

  async listSkills(t: RuntimeTarget): Promise<RuntimeSkill[]> {
    const { data } = await hermesFetch<J[] | J>(t, "GET", "/v1/skills");
    const rows = Array.isArray(data) ? data : ((data?.skills ?? data?.data ?? []) as J[]);
    return rows.map((r) => ({ name: s(r.name) ?? "", description: s(r.description), category: s(r.category) }));
  }

  async listToolsets(t: RuntimeTarget): Promise<RuntimeToolset[]> {
    const { data } = await hermesFetch<J[] | J>(t, "GET", "/v1/toolsets");
    const rows = Array.isArray(data) ? data : ((data?.toolsets ?? data?.data ?? []) as J[]);
    return rows.map((r) => ({
      name: s(r.name) ?? "",
      label: s(r.label),
      enabled: r.enabled !== false,
      tools: Array.isArray(r.tools) ? (r.tools as unknown[]).filter((x): x is string => typeof x === "string") : [],
    }));
  }
}
