import "server-only";
import type { Organization, Runtime, SuspensionReason } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { correlationId as newCorrelationId, nowIso } from "@/server/ids";
import { awsControl } from "@/server/aws/control";
import { adapterFor, resolveTarget } from "@/server/runtime";
import { sanitizeRuntimeError } from "@/server/runtime/errors";
import { conflict, invalid } from "@/server/errors";
import { redactSecrets } from "@/server/redact";
import { audit, getOrgFor, refOf } from "./common";
import { activeRunsFor } from "./runs";
import { refreshRuntimeHealth } from "./monitoring";

const SUSPENSION_REASONS: SuspensionReason[] = ["billing", "manual", "security", "contract_ended", "other"];

export interface LifecycleOutcome {
  ok: boolean;
  message: string;
  correlationId: string;
}

/**
 * Suspend a client.
 *   1. Block execution in the app immediately (org.status = suspended).
 *   2. Ask the runtime to stop active runs (best effort).
 *   3. Stop the runtime service through Systems Manager.
 *   4. Leave storage untouched — memory, sessions, skills, automations,
 *      configuration and history all survive.
 */
export async function suspendClient(
  r: Repository,
  actor: Actor,
  orgId: string,
  reason: SuspensionReason,
  note?: string,
): Promise<LifecycleOutcome> {
  const org = await getOrgFor(r, orgId, actor, "ops.clients.suspend");
  if (!SUSPENSION_REASONS.includes(reason)) throw invalid("Choose a suspension reason.");
  if (org.status === "suspended") return { ok: true, message: `${org.name} is already suspended.`, correlationId: newCorrelationId() };
  const correlationId = newCorrelationId();

  // 1. Gate first, so no new work can start while we stop things.
  let tx = new Tx(r);
  tx.patch("organizations", org, {
    status: "suspended",
    suspension: { reason, at: nowIso(), by: actor.user.id, note: note ? redactSecrets(note, 500) : undefined },
    eligibleForReactivation: false,
    holds: { ...org.holds, security: org.holds.security || reason === "security" },
  });
  if (reason === "billing") {
    tx.insert("billing_events", { orgId, type: "client_suspended_for_billing", actorId: actor.user.id, correlationId, detail: note });
  }
  audit(tx, actor, { action: "client.suspend", orgId, targetType: "organization", targetId: orgId, correlationId, detail: `reason=${reason}` });
  await tx.commit();

  // 2. Stop active runs, best effort.
  const runtimes = await r.list("runtimes", { orgId });
  for (const run of await activeRunsFor(r, orgId)) {
    const bot = await r.get("bots", run.botId);
    const runtime = runtimes.find((x) => x.id === bot?.runtimeId);
    if (bot && runtime && run.runtimeRunId) {
      await adapterFor(runtime).stopRun(await resolveTarget(runtime, bot), run.runtimeRunId).catch(() => undefined);
    }
  }

  // 3. Stop the runtime service. Storage is not touched.
  const problems: string[] = [];
  for (const runtime of runtimes) {
    try {
      const cmd = await awsControl().runLifecycle(runtime.id, runtime.instanceId ?? "demo", "stop-runtime");
      tx = new Tx(r);
      tx.patch("runtimes", runtime, { deploymentState: "suspended", health: "stopped", ready: false });
      tx.insert("deployment_events", {
        orgId, runtimeId: runtime.id, kind: "suspend", status: cmd.status === "failed" ? "failed" : "succeeded",
        detail: `stop-runtime ${cmd.commandId}`, actorId: actor.user.id, correlationId,
      });
      await tx.commit();
    } catch (e) {
      const s = sanitizeRuntimeError(e, correlationId);
      problems.push(s.operator);
    }
  }
  return problems.length
    ? { ok: false, message: `Execution is blocked, but the runtime did not confirm the stop: ${problems[0]}`, correlationId }
    : { ok: true, message: `${org.name} suspended. Bot state is preserved.`, correlationId };
}

/**
 * Reactivate: start the runtime, wait for health, verify capabilities,
 * then mark the organization active. Holds (manual/security) must be
 * cleared first — the operator stays in control.
 */
