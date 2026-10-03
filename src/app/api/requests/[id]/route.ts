import { handle, json, body } from "@/server/api";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";
import { getRequestFor, addMessage, updateRequest } from "@/server/services/requests";
import { toClientRequest } from "@/server/views/client";

/** GET: client view (or full record for operators). PATCH: operator routing. POST: add a message. */
export const GET = (_req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const actor = await requireActor();
    const req = await getRequestFor(await repo(), actor, (await ctx.params).id);
    return json({ request: can(actor, "ops.view", req.orgId) ? req : toClientRequest(req) });
  });

export const PATCH = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const actor = await requireActor();
    const b = await body<{ status?: "in_progress"; assignedOperatorId?: string | null; assignedBotIds?: string[]; clarification?: string }>(req);
    return json({ request: await updateRequest(await repo(), actor, (await ctx.params).id, b) });
  });

export const POST = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const actor = await requireActor();
    const b = await body<{ text?: string }>(req);
    const next = await addMessage(await repo(), actor, (await ctx.params).id, String(b.text ?? ""));
    return json({ request: can(actor, "ops.view", next.orgId) ? next : toClientRequest(next) });
  });
