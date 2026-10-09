"use server";
import { act, str, type ActionState } from "@/server/actions/wrap";
import { requirePortalOrg } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { createPrivacyCase } from "@/server/services/privacy";

export async function accountRequestAction(_previous: ActionState, form: FormData) {
  return act(async () => {
    const { actor, org } = await requirePortalOrg("portal.requests.create");
    const item = await createPrivacyCase(await repo(), actor, { orgId: org.id, kind: str(form, "kind"), details: str(form, "details") });
    return `Request received. Reference ${item.id}. We will reply to your account email. Cancellation takes effect under your signed service agreement; no new charge was authorized.`;
  }, "/portal/account");
}
