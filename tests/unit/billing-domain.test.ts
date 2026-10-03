import { describe, it, expect } from "vitest";
import {
  addDays, autoReactivationAllowed, clientBillingStatus, deriveInvoiceStatus, suspensionEligibility, totals,
} from "@/server/billing/domain";
import type { Invoice } from "@/lib/platform/types";

const inv = (p: Partial<Invoice>): Invoice => ({
  id: "i", orgId: "o", createdAt: "", updatedAt: "", version: 1, invoiceNumber: "AB-1", issueDate: "2026-09-01", dueDate: "2026-09-06",
  currency: "USD", lineItems: [], subtotalCents: 750000, taxCents: 0, totalCents: 750000, amountPaidCents: 0, balanceDueCents: 750000,
  status: "sent", preferredPaymentMethod: "ach", createdBy: "u", sentAt: "2026-09-01T00:00:00Z", ...p,
});

describe("billing domain", () => {
  it("computes totals in integer cents", () => {
    expect(totals([{ description: "a", quantity: 1, unitCents: 750000, kind: "recurring" }, { description: "b", quantity: 2, unitCents: 12550, kind: "custom" }], 100)).toEqual({ subtotalCents: 775100, taxCents: 100, totalCents: 775200 });
  });
  it("derives sent → due → past_due on the calendar", () => {
    expect(deriveInvoiceStatus(inv({}), "2026-09-05")).toBe("sent");
    expect(deriveInvoiceStatus(inv({}), "2026-09-06")).toBe("due");
    expect(deriveInvoiceStatus(inv({}), "2026-09-07")).toBe("past_due");
  });
  it("partial payment is partially_paid until it becomes past due", () => {
    expect(deriveInvoiceStatus(inv({ amountPaidCents: 100000 }), "2026-09-03")).toBe("partially_paid");
    expect(deriveInvoiceStatus(inv({ amountPaidCents: 100000 }), "2026-09-10")).toBe("past_due");
  });
  it("full payment is paid regardless of date", () => {
    expect(deriveInvoiceStatus(inv({ amountPaidCents: 750000 }), "2026-12-01")).toBe("paid");
  });
  it("never derives status for drafts, voids or write-offs", () => {
    for (const s of ["draft", "void", "written_off"] as const) expect(deriveInvoiceStatus(inv({ status: s }), "2027-01-01")).toBe(s);
  });
  it("past due inside the grace period is not eligible for suspension", () => {
    const e = suspensionEligibility({ gracePeriodDays: 7, autoSuspendEnabled: false }, [inv({})], addDays("2026-09-06", 5));
    expect(e).toMatchObject({ eligible: false, inGrace: true, worstDaysPastDue: 5 });
  });
  it("past the grace period is eligible, but auto-suspend stays off by default", () => {
    const e = suspensionEligibility({ gracePeriodDays: 7, autoSuspendEnabled: false }, [inv({})], addDays("2026-09-06", 10));
    expect(e).toMatchObject({ eligible: true, autoSuspend: false });
  });
  it("auto-suspend only when the agreement explicitly enables it", () => {
    expect(suspensionEligibility({ gracePeriodDays: 7, autoSuspendEnabled: true }, [inv({})], "2026-09-20").autoSuspend).toBe(true);
  });
  it("auto-reactivation requires every condition", () => {
    const base = { agreement: { autoReactivateOnPayment: true }, suspensionReason: "billing", holds: { manual: false, security: false }, invoices: [inv({ amountPaidCents: 750000 })] };
    expect(autoReactivationAllowed(base)).toBe(true);
    expect(autoReactivationAllowed({ ...base, agreement: { autoReactivateOnPayment: false } })).toBe(false);
    expect(autoReactivationAllowed({ ...base, suspensionReason: "manual" })).toBe(false);
    expect(autoReactivationAllowed({ ...base, holds: { manual: true, security: false } })).toBe(false);
    expect(autoReactivationAllowed({ ...base, holds: { manual: false, security: true } })).toBe(false);
    expect(autoReactivationAllowed({ ...base, invoices: [inv({})], today: "2026-10-01" })).toBe(false);
  });
  it("client billing status prefers the worst state", () => {
    expect(clientBillingStatus([inv({ amountPaidCents: 750000 }), inv({})], "2026-09-20")).toBe("past_due");
    expect(clientBillingStatus([], "2026-09-20")).toBe("none");
  });
});
