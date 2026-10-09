import "server-only";
import { Tx, type Repository } from "@/server/db/repository";
import { AppError } from "@/server/errors";
import { sha256Hex } from "@/server/ids";

/** Atomic fixed-window limit shared by all application instances. Storage errors
 * fail closed. Store a hash, never an IP/email in the key. */
export async function sharedRateLimit(r: Repository, key: string, limit: number, windowMs: number, now = Date.now()) {
  if (!Number.isSafeInteger(limit) || limit < 1 || !Number.isFinite(windowMs) || windowMs < 1000) throw new Error("Invalid rate limit.");
  const bucket = Math.floor(now / windowMs);
  const id = sha256Hex(JSON.stringify([key, windowMs, bucket]));
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = await r.get("security_counters", id);
    if (current && current.count >= limit) return { allowed: false, remaining: 0 };
    const tx = new Tx(r);
    if (current) tx.patch("security_counters", current, { count: current.count + 1 });
    else tx.insert("security_counters", { id, count: 1, expiresAt: new Date((bucket + 1) * windowMs).toISOString() });
    try { await tx.commit(); return { allowed: true, remaining: limit - (current?.count ?? 0) - 1 }; }
    catch (e) { if (!(e instanceof AppError) || e.code !== "conflict") throw e; }
  }
  return { allowed: false, remaining: 0 };
}
