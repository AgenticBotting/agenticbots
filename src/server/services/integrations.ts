import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Integration } from "@/lib/platform/types";
import type { IntegrationKey } from "@/config/bot-catalog";
import { getIntegrationDef } from "@/config/integrations";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { correlationId as newCorrelationId, nowIso } from "@/server/ids";
import { botRuntime } from "@/server/runtime";
import { sanitizeRuntimeError } from "@/server/runtime/runtime-errors";
import { awsControl } from "@/server/aws/control";
import { conflict, invalid, notFound } from "@/server/errors";
import { isDemo } from "@/server/env";
import { redactSecrets } from "@/server/redact";
import { audit, getOrgFor, getScoped } from "./common";
import { clearIncident, raiseIncident } from "./incidents";

export async function createIntegration(
  r: Repository,
  actor: Actor,
  input: { orgId: string; provider: IntegrationKey; displayName?: string; secretRef?: string; metadata?: Record<string, string> },
): Promise<Integration> {
  await getOrgFor(r, input.orgId, actor, "ops.integrations.manage");
  const def = getIntegrationDef(input.provider);
  if (!def) throw invalid("Unknown integration type.");
  if (input.secretRef && !/^agenticbots\/(prod|staging|demo)\/tenants\/[a-z0-9-]+\/integrations\/[a-z0-9_-]+$/.test(input.secretRef)) {
    throw invalid("Secret reference must be a path under agenticbots/<env>/tenants/<tenant>/integrations/<name>.");
  }
  const tx = new Tx(r);
  // A new integration is never "connected" until a check or an operator proves it.
  const row = tx.insert("integrations", {
    orgId: input.orgId,
    provider: input.provider,
    displayName: input.displayName?.trim() || def.displayName,
    status: input.secretRef ? "needs_attention" : "not_configured",
    capabilities: [],
    secretRef: input.secretRef,
    botIds: [],
    metadata: input.metadata ?? {},
  });
  audit(tx, actor, { action: "integration.create", orgId: input.orgId, targetType: "integration", targetId: row.id, correlationId: newCorrelationId(), detail: def.displayName });
  await tx.commit();
  return row;
}

/**
 * Automated check. Only reports Connected when the runtime proves the
 * connection is live (its tool connection is present and enabled for a Bot
 * that uses it). Connectors without an automated probe are never marked
 * Connected by a check.
 */
export async function checkIntegration(r: Repository, actor: Actor, integrationId: string): Promise<Integration> {
  const integ = await getScoped(r, "integrations", integrationId, actor, "ops.integrations.manage");
  const correlationId = newCorrelationId();
  const toolset = integ.metadata.toolset;
  let status: Integration["status"] = integ.status;
  let lastError: string | undefined;
  let verifiedBy: Integration["verifiedBy"] = integ.verifiedBy;

  if (isDemo() && integ.metadata.demo === "true") {
    // Seeded demo integrations keep their seeded state — nothing real is probed.
  } else if (!toolset) {
    lastError = "No automated check for this connector. Verify by hand and record it.";
  } else {
    const botId = integ.botIds[0];
    const bot = botId ? await r.get("bots", botId) : null;
    const runtime = bot ? await r.get("runtimes", bot.runtimeId) : null;
    if (!bot || !runtime) {
      lastError = "Assign this integration to a Bot before checking it.";
      status = "needs_attention";
    } else {
      try {
        const sets = await botRuntime(runtime, bot).listBotToolsets();
        const found = sets.find((t) => t.name === toolset);
        if (found?.enabled && found.tools.length > 0) {
          status = "connected";
          verifiedBy = "check";
        } else {
          status = "needs_attention";
          lastError = found ? "Connection present but disabled" : "Connection not found on the Bot";
        }
      } catch (e) {
        status = "needs_attention";
        lastError = sanitizeRuntimeError(e, correlationId).operator;
      }
    }
  }

  const tx = new Tx(r);
  const next = tx.patch("integrations", integ, { status, lastCheckAt: nowIso(), lastError: lastError ? redactSecrets(lastError, 300) : undefined, verifiedBy });
  audit(tx, actor, { action: "integration.check", orgId: integ.orgId, targetType: "integration", targetId: integ.id, correlationId, detail: status });
  await tx.commit();
  if (status === "needs_attention" && integ.status === "connected") {
    await raiseIncident(r, {
      orgId: integ.orgId, type: "integration_failure", severity: "medium", title: `${integ.displayName} needs attention`,
      detail: lastError ?? "Check failed", correlationId, target: integ.id, integrationId: integ.id,
      clientMessage: `${integ.displayName} connection needs attention.`,
    });
  } else if (status === "connected") {
    await clearIncident(r, integ.orgId, "integration_failure", integ.id, { id: actor.user.id, name: actor.user.name });
  }
  return next;
}

