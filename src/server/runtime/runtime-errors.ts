import "server-only";
import { redactSecrets } from "@/server/redact";

/**
 * Normalized runtime errors. Adapters translate every engine failure into
 * one of these classes; nothing engine-specific (status codes, payloads,
 * stack traces) escapes the adapter in any other form.
 *
 * sanitizeRuntimeError() is then the only way a runtime failure becomes
 * text: clients get one of a fixed set of sentences, operators get a
 * redacted technical line, a stable code and a correlation id.
 */
export const CLIENT_ERROR_MESSAGES = {
  unavailable: "Bot temporarily unavailable.",
  failed: "Task could not be completed.",
  connection: "Connection needs attention.",
  approval_expired: "Approval expired.",
  integration: "Integration requires attention.",
} as const;

export type RuntimeErrorCode =
  | "runtime_unreachable"
  | "runtime_auth"
  | "runtime_overloaded"
  | "runtime_not_found"
  | "bot_not_found"
  | "run_not_found"
  | "run_failed"
  | "approval_required"
  | "capability_unavailable"
  | "runtime_bad_request"
  | "runtime_conflict"
  | "provider_failure"
  | "integration_failure"
  | "approval_expired"
  | "run_interrupted"
  | "suspended"
  | "unknown";

export class RuntimeError extends Error {
  constructor(
    public readonly code: RuntimeErrorCode,
    message: string,
    public readonly status?: number,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "RuntimeError";
  }
}

/** The runtime could not be reached, is restarting, or is at capacity. */
export class RuntimeUnavailableError extends RuntimeError {
  constructor(message = "Runtime unavailable", opts: { overloaded?: boolean; status?: number } = {}) {
    super(opts.overloaded ? "runtime_overloaded" : "runtime_unreachable", message, opts.status, true);
    this.name = "RuntimeUnavailableError";
  }
}

/** The runtime rejected the Bot's credentials, or none are configured. */
export class RuntimeAuthenticationError extends RuntimeError {
  constructor(message = "Runtime rejected credentials", status?: number) {
    super("runtime_auth", message, status);
    this.name = "RuntimeAuthenticationError";
  }
}

/** The runtime does not know (or has parked) this Bot. */
export class BotNotFoundError extends RuntimeError {
  constructor(message = "Bot not found on runtime", status?: number) {
    super("bot_not_found", message, status);
    this.name = "BotNotFoundError";
  }
}

/** The runtime no longer knows this Run (e.g. after a restart). */
export class RunNotFoundError extends RuntimeError {
  constructor(message = "Run not found on runtime", status?: number) {
    super("run_not_found", message, status);
    this.name = "RunNotFoundError";
  }
}

/** A Conversation or Automation the runtime does not know. */
export class RuntimeResourceNotFoundError extends RuntimeError {
  constructor(message = "Not found on runtime", status?: number) {
    super("runtime_not_found", message, status);
    this.name = "RuntimeResourceNotFoundError";
  }
}

/** The Run could not be carried out. */
export class RunFailedError extends RuntimeError {
  constructor(message = "Run failed", status?: number) {
    super("run_failed", message, status);
    this.name = "RunFailedError";
  }
}

/** The operation needs an approval decision first (or none is pending). */
export class ApprovalRequiredError extends RuntimeError {
  constructor(message = "Approval required", status?: number) {
    super("approval_required", message, status);
    this.name = "ApprovalRequiredError";
  }
}

/** The model provider behind the runtime failed. */
export class ProviderUnavailableError extends RuntimeError {
  constructor(message = "Model provider unavailable", status?: number) {
    super("provider_failure", message, status, true);
    this.name = "ProviderUnavailableError";
  }
}

/** The runtime does not support this operation. */
export class CapabilityUnavailableError extends RuntimeError {
  constructor(
    public readonly capability: string,
    message = `Runtime does not support ${capability}`,
  ) {
    super("capability_unavailable", message);
    this.name = "CapabilityUnavailableError";
  }
}

/** The runtime refused the request as malformed or conflicting. */
export class RuntimeRequestError extends RuntimeError {
  constructor(message: string, status?: number, conflict = false) {
    super(conflict ? "runtime_conflict" : "runtime_bad_request", message, status);
    this.name = "RuntimeRequestError";
  }
}

const NOT_FOUND: RuntimeErrorCode[] = ["runtime_not_found", "run_not_found", "bot_not_found"];

/** Any not-found variant — for callers that only care whether it is gone. */
export function isRuntimeNotFound(err: unknown): boolean {
  return err instanceof RuntimeError && NOT_FOUND.includes(err.code);
}

export interface SanitizedError {
  code: RuntimeErrorCode;
  client: (typeof CLIENT_ERROR_MESSAGES)[keyof typeof CLIENT_ERROR_MESSAGES];
  operator: string;
  correlationId: string;
  retryable: boolean;
}

const UNAVAILABLE: RuntimeErrorCode[] = ["runtime_unreachable", "runtime_overloaded", "suspended", "runtime_auth", "bot_not_found", "capability_unavailable"];

export function sanitizeRuntimeError(err: unknown, correlationId: string): SanitizedError {
  const code: RuntimeErrorCode =
    err instanceof RuntimeError ? err.code : classify(err instanceof Error ? err.message : String(err));
  const raw = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const client =
    code === "integration_failure"
      ? CLIENT_ERROR_MESSAGES.integration
      : code === "approval_expired"
        ? CLIENT_ERROR_MESSAGES.approval_expired
        : UNAVAILABLE.includes(code)
          ? CLIENT_ERROR_MESSAGES.unavailable
          : CLIENT_ERROR_MESSAGES.failed;
  return {
    code,
    client,
    // First line only — stack frames carry file paths and are never stored.
    operator: redactSecrets(raw.split("\n")[0], 400),
    correlationId,
    retryable: err instanceof RuntimeError ? err.retryable : code === "runtime_unreachable" || code === "runtime_overloaded",
  };
}

function classify(msg: string): RuntimeErrorCode {
  const m = msg.toLowerCase();
  if (/econnrefused|enotfound|etimedout|fetch failed|network|socket hang up|aborted/.test(m)) return "runtime_unreachable";
  if (/401|403|unauthori[sz]ed|forbidden/.test(m)) return "runtime_auth";
  if (/429|too many concurrent|rate limit/.test(m)) return "runtime_overloaded";
  if (/invalid_grant|oauth|token expired|integration/.test(m)) return "integration_failure";
  if (/provider|model.*(unavailable|overloaded)|upstream/.test(m)) return "provider_failure";
  if (/interrupted|shutdown/.test(m)) return "run_interrupted";
  return "unknown";
}
