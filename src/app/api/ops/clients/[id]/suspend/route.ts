import { handle, json, body } from "@/server/api";
import { repo } from "@/server/db";
import { requireActor } from "@/server/auth/guard";
import { suspendClient } from "@/server/services/clients";
import type { SuspensionReason } from "@/lib/platform/types";

export const POST = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const b = await body<{ reason?: SuspensionReason; note?: string }>(req);
    return json(await suspendClient(await repo(), await requireActor(), (await ctx.params).id, b.reason ?? "manual", b.note));
  });
