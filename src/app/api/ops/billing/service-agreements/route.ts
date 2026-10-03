import { handle, json, body } from "@/server/api";
import { repo } from "@/server/db";
import { requirePermission, requireActor } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";
import { createAgreement, type AgreementInput } from "@/server/billing/service";

export const GET = () =>
  handle(async () => {
    const actor = await requirePermission("ops.billing.read");
    return json({ agreements: (await (await repo()).list("service_agreements")).filter((a) => can(actor, "ops.billing.read", a.orgId)) });
  });

export const POST = (req: Request) =>
  handle(async () => {
    const b = await body<AgreementInput & { orgId: string }>(req);
    return json({ agreement: await createAgreement(await repo(), await requireActor(), String(b.orgId), b) }, 201);
  });
