import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { requirePermission } from "@/server/auth/guard";
import { refOf } from "@/server/services/common";
import { refreshRuntimeHealth } from "@/server/services/monitoring";

/** GET: last-known health (cheap). POST: refresh now. */
export const GET = (_req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const id = (await ctx.params).id;
    await requirePermission("ops.view", id);
    return json({ runtimes: await (await repo()).list("runtimes", { orgId: id }) });
  });

export const POST = (_req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const id = (await ctx.params).id;
    const actor = await requirePermission("ops.runtime.control", id);
    const r = await repo();
    const out = [];
    for (const rt of await r.list("runtimes", { orgId: id })) out.push(await refreshRuntimeHealth(r, rt.id, refOf(actor)));
    return json({ runtimes: out });
  });
