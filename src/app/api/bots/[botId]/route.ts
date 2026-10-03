import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { currentActor } from "@/server/auth/session";
import { can } from "@/server/auth/policy";
import { toClientBot } from "@/server/views/client";
import { notFound, unauthenticated } from "@/server/errors";

/** GET /api/bots/:botId — client view for clients; full record for operators. */
export const GET = (_req: Request, ctx: { params: Promise<{ botId: string }> }) =>
  handle(async () => {
    const actor = await currentActor();
    if (!actor) throw unauthenticated();
    const r = await repo();
    const bot = await r.get("bots", (await ctx.params).botId);
    if (!bot) throw notFound("Bot");
    if (can(actor, "ops.view", bot.orgId)) return json({ bot });
    if (!can(actor, "portal.view", bot.orgId)) throw notFound("Bot");
    const org = await r.get("organizations", bot.orgId);
    return json({ bot: toClientBot(bot, org!) });
  });
