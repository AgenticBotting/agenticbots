import { handle, json, body } from "@/server/api";
import { repo } from "@/server/db";
import { requirePortalOrg } from "@/server/auth/guard";
import { createRequest } from "@/server/services/requests";
import { toClientRequest } from "@/server/views/client";

export const GET = () =>
  handle(async () => {
    const { org } = await requirePortalOrg("portal.view");
    return json({ requests: (await (await repo()).list("requests", { orgId: org.id })).map(toClientRequest) });
  });

export const POST = (req: Request) =>
  handle(async () => {
    const { actor, org } = await requirePortalOrg("portal.requests.create");
    const b = await body<{ title?: string; description?: string; priority?: "low" | "normal" | "high" | "urgent" }>(req);
    const created = await createRequest(await repo(), actor, org.id, { title: String(b.title ?? ""), description: String(b.description ?? ""), priority: b.priority });
    return json({ request: toClientRequest(created) }, 201);
  });
