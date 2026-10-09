import { ApprovalReviews } from "@/components/platform/approval-reviews";
import { PlaybookEditor } from "@/components/platform/playbook-editor";
import { ActionButton } from "@/components/platform/actions";
import { loadDraft } from "@/server/services/playbooks";
import { supportEvidence } from "@/server/services/support-planning";
import { compilePlaybook } from "@/lib/platform/playbooks";
import { prepareSupportAction } from "../../playbook-actions";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { can } from "@/server/auth/policy";
import { lookups } from "@/server/services/lookups";
import { PageHead, Panel, KV, When } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionForm, SubmitButton } from "@/components/platform/actions";
import { RunsTable } from "@/components/platform/lists";
import { NoteBox } from "@/components/platform/NoteBox";
import { REQUEST_STATUS_LABEL } from "@/server/views/client";
import * as A from "../../actions";

export const metadata = { title: "Request" };

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireOperatorPage();
  const { id } = await params;
  const r = await repo();
  const req = await r.get("requests", id);
  if (!req || !can(actor, "ops.view", req.orgId)) notFound();
  const L = await lookups(r, actor);
  const [org, bots, runs, approvals, notes] = await Promise.all([
    r.get("organizations", req.orgId), r.list("bots", { orgId: req.orgId, order: "asc" }), r.list("runs", { orgId: req.orgId }),
    r.list("approvals", { orgId: req.orgId }), r.list("operator_notes", { orgId: req.orgId, where: { targetType: "request", targetId: id } }),
  ]);
  const linkedRuns = runs.filter((x) => x.requestId === id || req.linkedRunIds.includes(x.id));
  const linkedApprovals = approvals.filter((a) => a.requestId === id || req.linkedApprovalIds.includes(a.id));
  const submitter = L.users.get(req.submittedBy);
  const {draft} = await loadDraft(r,actor,"support",id);
  const evidence = await supportEvidence(r,actor,id);
  const activeBots = bots.filter((b) => b.status !== "disabled");

  return (
    <>
      <PageHead title={req.title} crumbs={[{ href: "/ops/requests", label: "Requests" }, { href: `/ops/clients/${req.orgId}`, label: org?.name ?? "Client" }]}
        description={<span className="inline-flex gap-4 items-center"><Status value={req.status} label={REQUEST_STATUS_LABEL[req.status]} /> <span>Priority: {req.priority}</span></span>} />
      <Panel title="Support workbench" sub="Prepare a diagnosis → review the plan → authorize execution" className="mb-6">
        <p className="oc-note mb-4">Build a diagnostic brief from this client’s platform records. This preparation uses recorded evidence and an editable SOP template; it does not call a model or execute changes.</p>
        <details className="mb-4"><summary className="oc-note cursor-pointer">Inspect available evidence</summary><ul className="list-disc pl-5 mt-3 grid gap-2 oc-note">{evidence.facts.map((f,i)=><li key={i}>{f}</li>)}</ul></details>
        {draft ? <PlaybookEditor key={`${req.version}-${draft.version}`} kind="support" targetId={id} title={draft.title} sourceVersion={req.version} draft={draft}/> : <ActionButton action={prepareSupportAction} hidden={{requestId:id,version:"0"}} label="Prepare diagnostic plan" variant="primary"/>}
      </Panel>
      <div className="pf-grid pf-grid-main">
        <div className="pf-grid">
          <Panel title="What the client asked">
            <p className="whitespace-pre-wrap text-[14px]">{req.description || <span className="pf-muted">No details given.</span>}</p>
            <div className="pf-small pf-muted mt-3">Submitted by {submitter ?? "client"} · <When iso={req.submittedAt} /></div>
          </Panel>
          <Panel title="Start a Bot Run for this request" sub="The client sees progress as activity — never which Bot or person did the work.">
            <ActionForm action={A.requestRunAction} hidden={{ requestId: id, idempotencyKey: randomUUID() }}>
              <label className="pf-label">Bot<select name="botId" className="field">{activeBots.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
              <label className="pf-label">Task <span className="hint">Leave empty to send the request as written.</span><textarea name="task" className="field" rows={5} defaultValue={draft ? compilePlaybook(draft.title,draft.steps) : ""} maxLength={4000} /></label>
              <div><SubmitButton disabled={org?.status === "suspended"}>Start Bot Run</SubmitButton></div>
            </ActionForm>
          </Panel>
          <Panel title="Linked runs" flush><RunsTable runs={linkedRuns} names={{ orgs: L.orgs, bots: L.bots }} showClient={false} /></Panel>
          <Panel title="Linked approvals"><ApprovalReviews approvals={linkedApprovals} names={{ orgs: L.orgs, bots: L.bots }} showClient={false} allowActions /></Panel>
          <Panel title="Conversation with the client">
            <div className="grid gap-3 mb-4">
              {req.messages.length === 0 && <p className="pf-muted pf-small">No messages yet.</p>}
              {req.messages.map((m, i) => (
                <div key={i} className={m.fromAgenticBots ? "border-l-2 border-[var(--color-accent-500)] pl-3" : "border-l-2 border-[var(--border-strong)] pl-3"}>
                  <div className="text-[13.5px] whitespace-pre-wrap">{m.text}</div>
                  <div className="pf-small pf-muted">{m.byName} · <When iso={m.at} /></div>
                </div>
              ))}
            </div>
            <ActionForm action={A.requestMessageAction} hidden={{ requestId: id }} resetOnSuccess>
              <textarea name="text" className="field" rows={2} aria-label="Reply to client" placeholder="Reply as AgenticBots (the client sees this)" />
              <div><SubmitButton variant="outline">Send reply</SubmitButton></div>
            </ActionForm>
          </Panel>
        </div>
        <div className="pf-grid">
          <Panel title="Routing">
            <ActionForm action={A.updateRequestAction} hidden={{ requestId: id }}>
              <label className="pf-label">Status
                <select name="status" className="field" defaultValue={req.status}>
                  {Object.entries(REQUEST_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="pf-label">Assigned operator
                <select name="assignedOperatorId" className="field" defaultValue={req.assignedOperatorId ?? ""}>
                  <option value="">Unassigned</option>
                  {L.operators.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>
              <fieldset className="grid gap-1">
                <legend className="pf-label mb-1">Assigned Bots</legend>
                {bots.map((b) => <label key={b.id} className="pf-check"><input type="checkbox" name="assignedBotIds" value={b.id} defaultChecked={req.assignedBotIds.includes(b.id)} /> {b.name}</label>)}
              </fieldset>
              <div><SubmitButton variant="outline">Save routing</SubmitButton></div>
            </ActionForm>
          </Panel>
          <Panel title="Ask the client a question">
            <ActionForm action={A.updateRequestAction} hidden={{ requestId: id }} resetOnSuccess>
              <textarea name="clarification" className="field" rows={2} aria-label="Clarification" placeholder="Moves the request to Waiting on client" />
              <div><SubmitButton variant="outline">Request clarification</SubmitButton></div>
            </ActionForm>
          </Panel>
          <Panel title="Deliverables" sub="Shown to the client on their request">
            <KV rows={req.deliverables.map((d) => [d.label, d.url ? <a key={d.label} className="underline" href={d.url}>{d.url}</a> : "—"])} />
            <ActionForm action={A.updateRequestAction} hidden={{ requestId: id }} resetOnSuccess className="mt-3">
              <input name="deliverableLabel" className="field" placeholder="Label, e.g. Prospect list (31 contacts)" aria-label="Deliverable label" />
              <input name="deliverableUrl" className="field" placeholder="https:// link (optional)" aria-label="Deliverable link" />
              <div><SubmitButton variant="outline">Attach result</SubmitButton></div>
            </ActionForm>
          </Panel>
          <Panel title="Internal notes" sub="Never shown to the client"><NoteBox orgId={req.orgId} targetType="request" targetId={id} notes={notes} /></Panel>
        </div>
      </div>
    </>
  );
}
