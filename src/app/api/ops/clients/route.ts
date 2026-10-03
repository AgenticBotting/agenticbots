import { handle, json, body } from "@/server/api";
import { repo } from "@/server/db";
import { requirePermission } from "@/server/auth/guard";
import { clientRows } from "@/server/services/queries";
import { createClientOrg } from "@/server/services/accounts";

export const GET = () =>
  handle(async () => {
    const actor = await requirePermission("ops.view");
    const rows = await clientRows(await repo(), actor);
    return json({ clients: rows.map((x) => ({ ...x, bots: x.bots.length })) });
  });

export const POST = (req: Request) =>
  handle(async () => {
    const actor = await requirePermission("ops.clients.manage");
    const b = await body<{ name?: string; industry?: string; instanceType?: string }>(req);
    return json({ client: await createClientOrg(await repo(), actor, { name: String(b.name ?? ""), industry: b.industry, instanceType: b.instanceType }) }, 201);
  });
