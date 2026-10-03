import "server-only";
import type { Invoice, Payment, PaymentMethod, ServiceAgreement } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { correlationId as newCorrelationId, nowIso } from "@/server/ids";
import { billingDefaults } from "@/server/env";
import { conflict, invalid, notFound } from "@/server/errors";
import { redactSecrets } from "@/server/redact";
import { audit, getOrgFor, getScoped, SYSTEM } from "@/server/services/common";
import { raiseIncident } from "@/server/services/incidents";
import type { BillingProvider } from "./provider";
import { ManualBillingProvider } from "./providers/manual";
import {
  addDays,
  autoReactivationAllowed,
  clientBillingStatus,
  deriveInvoiceStatus,
  formatUsd,
  isOpen,
  suspensionEligibility,
  todayStr,
  totals,
} from "./domain";

export const PAYMENT_METHODS: PaymentMethod[] = ["ach", "wire", "bank_transfer", "check", "other", "stripe_optional"];
const SOURCE_FOR: Record<PaymentMethod, Payment["source"]> = {
  ach: "ach_received",
  wire: "wire_received",
  bank_transfer: "bank_transfer_received",
  check: "check_received",
  other: "other",
  stripe_optional: "other",
};

let provider: BillingProvider = new ManualBillingProvider();
export const billingProvider = () => provider;
/** Swap in a future adapter (tests use this too). */
export function setBillingProvider(p: BillingProvider) {
  provider = p;
}

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const cents = (n: number, what: string) => {
  if (!Number.isInteger(n) || n < 0 || n > 100_000_000_00) throw invalid(`${what} must be a positive dollar amount.`);
  return n;
};

/* ───────────────────────── Service agreements ───────────────────────── */

export interface AgreementInput {
  name: string;
  monthlyValueCents: number;
  implementationFeeCents?: number;
  setupFeeCents?: number;
  billingFrequency?: ServiceAgreement["billingFrequency"];
  paymentTermsDays?: number;
  preferredPaymentMethod?: PaymentMethod;
  startDate: string;
  renewalDate?: string;
  endDate?: string;
  gracePeriodDays?: number;
  autoSuspendEnabled?: boolean;
  autoReactivateOnPayment?: boolean;
  notes?: string;
  status?: ServiceAgreement["status"];
}

export async function createAgreement(r: Repository, actor: Actor, orgId: string, input: AgreementInput): Promise<ServiceAgreement> {
  await getOrgFor(r, orgId, actor, "ops.billing.write");
  if (!input.name.trim()) throw invalid("Name the agreement.");
  if (!isDate(input.startDate)) throw invalid("Start date must be YYYY-MM-DD.");
  if (input.endDate && !isDate(input.endDate)) throw invalid("End date must be YYYY-MM-DD.");
  const method = input.preferredPaymentMethod ?? "ach";
  if (!PAYMENT_METHODS.includes(method)) throw invalid("Unknown payment method.");
  const correlationId = newCorrelationId();
  const tx = new Tx(r);
  const a = tx.insert("service_agreements", {
    orgId,
    name: input.name.trim(),
    monthlyValueCents: cents(input.monthlyValueCents, "Monthly value"),
    implementationFeeCents: cents(input.implementationFeeCents ?? 0, "Implementation fee"),
    setupFeeCents: cents(input.setupFeeCents ?? 0, "Setup fee"),
    billingFrequency: input.billingFrequency ?? "monthly",
    paymentTermsDays: Math.max(0, Math.min(120, input.paymentTermsDays ?? billingDefaults.paymentTermsDays)),
    preferredPaymentMethod: method,
    startDate: input.startDate,
    renewalDate: input.renewalDate,
    endDate: input.endDate,
    status: input.status ?? "active",
    gracePeriodDays: Math.max(0, Math.min(90, input.gracePeriodDays ?? billingDefaults.graceDays)),
    // Both default OFF for early production: AgenticBots calls a
    // $7,500/month client before anything is switched off.
    autoSuspendEnabled: input.autoSuspendEnabled ?? billingDefaults.autoSuspend,
    autoReactivateOnPayment: input.autoReactivateOnPayment ?? billingDefaults.autoReactivate,
    notes: input.notes ? redactSecrets(input.notes, 2000) : undefined,
    createdBy: actor.user.id,
  });
  tx.insert("billing_events", { orgId, type: "agreement_created", actorId: actor.user.id, amountCents: a.monthlyValueCents, correlationId, reference: a.name });
  audit(tx, actor, { action: "billing.agreement.create", orgId, targetType: "service_agreement", targetId: a.id, correlationId, detail: `${a.name} ${formatUsd(a.monthlyValueCents)}/mo` });
  await tx.commit();
  return a;
}

