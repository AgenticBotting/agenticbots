import "server-only";
import { NextResponse } from "next/server";
import { AppError } from "@/server/errors";
import { correlationId } from "@/server/ids";
import { redactSecrets } from "@/server/redact";
import { RuntimeError, sanitizeRuntimeError } from "@/server/runtime/runtime-errors";

/**
 * JSON route wrapper. Every route handler goes through this so that errors
 * are always mapped to a safe body: AppErrors carry their public message,
 * runtime failures their sanitized client sentence, everything else a
 * reference id. Stack traces never leave the server.
 */
export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AppError) return json({ error: { code: e.code, message: e.publicMessage } }, e.status);
    const id = correlationId();
    if (e instanceof RuntimeError) {
      const s = sanitizeRuntimeError(e, id);
      return json({ error: { code: "runtime", message: s.client, correlationId: id } }, 502);
    }
    console.error(`[api ${id}]`, redactSecrets(e instanceof Error ? `${e.name}: ${e.message}` : String(e)));
    return json({ error: { code: "internal", message: "Something went wrong.", correlationId: id } }, 500);
  }
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new AppError("validation", "Request body must be JSON.", 400);
  }
}
