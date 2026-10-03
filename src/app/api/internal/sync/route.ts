import { timingSafeEqual } from "node:crypto";
import { handle, json } from "@/server/api";
import { repo } from "@/server/db";
import { runSyncCycle } from "@/server/services/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Background sync — called every minute by Vercel Cron (vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. Reconciles active runs, expires
 * approvals, polls runtime health server-side, ticks billing transitions.
 */
export const GET = (req: Request) =>
  handle(async () => {
    const secret = process.env.CRON_SECRET ?? "";
    const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const ok = secret.length >= 16 && got.length === secret.length && timingSafeEqual(Buffer.from(got), Buffer.from(secret));
    if (!ok) return json({ error: { code: "unauthenticated", message: "Unauthorized" } }, 401);
    return json({ ok: true, result: await runSyncCycle(await repo()) });
  });
