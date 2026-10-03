import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { requirePortalOrg } from "@/server/auth/guard";
import { toClientBot } from "@/server/views/client";

/** GET /api/bots — the signed-in client's Bots (client view: name, status, last useful activity). */
export const GET = () =>
  handle(async () => {
    const { org } = await requirePortalOrg("portal.view");
    const bots = await (await repo()).list("bots", { orgId: org.id, order: "asc" });
    return json({ bots: bots.map((b) => toClientBot(b, org)) });
  });
