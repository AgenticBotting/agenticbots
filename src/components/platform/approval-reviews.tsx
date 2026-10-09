import Link from "next/link";
import type { Approval, Bot } from "@/lib/platform/types";
import { ConfirmAction } from "./actions";
import { When, Empty } from "./ui";
import { Status } from "./status";
import { resolveApprovalAction } from "@/app/ops/actions";
import { approvalDisplayStatus } from "@/lib/platform/approval-status";

export function ApprovalReviews({ approvals, names, showClient = true, allowActions = false }: { approvals: Approval[]; names: { orgs?: Map<string,string>; bots?: Map<string,Bot> }; showClient?: boolean; allowActions?: boolean }) {
  if(!approvals.length) return <Empty title="No approvals in this view">New decisions appear here with the proposed action and supporting context.</Empty>;
  return <div className="pf-grid">{approvals.map(a=>{
    const status=approvalDisplayStatus(a);
    return <details className="oc-review" key={a.id} id={`approval-${a.id}`}>
      <summary><div><span className="pf-small pf-muted">{showClient ? `${names.orgs?.get(a.orgId) ?? "Client"} · ` : ""}{a.category.replaceAll("_"," ")} · {a.risk} risk</span><h2>{a.title}</h2><span className="oc-note">{names.bots?.get(a.botId)?.name} · Requested <When iso={a.requestedAt}/></span></div><div className="grid gap-2"><Status value={status}/><span className="pf-small">Review details ↓</span></div></summary>
      <div className="body">
        <div className="pf-grid pf-grid-2"><div><h3>Why this is proposed</h3><p>{a.explanation || "No explanation provided."}</p></div><div><h3>Expected effect</h3><p>{a.expectedImpact || "No impact assessment provided."}</p></div></div>
        <div><h3>Proposed work</h3><div className="oc-preview">{a.preview || "No work preview was attached. Request supporting details before approving."}</div></div>
        <div className="oc-steps"><div><span className="n">01 · Prepared</span><strong>BOT proposal</strong><p>Review the work and its scope.</p></div><div><span className="n">02 · Decision</span><strong>{a.audience === "client" ? "Client approval" : "Operator approval"}</strong><p>{a.audience === "client" ? "An operator may decide on the client's behalf." : "An internal operational decision."}</p></div><div><span className="n">03 · After approval</span><strong>{a.kind === "runtime" ? "Resume BOT RUN" : "Start execution run"}</strong><p>{a.kind === "runtime" ? "The waiting run may continue with this approved action." : "A new BOT RUN carries out the prepared action."}</p></div></div>
        <div className="oc-note">{a.expiresAt ? <>Decision expires <When iso={a.expiresAt}/>.</> : "No expiry was recorded."} {a.runId && <Link className="underline ml-2" href={`/ops/runs/${a.runId}`}>Inspect source run</Link>} {a.requestId && <Link className="underline ml-2" href={`/ops/requests/${a.requestId}`}>Open client request</Link>}</div>
        {allowActions && status==="pending" && <div className="oc-links">
          <ConfirmAction action={resolveApprovalAction} hidden={{approvalId:a.id,decision:"approve"}} label={a.audience==="client" ? "Approve for client":"Approve action"} variant="primary" title="Authorize this proposed action?" body={<><p>{a.title}</p><p className="mt-3">{a.expectedImpact}</p><p className="mt-3">This decision can release execution. Confirm only after reviewing the proposal above.</p></>} confirmLabel="Approve and release"/>
          <ConfirmAction action={resolveApprovalAction} hidden={{approvalId:a.id,decision:"deny"}} label="Decline" variant="outline" title="Decline this proposal?" body="The proposed action will not be released. This decision is recorded in the audit history." confirmLabel="Decline proposal"/>
        </div>}
        {status==="expired" && <p className="oc-note">This proposal expired. A fresh proposal is needed before execution.</p>}
        {a.resolutionNote && <p className="oc-note">Decision note: {a.resolutionNote}</p>}
      </div>
    </details>;
  })}</div>;
}
