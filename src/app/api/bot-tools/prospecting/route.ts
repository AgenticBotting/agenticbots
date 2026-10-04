import { body, handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { AppError } from "@/server/errors";
import { ctxOf } from "@/server/prospecting/access";
import { PROSPECTING_TOOLS, botPrincipal, runProspectingTool, verifyToolToken } from "@/server/prospecting/tools";

/**
 * Prospecting Bot tools — server-to-server.
 *
 *   GET  /api/bot-tools/prospecting   → tool list (names, descriptions)
 *   POST /api/bot-tools/prospecting   { tool, args } → normalized JSON result
 *
 * Auth: `Authorization: Bearer <tool token>` — a short-lived HMAC token
 * bound to one Prospecting Bot and one client. The Bot never receives a
 * provider credential; it only ever sees these normalized results.
 */
function bearer(req: Request): string {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) throw new AppError("unauthenticated", "Missing tool token.", 401);
  return m[1].trim();
}

export const GET = (req: Request) =>
  handle(async () => {
    verifyToolToken(bearer(req));
    return json({ tools: PROSPECTING_TOOLS.map((t) => ({ name: t.name, description: t.description, mayCost: t.mayCost })) });
  });

export const POST = (req: Request) =>
  handle(async () => {
    const { botId, orgId } = verifyToolToken(bearer(req));
    const r = await repo();
    const principal = await botPrincipal(r, botId, orgId);
    const b = await body<{ tool?: string; args?: unknown }>(req);
    const result = await runProspectingTool(ctxOf(r, principal), String(b.tool ?? ""), b.args);
    return json({ result });
  });
