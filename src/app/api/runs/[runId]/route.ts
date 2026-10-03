import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { currentActor } from "@/server/auth/session";
import { can } from "@/server/auth/policy";
import { syncRun, isActive } from "@/server/services/runs";
import { clientSafe } from "@/server/redact";
import { CLIENT_ERROR_MESSAGES } from "@/server/runtime/runtime-errors";
import { notFound, unauthenticated } from "@/server/errors";

/** GET /api/runs/:runId — polling fallback for the event stream. */
export const GET = (_req: Request, ctx: { params: Promise<{ runId: string }> }) =>
  handle(async () => {
    const actor = await currentActor();
    if (!actor) throw unauthenticated();
    const r = await repo();
    let run = await r.get("runs", (await ctx.params).runId);
    if (!run) throw notFound("Run");
    const operator = can(actor, "ops.view", run.orgId);
    if (!operator && !can(actor, "portal.view", run.orgId)) throw notFound("Run");
    if (isActive(run.status)) run = await syncRun(r, run.id).catch(() => run!);
    if (operator) return json({ run });
    return json({
      run: {
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        endedAt: run.endedAt,
        result: run.status === "completed" ? clientSafe(run.resultSummary, 600) : undefined,
        error: run.status === "failed" ? CLIENT_ERROR_MESSAGES.failed : undefined,
      },
    });
  });
