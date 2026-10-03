import { handle, json } from "@/server/api";
import { requirePortalOrg } from "@/server/auth/guard";
import { portalData } from "@/server/views/portal";

export const GET = () =>
  handle(async () => {
    const { org } = await requirePortalOrg("portal.integrations.view");
    return json({ integrations: (await portalData(org)).integrations });
  });
