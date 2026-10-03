import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { requirePermission } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";

export const GET = () =>
  handle(async () => {
    const actor = await requirePermission("ops.billing.read");
    return json({ payments: (await (await repo()).list("payments")).filter((p) => can(actor, "ops.billing.read", p.orgId)) });
  });
