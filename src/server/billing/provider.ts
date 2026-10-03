import "server-only";
import type { Invoice, Payment } from "@/lib/platform/types";

/**
 * BillingProvider — the seam where an accounting or payments system can
 * plug in later (QuickBooks, Xero, Bill.com, Stripe, a bank feed). The core
 * domain never imports a provider SDK and never depends on a provider's
 * objects: it stores its own invoices and payments and, at most, an
 * `externalAccountingId` pointing at the provider's copy.
 */
export interface BillingProvider {
  readonly key: string;
  readonly displayName: string;
  /** Mirror an invoice into the external system. Null = provider does not sync invoices. */
  pushInvoice(invoice: Invoice): Promise<{ externalId: string } | null>;
  /** Deliver the invoice to the client. Manual provider: the operator sends it from their own process. */
  deliverInvoice(invoice: Invoice): Promise<{ delivered: boolean; note: string }>;
  /** Payments detected by the provider since a date. Manual provider: none — payments are recorded by an operator. */
  fetchPayments(since: string): Promise<Pick<Payment, "invoiceId" | "amountCents" | "dateReceived" | "method" | "referenceNumber">[]>;
}

/** Future adapters implement BillingProvider; registering one is a config
 *  change, not a rewrite. Listed so operators can see what is possible. */
export const FUTURE_PROVIDERS = ["QuickBooksBillingProvider", "XeroBillingProvider", "BillComBillingProvider", "StripeBillingProvider", "BankFeedBillingProvider"] as const;
