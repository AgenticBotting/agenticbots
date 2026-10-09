"use server";
import { act, str, opt, type ActionState } from "@/server/actions/wrap";
import { requirePermission } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { createPrivacyCase, decidePrivacyCase } from "@/server/services/privacy";
export async function recordCaseAction(_p: ActionState, f: FormData) {
  return act(async () => {
    await createPrivacyCase(await repo(), await requirePermission("ops.settings.manage"), { kind: str(f, "kind"), contactEmail: opt(f, "email"), details: str(f, "details") });
    return "Request recorded. Verify the requester before fulfillment.";
  }, "/ops/privacy");
}
export async function decideCaseAction(_p: ActionState, f: FormData) {
  return act(async () => {
    await decidePrivacyCase(await repo(), await requirePermission("ops.settings.manage"), str(f, "id"), str(f, "status"), str(f, "resolution"));
    return "Request updated. This records your completed work; it does not send email or delete records.";
  }, "/ops/privacy");
}
