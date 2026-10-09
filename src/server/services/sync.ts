import "server-only";
import { Tx } from "@/server/db/repository";
import { claimSyncLease, finishSyncLease, pruneExpiredSecurityRecords } from "@/server/security/leases";
import { audit, SYSTEM } from "./common";
import { correlationId } from "@/server/ids";
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

  const lease = await claimSyncLease(r);
  if (!lease) return { ...out, skipped: 1 };
  const deadline = Date.now() + 40_000;
  const work: { key: string; run: () => Promise<void> }[] = [];
  for (const run of await activeRunsFor(r)) work.push({ key: `run:${run.id}`, run: async () => { await syncRun(r, run.id); out.runs++; } });
  work.push({ key: "approvals", run: async () => { out.approvalsExpired = await expireApprovals(r); await flagAgingApprovals(r); } });
  for (const rt of await r.list("runtimes")) {
    if (rt.deploymentState === "not_provisioned") continue;
    const last = Date.parse(rt.lastCheckedAt ?? rt.lastHeartbeatAt ?? "") || 0;
    if (Date.now() - last < healthEvery) continue;
    work.push({ key: `health:${rt.id}`, run: async () => { await refreshRuntimeHealth(r, rt.id); out.runtimes++; } });
  }
  for (const org of await r.list("organizations")) {
    if (org.status === "suspended" || org.status === "canceled") continue;
    work.push({ key: `automations:${org.id}`, run: async () => { await syncAutomations(r, org.id); } });
  }
  work.push({ key: "billing", run: async () => { out.invoicesChanged = (await runBillingTransitions(r)).changed; } });
  work.push({ key: "retention", run: async () => { out.securityRecordsPruned = await pruneExpiredSecurityRecords(r); } });
  work.sort((a, b) => a.key.localeCompare(b.key));
  const nextIndex = lease.cursor ? work.findIndex(w => w.key > lease.cursor!) : 0;
  const start = Math.max(0, nextIndex);
  const ordered = [...work.slice(start), ...work.slice(0, start)];
  try {
    for (const job of ordered) {
      if (Date.now() >= deadline) { out.deferred = 1; break; }
      const current = await r.get("operation_leases", lease.id);
      if (!current || current.holder !== lease.holder || Date.parse(current.expiresAt) <= Date.now()) { out.skipped = 1; break; }
      try { await job.run(); } catch { out.errors++; }
      const tx = new Tx(r);
      tx.patch("operation_leases", current, { cursor: job.key });
      await tx.commit();
    }
    const tx = new Tx(r);
    audit(tx, SYSTEM, { action: "security.sync.complete", targetType: "operation_lease", targetId: lease.id, correlationId: correlationId(), result: out.errors ? "failure" : "success", detail: JSON.stringify(out) });
    await tx.commit();
    return out;
  } finally { await finishSyncLease(r, lease.holder); }
}