export async function updateAgreement(r: Repository, actor: Actor, agreementId: string, input: Partial<AgreementInput>): Promise<ServiceAgreement> {
  const a = await getScoped(r, "service_agreements", agreementId, actor, "ops.billing.write");
  const patch: Partial<ServiceAgreement> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.monthlyValueCents !== undefined) patch.monthlyValueCents = cents(input.monthlyValueCents, "Monthly value");
  if (input.implementationFeeCents !== undefined) patch.implementationFeeCents = cents(input.implementationFeeCents, "Implementation fee");
  if (input.setupFeeCents !== undefined) patch.setupFeeCents = cents(input.setupFeeCents, "Setup fee");
  if (input.billingFrequency) patch.billingFrequency = input.billingFrequency;
  if (input.paymentTermsDays !== undefined) patch.paymentTermsDays = Math.max(0, Math.min(120, input.paymentTermsDays));
  if (input.preferredPaymentMethod) {
    if (!PAYMENT_METHODS.includes(input.preferredPaymentMethod)) throw invalid("Unknown payment method.");
    patch.preferredPaymentMethod = input.preferredPaymentMethod;
  }
  if (input.gracePeriodDays !== undefined) patch.gracePeriodDays = Math.max(0, Math.min(90, input.gracePeriodDays));
  if (input.autoSuspendEnabled !== undefined) patch.autoSuspendEnabled = input.autoSuspendEnabled;
  if (input.autoReactivateOnPayment !== undefined) patch.autoReactivateOnPayment = input.autoReactivateOnPayment;
  if (input.status) patch.status = input.status;
  if (input.endDate !== undefined) patch.endDate = input.endDate || undefined;
  if (input.renewalDate !== undefined) patch.renewalDate = input.renewalDate || undefined;
  if (input.notes !== undefined) patch.notes = redactSecrets(input.notes, 2000);
  const correlationId = newCorrelationId();
  const tx = new Tx(r);
  const next = tx.patch("service_agreements", a, patch);
  tx.insert("billing_events", { orgId: a.orgId, type: "agreement_updated", actorId: actor.user.id, correlationId, detail: Object.keys(patch).join(", ") });
  audit(tx, actor, { action: "billing.agreement.update", orgId: a.orgId, targetType: "service_agreement", targetId: a.id, correlationId, detail: Object.keys(patch).join(", ") });
  await tx.commit();
  return next;
}

/* ───────────────────────────── Invoices ───────────────────────────── */

async function nextInvoiceNumber(r: Repository, issueDate: string): Promise<string> {
  const year = issueDate.slice(0, 4);
  const existing = (await r.list("invoices")).filter((i) => i.invoiceNumber.startsWith(`AB-${year}-`));
  const max = existing.reduce((m, i) => Math.max(m, Number.parseInt(i.invoiceNumber.split("-")[2] ?? "0", 10) || 0), 0);
  return `AB-${year}-${String(max + 1).padStart(4, "0")}`;
}

export interface InvoiceInput {
  serviceAgreementId?: string;
  issueDate?: string;
  dueDate?: string;
  lineItems?: Invoice["lineItems"];
  taxCents?: number;
  notes?: string;
  /** Add the agreement's monthly fee as a line item. */
  includeRecurring?: boolean;
  includeImplementationFee?: boolean;
  includeSetupFee?: boolean;
}

