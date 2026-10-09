import "server-only";
import { Tx, type Repository } from "@/server/db/repository";
import { AppError } from "@/server/errors";
import { nowIso, randomToken } from "@/server/ids";

/** Lease duration exceeds the sync route's hard 60s execution limit. A killed
 * invocation cannot overlap a replacement after the 3-minute lease expires. */
export async function claimSyncLease(r: Repository, now = Date.now()) {
  const old = await r.get("operation_leases", "platform-sync");
  if (old && Date.parse(old.expiresAt) > now) return null;
  const tx = new Tx(r);
  const fields = { holder: randomToken(16), expiresAt: new Date(now + 180_000).toISOString() };
  const next = old ? tx.patch("operation_leases", old, fields) : tx.insert("operation_leases", { id: "platform-sync", ...fields });
  try { await tx.commit(); return next; }
  catch (e) { if (e instanceof AppError && e.code === "conflict") return null; throw e; }
}

export async function pruneExpiredSecurityRecords(r: Repository) {
  const tx = new Tx(r);
  let removed = 0;
  for (const table of ["auth_challenges", "security_counters", "sessions"] as const) {
    const grace = table === "sessions" ? 30 * 86_400_000 : 86_400_000;
    for (const row of await r.list(table, { order: "asc", limit: 100 })) {
      if (Date.parse(row.expiresAt) < Date.now() - grace) { tx.delete(table, row.id); removed++; }
    }
  }
  if (removed) await tx.commit();
  return removed;
}

export async function finishSyncLease(r: Repository, holder: string) {
  const lease = await r.get("operation_leases", "platform-sync");
  if (!lease || lease.holder !== holder) return;
  const tx = new Tx(r);
  tx.patch("operation_leases", lease, { expiresAt: nowIso(), completedAt: nowIso() });
  await tx.commit();
}
