import "server-only";
import type { Runtime } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import { correlationId as newCorrelationId, nowIso } from "@/server/ids";
import { awsControl } from "@/server/aws/control";
import { runtimeFor } from "@/server/runtime";
import { sanitizeRuntimeError } from "@/server/runtime/runtime-errors";
import { notFound } from "@/server/errors";
import { clearIncident, raiseIncident } from "./incidents";
import { isDemo } from "@/server/env";
import { SYSTEM, audit, type ActorRef } from "./common";

const DISK_WARN_PCT = 85;

/**
 * Server-side health polling. Browsers never poll runtimes: they read the
 * last-known health stored here, refreshed by the sync job (and on demand
 * by an operator's Refresh Health). One runtime at a time, no fan-out storm.
 */
export async function refreshRuntimeHealth(r: Repository, runtimeId: string, by: ActorRef = SYSTEM): Promise<Runtime> {
  const runtime = await r.get("runtimes", runtimeId);
  if (!runtime) throw notFound("Runtime");
  const correlationId = newCorrelationId();
  const aws = awsControl();
  const rt = runtimeFor(runtime);
  const started = Date.now();
  const patch: Partial<Runtime> = { lastCheckedAt: nowIso() };

  if (runtime.instanceId) {
    try {
      const inst = await aws.describeInstance(runtime.instanceId);
      patch.ec2State = (inst.state as Runtime["ec2State"]) ?? "unknown";
      patch.diskUsedPct = await aws.diskUsedPct(runtime.instanceId).catch(() => runtime.diskUsedPct);
    } catch {
      patch.ec2State = "unknown";
    }
  }

  try {
    const health = await rt.getDetailedHealth();
    patch.lastHeartbeatAt = nowIso();
    patch.health = health.status === "healthy" && !health.ready ? "degraded" : health.status;
    patch.ready = health.ready;
    patch.tunnel = "connected";
    if (health.ready) {
      const caps = await rt.getBotCapabilities();
      patch.capabilities = { runs: caps.runs, runEvents: caps.runEvents, runStop: caps.runStop, runApproval: caps.runApproval, conversations: caps.conversations, automations: caps.automations };
    }
    if (health.diskFreePct !== undefined && patch.diskUsedPct === undefined) patch.diskUsedPct = 100 - health.diskFreePct;
    patch.lastError = undefined;
  } catch (e) {
    const s = sanitizeRuntimeError(e, correlationId);
    patch.health = runtime.deploymentState === "suspended" ? "stopped" : "offline";
    patch.ready = false;
    patch.tunnel = s.code === "runtime_unreachable" ? "down" : runtime.tunnel;
    patch.lastError = { code: s.code, message: s.operator, at: nowIso(), correlationId };
  }

  const tx = new Tx(r);
  const next = tx.patch("runtimes", runtime, patch);
  tx.insert("runtime_health_samples", {
    orgId: runtime.orgId, runtimeId: runtime.id, checkedAt: patch.lastCheckedAt!,
    health: next.health, ready: next.ready, latencyMs: Date.now() - started, demo: isDemo(),
  });
  audit(tx, by, { action: "runtime.health_checked", orgId: runtime.orgId, targetType: "runtime", targetId: runtime.id, correlationId, detail: `Health: ${next.health}; ready: ${next.ready}` });
  await tx.commit();

  // Incidents: raise on bad state (never for an intentionally suspended runtime), clear on recovery.
  const target = runtime.id;
  if (runtime.deploymentState !== "suspended" && runtime.deploymentState !== "not_provisioned") {
    if (patch.health === "offline") {
      await raiseIncident(r, {
        orgId: runtime.orgId, type: patch.tunnel === "down" ? "tunnel_unavailable" : "runtime_offline", severity: "critical",
        title: "Runtime offline", detail: patch.lastError?.message ?? "No response", correlationId, target, runtimeId: runtime.id,
        clientMessage: "Some Bots are temporarily unavailable.",
      });
    } else if (patch.health === "degraded") {
      await raiseIncident(r, { orgId: runtime.orgId, type: "runtime_degraded", severity: "high", title: "Runtime degraded", detail: "Readiness checks failing", correlationId, target, runtimeId: runtime.id });
    } else if (patch.health === "healthy") {
      await clearIncident(r, runtime.orgId, "runtime_offline", target, by);
      await clearIncident(r, runtime.orgId, "tunnel_unavailable", target, by);
      await clearIncident(r, runtime.orgId, "runtime_degraded", target, by);
    }
  }
  if ((patch.diskUsedPct ?? 0) >= DISK_WARN_PCT) {
    await raiseIncident(r, { orgId: runtime.orgId, type: "disk_nearly_full", severity: "high", title: `Disk ${patch.diskUsedPct}% full`, detail: "Expand the data volume or prune logs", correlationId, target, runtimeId: runtime.id });
  }
  if (runtime.restartCount24h >= 3) {
    await raiseIncident(r, { orgId: runtime.orgId, type: "repeated_restart", severity: "medium", title: "Runtime restarted repeatedly", detail: `${runtime.restartCount24h} restarts in 24h`, correlationId, target, runtimeId: runtime.id });
  }
  return next;
}

/** Aging approvals become an operator incident after 24h. */
export async function flagAgingApprovals(r: Repository): Promise<void> {
  const pending = (await r.list("approvals")).filter((a) => a.status === "pending" && Date.parse(a.requestedAt) < Date.now() - 24 * 3600_000);
  for (const a of pending) {
    await raiseIncident(r, {
      orgId: a.orgId, type: "aging_approval", severity: "low", title: `Approval waiting over 24h: ${a.title}`,
      detail: "Nudge the client or decide internally.", correlationId: newCorrelationId(), target: a.id, botId: a.botId,
    });
  }
}
