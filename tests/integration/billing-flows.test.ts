import { describe, it, expect, beforeEach } from "vitest";
import { world } from "../support/fixtures";
import * as billing from "@/server/billing/service";
import { suspendClient, reactivateClient } from "@/server/services/clients";
import { startRun } from "@/server/services/runs";
import { addDays, todayStr } from "@/server/billing/domain";

let w: Awaited<ReturnType<typeof world>>;
beforeEach(async () => {
  w = await world();
});

async function freshClient() {
  const { createClientOrg } = await import("@/server/services/accounts");
  const org = await createClientOrg(w.r, w.admin, { name: `Billing Test ${Math.random().toString(36).slice(2, 7)}` });
  return org;
}

describe("manual billing (no payment processor)", () => {
  it("agreement → invoice → partial ACH → full wire → paid, with audit + billing events", async () => {
    const org = await freshClient();
    const ag = await billing.createAgreement(w.r, w.operator, org.id, { name: "Managed Bots", monthlyValueCents: 750000, implementationFeeCents: 1200000, startDate: todayStr(), preferredPaymentMethod: "ach" });
    expect(ag).toMatchObject({ status: "active", autoSuspendEnabled: false, autoReactivateOnPayment: false, gracePeriodDays: 7 });
    const inv = await billing.createInvoice(w.r, w.operator, org.id, { serviceAgreementId: ag.id, includeRecurring: true, includeImplementationFee: true });
    expect(inv.totalCents).toBe(1950000);
    expect(inv.status).toBe("draft");
    await billing.markInvoiceSent(w.r, w.operator, inv.id);

    const p1 = await billing.recordPayment(w.r, w.operator, { invoiceId: inv.id, amountCents: 1200000, dateReceived: todayStr(), method: "ach", referenceNumber: "ACH-1" });
    expect(p1.invoice).toMatchObject({ amountPaidCents: 1200000, balanceDueCents: 750000, status: "partially_paid" });
    const p2 = await billing.recordPayment(w.r, w.operator, { invoiceId: inv.id, amountCents: 750000, dateReceived: todayStr(), method: "wire", referenceNumber: "FED-2" });
    expect(p2.invoice).toMatchObject({ balanceDueCents: 0, status: "paid" });

    const events = (await w.r.list("billing_events", { orgId: org.id })).map((e) => e.type);
    expect(events).toEqual(expect.arrayContaining(["agreement_created", "invoice_created", "invoice_sent", "payment_recorded"]));
    const audits = (await w.r.list("audit_logs", { orgId: org.id })).map((a) => a.action);
    expect(audits).toEqual(expect.arrayContaining(["billing.agreement.create", "billing.invoice.create", "billing.payment.record"]));
  });

  it("refuses overpayment, future dates and payments on drafts", async () => {
    const org = await freshClient();
    const inv = await billing.createInvoice(w.r, w.operator, org.id, { lineItems: [{ description: "Setup", quantity: 1, unitCents: 50000, kind: "custom" }] });
    await expect(billing.recordPayment(w.r, w.operator, { invoiceId: inv.id, amountCents: 50000, dateReceived: todayStr(), method: "ach" })).rejects.toThrow(/draft/);
    await billing.markInvoiceSent(w.r, w.operator, inv.id);
    await expect(billing.recordPayment(w.r, w.operator, { invoiceId: inv.id, amountCents: 50001, dateReceived: todayStr(), method: "ach" })).rejects.toThrow(/more than/);
    await expect(billing.recordPayment(w.r, w.operator, { invoiceId: inv.id, amountCents: 100, dateReceived: addDays(todayStr(), 3), method: "ach" })).rejects.toThrow(/future/);
  });

  it("corrections reverse, never delete", async () => {
    const org = await freshClient();
    const inv = await billing.createInvoice(w.r, w.operator, org.id, { lineItems: [{ description: "Setup", quantity: 1, unitCents: 50000, kind: "custom" }] });
    await billing.markInvoiceSent(w.r, w.operator, inv.id);
    const { payment } = await billing.recordPayment(w.r, w.operator, { invoiceId: inv.id, amountCents: 50000, dateReceived: todayStr(), method: "check", referenceNumber: "1042" });
    await billing.reversePayment(w.r, w.operator, payment.id, "Recorded against the wrong client");
    const payments = await w.r.list("payments", { orgId: org.id });
    expect(payments).toHaveLength(2);
    expect(payments.map((p) => p.amountCents).sort()).toEqual([-50000, 50000]);
    const after = await w.r.get("invoices", inv.id);
    expect(after).toMatchObject({ amountPaidCents: 0, balanceDueCents: 50000 });
    await expect(w.r.commit([{ type: "delete", table: "payments", id: payment.id }])).rejects.toThrow(/never deleted/);
  });

  it("past due → manual billing suspension → payment → eligible, NOT auto-reactivated → manual reactivation", async () => {
    const org = await freshClient();
    const r = w.r;
    // Make the org active with a deployed demo runtime and one Bot.
    const { provisionBot } = await import("@/server/services/bots");
    const { Tx } = await import("@/server/db/repository");
    const tx = new Tx(r);
    tx.patch("organizations", (await r.get("organizations", org.id))!, { status: "active" });
    await tx.commit();
    const bot = await provisionBot(r, w.operator, org.id, "seo");
    const ag = await billing.createAgreement(r, w.operator, org.id, { name: "Managed", monthlyValueCents: 500000, startDate: addDays(todayStr(), -40) });
    const inv = await billing.createInvoice(r, w.operator, org.id, { serviceAgreementId: ag.id, includeRecurring: true, issueDate: addDays(todayStr(), -30), dueDate: addDays(todayStr(), -25) });
    await billing.markInvoiceSent(r, w.operator, inv.id);
    await billing.runBillingTransitions(r);
    expect((await r.get("invoices", inv.id))!.status).toBe("past_due");
    expect((await r.get("organizations", org.id))!.status).toBe("past_due");
    // Past due alone never suspends.
    const events = (await r.list("billing_events", { orgId: org.id })).map((e) => e.type);
    expect(events).toContain("client_eligible_for_suspension");
    expect((await r.get("organizations", org.id))!.status).not.toBe("suspended");

    const s = await suspendClient(r, w.operator, org.id, "billing", "Called twice; agreed to suspend");
    expect(s.ok).toBe(true);
    expect((await r.get("organizations", org.id))!.status).toBe("suspended");
    await expect(startRun(r, w.operator, { botId: bot.id, task: "Do research", idempotencyKey: "blocked-0000001" })).rejects.toThrow(/paused/);

    const pay = await billing.recordPayment(r, w.operator, { invoiceId: inv.id, amountCents: 500000, dateReceived: todayStr(), method: "wire", referenceNumber: "FED-9" });
    expect(pay.eligibleForReactivation).toBe(true);
    expect(pay.autoReactivate).toBe(false);
    const orgAfter = (await r.get("organizations", org.id))!;
    expect(orgAfter.status).toBe("suspended"); // nothing restarts on its own
    expect(orgAfter.eligibleForReactivation).toBe(true);

    const re = await reactivateClient(r, w.operator, org.id);
    expect(re.ok).toBe(true);
    expect((await r.get("organizations", org.id))!.status).toBe("active");
    const audit = (await r.list("audit_logs", { orgId: org.id })).map((a) => a.action);
    expect(audit).toEqual(expect.arrayContaining(["client.suspend", "billing.payment.record", "client.reactivate"]));
    const bev = (await r.list("billing_events", { orgId: org.id })).map((e) => e.type);
    expect(bev).toEqual(expect.arrayContaining(["client_suspended_for_billing", "client_eligible_for_reactivation", "client_reactivated"]));
  });

  it("a manual hold blocks reactivation until cleared", async () => {
    const coastal = w.coastal;
    const { setHold } = await import("@/server/services/clients");
    await setHold(w.r, w.operator, coastal.id, "manual", true);
    await expect(reactivateClient(w.r, w.operator, coastal.id)).rejects.toThrow(/manual hold/);
    await setHold(w.r, w.operator, coastal.id, "manual", false);
    expect((await reactivateClient(w.r, w.operator, coastal.id)).ok).toBe(true);
  });

  it("billing writes require an operator", async () => {
    await expect(billing.createInvoice(w.r, w.owner, w.acme.id, { lineItems: [{ description: "x", quantity: 1, unitCents: 1, kind: "custom" }] })).rejects.toThrow(/not found|access/i);
    const inv = (await w.r.list("invoices", { orgId: w.acme.id })).find((i) => i.status !== "paid")!;
    await expect(billing.recordPayment(w.r, w.owner, { invoiceId: inv.id, amountCents: 100, dateReceived: todayStr(), method: "ach" })).rejects.toThrow(/not found/i);
  });
});
