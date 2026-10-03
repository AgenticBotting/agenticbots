import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { reactivateClient } from "@/server/services/clients";

export const POST = (_req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => json(await reactivateClient(await repo(), await requireActor(), (await ctx.params).id)));
