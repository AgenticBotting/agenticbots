import "server-only";
import type { BillingProvider } from "../provider";

/**
 * ManualBillingProvider — the default and, for the first clients, the only
 * provider. Invoices are sent through whatever process AgenticBots already
 * uses (email a PDF, accounting software). Clients pay by ACH, wire, bank
 * transfer or check. An operator who sees the funds arrive records the
 * payment. No processor, no bank credentials, nothing to integrate.
 */
export class ManualBillingProvider implements BillingProvider {
  readonly key = "manual";
  readonly displayName = "Manual (ACH / wire / check)";

  async pushInvoice() {
    return null;
  }

  async deliverInvoice() {
    return { delivered: false, note: "Marked as sent. Deliver it through your usual invoicing process." };
  }

  async fetchPayments() {
    return [];
  }
}
