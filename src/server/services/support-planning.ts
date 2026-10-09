import "server-only";
import type { Repository } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { runtimeObservation } from "@/lib/platform/health";
import { PLAYBOOK_TEMPLATES } from "@/lib/platform/playbooks";
import { getScoped } from "./common";
import { loadDraft, saveDraft } from "./playbooks";

/** Evidence-only preparation. No model call, runtime command or customer send. */
export async function supportEvidence(r: Repository, actor: Actor, requestId: string) {
  const request = await getScoped(r,"requests",requestId,actor,"ops.requests.manage");
  const [runtimes,integrations,runs,incidents] = await Promise.all([
    r.list("runtimes",{orgId:request.orgId}),r.list("integrations",{orgId:request.orgId}),r.list("runs",{orgId:request.orgId}),r.list("incidents",{orgId:request.orgId}),
  ]);
  return { request, facts: [
    ...runtimes.map(rt=>{const observation=runtimeObservation(rt);return `Runtime: ${observation.label}; checked ${observation.checkedAt ?? "never"}.`; }),
    ...integrations.map(i=>`${i.displayName}: last recorded ${i.status.replaceAll("_"," ")}; checked ${i.lastCheckAt ?? "never"}.`),
    `${runs.filter(x=>x.requestId===requestId || request.linkedRunIds.includes(x.id)).length} linked BOT RUNS.`,
    `${incidents.filter(i=>i.status==="open" || i.status==="investigating").length} unresolved client incidents.`,
  ] };
}
export async function prepareSupportDraft(r: Repository, actor: Actor, requestId: string, expectedVersion: number) {
  const {request,facts}=await supportEvidence(r,actor,requestId);
  const {draft}=await loadDraft(r,actor,"support",requestId);
  const steps=PLAYBOOK_TEMPLATES[1].steps.map(s=>({...s}));
  steps[0].instruction=`Request: ${request.title}\n\nPlatform observations:\n${facts.join("\n")}\n\nValidate these observations before proposing changes.`.slice(0,1800);
  return saveDraft(r,actor,{kind:"support",targetId:requestId,title:`Support: ${request.title}`.slice(0,120),steps,sourceVersion:request.version,expectedVersion: draft ? expectedVersion : 0});
}
