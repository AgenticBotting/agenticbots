/**
 * Wire shapes of the Hermes Agent API server, as pinned in
 * docs/research/HERMES_INTEGRATION.md (v2026.9.24). Only files in this
 * folder may use them. Fields are optional and loosely typed on purpose:
 * the mappers tolerate older/newer field names (see hermes-mappers.ts).
 */
export type HermesJson = Record<string, unknown>;

export const HERMES_PINNED_VERSION = "2026.9.24";

export type HermesRunStatus =
  | "queued"
  | "started"
  | "running"
  | "stopping"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "cancelled"
  | "interrupted";

export type HermesEventName =
  | "run.queued"
  | "run.started"
  | "message.started"
  | "message.delta"
  | "message.interim"
  | "tool.started"
  | "tool.progress"
  | "tool.completed"
  | "tool.failed"
  | "approval.request"
  | "approval.responded"
  | "run.completed"
  | "run.failed"
  | "run.cancelled"
  | "run.interrupted"
  | "run.stopping"
  | "subagent.start"
  | "subagent.complete";

export interface HermesUsage {
  input_tokens?: number;
  output_tokens?: number;
  /** Older builds used OpenAI-style names. */
  prompt_tokens?: number;
  completion_tokens?: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
}

export interface HermesRun {
  run_id?: string;
  status?: HermesRunStatus | string;
  output?: string;
  error?: string;
  usage?: HermesUsage;
  model?: string;
  runtime?: { provider?: string; model?: string };
  approval?: { request_id?: string; description?: string; command?: string };
  shutdown_requested_at?: number | string;
}

export interface HermesEvent extends HermesJson {
  event?: HermesEventName | string;
  timestamp?: number | string;
  tool?: string;
  preview?: string;
  duration?: number;
  error?: boolean | string;
  text?: string;
  output?: string;
  usage?: HermesUsage;
  request_id?: string;
  description?: string;
  command?: string;
}

export interface HermesJob {
  id?: string;
  job_id?: string;
  name?: string;
  schedule?: string | { expr?: string; display?: string };
  schedule_display?: string;
  enabled?: boolean;
  state?: string;
  last_run_at?: number | string;
  last_status?: "ok" | "error" | string;
  next_run_at?: number | string;
  last_error?: string;
  consecutive_failures?: number;
}

export interface HermesCapabilities {
  version?: string;
  features?: Record<string, unknown>;
  endpoints?: Record<string, unknown>;
}
