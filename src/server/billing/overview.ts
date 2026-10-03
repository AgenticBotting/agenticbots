import "server-only";
import type { Invoice, Organization, Payment, ServiceAgreement } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { can, type Actor } from "@/server/auth/policy";
import {
  clientBillingStatus,
  deriveInvoiceStatus,
  isOpen,
  monthlyEquivalentCents,
  nextBillingDate,
  outstandingCents,
  suspensionEligibility,
  todayStr,
  type ClientBillingStatus,
} from "./domain";

export interface BillingRow {
  org: Organization;
  agreement?: ServiceAgreement;
  lastInvoice?: Invoice;
  paymentStatus: ClientBillingStatus;
  outstandingCents: number;
  lastPayment?: Payment;
  nextBillingDate?: string;
  eligibleForSuspension: boolean;
  worstDaysPastDue: number;
  inGrace: boolean;
}

export interface BillingMetrics {
  mrrCents: number;
  activeContractValueCents: number;
  outstandingCents: number;
  paymentsThisMonthCents: number;
  pastDueAccounts: number;
  eligibleForSuspension: number;
  suspendedForBilling: number;
  implementationFeesOutstandingCents: number;
  estimatedOperatingCostUsd: number;
  estimatedGrossMarginCents: number;
}

/** Internal-only billing picture. Never rendered in the client portal. */
export async function billingOverview(r: Repository, actor: Actor): Promise<{ rows: BillingRow[]; metrics: BillingMetrics }> {
  const today = todayStr();
  const month = today.slice(0, 7);
  const [orgs, agreements, invoices, payments, runtimes, rollups] = await Promise.all([
    r.list("organizations"), r.list("service_agreements"), r.list("invoices"), r.list("payments"), r.list("runtimes"), r.list("usage_rollups"),
  ]);
  const rows: BillingRow[] = [];
  for (const org of orgs.filter((o) => can(actor, "ops.billing.read", o.id) && o.environment !== "staging")) {
    const orgInv = invoices.filter((i) => i.orgId === org.id).map((i) => ({ ...i, status: deriveInvoiceStatus(i, today) }));
    const agreement = agreements
      .filter((a) => a.orgId === org.id)
      .sort((a, b) => (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1))[0];
    const issued = orgInv.filter((i) => i.status !== "void").sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    const orgPayments = payments.filter((p) => p.orgId === org.id && p.amountCents > 0 && !p.reversedByPaymentId).sort((a, b) => b.dateReceived.localeCompare(a.dateReceived));
    const e = suspensionEligibility(agreement, orgInv, today);
    rows.push({
      org,
      agreement,
      lastInvoice: issued[0],
      paymentStatus: clientBillingStatus(orgInv, today),
      outstandingCents: outstandingCents(orgInv),
      lastPayment: orgPayments[0],
      nextBillingDate: agreement ? nextBillingDate(agreement, issued.find((i) => i.lineItems.some((l) => l.kind === "recurring"))?.issueDate) : undefined,
      eligibleForSuspension: e.eligible,
      worstDaysPastDue: e.worstDaysPastDue,
      inGrace: e.inGrace,
    });
  }
  const visible = new Set(rows.map((x) => x.org.id));
  const vInvoices = invoices.filter((i) => visible.has(i.orgId)).map((i) => ({ ...i, status: deriveInvoiceStatus(i, today) }));
  const mrrCents = rows.reduce((s, x) => s + (x.agreement ? monthlyEquivalentCents(x.agreement) : 0), 0);
  const modelCost = rollups.filter((u) => visible.has(u.orgId) && u.period === month).reduce((s, u) => s + u.modelCostUsd, 0);
  const infraCost = runtimes.filter((rt) => visible.has(rt.orgId) && rt.deploymentState !== "not_provisioned").reduce((s, rt) => s + rt.estimatedMonthlyCostUsd, 0);
  const metrics: BillingMetrics = {
    mrrCents,
    activeContractValueCents: rows.reduce((s, x) => {
      const a = x.agreement;
      if (!a || (a.status !== "active" && a.status !== "past_due")) return s;
      return s + a.monthlyValueCents * 12;
    }, 0),
    outstandingCents: outstandingCents(vInvoices),
    paymentsThisMonthCents: payments.filter((p) => visible.has(p.orgId) && p.dateReceived.startsWith(month)).reduce((s, p) => s + p.amountCents, 0),
    pastDueAccounts: rows.filter((x) => x.paymentStatus === "past_due").length,
    eligibleForSuspension: rows.filter((x) => x.eligibleForSuspension && x.org.status !== "suspended").length,
    suspendedForBilling: rows.filter((x) => x.org.status === "suspended" && x.org.suspension?.reason === "billing").length,
    implementationFeesOutstandingCents: vInvoices
      .filter((i) => isOpen(i.status))
      .reduce((s, i) => s + i.lineItems.filter((l) => l.kind === "implementation").reduce((a, l) => a + l.unitCents * l.quantity, 0), 0),
    estimatedOperatingCostUsd: Math.round((modelCost + infraCost) * 100) / 100,
    estimatedGrossMarginCents: mrrCents - Math.round((modelCost + infraCost) * 100),
  };
  return { rows, metrics };
}
