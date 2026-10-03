import "server-only";
import type { Repository } from "@/server/db/repository";
import { syncRun, activeRunsFor } from "./runs";
import { expireApprovals } from "./approvals";
import { refreshRuntimeHealth, flagAgingApprovals } from "./monitoring";
import { syncAutomations } from "./automations";
import { runBillingTransitions } from "@/server/billing/service";

/**
 * The background sync cycle. Runs from a scheduled hit on
 * /api/internal/sync (Vercel Cron, every minute) — not from browsers, so
 * there is one predictable polling loop instead of a request per tab.
 *
 * Each step is isolated: one failing tenant never blocks the others.
 */
export async function runSyncCycle(r: Repository, opts: { healthEveryMs?: number } = {}): Promise<Record<string, number>> {
  const out: Record<string, number> = { runs: 0, runtimes: 0, approvalsExpired: 0, invoicesChanged: 0, errors: 0 };
  const healthEvery = opts.healthEveryMs ?? 5 * 60_000;

  for (const run of await activeRunsFor(r)) {
    try {
      await syncRun(r, run.id);
      out.runs++;
    } catch {
      out.errors++;
    }
  }
  try {
    out.approvalsExpired = await expireApprovals(r);
    await flagAgingApprovals(r);
  } catch {
    out.errors++;
  }
  for (const rt of await r.list("runtimes")) {
    if (rt.deploymentState === "not_provisioned") continue;
    const last = rt.lastHeartbeatAt ? Date.parse(rt.lastHeartbeatAt) : 0;
    if (Date.now() - last < healthEvery) continue;
    try {
      await refreshRuntimeHealth(r, rt.id);
      out.runtimes++;
    } catch {
      out.errors++;
    }
  }
  for (const org of await r.list("organizations")) {
    if (org.status === "suspended" || org.status === "canceled") continue;
    await syncAutomations(r, org.id).catch(() => {
      out.errors++;
    });
  }
  try {
    out.invoicesChanged = (await runBillingTransitions(r)).changed;
  } catch {
    out.errors++;
  }
  return out;
}
