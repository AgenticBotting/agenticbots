import { handle, json, body } from "@/server/api";
import { repo } from "@/server/db";
import { requirePermission, requireActor } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";
import { createInvoice, type InvoiceInput } from "@/server/billing/service";
import { deriveInvoiceStatus } from "@/server/billing/domain";

export const GET = () =>
  handle(async () => {
    const actor = await requirePermission("ops.billing.read");
    const rows = (await (await repo()).list("invoices")).filter((i) => can(actor, "ops.billing.read", i.orgId));
    return json({ invoices: rows.map((i) => ({ ...i, status: deriveInvoiceStatus(i) })) });
  });

export const POST = (req: Request) =>
  handle(async () => {
    const b = await body<InvoiceInput & { orgId: string }>(req);
    return json({ invoice: await createInvoice(await repo(), await requireActor(), String(b.orgId), b) }, 201);
  });
