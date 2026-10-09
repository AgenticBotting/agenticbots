import Link from "next/link";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { getScoped } from "@/server/services/common";
import { loadDraft } from "@/server/services/playbooks";
import { PageHead, Panel } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { PlaybookEditor } from "@/components/platform/playbook-editor";
import { ActionButton, ConfirmAction } from "@/components/platform/actions";
import { automationAction } from "../../actions";
import { applyPlaybookAction } from "../../playbook-actions";

export const metadata = { title: "Automation workspace" };
export default async function AutomationWorkspace({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const actor=await requireOperatorPage(); const r=await repo();
  const job=await getScoped(r,"automation_jobs",id,actor,"ops.view");
  const {draft}=await loadDraft(r,actor,"automation",id);
  const org=await r.get("organizations",job.orgId);
  return <>
    <PageHead title={job.name} crumbs={[{label:"Automations",href:"/ops/automations"}]} description={`${org?.name} · ${job.scheduleLabel ?? job.schedule}`} actions={<Status value={job.status}/>} />
    <div className="oc-brief"><h2>From instructions to a repeatable procedure.</h2><p className="oc-note">Build the SOP below, save it, then review its instructions. Applying a draft updates a paused schedule. Resuming is a separate decision; sends, publishing and other business changes still require their own approval.</p><div className="oc-links">
      <ActionButton action={automationAction} hidden={{jobId:id,op:job.status==="paused" ? "resume":"pause"}} label={job.status==="paused" ? "Resume saved schedule":"Pause schedule"}/>
      {draft && draft.sourceVersion === job.version && job.status==="paused" && <ConfirmAction action={applyPlaybookAction} hidden={{draftId:draft.id,version:String(draft.version),confirmed:"yes"}} variant="primary" label="Apply reviewed SOP" title="Apply this SOP to the paused automation?" body="The saved draft replaces this automation's BOT instructions. The schedule remains paused. Review the compiled instructions below before confirming." confirmLabel="Apply SOP"/>}
      <Link className="btn btn-outline" href={`/ops/bots/${job.botId}`}>Open assigned BOT</Link>
    </div>{draft && draft.sourceVersion !== job.version && <p className="oc-note">The schedule configuration changed. Review the procedure and save a fresh draft before applying it.</p>}</div>
    <Panel title="Procedure builder" sub={draft ? `Saved draft · revision ${draft.version}` : "Draft workspace"}>
      <PlaybookEditor key={`${draft?.version ?? 0}-${job.version}`} kind="automation" targetId={id} title={job.name} sourceVersion={job.version} draft={draft} initialSteps={[{id:"current",kind:"analyze",title:"Current BOT instructions",instruction:job.prompt}]} />
    </Panel>
    <details className="pf-disclosure mt-6"><summary>Currently configured instructions</summary><div className="body oc-preview">{job.prompt}</div></details>
  </>;
}
