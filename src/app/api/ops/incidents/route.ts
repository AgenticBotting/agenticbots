import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { requirePermission } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";

export const GET = () =>
  handle(async () => {
    const actor = await requirePermission("ops.view");
    return json({ incidents: (await (await repo()).list("incidents")).filter((i) => can(actor, "ops.view", i.orgId)) });
  });
