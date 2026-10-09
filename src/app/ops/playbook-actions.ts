"use server";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { act, str, type ActionState } from "@/server/actions/wrap";
import { invalid } from "@/server/errors";
import { saveDraft, applyAutomationDraft } from "@/server/services/playbooks";
export async function savePlaybookAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return act(async () => {
    const raw = str(form, "draft");
    if (raw.length > 30_000) throw invalid("This draft is too large.");
    let input: unknown;
    try { input = JSON.parse(raw); } catch { throw invalid("The draft could not be read."); }
    await saveDraft(await repo(), await requireActor(), input);
    return "Draft saved. No BOT or external system was changed.";
  });
}
export async function applyPlaybookAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return act(async () => {
    if (str(form, "confirmed") !== "yes") throw invalid("Review and confirm the SOP first.");
    await applyAutomationDraft(await repo(), await requireActor(), str(form,"draftId"), Number(str(form,"version")));
    return "SOP applied to the paused automation. Review its schedule before resuming.";
  });
}
export async function prepareSupportAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return act(async () => {
    const {prepareSupportDraft}=await import("@/server/services/support-planning");
    await prepareSupportDraft(await repo(),await requireActor(),str(form,"requestId"),Number(str(form,"version")));
    return "Evidence and a diagnostic plan are ready for review. No execution started.";
  });
}
export async function applySkillPlaybookAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return act(async () => {
    if(str(form,"confirmed")!=="yes") throw invalid("Review and confirm the strategy first.");
    const {applySkillDraft}=await import("@/server/services/playbooks");
    await applySkillDraft(await repo(),await requireActor(),str(form,"draftId"),Number(str(form,"version")));
    return "BOT instructions updated for future manual runs. Existing skills and scheduled prompts are unchanged.";
  });
}