export async function createInvoice(r: Repository, actor: Actor, orgId: string, input: InvoiceInput): Promise<Invoice> {
  await getOrgFor(r, orgId, actor, "ops.billing.write");
  let agreement: ServiceAgreement | undefined;
  if (input.serviceAgreementId) {
    const a = await r.get("service_agreements", input.serviceAgreementId);
    if (!a || a.orgId !== orgId) throw notFound("Service agreement");
    agreement = a;
  }
  const issueDate = input.issueDate ?? todayStr();
  if (!isDate(issueDate)) throw invalid("Issue date must be YYYY-MM-DD.");
  const dueDate = input.dueDate ?? addDays(issueDate, agreement?.paymentTermsDays ?? billingDefaults.paymentTermsDays);
  if (!isDate(dueDate) || dueDate < issueDate) throw invalid("Due date must be on or after the issue date.");

  const items: Invoice["lineItems"] = [...(input.lineItems ?? [])];
  if (agreement && input.includeRecurring) {
    const period = new Date(`${issueDate}T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    items.unshift({ description: `${agreement.name} — ${period}`, quantity: 1, unitCents: agreement.monthlyValueCents, kind: "recurring" });
  }
  if (agreement && input.includeImplementationFee && agreement.implementationFeeCents > 0) {
    items.push({ description: "Implementation fee", quantity: 1, unitCents: agreement.implementationFeeCents, kind: "implementation" });
  }
  if (agreement && input.includeSetupFee && agreement.setupFeeCents > 0) {
    items.push({ description: "Setup fee", quantity: 1, unitCents: agreement.setupFeeCents, kind: "setup" });
  }
  if (items.length === 0) throw invalid("Add at least one line item.");
  for (const li of items) {
    if (!li.description.trim()) throw invalid("Every line item needs a description.");
    if (!(li.quantity > 0) || !Number.isInteger(li.unitCents) || li.unitCents < 0) throw invalid("Line items need a positive quantity and amount.");
  }
  const t = totals(items, cents(input.taxCents ?? 0, "Tax"));
  if (t.totalCents <= 0) throw invalid("Invoice total must be more than $0.");

  const correlationId = newCorrelationId();
  const tx = new Tx(r);
  const inv = tx.insert("invoices", {
    orgId,
    invoiceNumber: await nextInvoiceNumber(r, issueDate),
    serviceAgreementId: agreement?.id,
    issueDate,
    dueDate,
    currency: "USD",
    lineItems: items,
    ...t,
    amountPaidCents: 0,
    balanceDueCents: t.totalCents,
    status: "draft",
    notes: input.notes ? redactSecrets(input.notes, 2000) : undefined,
    preferredPaymentMethod: agreement?.preferredPaymentMethod ?? "ach",
    createdBy: actor.user.id,
  });
  tx.insert("billing_events", { orgId, type: "invoice_created", actorId: actor.user.id, invoiceId: inv.id, amountCents: inv.totalCents, correlationId, reference: inv.invoiceNumber });
  audit(tx, actor, { action: "billing.invoice.create", orgId, targetType: "invoice", targetId: inv.id, correlationId, detail: `${inv.invoiceNumber} ${formatUsd(inv.totalCents)}` });
  await tx.commit();
  return inv;
}

export async function markInvoiceSent(r: Repository, actor: Actor, invoiceId: string): Promise<{ invoice: Invoice; note: string }> {
  const inv = await getScoped(r, "invoices", invoiceId, actor, "ops.billing.write");
  if (inv.status !== "draft") throw conflict("Only draft invoices can be sent.");
  const delivery = await billingProvider().deliverInvoice(inv);
  const external = await billingProvider().pushInvoice(inv);
  const correlationId = newCorrelationId();
  const tx = new Tx(r);
  const sentAt = nowIso();
  const next = tx.patch("invoices", inv, {
    sentAt,
    status: deriveInvoiceStatus({ ...inv, status: "sent", sentAt }),
    externalAccountingId: external?.externalId ?? inv.externalAccountingId,
  });
  tx.insert("billing_events", { orgId: inv.orgId, type: "invoice_sent", actorId: actor.user.id, invoiceId: inv.id, amountCents: inv.totalCents, correlationId, reference: inv.invoiceNumber });
  audit(tx, actor, { action: "billing.invoice.send", orgId: inv.orgId, targetType: "invoice", targetId: inv.id, correlationId });
  await tx.commit();
  return { invoice: next, note: delivery.note };
}

export async function voidInvoice(r: Repository, actor: Actor, invoiceId: string, reason: string): Promise<Invoice> {
  const inv = await getScoped(r, "invoices", invoiceId, actor, "ops.billing.write");
  if (inv.amountPaidCents > 0) throw conflict("This invoice has payments. Reverse them first, then void.");
  if (inv.status === "void") return inv;
  if (!reason.trim()) throw invalid("Give a reason for voiding.");
  const correlationId = newCorrelationId();
  const tx = new Tx(r);
  const next = tx.patch("invoices", inv, { status: "void", balanceDueCents: 0, notes: `${inv.notes ? `${inv.notes}\n` : ""}Voided: ${redactSecrets(reason, 300)}` });
  tx.insert("billing_events", { orgId: inv.orgId, type: "invoice_voided", actorId: actor.user.id, invoiceId: inv.id, correlationId, detail: reason });
  audit(tx, actor, { action: "billing.invoice.void", orgId: inv.orgId, targetType: "invoice", targetId: inv.id, correlationId, detail: reason });
  await tx.commit();
  return next;
}

/** Operator can mark an invoice past due explicitly (e.g. terms agreed verbally). */
export async function markPastDue(r: Repository, actor: Actor, invoiceId: string): Promise<Invoice> {
  const inv = await getScoped(r, "invoices", invoiceId, actor, "ops.billing.write");
  if (!isOpen(inv.status)) throw conflict("Only open invoices can be marked past due.");
  const correlationId = newCorrelationId();
  const tx = new Tx(r);
  const next = tx.patch("invoices", inv, { status: "past_due" });
  tx.insert("billing_events", { orgId: inv.orgId, type: "invoice_past_due", actorId: actor.user.id, invoiceId: inv.id, amountCents: inv.balanceDueCents, correlationId, reference: inv.invoiceNumber });
  audit(tx, actor, { action: "billing.invoice.past_due", orgId: inv.orgId, targetType: "invoice", targetId: inv.id, correlationId });
  await tx.commit();
  await syncAccountStanding(r, inv.orgId, actor.user.id);
  return next;
}

/* ───────────────────────────── Payments ───────────────────────────── */

export interface RecordPaymentInput {
  invoiceId: string;
  amountCents: number;
  dateReceived: string;
  method: PaymentMethod;
  referenceNumber?: string;
  operatorNotes?: string;
}

export interface RecordPaymentResult {
  payment: Payment;
  invoice: Invoice;
  eligibleForReactivation: boolean;
  autoReactivate: boolean;
}

/**
 * Record a payment an operator has confirmed arrived (ACH, wire, check…).
 * Creates the payment, updates the invoice's paid amount, balance and
 * status, updates the account standing, and writes billing + audit
 * events — in one atomic commit. Never stores banking credentials.
 */
export async function recordPayment(r: Repository, actor: Actor, input: RecordPaymentInput): Promise<RecordPaymentResult> {
  const inv = await getScoped(r, "invoices", input.invoiceId, actor, "ops.billing.write");
  if (inv.status === "void" || inv.status === "written_off" || inv.status === "draft") {
    throw conflict(`Payments cannot be recorded against a ${inv.status.replace("_", " ")} invoice.`);
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) throw invalid("Enter the amount received.");
  if (input.amountCents > inv.balanceDueCents) {
    throw invalid(`That is more than the ${formatUsd(inv.balanceDueCents)} balance. Record the invoice balance and note the overpayment.`);
  }
  if (!isDate(input.dateReceived)) throw invalid("Date received must be YYYY-MM-DD.");
  if (input.dateReceived > todayStr()) throw invalid("Date received cannot be in the future.");
  if (!PAYMENT_METHODS.includes(input.method)) throw invalid("Unknown payment method.");
  const reference = input.referenceNumber?.trim();
  if (reference && !/^[A-Za-z0-9 #._\-/]{1,64}$/.test(reference)) throw invalid("Reference can only contain letters, numbers and - _ . / #");

  const correlationId = newCorrelationId();
  const tx = new Tx(r);
  const payment = tx.insert("payments", {
    orgId: inv.orgId,
    invoiceId: inv.id,
    amountCents: input.amountCents,
    dateReceived: input.dateReceived,
    method: input.method,
    source: SOURCE_FOR[input.method],
    referenceNumber: reference,
    operatorNotes: input.operatorNotes ? redactSecrets(input.operatorNotes, 1000) : undefined,
    createdBy: actor.user.id,
  });
  const amountPaidCents = inv.amountPaidCents + input.amountCents;
  const invoice = tx.patch("invoices", inv, {
    amountPaidCents,
    balanceDueCents: inv.totalCents - amountPaidCents,
    status: deriveInvoiceStatus({ ...inv, amountPaidCents }),
  });
  tx.insert("billing_events", {
    orgId: inv.orgId, type: "payment_recorded", actorId: actor.user.id, invoiceId: inv.id, paymentId: payment.id,
    amountCents: input.amountCents, reference, correlationId,
  });
  audit(tx, actor, {
    action: "billing.payment.record",
    orgId: inv.orgId,
    targetType: "payment",
    targetId: payment.id,
    correlationId,
    detail: `${formatUsd(input.amountCents)} ${input.method} on ${inv.invoiceNumber}`,
  });
  await tx.commit();

  const standing = await syncAccountStanding(r, inv.orgId, actor.user.id);
  return { payment, invoice, ...standing };
}

/**
 * Correct a mistaken payment without deleting history: a reversal is a new
 * negative payment that points at the original; the invoice is recomputed.
 */
export async function reversePayment(r: Repository, actor: Actor, paymentId: string, reason: string): Promise<Payment> {
  const p = await getScoped(r, "payments", paymentId, actor, "ops.billing.write");
  if (p.reversesPaymentId) throw conflict("A reversal cannot itself be reversed. Record a new payment instead.");
  if (p.reversedByPaymentId) throw conflict("This payment was already reversed.");
  if (!reason.trim()) throw invalid("Give a reason for the correction.");
  const inv = await r.get("invoices", p.invoiceId);
  if (!inv) throw notFound("Invoice");
  const correlationId = newCorrelationId();
  const tx = new Tx(r);
  const reversal = tx.insert("payments", {
    orgId: p.orgId,
    invoiceId: p.invoiceId,
    amountCents: -p.amountCents,
    dateReceived: todayStr(),
    method: p.method,
    source: "manual_adjustment",
    referenceNumber: p.referenceNumber ? `REV ${p.referenceNumber}`.slice(0, 64) : undefined,
    operatorNotes: `Reversal: ${redactSecrets(reason, 500)}`,
    reversesPaymentId: p.id,
    createdBy: actor.user.id,
  });
  tx.patch("payments", p, { reversedByPaymentId: reversal.id });
  const amountPaidCents = inv.amountPaidCents - p.amountCents;
  tx.patch("invoices", inv, {
    amountPaidCents,
    balanceDueCents: inv.totalCents - amountPaidCents,
    status: deriveInvoiceStatus({ ...inv, amountPaidCents }),
  });
  tx.insert("billing_events", { orgId: p.orgId, type: "payment_reversed", actorId: actor.user.id, invoiceId: inv.id, paymentId: p.id, amountCents: -p.amountCents, correlationId, detail: reason });
  audit(tx, actor, { action: "billing.payment.reverse", orgId: p.orgId, targetType: "payment", targetId: p.id, correlationId, detail: reason });
  await tx.commit();
  await syncAccountStanding(r, p.orgId, actor.user.id);
  return reversal;
}

/**
 * Recompute an organization's billing standing after any financial change.
 * Moves agreement past_due ↔ active and, if the client was suspended FOR
 * BILLING and is now in good standing, marks it eligible for reactivation —
 * without restarting anything. "PAYMENT RECEIVED — CLIENT ELIGIBLE FOR
 * REACTIVATION" is shown to the operator, who decides.
 */
export async function syncAccountStanding(
  r: Repository,
  orgId: string,
  actorId: string,
): Promise<{ eligibleForReactivation: boolean; autoReactivate: boolean }> {
  const [org, invoices, agreements] = await Promise.all([
    r.get("organizations", orgId),
    r.list("invoices", { orgId }),
    r.list("service_agreements", { orgId }),
  ]);
  if (!org) return { eligibleForReactivation: false, autoReactivate: false };
  const status = clientBillingStatus(invoices);
  const agreement = agreements.find((a) => a.status === "active" || a.status === "past_due" || a.status === "suspended");
  const correlationId = newCorrelationId();
  const tx = new Tx(r);

  if (agreement) {
    const want = status === "past_due" ? "past_due" : agreement.status === "past_due" ? "active" : agreement.status;
    if (want !== agreement.status && agreement.status !== "suspended") tx.patch("service_agreements", agreement, { status: want });
  }
  // Organization status: past_due is a visible flag only — it never blocks execution.
  if (org.status === "active" && status === "past_due") tx.patch("organizations", org, { status: "past_due" });
  if (org.status === "past_due" && status !== "past_due") tx.patch("organizations", org, { status: "active" });

  let eligible = false;
  let auto = false;
  if (org.status === "suspended" && org.suspension?.reason === "billing" && status !== "past_due") {
    eligible = true;
    auto = autoReactivationAllowed({ agreement, suspensionReason: org.suspension.reason, holds: org.holds, invoices });
    if (!org.eligibleForReactivation) {
      tx.patch("organizations", org, { eligibleForReactivation: true });
      tx.insert("billing_events", { orgId, type: "client_eligible_for_reactivation", actorId, correlationId });
    }
  }
  await tx.commit();
  return { eligibleForReactivation: eligible, autoReactivate: auto };
}

/**
 * Daily transitions (run by the sync job): sent → due → past_due on the
 * calendar, then flag clients that have passed their grace period. It
 * NEVER suspends unless the agreement has auto-suspend enabled — and even
 * then only flags it; the sync job hands the decision to an operator by
 * default (see runBillingTransitions caller).
 */
export async function runBillingTransitions(r: Repository, today = todayStr()): Promise<{ changed: number; eligible: string[] }> {
  const invoices = await r.list("invoices");
  let changed = 0;
  for (const inv of invoices) {
    if (!isOpen(inv.status)) continue;
    const next = deriveInvoiceStatus(inv, today);
    if (next !== inv.status) {
      const tx = new Tx(r);
      tx.patch("invoices", inv, { status: next });
      const type = next === "past_due" ? "invoice_past_due" : next === "due" ? "invoice_due" : undefined;
      if (type) tx.insert("billing_events", { orgId: inv.orgId, type, actorId: SYSTEM.id, invoiceId: inv.id, amountCents: inv.balanceDueCents, correlationId: newCorrelationId(), reference: inv.invoiceNumber });
      await tx.commit();
      changed++;
    }
  }
  const eligible: string[] = [];
  for (const org of await r.list("organizations")) {
    const orgInvoices = (await r.list("invoices", { orgId: org.id })).map((i) => ({ ...i, status: deriveInvoiceStatus(i, today) }));
    const agreement = (await r.list("service_agreements", { orgId: org.id })).find((a) => a.status !== "terminated" && a.status !== "completed");
    const e = suspensionEligibility(agreement, orgInvoices, today);
    await syncAccountStanding(r, org.id, SYSTEM.id);
    if (e.eligible && org.status !== "suspended") {
      eligible.push(org.id);
      const already = (await r.list("billing_events", { orgId: org.id, where: { type: "client_eligible_for_suspension" } }))
        .some((ev) => ev.createdAt.slice(0, 10) === today);
      if (!already) {
        const tx = new Tx(r);
        tx.insert("billing_events", { orgId: org.id, type: "client_eligible_for_suspension", actorId: SYSTEM.id, correlationId: newCorrelationId(), detail: `${e.worstDaysPastDue} days past due` });
        await tx.commit();
      }
      await raiseIncident(r, {
        orgId: org.id, type: "past_due_account", severity: "medium",
        title: `${org.name}: ${e.worstDaysPastDue} days past due — eligible for suspension`,
        detail: e.autoSuspend ? "Auto-suspend is enabled on this agreement." : "Operator decision required. Auto-suspend is off.",
        correlationId: newCorrelationId(), target: org.id,
      });
    }
  }
  return { changed, eligible };
}
