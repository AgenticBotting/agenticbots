import "server-only";
import { RuntimeError } from "../errors";
import type { RuntimeTarget } from "../adapter";

/**
 * Minimal HTTP client for the engine's API server (pinned contract:
 * docs/research/HERMES_INTEGRATION.md). Server-only — the base URL and
 * bearer key come from Secrets Manager and never reach a browser.
 *
 * Multi-profile routing: one listener serves every Bot profile under a
 * `/p/<profile>/` prefix, and each prefix only accepts THAT profile's key.
 */
const DEFAULT_TIMEOUT_MS = 15_000;

export function profilePath(t: RuntimeTarget, path: string): string {
  const base = t.baseUrl.replace(/\/+$/, "");
  const prefix = t.profile && t.profile !== "default" ? `/p/${encodeURIComponent(t.profile)}` : "";
  return `${base}${prefix}${path}`;
}

export function authHeaders(t: RuntimeTarget, extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${t.apiKey}`,
    Accept: "application/json",
    ...t.extraHeaders,
    ...extra,
  };
}

export async function hermesFetch<T>(
  t: RuntimeTarget,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  opts: { body?: unknown; headers?: Record<string, string>; timeoutMs?: number; okStatuses?: number[] } = {},
): Promise<{ data: T; status: number; headers: Headers }> {
  let res: Response;
  try {
    res = await fetch(profilePath(t, path), {
      method,
      headers: authHeaders(t, {
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...opts.headers,
      }),
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (e) {
    throw new RuntimeError("runtime_unreachable", `Runtime request failed: ${(e as Error).name}`, undefined, true);
  }
  const text = await res.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  if (!res.ok && !(opts.okStatuses ?? []).includes(res.status)) {
    throw errorFor(res.status, data);
  }
  return { data: data as T, status: res.status, headers: res.headers };
}

function errorFor(status: number, body: unknown): RuntimeError {
  const msg = extractMessage(body) ?? `HTTP ${status}`;
  if (status === 401 || status === 403) return new RuntimeError("runtime_auth", `Runtime rejected credentials (${status})`, status);
  if (status === 404) return new RuntimeError("runtime_not_found", `Not found on runtime: ${msg}`, status);
  if (status === 409) return new RuntimeError("runtime_conflict", `Runtime conflict: ${msg}`, status);
  if (status === 429) return new RuntimeError("runtime_overloaded", `Runtime at capacity: ${msg}`, status, true);
  if (status === 424) return new RuntimeError("provider_failure", `Runtime dependency failed: ${msg}`, status);
  if (status >= 500) return new RuntimeError("runtime_unreachable", `Runtime error ${status}: ${msg}`, status, true);
  return new RuntimeError("runtime_bad_request", `Runtime refused request (${status}): ${msg}`, status);
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

/**
 * Server-Sent Events reader. Skips `: keepalive` comment lines (the engine
 * sends one every 10s), yields parsed JSON payloads.
 */
export async function* readSse(
  t: RuntimeTarget,
  path: string,
  signal?: AbortSignal,
): AsyncGenerator<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(profilePath(t, path), {
      headers: authHeaders(t, { Accept: "text/event-stream" }),
      signal,
      cache: "no-store",
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    throw new RuntimeError("runtime_unreachable", `Event stream failed: ${(e as Error).name}`, undefined, true);
  }
  if (!res.ok || !res.body) throw errorFor(res.status, undefined);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const block = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const dataLines: string[] = [];
        let eventName: string | undefined;
        for (const line of block.split("\n")) {
          if (line.startsWith(":")) continue;
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
        }
        if (dataLines.length === 0) continue;
        const payload = dataLines.join("\n");
        if (payload === "[DONE]") return;
        try {
          const obj = JSON.parse(payload) as Record<string, unknown>;
          if (eventName && !obj.event) obj.event = eventName;
          yield obj;
        } catch {
          // Malformed frame: ignore rather than kill the stream.
        }
      }
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    throw new RuntimeError("runtime_unreachable", "Event stream interrupted", undefined, true);
  } finally {
    reader.releaseLock();
  }
}
