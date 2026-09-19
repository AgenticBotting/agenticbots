/**
 * NMI / EasyPayDirect gateway client.
 *
 * Ported from the working integration built for The Cave — same API,
 * same Direct Post endpoint. Server-side only: never import this into a
 * client component.
 *
 * No card number ever reaches this file. Collect.js tokenises the card in
 * the gateway's own iframes and hands back a one-time `payment_token`,
 * which is all we ever post. That is what keeps this a SAQ A-EP
 * integration rather than a full PCI audit.
 *
 * Docs: https://secure.nmi.com/merchants/resources/integration/integration_portal.php
 */

const NMI_API_URL = "https://secure.nmi.com/api/transact.php";

function getSecurityKey(): string {
  const key = process.env.NMI_SECURITY_KEY;
  if (!key) {
    throw new Error("NMI_SECURITY_KEY environment variable is not set");
  }
  return key;
}

export interface NMIResponse {
  response: string; // "1" = approved, "2" = declined, "3" = error
  responsetext: string; // e.g. "SUCCESS", "DECLINE"
  authcode: string;
  transactionid: string;
  avsresponse: string; // AVS result code
  cvvresponse: string; // CVV result code
  orderid: string;
  response_code: string; // detailed response code
  customer_vault_id?: string;
  // Raw parsed params for debugging
  raw: Record<string, string>;
}

async function sendRequest(
  params: Record<string, string>
): Promise<NMIResponse> {
  const body = new URLSearchParams({
    security_key: getSecurityKey(),
    ...params,
  });

  const res = await fetch(NMI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`NMI API returned HTTP ${res.status}`);
  }

  const text = await res.text();
  const parsed = Object.fromEntries(new URLSearchParams(text));

  return {
    response: parsed.response || "",
    responsetext: parsed.responsetext || "",
    authcode: parsed.authcode || "",
    transactionid: parsed.transactionid || "",
    avsresponse: parsed.avsresponse || "",
    cvvresponse: parsed.cvvresponse || "",
    orderid: parsed.orderid || "",
    response_code: parsed.response_code || "",
    customer_vault_id: parsed.customer_vault_id,
    raw: parsed,
  };
}

export function isApproved(response: NMIResponse): boolean {
  return response.response === "1";
}

export function isDeclined(response: NMIResponse): boolean {
  return response.response === "2";
}

// ─── One-Time Payments ───────────────────────────────────────

export interface ChargeParams {
  paymentToken: string;
  amount: number; // in dollars (e.g. 99.99)
  orderId?: string;
  orderDescription?: string;
  customerEmail?: string;
  customerName?: string;
  billingAddress?: {
    address1?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export async function processPayment(
  params: ChargeParams
): Promise<NMIResponse> {
  const fields: Record<string, string> = {
    type: "sale",
    payment_token: params.paymentToken,
    amount: params.amount.toFixed(2),
  };

  if (params.orderId) fields.orderid = params.orderId;
  if (params.orderDescription)
    fields.order_description = params.orderDescription;
  if (params.customerEmail) fields.email = params.customerEmail;

  // Split name into first/last for NMI
  if (params.customerName) {
    const parts = params.customerName.trim().split(/\s+/);
    fields.first_name = parts[0] || "";
    fields.last_name = parts.slice(1).join(" ") || "";
  }

  // Billing address for AVS verification
  if (params.billingAddress) {
    const addr = params.billingAddress;
    if (addr.address1) fields.address1 = addr.address1;
    if (addr.city) fields.city = addr.city;
    if (addr.state) fields.state = addr.state;
    if (addr.zip) fields.zip = addr.zip;
    if (addr.country) fields.country = addr.country;
  }

  return sendRequest(fields);
}

// ─── Refunds & Voids ────────────────────────────────────────

export async function refundTransaction(
  transactionId: string,
  amount?: number
): Promise<NMIResponse> {
  const fields: Record<string, string> = {
    type: "refund",
    transactionid: transactionId,
  };
  if (amount !== undefined) {
    fields.amount = amount.toFixed(2);
  }
  return sendRequest(fields);
}

export async function voidTransaction(
  transactionId: string
): Promise<NMIResponse> {
  return sendRequest({
    type: "void",
    transactionid: transactionId,
  });
}

// ─── Customer Vault ─────────────────────────────────────────

export interface VaultCustomerParams {
  paymentToken: string;
  customerEmail: string;
  customerName: string;
  billingAddress?: {
    address1?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

export async function addToVault(
  params: VaultCustomerParams
): Promise<NMIResponse> {
  const fields: Record<string, string> = {
    customer_vault: "add_customer",
    payment_token: params.paymentToken,
    email: params.customerEmail,
  };

  const parts = params.customerName.trim().split(/\s+/);
  fields.first_name = parts[0] || "";
  fields.last_name = parts.slice(1).join(" ") || "";

  if (params.billingAddress) {
    const addr = params.billingAddress;
    if (addr.address1) fields.address1 = addr.address1;
    if (addr.city) fields.city = addr.city;
    if (addr.state) fields.state = addr.state;
    if (addr.zip) fields.zip = addr.zip;
    if (addr.country) fields.country = addr.country;
  }

  return sendRequest(fields);
}

export async function chargeVault(
  customerVaultId: string,
  amount: number,
  orderId?: string
): Promise<NMIResponse> {
  const fields: Record<string, string> = {
    type: "sale",
    customer_vault_id: customerVaultId,
    amount: amount.toFixed(2),
  };
  if (orderId) fields.orderid = orderId;
  return sendRequest(fields);
}

export async function deleteFromVault(
  customerVaultId: string
): Promise<NMIResponse> {
  return sendRequest({
    customer_vault: "delete_customer",
    customer_vault_id: customerVaultId,
  });
}

// ─── Recurring Billing ──────────────────────────────────────

export interface RecurringParams {
  customerVaultId: string;
  planAmount: number; // in dollars
  interval: "monthly" | "yearly";
  orderId?: string;
  orderDescription?: string;
}

export async function addRecurring(
  params: RecurringParams
): Promise<NMIResponse> {
  const fields: Record<string, string> = {
    recurring: "add_subscription",
    plan_amount: params.planAmount.toFixed(2),
    customer_vault_id: params.customerVaultId,
    // NMI uses plan_payments=0 for unlimited recurring
    plan_payments: "0",
  };

  // Set billing frequency
  if (params.interval === "monthly") {
    fields.month_frequency = "1";
    fields.day_of_month = new Date().getDate().toString();
  } else {
    fields.month_frequency = "12";
    fields.day_of_month = new Date().getDate().toString();
  }

  // Start date = today
  const now = new Date();
  const startDate =
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    now.getFullYear().toString();
  fields.start_date = startDate;

  if (params.orderId) fields.orderid = params.orderId;
  if (params.orderDescription)
    fields.order_description = params.orderDescription;

  return sendRequest(fields);
}

export async function cancelRecurring(
  subscriptionId: string
): Promise<NMIResponse> {
  return sendRequest({
    recurring: "delete_subscription",
    subscription_id: subscriptionId,
  });
}
