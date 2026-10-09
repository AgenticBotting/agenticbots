"use server";

import { redirect } from "next/navigation";
import { repo } from "@/server/db";
import { requirePortalOrg } from "@/server/auth/guard";
import { act, opt, str, type ActionState } from "@/server/actions/wrap";
import { createRequest, addMessage } from "@/server/services/requests";
import { resolveApproval } from "@/server/services/approvals";
import { notFound } from "@/server/errors";
import { destroySession } from "@/server/auth/session";

type A = (prev: ActionState, f: FormData) => Promise<ActionState>;

/** Client-side actions. Every one resolves the client's organization from
 *  their membership — never from a form field — so a client can only act
 *  on their own organization. Staff in preview mode have no membership and
 *  are refused here. */

export const submitRequestAction: A = async (_p, f) =>
  act(async () => {
    const { actor, org } = await requirePortalOrg("portal.requests.create");
    const req = await createRequest(await repo(), actor, org.id, {
      title: str(f, "title"),
      description: str(f, "description"),
      priority: (opt(f, "priority") as "normal" | undefined) ?? "normal",
    });
    if (f.get("stay") === "1") return "Request sent. AgenticBots will pick it up shortly.";
    redirect(`/portal/requests/${req.id}`);
  }, "/portal");

export const commentAction: A = async (_p, f) =>
  act(async () => {
    const { actor, org } = await requirePortalOrg("portal.requests.comment");
    const r = await repo();
    const req = await r.get("requests", str(f, "requestId"));
    if (!req || req.orgId !== org.id) throw notFound("Request");
    await addMessage(r, actor, req.id, str(f, "text"));
    return "Sent.";
  }, "/portal");

export const decideAction: A = async (_p, f) =>
  act(async () => {
    const { actor, org } = await requirePortalOrg("portal.approvals.resolve");
    const r = await repo();
    const a = await r.get("approvals", str(f, "approvalId"));
    if (!a || a.orgId !== org.id) throw notFound("Approval");
    const decision = str(f, "decision") === "approve" ? "approve" : "deny";
    await resolveApproval(r, actor, a.id, decision, opt(f, "note"));
    return decision === "approve" ? "Your approval was recorded. Review the request for its execution status." : "Declined. Nothing will be sent or changed.";
  }, "/portal");

export async function portalLogout() {
  await destroySession();
  redirect("/login");
}
