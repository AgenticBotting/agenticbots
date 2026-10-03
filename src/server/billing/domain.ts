/**
 * Billing domain — pure functions, no I/O. Everything financial that can be
 * computed is computed here, so it is unit-tested in isolation and the
 * same rules run in the UI, the API and the nightly transition job.
 *
 * Money is integer cents. Dates are YYYY-MM-DD strings compared lexically.
 */
import type { Invoice, InvoiceStatus, ServiceAgreement } from "@/lib/platform/types";

export const todayStr = (d = new Date()): string => d.toISOString().slice(0, 10);

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function lineTotal(items: Invoice["lineItems"]): number {
  return items.reduce((sum, li) => sum + Math.round(li.quantity * li.unitCents), 0);
}

export function totals(items: Invoice["lineItems"], taxCents = 0) {
  const subtotalCents = lineTotal(items);
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}

/** The status an invoice should have, given its amounts and today's date.
 *  Draft, void and written-off are set by people, never derived. */
export function deriveInvoiceStatus(inv: Pick<Invoice, "status" | "totalCents" | "amountPaidCents" | "dueDate" | "sentAt">, today = todayStr()): InvoiceStatus {
  if (inv.status === "draft" || inv.status === "void" || inv.status === "written_off") return inv.status;
  const balance = inv.totalCents - inv.amountPaidCents;
  if (balance <= 0) return "paid";
  if (today > inv.dueDate) return "past_due";
  if (inv.amountPaidCents > 0) return "partially_paid";
  if (today === inv.dueDate) return "due";
  return "sent";
}

export const OPEN_STATUSES: InvoiceStatus[] = ["sent", "due", "partially_paid", "past_due"];
export const isOpen = (s: InvoiceStatus) => OPEN_STATUSES.includes(s);

export function daysPastDue(inv: Pick<Invoice, "dueDate" | "status">, today = todayStr()): number {
  return isOpen(inv.status) && today > inv.dueDate ? daysBetween(inv.dueDate, today) : 0;
}

export type ClientBillingStatus = "paid" | "upcoming" | "due" | "partially_paid" | "past_due" | "none";

export function clientBillingStatus(invoices: Invoice[], today = todayStr()): ClientBillingStatus {
  const live = invoices.filter((i) => i.status !== "void" && i.status !== "draft" && i.status !== "written_off");
  if (live.length === 0) return "none";
  const statuses = live.map((i) => deriveInvoiceStatus(i, today));
  if (statuses.includes("past_due")) return "past_due";
  if (statuses.includes("partially_paid")) return "partially_paid";
  if (statuses.includes("due")) return "due";
  if (statuses.includes("sent")) return "upcoming";
  return "paid";
}

export function outstandingCents(invoices: Invoice[]): number {
  return invoices.filter((i) => isOpen(i.status)).reduce((s, i) => s + Math.max(0, i.balanceDueCents), 0);
}

/**
 * Suspension eligibility. Past due alone never suspends anyone:
 *   Due → Past Due → Grace Period → Eligible for Suspension → Operator decides.
 * Only when the agreement explicitly enables auto-suspend does
 * `autoSuspend` come back true.
 */
export function suspensionEligibility(
  agreement: Pick<ServiceAgreement, "gracePeriodDays" | "autoSuspendEnabled"> | undefined,
  invoices: Invoice[],
  today = todayStr(),
): { eligible: boolean; autoSuspend: boolean; worstDaysPastDue: number; inGrace: boolean } {
  const grace = agreement?.gracePeriodDays ?? 7;
  const worst = Math.max(0, ...invoices.map((i) => daysPastDue({ ...i, status: deriveInvoiceStatus(i, today) }, today)));
  const eligible = worst > grace;
  return { eligible, autoSuspend: eligible && !!agreement?.autoSuspendEnabled, worstDaysPastDue: worst, inGrace: worst > 0 && !eligible };
}

/**
 * After a payment, may this client be automatically reactivated?
 * Default answer is no: auto_reactivate_on_payment is off unless the
 * agreement enables it, and every other condition must also hold.
 */
export function autoReactivationAllowed(input: {
  agreement?: Pick<ServiceAgreement, "autoReactivateOnPayment">;
  suspensionReason?: string;
  holds: { manual: boolean; security: boolean };
  invoices: Invoice[];
  today?: string;
}): boolean {
  if (!input.agreement?.autoReactivateOnPayment) return false;
  if (input.suspensionReason !== "billing") return false;
  if (input.holds.manual || input.holds.security) return false;
  return clientBillingStatus(input.invoices, input.today) !== "past_due";
}

/** Next date a recurring invoice should be issued. */
export function nextBillingDate(agreement: Pick<ServiceAgreement, "startDate" | "billingFrequency">, lastIssueDate?: string): string {
  const step = agreement.billingFrequency === "monthly" ? 1 : agreement.billingFrequency === "quarterly" ? 3 : 12;
  const base = lastIssueDate ?? agreement.startDate;
  if (!lastIssueDate) return base;
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + step);
  return d.toISOString().slice(0, 10);
}

/** Monthly-equivalent value of an agreement (for MRR). */
export function monthlyEquivalentCents(a: Pick<ServiceAgreement, "monthlyValueCents" | "status">): number {
  return a.status === "active" || a.status === "past_due" ? a.monthlyValueCents : 0;
}

export const formatUsd = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 === 0 ? 0 : 2 });
