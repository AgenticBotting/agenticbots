import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { requirePermission } from "@/server/auth/guard";
import { notFound } from "@/server/errors";

export const GET = (_req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const id = (await ctx.params).id;
    await requirePermission("ops.view", id);
    const r = await repo();
    const org = await r.get("organizations", id);
    if (!org) throw notFound("Client");
    const [bots, runtimes, agreements] = await Promise.all([r.list("bots", { orgId: id }), r.list("runtimes", { orgId: id }), r.list("service_agreements", { orgId: id })]);
    return json({ client: org, bots, runtimes, agreements });
  });
