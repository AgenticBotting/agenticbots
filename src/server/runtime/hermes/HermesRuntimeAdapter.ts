import "server-only";
import type { RuntimeAdapter } from "../RuntimeAdapter";
import type {
  AutomationConfig,
  BotRunEvent,
  RuntimeAutomation,
  RuntimeBot,
  RuntimeBotRun,
  RuntimeCapabilities,
  RuntimeConnection,
  RuntimeConversation,
  RuntimeHealthReport,
  RuntimeSkill,
  RuntimeToolset,
  StartBotRunInput,
  StartedBotRun,
} from "../runtime-types";
import { CapabilityUnavailableError, RuntimeError, RuntimeRequestError } from "../runtime-errors";
import { hermesFetch, readSse } from "./hermes-client";
import type { HermesCapabilities, HermesJob, HermesJson, HermesRun } from "./hermes-types";
import {
  firstModelAlias,
  mapCapabilities,
  mapConversation,
  mapDetailedHealth,
  mapEvent,
  mapHealth,
  mapJob,
  mapMessages,
  mapRun,
  mapSkill,
  mapToolset,
  rowsOf,
} from "./hermes-mappers";

/**
 * HermesRuntimeAdapter — the only application code that knows Hermes.
 *
 *   Bot           → profile  (`/p/<profile>/` prefix, per-profile key)
 *   Bot Run       → POST /v1/runs (+ Idempotency-Key), GET/stop/approval
 *   Conversation  → /api/sessions
 *   Automation    → /api/jobs
 *   Action        → tool.* events
 *
 * Pinned contract: docs/research/HERMES_INTEGRATION.md.
 */
const id = encodeURIComponent;

export class HermesRuntimeAdapter implements RuntimeAdapter {
  readonly provider = "hermes" as const;
  readonly traits = { eventReplay: false };

  async getHealth(c: RuntimeConnection): Promise<RuntimeHealthReport> {
    const { data } = await hermesFetch<HermesJson>({ ...c, runtimeProfile: undefined }, "GET", "/health", { subject: "runtime", timeoutMs: 5000 });
    return mapHealth(data);
  }

  async getDetailedHealth(c: RuntimeConnection): Promise<RuntimeHealthReport> {
    const { data } = await hermesFetch<HermesJson>({ ...c, runtimeProfile: undefined }, "GET", "/health/detailed", { subject: "runtime", timeoutMs: 8000 });
    return mapDetailedHealth(data);
  }

  async listBots(c: RuntimeConnection, runtimeProfiles: string[]): Promise<RuntimeBot[]> {
    const out: RuntimeBot[] = [];
    for (const runtimeProfile of runtimeProfiles) {
      try {
        out.push(await this.getBot({ ...c, runtimeProfile }));
      } catch (e) {
        const code = e instanceof RuntimeError ? e.code : "unknown";
        out.push({
          runtimeProfile,
          status: code === "bot_not_found" || code === "runtime_auth" ? "disabled" : code === "runtime_unreachable" ? "offline" : "degraded",
        });
      }
    }
    return out;
  }

  async getBot(c: RuntimeConnection): Promise<RuntimeBot> {
    // A Bot answers on its own profile prefix with its own key; a parked
    // (disabled) profile does not.
    const { data } = await hermesFetch<HermesJson>(c, "GET", "/v1/models", { subject: "bot", timeoutMs: 5000 });
    return { runtimeProfile: c.runtimeProfile ?? "default", status: "active", modelAlias: firstModelAlias(data) };
  }

  async getBotCapabilities(c: RuntimeConnection): Promise<RuntimeCapabilities> {
    const { data } = await hermesFetch<HermesCapabilities>(c, "GET", "/v1/capabilities", { subject: "bot" });
    return mapCapabilities(data);
  }

  async listBotSkills(c: RuntimeConnection): Promise<RuntimeSkill[]> {
    const { data } = await hermesFetch<unknown>(c, "GET", "/v1/skills", { subject: "bot" });
    return rowsOf(data, "skills").map(mapSkill);
  }

  async listBotToolsets(c: RuntimeConnection): Promise<RuntimeToolset[]> {
    const { data } = await hermesFetch<unknown>(c, "GET", "/v1/toolsets", { subject: "bot" });
    return rowsOf(data, "toolsets").map(mapToolset);
  }

  async startBotRun(c: RuntimeConnection, input: StartBotRunInput): Promise<StartedBotRun> {
    const body: HermesJson = { input: input.task };
    if (input.instructions) body.instructions = input.instructions;
    if (input.conversationRuntimeId) body.session_id = input.conversationRuntimeId;
    if (input.model) body.model = input.model;
    if (input.provider) body.provider = input.provider;
    if (input.reasoning) body.model_options = { reasoning_effort: input.reasoning };
    const { data, headers } = await hermesFetch<HermesRun>(c, "POST", "/v1/runs", {
      subject: "bot",
      body,
      headers: { "Idempotency-Key": input.idempotencyKey, "X-Correlation-Id": input.correlationId },
      timeoutMs: 20_000,
    });
    const runtimeRunId = data?.run_id;
    if (typeof runtimeRunId !== "string" || !runtimeRunId) throw new RuntimeRequestError("Runtime did not return a run id");
    return { runtimeRunId, replayed: headers.get("Idempotency-Replayed") === "true" };
  }

