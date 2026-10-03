import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { requirePermission } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";

export const GET = () =>
  handle(async () => {
    const actor = await requirePermission("ops.view");
    return json({ bots: (await (await repo()).list("bots")).filter((b) => can(actor, "ops.view", b.orgId)) });
  });
