import "server-only";
import type { RuntimeConnection } from "../runtime-types";
import { hermesHeaders, hermesUrl } from "./hermes-auth";
import { hermesHttpError, hermesNetworkError, type HermesSubject } from "./hermes-errors";
import type { HermesJson } from "./hermes-types";

/**
 * Minimal HTTP + SSE client for the Hermes API server. Server-only — the
 * endpoint and keys come from the resolved connection and never reach a
 * browser.
 */
const DEFAULT_TIMEOUT_MS = 15_000;

export interface HermesRequest {
  subject: HermesSubject;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function hermesFetch<T>(
  c: RuntimeConnection,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  req: HermesRequest,
): Promise<{ data: T; status: number; headers: Headers }> {
  let res: Response;
  try {
    res = await fetch(hermesUrl(c, path), {
      method,
      headers: hermesHeaders(c, {
        ...(req.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...req.headers,
      }),
      body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
      signal: AbortSignal.timeout(req.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (e) {
    throw hermesNetworkError(e);
  }
  const text = await res.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  if (!res.ok) throw hermesHttpError(res.status, data, req.subject);
  return { data: data as T, status: res.status, headers: res.headers };
}

/**
 * Server-Sent Events reader. Skips `: keepalive` comment lines (sent every
 * 10s), yields parsed JSON payloads. Hermes run streams are consume-once.
 */
export async function* readSse(c: RuntimeConnection, path: string, signal?: AbortSignal): AsyncGenerator<HermesJson> {
  let res: Response;
  try {
    res = await fetch(hermesUrl(c, path), {
      headers: hermesHeaders(c, { Accept: "text/event-stream" }),
      signal,
      cache: "no-store",
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    throw hermesNetworkError(e, "Event stream");
  }
  if (!res.ok || !res.body) throw hermesHttpError(res.status, undefined, "run");

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
          const obj = JSON.parse(payload) as HermesJson;
          if (eventName && !obj.event) obj.event = eventName;
          yield obj;
        } catch {
          // Malformed frame: ignore rather than kill the stream.
        }
      }
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    throw hermesNetworkError(e, "Event stream");
  } finally {
    reader.releaseLock();
  }
}
