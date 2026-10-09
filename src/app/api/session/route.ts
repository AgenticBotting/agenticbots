import { isDemo } from "@/server/env";
import { sameOriginMutation, requestIp } from "@/lib/request-security";
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
export const POST = (req: Request) =>
  handle(async () => {
    if (!(req.headers.get("content-type") ?? "").includes("application/json") || !sameOriginMutation(req)) {
      return json({ error: { code: "forbidden", message: "Not allowed." } }, 403);
    }
    const b = await body<{ email?: string; password?: string }>(req);
    const ip = requestIp(req.headers);
    const user = await authenticate(await repo(), String(b.email ?? ""), String(b.password ?? ""), ip);
    if (!user) return json({ error: { code: "unauthenticated", message: "That email and password do not match an active account." } }, 401);
    await createSession(user);
    return json({ ok: true, home: user.platformRole && !isDemo() ? "/login/security" : user.platformRole ? "/ops" : "/portal" });
  });

export const DELETE = (req: Request) =>
  handle(async () => {
    if (!sameOriginMutation(req)) return json({ error: { code: "forbidden", message: "Not allowed." } }, 403);
    await destroySession();
    return json({ ok: true });
  });
