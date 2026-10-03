import { notFound } from "next/navigation";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { can } from "@/server/auth/policy";
import { PageHead, Panel } from "@/components/platform/ui";
import { ActionForm, SubmitButton } from "@/components/platform/actions";
import { addDays, todayStr } from "@/server/billing/domain";
import { money } from "@/lib/platform/format";
import { createInvoiceAction } from "../../actions";

export const metadata = { title: "New invoice" };

export default async function NewInvoice({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const actor = await requireOperatorPage();
  const orgId = (await searchParams).client ?? "";
  const r = await repo();
  const org = orgId ? await r.get("organizations", orgId) : null;
  if (!org || !can(actor, "ops.billing.write", org.id)) notFound();
  const agreements = (await r.list("service_agreements", { orgId })).filter((a) => a.status !== "terminated");
  const ag = agreements[0];
  const today = todayStr();
  return (
    <>
      <PageHead title={`New invoice — ${org.name}`} crumbs={[{ href: "/ops/billing", label: "Billing" }, { href: `/ops/clients/${org.id}?tab=billing`, label: org.name }]}
        description="Creates a draft. Mark it sent once you have delivered it through your usual invoicing process." />
      <Panel>
        <ActionForm action={createInvoiceAction} hidden={{ orgId: org.id }} className="max-w-2xl">
          <label className="pf-label">Service agreement
            <select name="serviceAgreementId" className="field" defaultValue={ag?.id}>
              <option value="">None (custom invoice)</option>
              {agreements.map((a) => <option key={a.id} value={a.id}>{a.name} — {money(a.monthlyValueCents)}/mo</option>)}
            </select>
          </label>
          <div className="pf-form-row">
            <label className="pf-label">Issue date<input type="date" name="issueDate" className="field" defaultValue={today} /></label>
            <label className="pf-label">Due date <span className="hint">Defaults to the agreement&apos;s terms</span><input type="date" name="dueDate" className="field" defaultValue={addDays(today, ag?.paymentTermsDays ?? 5)} /></label>
          </div>
          <fieldset className="grid gap-1.5">
            <legend className="pf-label mb-1">From the agreement</legend>
            <label className="pf-check"><input type="checkbox" name="includeRecurring" defaultChecked={!!ag} /> Monthly fee {ag ? `(${money(ag.monthlyValueCents)})` : ""}</label>
            <label className="pf-check"><input type="checkbox" name="includeImplementationFee" /> Implementation fee {ag ? `(${money(ag.implementationFeeCents)})` : ""}</label>
            <label className="pf-check"><input type="checkbox" name="includeSetupFee" /> Setup fee {ag ? `(${money(ag.setupFeeCents)})` : ""}</label>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="pf-label mb-1">Additional line items <span className="hint">Custom development, usage, extra Bot deployments</span></legend>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-[1fr_140px] gap-2">
                <input name={`line${i}Desc`} className="field" placeholder="Description" aria-label={`Line ${i + 1} description`} />
                <input name={`line${i}Amount`} className="field" inputMode="decimal" placeholder="$0.00" aria-label={`Line ${i + 1} amount`} />
              </div>
            ))}
          </fieldset>
          <label className="pf-label">Notes printed on the invoice<textarea name="notes" className="field" rows={2} /></label>
          <div><SubmitButton>Create draft invoice</SubmitButton></div>
        </ActionForm>
      </Panel>
    </>
  );
}
