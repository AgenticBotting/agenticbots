import "server-only";
import type { RunStatus, Usage } from "@/lib/platform/types";

/**
 * RuntimeAdapter — the boundary between AgenticBots and whatever engine
 * executes Bots. Everything on this side speaks AgenticBots:
 *
 *   Bot           (engine: profile)
 *   Bot Run       (engine: run)
 *   Conversation  (engine: session)
 *   Automation    (engine: scheduled job)
 *   Action        (engine: tool call)
 *   Runtime       (engine: gateway)
 *
 * Implementations: DemoRuntimeAdapter (no network, deterministic) and
 * HermesRuntimeAdapter (src/server/runtime/hermes). Nothing outside
 * src/server/runtime/hermes may import engine-specific code.
 */

/** Where to reach one Bot inside one client runtime. Resolved server-side
 *  from Secrets Manager; never serialized to a browser. */
export interface RuntimeTarget {
  runtimeId: string;
  /** Bot's runtime profile name, e.g. "seo". Undefined = runtime-level call. */
  profile?: string;
  baseUrl: string;
  /** Per-Bot bearer key. */
  apiKey: string;
  /** Private-connectivity headers (e.g. tunnel service-token headers). */
  extraHeaders: Record<string, string>;
}

export interface RuntimeCapabilities {
  runs: boolean;
  runEvents: boolean;
  runStop: boolean;
  runApproval: boolean;
  idempotency: boolean;
  conversations: boolean;
  automations: boolean;
  skills: boolean;
  toolsets: boolean;
  detailedHealth: boolean;
  /** Engine-reported flags, kept verbatim for operators. */
  raw: Record<string, boolean>;
}

export interface RuntimeHealthReport {
  status: "healthy" | "degraded" | "offline";
  ready: boolean;
  checks: { name: string; status: string }[];
  activeRuns?: number;
  diskFreePct?: number;
  checkedAt: string;
}

export interface StartRunInput {
  task: string;
  /** Extra instructions layered on the Bot's own configuration. */
  instructions?: string;
  conversationRuntimeId?: string;
  idempotencyKey: string;
  correlationId: string;
  provider?: string;
  model?: string;
  reasoning?: "low" | "medium" | "high";
}

export interface RuntimeRunState {
  runtimeRunId: string;
  status: RunStatus;
  output?: string;
  usage?: Usage;
  provider?: string;
  model?: string;
  error?: string;
  pendingApproval?: { requestId?: string; description: string; detail?: string };
  /** True when the engine says the run is draining toward interruption. */
  stopping?: boolean;
}

/** Engine events, normalized. `action` is the engine's tool name — the
 *  translation registry turns it into business language. */
export type RuntimeEventType =
  | "run.queued"
  | "run.started"
  | "action.started"
  | "action.completed"
  | "message"
  | "approval.requested"
  | "approval.resolved"
  | "run.completed"
  | "run.failed"
  | "run.cancelled"
  | "run.interrupted"
  | "other";

export interface RuntimeEvent {
  type: RuntimeEventType;
  at: string;
  action?: string;
  preview?: string;
  durationS?: number;
  error?: boolean;
  text?: string;
  usage?: Usage;
  approval?: { requestId?: string; description: string };
  /** Raw event name, for operators. */
  raw: string;
}

export interface RuntimeConversation {
  runtimeId: string;
  title?: string;
  messages?: { role: "user" | "assistant"; text: string; at?: string }[];
}

export interface RuntimeAutomation {
  runtimeJobId: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRunAt?: string;
  lastStatus?: "succeeded" | "failed";
  nextRunAt?: string;
  lastError?: string;
}

export interface AutomationInput {
  name: string;
  prompt: string;
  schedule: string;
  skills?: string[];
}

export interface RuntimeSkill {
  name: string;
  description?: string;
  category?: string;
}

export interface RuntimeToolset {
  name: string;
  label?: string;
  enabled: boolean;
  tools: string[];
}

export interface RuntimeAdapter {
  readonly kind: "demo" | "hermes";

  getCapabilities(t: RuntimeTarget): Promise<RuntimeCapabilities>;
  getHealth(t: RuntimeTarget): Promise<RuntimeHealthReport>;
  getDetailedHealth(t: RuntimeTarget): Promise<RuntimeHealthReport>;

  /** Bots the runtime currently answers for (by probing known profiles). */
  listBots(t: RuntimeTarget, profiles: string[]): Promise<{ profile: string; reachable: boolean }[]>;
  getBot(t: RuntimeTarget): Promise<{ profile: string; reachable: boolean; modelAlias?: string }>;

  startBotRun(t: RuntimeTarget, input: StartRunInput): Promise<{ runtimeRunId: string; replayed: boolean }>;
  getRun(t: RuntimeTarget, runtimeRunId: string): Promise<RuntimeRunState>;
  streamRunEvents(t: RuntimeTarget, runtimeRunId: string, signal?: AbortSignal): AsyncIterable<RuntimeEvent>;
  stopRun(t: RuntimeTarget, runtimeRunId: string): Promise<void>;
  approveRun(t: RuntimeTarget, runtimeRunId: string, requestId?: string): Promise<void>;
  denyRun(t: RuntimeTarget, runtimeRunId: string, requestId?: string): Promise<void>;

  listConversations(t: RuntimeTarget): Promise<RuntimeConversation[]>;
  createConversation(t: RuntimeTarget, title: string): Promise<RuntimeConversation>;
  getConversation(t: RuntimeTarget, runtimeId: string): Promise<RuntimeConversation>;

  listAutomations(t: RuntimeTarget): Promise<RuntimeAutomation[]>;
  createAutomation(t: RuntimeTarget, input: AutomationInput): Promise<RuntimeAutomation>;
  updateAutomation(t: RuntimeTarget, runtimeJobId: string, input: Partial<AutomationInput>): Promise<RuntimeAutomation>;
  pauseAutomation(t: RuntimeTarget, runtimeJobId: string): Promise<void>;
  resumeAutomation(t: RuntimeTarget, runtimeJobId: string): Promise<void>;
  runAutomationNow(t: RuntimeTarget, runtimeJobId: string): Promise<void>;
  deleteAutomation(t: RuntimeTarget, runtimeJobId: string): Promise<void>;

  listSkills(t: RuntimeTarget): Promise<RuntimeSkill[]>;
  listToolsets(t: RuntimeTarget): Promise<RuntimeToolset[]>;
}
