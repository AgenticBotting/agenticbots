import { handle, json } from "@/server/api";
import { requirePortalOrg } from "@/server/auth/guard";
import { portalReport } from "@/server/views/portal";

export const GET = (req: Request) =>
  handle(async () => {
    const { org } = await requirePortalOrg("portal.reports.view");
    const days = Number(new URL(req.url).searchParams.get("days") ?? "30");
    return json({ report: await portalReport(org, [7, 30, 90].includes(days) ? days : 30) });
  });
