import type { Runtime, RuntimeHealthSample } from "./types";

/** Two missed 5-minute polls make a previously healthy observation stale. */
export const HEALTH_FRESH_MS = 10 * 60_000;
export function runtimeObservation(rt: Pick<Runtime, "health" | "ready" | "lastCheckedAt" | "lastHeartbeatAt" | "deploymentState">, now = Date.now()) {
  const checkedAt = rt.lastCheckedAt ?? rt.lastHeartbeatAt;
  const age = checkedAt ? now - Date.parse(checkedAt) : NaN;
  const fresh = Number.isFinite(age) && age >= 0 && age <= HEALTH_FRESH_MS;
  const health = rt.deploymentState === "suspended" ? "stopped" : !fresh ? "unknown" : rt.health === "healthy" && !rt.ready ? "degraded" : rt.health;
  return { health, ready: fresh && rt.ready, fresh, checkedAt, label: fresh ? health : "Check overdue" };
}

/** Hourly buckets show the worst observed state; gaps stay unknown. */
export function healthHistory(samples: RuntimeHealthSample[], now = Date.now(), hours = 24) {
  const hour = 3_600_000;
  const start = Math.floor(now / hour) * hour - (hours - 1) * hour;
  return Array.from({ length: hours }, (_, i) => {
    const at = start + i * hour;
    const rows = samples.filter(s => Date.parse(s.checkedAt) >= at && Date.parse(s.checkedAt) < at + hour && Date.parse(s.checkedAt) <= now);
    const good = rows.filter(s => s.health === "healthy" && s.ready).length;
    return { at: new Date(at).toISOString(), count: rows.length, good,
      state: !rows.length ? "unknown" : rows.some(s => s.health === "offline") ? "bad" : good < rows.length ? "watch" : "good" };
  });
}

export function backupIsFresh(snapshot: string | undefined, now = Date.now()) {
  const age = snapshot ? now - Date.parse(snapshot) : NaN;
  return Number.isFinite(age) && age >= 0 && age <= 36 * 3600_000;
}
