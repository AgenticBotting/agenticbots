import "server-only";
import { revalidatePath } from "next/cache";
import { AppError } from "@/server/errors";
import { correlationId } from "@/server/ids";
import { redactSecrets } from "@/server/redact";
import { RuntimeError, sanitizeRuntimeError } from "@/server/runtime/errors";

export interface ActionState {
  ok?: boolean;
  message?: string;
  link?: string;
}

/**
 * Run a server action body, refresh affected screens, and turn any error
 * into a safe message. Unexpected errors are logged with a correlation id
 * (redacted) and the person sees the id, never the error.
 */
export async function act(
  fn: () => Promise<string | ActionState | void>,
  revalidate: string = "/ops",
): Promise<ActionState> {
  try {
    const res = await fn();
    revalidatePath(revalidate, "layout");
    if (typeof res === "string") return { ok: true, message: res };
    return { ok: true, ...(res ?? {}) };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, message: e.publicMessage };
    if (e instanceof RuntimeError) {
      const s = sanitizeRuntimeError(e, correlationId());
      return { ok: false, message: `${s.client} (ref ${s.correlationId})` };
    }
    // Next's redirect() throws a control-flow error that must propagate.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    const id = correlationId();
    console.error(`[action ${id}]`, redactSecrets(e instanceof Error ? `${e.name}: ${e.message}` : String(e)));
    return { ok: false, message: `That did not work. Reference ${id}.` };
  }
}

export const str = (f: FormData, k: string): string => String(f.get(k) ?? "").trim();
export const opt = (f: FormData, k: string): string | undefined => {
  const v = str(f, k);
  return v === "" ? undefined : v;
};
/** "$1,234.50" → 123450 */
export function centsFrom(f: FormData, k: string): number {
  const raw = str(f, k).replace(/[$,\s]/g, "");
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return Number.NaN;
  return Math.round(n * 100);
}
