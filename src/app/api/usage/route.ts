import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";

/** GET /api/usage — operators only. Clients never receive model or cost data. */
export const GET = () =>
  handle(async () => {
    const actor = await requireActor();
    const rows = (await (await repo()).list("usage_rollups")).filter((u) => can(actor, "ops.view", u.orgId));
    if (!can(actor, "ops.view")) return json({ error: { code: "forbidden", message: "You do not have access to this." } }, 403);
    return json({ usage: rows });
  });