export async function reactivateClient(r: Repository, actor: Actor, orgId: string): Promise<LifecycleOutcome> {
  const org = await getOrgFor(r, orgId, actor, "ops.clients.suspend");
  const correlationId = newCorrelationId();
  if (org.status !== "suspended" && org.status !== "past_due") {
    return { ok: true, message: `${org.name} is already active.`, correlationId };
  }
  if (org.holds.security) throw conflict("A security hold is in place. Clear it before reactivating.");
  if (org.holds.manual) throw conflict("A manual hold is in place. Clear it before reactivating.");

  const runtimes = await r.list("runtimes", { orgId });
  for (const runtime of runtimes) {
    await awsControl().runLifecycle(runtime.id, runtime.instanceId ?? "demo", "start-runtime");
  }
  // Wait for health (bounded — the sync job keeps checking afterwards).
  let healthy = runtimes.length === 0;
  let lastRuntime: Runtime | undefined;
  for (let attempt = 0; attempt < 6 && !healthy; attempt++) {
    if (attempt > 0) await new Promise((res) => setTimeout(res, 2500));
    healthy = true;
    for (const runtime of runtimes) {
      lastRuntime = await refreshRuntimeHealth(r, runtime.id, refOf(actor));
      if (!lastRuntime.ready) healthy = false;
    }
  }

  const tx = new Tx(r);
  const fresh = (await r.get("organizations", orgId)) as Organization;
  if (!healthy) {
    audit(tx, actor, { action: "client.reactivate", orgId, targetType: "organization", targetId: orgId, correlationId, result: "failure", detail: "runtime not healthy yet" });
    await tx.commit();
    return { ok: false, message: "The runtime is starting but has not passed its health check yet. Try Refresh Health in a minute.", correlationId };
  }
  tx.patch("organizations", fresh, { status: "active", suspension: undefined, eligibleForReactivation: false, holds: { ...fresh.holds, billing: false } });
  for (const runtime of await r.list("runtimes", { orgId })) {
    tx.patch("runtimes", runtime, { deploymentState: "deployed" });
    tx.insert("deployment_events", { orgId, runtimeId: runtime.id, kind: "reactivate", status: "succeeded", detail: "runtime healthy, capabilities verified", actorId: actor.user.id, correlationId });
  }
  tx.insert("billing_events", { orgId, type: "client_reactivated", actorId: actor.user.id, correlationId });
  audit(tx, actor, { action: "client.reactivate", orgId, targetType: "organization", targetId: orgId, correlationId });
  await tx.commit();
  return { ok: true, message: `${org.name} is active again. Bots resume with their existing state.`, correlationId };
}

export async function setHold(r: Repository, actor: Actor, orgId: string, hold: "manual" | "security" | "billing", on: boolean): Promise<Organization> {
  const org = await getOrgFor(r, orgId, actor, "ops.clients.suspend");
  const tx = new Tx(r);
  const next = tx.patch("organizations", org, { holds: { ...org.holds, [hold]: on } });
  const correlationId = newCorrelationId();
  if (hold === "billing") {
    tx.insert("billing_events", { orgId, type: on ? "billing_hold_added" : "billing_hold_removed", actorId: actor.user.id, correlationId });
  }
  audit(tx, actor, { action: `client.hold.${hold}.${on ? "add" : "remove"}`, orgId, targetType: "organization", targetId: orgId, correlationId });
  await tx.commit();
  return next;
}

export async function restartRuntime(r: Repository, actor: Actor, runtimeId: string): Promise<LifecycleOutcome> {
  const runtime = await r.get("runtimes", runtimeId);
  if (!runtime) throw invalid("Unknown runtime.");
  const org = await getOrgFor(r, runtime.orgId, actor, "ops.runtime.control");
  if (org.status === "suspended") throw conflict("This client is suspended. Reactivate instead of restarting.");
  const correlationId = newCorrelationId();
  const cmd = await awsControl().runLifecycle(runtime.id, runtime.instanceId ?? "demo", "restart-runtime");
  const tx = new Tx(r);
  tx.patch("runtimes", runtime, { lastRestartAt: nowIso(), restartCount24h: runtime.restartCount24h + 1 });
  tx.insert("deployment_events", { orgId: org.id, runtimeId, kind: "restart", status: "succeeded", detail: `restart-runtime ${cmd.commandId}`, actorId: actor.user.id, correlationId });
  audit(tx, actor, { action: "runtime.restart", orgId: org.id, targetType: "runtime", targetId: runtimeId, correlationId });
  await tx.commit();
  return { ok: true, message: "Restart requested. Health will update shortly.", correlationId };
}

export async function updateClientProfile(
  r: Repository,
  actor: Actor,
  orgId: string,
  input: Partial<Pick<Organization, "name" | "industry" | "website" | "primaryContactName" | "primaryContactEmail" | "timezone">>,
): Promise<Organization> {
  const org = await getOrgFor(r, orgId, actor, "ops.clients.manage");
  const tx = new Tx(r);
  const next = tx.patch("organizations", org, input);
  audit(tx, actor, { action: "client.update", orgId, targetType: "organization", targetId: orgId, correlationId: newCorrelationId() });
  await tx.commit();
  return next;
}
