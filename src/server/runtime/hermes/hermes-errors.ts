import "server-only";
import {
  ApprovalRequiredError,
  BotNotFoundError,
  ProviderUnavailableError,
  RunNotFoundError,
  RuntimeAuthenticationError,
  RuntimeError,
  RuntimeRequestError,
  RuntimeResourceNotFoundError,
  RuntimeUnavailableError,
} from "../runtime-errors";

/** What a request was about — decides which not-found error applies. */
export type HermesSubject = "runtime" | "bot" | "run" | "approval" | "conversation" | "automation";

/**
 * Translate an HTTP failure from Hermes into a normalized runtime error.
 * Only a short, redactable message survives; payloads and stack traces
 * never leave this folder.
 */
export function hermesHttpError(status: number, body: unknown, subject: HermesSubject): RuntimeError {
  const msg = extractMessage(body) ?? `HTTP ${status}`;
  if (status === 401 || status === 403) return new RuntimeAuthenticationError(`Runtime rejected credentials (${status})`, status);
  if (status === 404) {
    if (subject === "run") return new RunNotFoundError(`Run not found on runtime: ${msg}`, status);
    if (subject === "bot") return new BotNotFoundError(`Bot not found on runtime: ${msg}`, status);
    if (subject === "approval") return new ApprovalRequiredError(`No pending approval: ${msg}`, status);
    return new RuntimeResourceNotFoundError(`Not found on runtime: ${msg}`, status);
  }
  if (status === 409) {
    if (subject === "approval") return new ApprovalRequiredError(`Approval not pending: ${msg}`, status);
    return new RuntimeRequestError(`Runtime conflict: ${msg}`, status, true);
  }
  if (status === 429) return new RuntimeUnavailableError(`Runtime at capacity: ${msg}`, { overloaded: true, status });
  if (status === 424 || status === 502) return new ProviderUnavailableError(`Runtime dependency failed: ${msg}`, status);
  if (status >= 500) return new RuntimeUnavailableError(`Runtime error ${status}: ${msg}`, { status });
  return new RuntimeRequestError(`Runtime refused request (${status}): ${msg}`, status);
}

export function hermesNetworkError(e: unknown, what = "Runtime request"): RuntimeError {
  return new RuntimeUnavailableError(`${what} failed: ${(e as Error)?.name ?? "Error"}`);
}

function extractMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  const err = b.error;
  if (typeof err === "string") return err.slice(0, 200);
  if (err && typeof err === "object" && typeof (err as Record<string, unknown>).message === "string") {
    return String((err as Record<string, unknown>).message).slice(0, 200);
  }
  return typeof b.message === "string" ? b.message.slice(0, 200) : undefined;
}
