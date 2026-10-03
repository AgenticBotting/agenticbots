import "server-only";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { resolveApproval } from "./approvals";
import { conflict, notFound } from "@/server/errors";

/** Shared by POST /api/runs/:id/approve and /deny. Ownership is enforced
 *  by resolveApproval (client admins of the run's org, or operators). */
export async function decideRunApproval(runId: string, decision: "approve" | "deny") {
  const actor = await requireActor();
  const r = await repo();
  const run = await r.get("runs", runId);
  if (!run) throw notFound("Run");
  const pending = (await r.list("approvals", { orgId: run.orgId, where: { runId } })).find((a) => a.status === "pending");
  if (!pending) throw conflict("This run is not waiting for approval.");
  const a = await resolveApproval(r, actor, pending.id, decision);
  return { id: a.id, status: a.status };
}
