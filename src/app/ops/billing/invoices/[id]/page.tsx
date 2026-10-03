import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOperatorPage } from "@/server/auth/guard";
import { repo } from "@/server/db";
import { can } from "@/server/auth/policy";
import { deriveInvoiceStatus, isOpen, todayStr, daysPastDue } from "@/server/billing/domain";
import { PageHead, Panel, KV, Table, Empty, Banner, When } from "@/components/platform/ui";
import { Status } from "@/components/platform/status";
import { ActionButton, ActionForm, ConfirmAction, SubmitButton } from "@/components/platform/actions";
import { NoteBox } from "@/components/platform/NoteBox";
import { money } from "@/lib/platform/format";
import * as A from "../../../actions";

export const metadata = { title: "Invoice" };

const METHOD_LABEL: Record<string, string> = { ach: "ACH", wire: "Wire", bank_transfer: "Bank transfer", check: "Check", other: "Other", stripe_optional: "Card (optional adapter)" };

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireOperatorPage();
  const { id } = await params;
  const r = await repo();
  const raw = await r.get("invoices", id);
  if (!raw || !can(actor, "ops.billing.read", raw.orgId)) notFound();
  const inv = { ...raw, status: deriveInvoiceStatus(raw) };
  const [org, payments, events, users, notes] = await Promise.all([
    r.get("organizations", inv.orgId), r.list("payments", { orgId: inv.orgId, where: { invoiceId: id }, order: "asc" }),
    r.list("billing_events", { orgId: inv.orgId, where: { invoiceId: id } }), r.list("users"),
    r.list("operator_notes", { orgId: inv.orgId, where: { targetType: "invoice", targetId: id } }),
  ]);
  const agreement = inv.serviceAgreementId ? await r.get("service_agreements", inv.serviceAgreementId) : null;
  const canWrite = can(actor, "ops.billing.write", inv.orgId);
  const name = (uid: string) => users.find((u) => u.id === uid)?.name ?? "system";
  const dpd = daysPastDue(inv);

  return (
    <>
      <PageHead title={`Invoice ${inv.invoiceNumber}`} crumbs={[{ href: "/ops/billing", label: "Billing" }, { href: `/ops/clients/${inv.orgId}?tab=billing`, label: org?.name ?? "Client" }]}
        description={<span className="inline-flex gap-4 items-center"><Status value={inv.status} /> <span>{money(inv.totalCents, { exact: true })} · balance <strong>{money(inv.balanceDueCents, { exact: true })}</strong></span></span>}
        actions={canWrite ? (
          <>
            {inv.status === "draft" && <ActionButton action={A.sendInvoiceAction} hidden={{ invoiceId: id }} label="Mark as sent" variant="primary" />}
            {isOpen(inv.status) && inv.status !== "past_due" && <ActionButton action={A.markPastDueAction} hidden={{ invoiceId: id }} label="Mark past due" />}
            {inv.amountPaidCents === 0 && inv.status !== "void" && (
              <ConfirmAction action={A.voidInvoiceAction} hidden={{ invoiceId: id }} label="Void" title="Void this invoice?" body="The invoice stays in the history with status Void and a zero balance." fields={<label className="pf-label">Reason<input name="reason" className="field" required /></label>} confirmLabel="Void invoice" />
            )}
          </>
        ) : null}
      />
      {org?.eligibleForReactivation && <Banner tone="good" action={<Link className="btn btn-primary" href={`/ops/clients/${inv.orgId}`}>Go to client</Link>}><strong>PAYMENT RECEIVED — CLIENT ELIGIBLE FOR REACTIVATION.</strong> Reactivation is your decision.</Banner>}
      {dpd > 0 && <Banner tone="bad"><strong>{dpd} days past due.</strong> Grace period: {agreement?.gracePeriodDays ?? 7} days. {dpd > (agreement?.gracePeriodDays ?? 7) ? "The client is eligible for suspension — the decision is yours." : "Still inside the grace period."}</Banner>}

      <div className="pf-grid pf-grid-main">
        <div className="pf-grid">
          <Panel title="Line items" flush>
            <Table head={["Description", "Qty", "Amount"]}>
              {inv.lineItems.map((l, i) => <tr key={i}><td>{l.description}<div className="pf-small pf-muted">{l.kind}</div></td><td>{l.quantity}</td><td className="num">{money(l.unitCents * l.quantity, { exact: true })}</td></tr>)}
              <tr><td colSpan={2}>Subtotal</td><td className="num">{money(inv.subtotalCents, { exact: true })}</td></tr>
              <tr><td colSpan={2}>Tax</td><td className="num">{money(inv.taxCents, { exact: true })}</td></tr>
              <tr><td colSpan={2}><strong>Total</strong></td><td className="num"><strong>{money(inv.totalCents, { exact: true })}</strong></td></tr>
              <tr><td colSpan={2}>Paid</td><td className="num">{money(inv.amountPaidCents, { exact: true })}</td></tr>
              <tr><td colSpan={2}><strong>Balance due</strong></td><td className="num"><strong>{money(inv.balanceDueCents, { exact: true })}</strong></td></tr>
            </Table>
          </Panel>
          <Panel title="Payments" flush sub="Corrections are recorded as reversals — financial history is never deleted.">
            <Table head={["Received", "Method", "Reference", "Amount", "Recorded by", ""]} empty={<Empty title="No payments recorded" />}>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.dateReceived}</td>
                  <td>{METHOD_LABEL[p.method]}<div className="pf-small pf-muted">{p.source.replace(/_/g, " ")}</div></td>
                  <td className="pf-mono">{p.referenceNumber ?? "—"}{p.operatorNotes && <div className="pf-small pf-muted" style={{ fontFamily: "inherit" }}>{p.operatorNotes}</div>}</td>
                  <td className="num" style={{ color: p.amountCents < 0 ? "var(--color-danger)" : undefined }}>{money(p.amountCents, { exact: true })}</td>
                  <td className="pf-small">{name(p.createdBy)} · <When iso={p.createdAt} /></td>
                  <td>{canWrite && p.amountCents > 0 && !p.reversedByPaymentId && (
                    <ConfirmAction action={A.reversePaymentAction} hidden={{ paymentId: p.id }} label="Reverse" title="Reverse this payment?" body="Adds a negative correction record and restores the invoice balance. The original record stays." fields={<label className="pf-label">Reason<input name="reason" className="field" required placeholder="Recorded against the wrong invoice" /></label>} confirmLabel="Reverse payment" />
                  )}{p.reversedByPaymentId && <span className="pf-small pf-muted">reversed</span>}</td>
                </tr>
              ))}
            </Table>
          </Panel>
          <Panel title="Billing events" flush>
            <Table head={["Event", "Amount", "By", "When"]} empty={<Empty title="No events" />}>
              {events.map((e) => <tr key={e.id}><td className="pf-mono">{e.type}</td><td className="num">{e.amountCents !== undefined ? money(e.amountCents) : "—"}</td><td className="pf-small">{name(e.actorId)}</td><td><When iso={e.createdAt} /></td></tr>)}
            </Table>
          </Panel>
        </div>
        <div className="pf-grid">
          {canWrite && isOpen(inv.status) && (
            <Panel title="Record payment" sub="Only after you have confirmed the funds arrived in the bank.">
              <ActionForm action={A.recordPaymentAction} hidden={{ invoiceId: id }} resetOnSuccess>
                <label className="pf-label">Amount received ($)<input name="amount" className="field" inputMode="decimal" required defaultValue={(inv.balanceDueCents / 100).toFixed(2)} /></label>
                <label className="pf-label">Date received<input type="date" name="dateReceived" className="field" required defaultValue={todayStr()} max={todayStr()} /></label>
                <label className="pf-label">Payment method
                  <select name="method" className="field" defaultValue={inv.preferredPaymentMethod}>
                    <option value="ach">ACH</option><option value="wire">Wire</option><option value="bank_transfer">Bank transfer</option><option value="check">Check</option><option value="other">Other</option>
                  </select>
                </label>
                <label className="pf-label">Reference / confirmation number <span className="hint">ACH trace, wire reference (IMAD/Fed ref) or check number</span><input name="referenceNumber" className="field pf-mono" maxLength={64} /></label>
                <label className="pf-label">Operator notes<textarea name="operatorNotes" className="field" rows={2} /></label>
                <p className="pf-small pf-muted">Never enter bank logins or account numbers here.</p>
                <div><SubmitButton>Record payment</SubmitButton></div>
              </ActionForm>
            </Panel>
          )}
          <Panel title="Invoice">
            <KV rows={[
              ["Client", org?.name], ["Agreement", agreement?.name ?? "Custom"], ["Issued", inv.issueDate], ["Due", inv.dueDate],
              ["Sent", inv.sentAt ? <When key="s" iso={inv.sentAt} /> : "Not yet"], ["Preferred payment", METHOD_LABEL[inv.preferredPaymentMethod]],
              ["Accounting system ID", inv.externalAccountingId ?? "—"], ["Created by", name(inv.createdBy)], ["Notes", inv.notes ?? "—"],
            ]} />
          </Panel>
          <Panel title="Internal notes"><NoteBox orgId={inv.orgId} targetType="invoice" targetId={id} notes={notes} /></Panel>
        </div>
      </div>
    </>
  );
}
