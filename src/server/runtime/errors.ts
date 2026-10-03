import "server-only";
import { redactSecrets } from "@/server/redact";

/**
 * sanitizeRuntimeError(): the only way a runtime failure becomes text.
 *
 * Clients get one of a fixed set of sentences — never a stack trace, a
 * status code, a hostname or a vendor error string. Operators get a
 * redacted technical line, a stable code and the correlation id they can
 * search for in logs.
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
  | "runtime_bad_request"
  | "runtime_conflict"
  | "provider_failure"
  | "integration_failure"
  | "approval_expired"
  | "run_interrupted"
  | "suspended"
  | "unknown";

export interface SanitizedError {
  code: RuntimeErrorCode;
  client: (typeof CLIENT_ERROR_MESSAGES)[keyof typeof CLIENT_ERROR_MESSAGES];
  operator: string;
  correlationId: string;
  retryable: boolean;
}

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

export function sanitizeRuntimeError(err: unknown, correlationId: string): SanitizedError {
  const code: RuntimeErrorCode =
    err instanceof RuntimeError ? err.code : classify(err instanceof Error ? err.message : String(err));
  const raw = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const client =
    code === "integration_failure"
      ? CLIENT_ERROR_MESSAGES.integration
      : code === "approval_expired"
        ? CLIENT_ERROR_MESSAGES.approval_expired
        : code === "runtime_unreachable" || code === "runtime_overloaded" || code === "suspended" || code === "runtime_auth"
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
