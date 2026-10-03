import { handle, json } from "@/server/api";
import { decideRunApproval } from "@/server/services/run-approval-route";

/** POST /api/runs/:runId/deny */
export const POST = (_req: Request, ctx: { params: Promise<{ runId: string }> }) =>
  handle(async () => json({ approval: await decideRunApproval((await ctx.params).runId, "deny") }));
