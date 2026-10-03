import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { requirePermission } from "@/server/auth/guard";
import { can } from "@/server/auth/policy";

export const GET = (req: Request) =>
  handle(async () => {
    const actor = await requirePermission("ops.view");
    const status = new URL(req.url).searchParams.get("status");
    const runs = (await (await repo()).list("runs", { limit: 500 })).filter((x) => can(actor, "ops.view", x.orgId) && (!status || x.status === status));
    return json({ runs });
  });
