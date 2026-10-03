import { headers } from "next/headers";
import { handle, json, body } from "@/server/api";
import { repo } from "@/server/db";
import { authenticate } from "@/server/services/accounts";
import { createSession, destroySession } from "@/server/auth/session";

/**
 * POST /api/session  { email, password }  → sets the session cookie.
 * DELETE /api/session                     → signs out.
 * JSON only, same-origin only (a cross-site form cannot set this content
 * type, and the Origin header is checked when present).
 */
async function sameOrigin(req: Request): Promise<boolean> {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = (await headers()).get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const POST = (req: Request) =>
  handle(async () => {
    if (!(req.headers.get("content-type") ?? "").includes("application/json") || !(await sameOrigin(req))) {
      return json({ error: { code: "forbidden", message: "Not allowed." } }, 403);
    }
    const b = await body<{ email?: string; password?: string }>(req);
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
    const user = await authenticate(await repo(), String(b.email ?? ""), String(b.password ?? ""), ip);
    if (!user) return json({ error: { code: "unauthenticated", message: "That email and password do not match an active account." } }, 401);
    await createSession(user);
    return json({ ok: true, home: user.platformRole ? "/ops" : "/portal" });
  });

export const DELETE = (req: Request) =>
  handle(async () => {
    if (!(await sameOrigin(req))) return json({ error: { code: "forbidden", message: "Not allowed." } }, 403);
    await destroySession();
    return json({ ok: true });
  });