  async getBotRun(c: RuntimeConnection, runtimeRunId: string): Promise<RuntimeBotRun> {
    const { data } = await hermesFetch<HermesRun>(c, "GET", `/v1/runs/${id(runtimeRunId)}`, { subject: "run" });
    return mapRun(runtimeRunId, data);
  }

  async stopBotRun(c: RuntimeConnection, runtimeRunId: string): Promise<void> {
    await hermesFetch(c, "POST", `/v1/runs/${id(runtimeRunId)}/stop`, { subject: "run", body: {} });
  }

  async *streamBotRunEvents(c: RuntimeConnection, runtimeRunId: string, signal?: AbortSignal): AsyncIterable<BotRunEvent> {
    for await (const e of readSse(c, `/v1/runs/${id(runtimeRunId)}/events`, signal)) yield mapEvent(e);
  }

  async listBotRunEvents(): Promise<BotRunEvent[]> {
    // Hermes run event streams are consume-once; history is not replayable.
    throw new CapabilityUnavailableError("event replay");
  }

  async approveBotRun(c: RuntimeConnection, runtimeRunId: string, approvalId?: string): Promise<void> {
    await hermesFetch(c, "POST", `/v1/runs/${id(runtimeRunId)}/approval`, {
      subject: "approval",
      body: { choice: "once", ...(approvalId ? { request_id: approvalId } : {}) },
    });
  }

  async denyBotRun(c: RuntimeConnection, runtimeRunId: string, approvalId?: string): Promise<void> {
    await hermesFetch(c, "POST", `/v1/runs/${id(runtimeRunId)}/approval`, {
      subject: "approval",
      body: { choice: "deny", ...(approvalId ? { request_id: approvalId } : {}) },
    });
  }

  async listConversations(c: RuntimeConnection): Promise<RuntimeConversation[]> {
    const { data } = await hermesFetch<unknown>(c, "GET", "/api/sessions?limit=50", { subject: "bot" });
    return rowsOf(data, "sessions").map((r) => mapConversation(r));
  }

  async createConversation(c: RuntimeConnection, title: string): Promise<RuntimeConversation> {
    const { data } = await hermesFetch<HermesJson>(c, "POST", "/api/sessions", { subject: "bot", body: { title } });
    return mapConversation(data ?? {}, title);
  }

  async getConversation(c: RuntimeConnection, runtimeConversationId: string): Promise<RuntimeConversation> {
    const sid = id(runtimeConversationId);
    const [{ data: meta }, { data: msgs }] = await Promise.all([
      hermesFetch<HermesJson>(c, "GET", `/api/sessions/${sid}`, { subject: "conversation" }),
      hermesFetch<unknown>(c, "GET", `/api/sessions/${sid}/messages`, { subject: "conversation" }),
    ]);
    const conv = mapConversation(meta ?? {});
    return { ...conv, runtimeConversationId, messages: mapMessages(rowsOf(msgs, "messages")) };
  }

  async listAutomations(c: RuntimeConnection): Promise<RuntimeAutomation[]> {
    const { data } = await hermesFetch<{ jobs?: HermesJob[] }>(c, "GET", "/api/jobs?include_disabled=true", { subject: "bot" });
    return (data?.jobs ?? []).map(mapJob);
  }

  async createAutomation(c: RuntimeConnection, config: AutomationConfig): Promise<RuntimeAutomation> {
    const { data } = await hermesFetch<{ job?: HermesJob }>(c, "POST", "/api/jobs", {
      subject: "bot",
      body: { name: config.name, schedule: config.schedule, prompt: config.prompt, skills: config.skills, deliver: "local" },
    });
    return mapJob(data?.job ?? {});
  }

  async updateAutomation(c: RuntimeConnection, runtimeAutomationId: string, config: Partial<AutomationConfig>): Promise<RuntimeAutomation> {
    const { data } = await hermesFetch<{ job?: HermesJob }>(c, "PATCH", `/api/jobs/${id(runtimeAutomationId)}`, { subject: "automation", body: config });
    return mapJob(data?.job ?? {});
  }

  async pauseAutomation(c: RuntimeConnection, runtimeAutomationId: string): Promise<void> {
    await hermesFetch(c, "POST", `/api/jobs/${id(runtimeAutomationId)}/pause`, { subject: "automation", body: {} });
  }
  async resumeAutomation(c: RuntimeConnection, runtimeAutomationId: string): Promise<void> {
    await hermesFetch(c, "POST", `/api/jobs/${id(runtimeAutomationId)}/resume`, { subject: "automation", body: {} });
  }
  async runAutomationNow(c: RuntimeConnection, runtimeAutomationId: string): Promise<void> {
    await hermesFetch(c, "POST", `/api/jobs/${id(runtimeAutomationId)}/run`, { subject: "automation", body: {} });
  }
  async deleteAutomation(c: RuntimeConnection, runtimeAutomationId: string): Promise<void> {
    await hermesFetch(c, "DELETE", `/api/jobs/${id(runtimeAutomationId)}`, { subject: "automation" });
  }
}
