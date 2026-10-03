import type { AutomationStatus, BotStatus, RunStatus, RuntimeProvider, Usage } from "@/lib/platform/types";

/**
 * Neutral runtime vocabulary. Everything in this file speaks AgenticBots:
 *
 *   Bot           a worker with its own credentials, Skills and Automations
 *   Bot Run       one task a Bot carries out
 *   Conversation  a thread of Runs that share context
 *   Automation    a scheduled task a Bot runs on its own
 *   Action        one step a Bot takes during a Run
 *   Runtime       the isolated environment a client's Bots execute in
 *
 * No engine-specific names, URLs, status strings or payload shapes belong
 * here. Each adapter translates its engine into these types.
 */

export type { AutomationStatus, RunStatus, RuntimeProvider, Usage };

/** What a runtime reports about one Bot. A subset of the stored BotStatus:
 *  "provisioning" is AgenticBots lifecycle, never reported by a runtime. */
export type RuntimeBotStatus = Exclude<BotStatus, "provisioning">;

/**
 * How to reach one Bot (or a runtime as a whole) — resolved server-side
 * from the stored mapping and Secrets Manager, never serialized to a
 * browser. `runtimeProfile` is the opaque name the runtime knows the Bot
 * by; only the adapter interprets it.
 */
export interface RuntimeConnection {
  provider: RuntimeProvider;
  /** AgenticBots runtime record id. */
  runtimeId: string;
  /** The Bot's runtime-side name (stored mapping). Undefined = runtime-level call. */
  runtimeProfile?: string;
  /** Private endpoint of the runtime. */
  endpoint: string;
  credentials: {
    /** Per-Bot key. */
    apiKey: string;
    /** Private-connectivity service token (tunnel access), if any. */
    accessClientId?: string;
    accessClientSecret?: string;
  };
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
  /** The runtime can replay a Run's full event history on request
   *  (otherwise events are delivered once, as a live stream). */
  eventReplay: boolean;
  /** Runtime-reported feature flags, kept verbatim for operators. */
  reported: Record<string, boolean>;
}

export interface RuntimeHealthReport {
  status: "healthy" | "degraded" | "offline";
  ready: boolean;
  checks: { name: string; status: string }[];
  activeRuns?: number;
  diskFreePct?: number;
  checkedAt: string;
}

export interface RuntimeBot {
  runtimeProfile: string;
  status: RuntimeBotStatus;
  /** Model alias the runtime reports for this Bot. Operator-only. */
  modelAlias?: string;
}

export interface StartBotRunInput {
  task: string;
  /** Extra instructions layered on the Bot's own configuration. */
  instructions?: string;
  /** Runtime-side id of the Conversation this Run continues (stored mapping). */
  conversationRuntimeId?: string;
  idempotencyKey: string;
  correlationId: string;
  provider?: string;
  model?: string;
  reasoning?: "low" | "medium" | "high";
}

export interface StartedBotRun {
  runtimeRunId: string;
  /** True when the idempotency key matched an earlier submission. */
  replayed: boolean;
}

export interface RuntimeApproval {
  /** Runtime-side approval id (stored mapping). */
  approvalId?: string;
  description: string;
  detail?: string;
}

export interface RuntimeBotRun {
  runtimeRunId: string;
  status: RunStatus;
  output?: string;
  usage?: Usage;
  provider?: string;
  model?: string;
  error?: string;
  pendingApproval?: RuntimeApproval;
  /** The runtime is draining this Run toward cancellation/interruption. */
  stopping?: boolean;
}

/** Normalized Bot Run events. */
export const BOT_EVENT_TYPES = [
  "bot.run.queued",
  "bot.run.started",
  "bot.action.started",
  "bot.action.completed",
  "bot.message",
  "bot.approval.requested",
  "bot.approval.resolved",
  "bot.run.completed",
  "bot.run.failed",
  "bot.run.cancelled",
  "bot.run.interrupted",
  "bot.other",
] as const;
export type BotEventType = (typeof BOT_EVENT_TYPES)[number];

export const TERMINAL_EVENT_TYPES: readonly BotEventType[] = ["bot.run.completed", "bot.run.failed", "bot.run.cancelled", "bot.run.interrupted"];

export interface BotRunEvent {
  type: BotEventType;
  at: string;
  /** Technical action name (e.g. "web_search"). The translation registry
   *  turns it into business language; clients never see it raw. */
  action?: string;
  preview?: string;
  durationS?: number;
  error?: boolean;
  text?: string;
  usage?: Usage;
  approval?: { approvalId?: string; description: string };
  /** The runtime's own event name, for operators only. */
  sourceEvent: string;
}

export interface RuntimeConversation {
  runtimeConversationId: string;
  title?: string;
  messages?: { role: "user" | "assistant"; text: string; at?: string }[];
}

export interface RuntimeAutomation {
  runtimeAutomationId: string;
  name: string;
  schedule: string;
  status: AutomationStatus;
  lastRunAt?: string;
  lastResult?: "succeeded" | "failed";
  nextRunAt?: string;
  lastError?: string;
}

export interface AutomationConfig {
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
