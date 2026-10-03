import { handle, json, body } from "@/server/api";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";
import { startRun } from "@/server/services/runs";
import { invalid, notFound } from "@/server/errors";

/** GET: runs for a Bot (operators). POST: start a Bot Run (operators).
 *  Send `Idempotency-Key` — retries with the same key return the same run. */
export const GET = (_req: Request, ctx: { params: Promise<{ botId: string }> }) =>
  handle(async () => {
    const actor = await requireActor();
    const r = await repo();
    const bot = await r.get("bots", (await ctx.params).botId);
    if (!bot || !can(actor, "ops.view", bot.orgId)) throw notFound("Bot");
    return json({ runs: await r.list("runs", { orgId: bot.orgId, where: { botId: bot.id }, limit: 100 }) });
  });

export const POST = (req: Request, ctx: { params: Promise<{ botId: string }> }) =>
  handle(async () => {
    const actor = await requireActor();
    const key = req.headers.get("idempotency-key");
    if (!key) throw invalid("Send an Idempotency-Key header.");
    const b = await body<{ task?: string; requestId?: string }>(req);
    const run = await startRun(await repo(), actor, { botId: (await ctx.params).botId, task: String(b.task ?? ""), requestId: b.requestId, idempotencyKey: key });
    return json({ run: { id: run.id, status: run.status, correlationId: run.correlationId } }, 202);
  });
