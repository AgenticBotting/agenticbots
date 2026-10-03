import { handle, json } from "@/server/api";
import { requirePortalOrg } from "@/server/auth/guard";
import { portalData } from "@/server/views/portal";

export const GET = () =>
  handle(async () => {
    const { org } = await requirePortalOrg("portal.view");
    return json({ approvals: (await portalData(org)).approvals });
  });