/** An operator who has verified a connection by hand records it. Audited. */
export async function setIntegrationStatusManually(
  r: Repository,
  actor: Actor,
  integrationId: string,
  status: Integration["status"],
  evidence: string,
): Promise<Integration> {
  const integ = await getScoped(r, "integrations", integrationId, actor, "ops.integrations.manage");
  if (!["connected", "needs_attention", "disconnected", "not_configured"].includes(status)) throw invalid("Invalid status.");
  if (status === "connected" && evidence.trim().length < 10) {
    throw invalid("Describe how you verified the connection (e.g. 'Test contact created in HubSpot and deleted').");
  }
  const tx = new Tx(r);
  const next = tx.patch("integrations", integ, {
    status,
    verifiedBy: status === "connected" ? "operator" : integ.verifiedBy,
    lastCheckAt: nowIso(),
    lastError: status === "connected" ? undefined : integ.lastError,
  });
  audit(tx, actor, { action: "integration.set_status", orgId: integ.orgId, targetType: "integration", targetId: integ.id, correlationId: newCorrelationId(), detail: `${status}: ${evidence}` });
  await tx.commit();
  return next;
}

/* ───────────────────────────── Webhooks ───────────────────────────── */

export const WEBHOOK_TOLERANCE_S = 300;

export function signWebhook(secret: string, timestamp: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

export function verifyWebhookSignature(secret: string, timestamp: string, body: string, signature: string, now = Date.now()): boolean {
  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > WEBHOOK_TOLERANCE_S) return false;
  const expected = Buffer.from(signWebhook(secret, timestamp, body));
  const got = Buffer.from(signature);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export async function webhookSecretFor(integ: Integration): Promise<string | null> {
  if (isDemo()) {
    // Deterministic demo secret so the demo webhook can be exercised locally.
    return createHmac("sha256", "agenticbots-demo-webhooks").update(integ.id).digest("hex");
  }
  if (!integ.webhookSecretRef) return null;
  const v = await awsControl().getSecretJson<{ secret: string }>(integ.webhookSecretRef);
  return v.secret ?? null;
}

/** Record a delivery id so a replayed webhook is processed at most once. */
export async function claimWebhookDelivery(r: Repository, source: string, externalId: string, orgId?: string): Promise<boolean> {
  const seen = await r.list("processed_webhooks", { where: { source, externalId } });
  if (seen.length > 0) return false;
  const tx = new Tx(r);
  tx.insert("processed_webhooks", { source, externalId, orgId });
  try {
    await tx.commit();
    return true;
  } catch {
    return false;
  }
}

export async function disconnectIntegration(r: Repository, actor: Actor, integrationId: string): Promise<Integration> {
  const integ = await getScoped(r, "integrations", integrationId, actor, "ops.integrations.manage");
  if (integ.status === "disconnected") throw conflict("Already disconnected.");
  const tx = new Tx(r);
  const next = tx.patch("integrations", integ, { status: "disconnected", botIds: [] });
  for (const botId of integ.botIds) {
    const bot = await r.get("bots", botId);
    if (bot) tx.patch("bots", bot, { integrationIds: bot.integrationIds.filter((i) => i !== integ.id) });
  }
  audit(tx, actor, { action: "integration.disconnect", orgId: integ.orgId, targetType: "integration", targetId: integ.id, correlationId: newCorrelationId() });
  await tx.commit();
  return next;
}

export async function getIntegrationScoped(r: Repository, actor: Actor, id: string) {
  const i = await r.get("integrations", id);
  if (!i) throw notFound("Integration");
  return getScoped(r, "integrations", id, actor, "ops.view");
}
