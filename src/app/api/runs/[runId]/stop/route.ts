import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { stopRun } from "@/server/services/runs";

/** POST /api/runs/:runId/stop — operators. */
export const POST = (_req: Request, ctx: { params: Promise<{ runId: string }> }) =>
  handle(async () => json({ run: await stopRun(await repo(), await requireActor(), (await ctx.params).runId) }));
