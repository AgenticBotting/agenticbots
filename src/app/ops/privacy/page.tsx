import { requireOperatorPage } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";
import { notFound } from "next/navigation";
import { repo } from "@/server/db";
import { PageHead, Panel } from "@/components/platform/ui";
import { ActionForm, SubmitButton } from "@/components/platform/actions";
import { decideCaseAction, recordCaseAction } from "./actions";
export const metadata = { title: "Privacy request desk" };
export default async function PrivacyDesk() {
  const actor = await requireOperatorPage();
  if (!can(actor, "ops.settings.manage")) notFound();
  const cases = await (await repo()).list("privacy_cases");
  return <>
    <PageHead title="Privacy request desk" description="Private to the owner. Record requests from the portal or email, verify authority, fulfill across relevant systems and record the outcome. Due dates are internal targets, not a substitute for applicable legal deadlines." />
    <Panel title="Record an email request">
      <ActionForm action={recordCaseAction} resetOnSuccess>
        <label className="pf-label">Reply email<input className="field" name="email" type="email" required /></label>
        <label className="pf-label">Type<select className="field" name="kind">{["access", "correct", "delete", "opt_out", "cancel"].map(k => <option key={k} value={k}>{k.replaceAll("_", " ")}</option>)}</select></label>
        <label className="pf-label">Minimal request summary<textarea className="field" name="details" maxLength={2000} rows={2} /></label>
        <SubmitButton>Record request</SubmitButton>
      </ActionForm>
    </Panel>
    <div className="pf-grid pf-grid-2 mt-6">{cases.map(p => <Panel key={p.id} title={`${p.kind.replaceAll("_", " ")} · ${p.status}`} sub={`Target ${p.dueAt.slice(0, 10)} · ${p.contactEmail}`}>
      <p>{p.details || "No additional details."}</p><p className="pf-small">Reference {p.id}</p>
      {p.resolution && <p className="mt-3">Latest evidence: {p.resolution}</p>}
      {["received", "verified"].includes(p.status) && <ActionForm action={decideCaseAction} hidden={{ id: p.id }}>
        <label className="pf-label">Decision<select className="field" name="status"><option value={p.status === "received" ? "verified" : "completed"}>{p.status === "received" ? "Identity / authority verified" : "Fulfillment completed"}</option><option value="declined">Decline with reason</option></select></label>
        <label className="pf-label">Evidence and response record<textarea name="resolution" className="field" minLength={15} maxLength={2000} required rows={3} /></label>
        <SubmitButton>Save decision</SubmitButton>
      </ActionForm>}
    </Panel>)}</div>
    {!cases.length && <p className="mt-6">No privacy or cancellation requests recorded.</p>}
  </>;
}
