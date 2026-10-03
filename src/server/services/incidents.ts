import "server-only";
import type { Incident, IncidentType } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import { nowIso } from "@/server/ids";
import { redactSecrets } from "@/server/redact";
import { audit, getScoped, type ActorRef } from "./common";
import type { Actor } from "@/server/auth/policy";

/**
 * Incidents dedupe on a fingerprint: the same problem on the same target
 * bumps `occurrences` and `lastSeenAt` instead of opening a new row.
 */
export async function raiseIncident(
  r: Repository,
  input: {
    orgId: string;
    type: IncidentType;
    severity: Incident["severity"];
    title: string;
    detail: string;
    correlationId: string;
    target: string;
    clientMessage?: string;
    botId?: string;
    runId?: string;
    integrationId?: string;
    runtimeId?: string;
  },
): Promise<Incident> {
  const fingerprint = `${input.type}:${input.target}`;
  const open = (await r.list("incidents", { orgId: input.orgId, where: { fingerprint } })).find(
    (i) => i.status === "open" || i.status === "investigating",
  );
  const tx = new Tx(r);
  const now = nowIso();
  let row: Incident;
  if (open) {
    row = tx.patch("incidents", open, {
      lastSeenAt: now,
      occurrences: open.occurrences + 1,
      detail: redactSecrets(input.detail, 600),
      correlationIds: [...open.correlationIds.slice(-9), input.correlationId],
      severity: input.severity,
    });
  } else {
    row = tx.insert("incidents", {
      orgId: input.orgId,
      type: input.type,
      severity: input.severity,
      title: input.title,
      detail: redactSecrets(input.detail, 600),
      clientMessage: input.clientMessage,
      status: "open",
      firstSeenAt: now,
      lastSeenAt: now,
      occurrences: 1,
      correlationIds: [input.correlationId],
      botId: input.botId,
      runId: input.runId,
      integrationId: input.integrationId,
      runtimeId: input.runtimeId,
      fingerprint,
    });
  }
  await tx.commit();
  return row;
}

/** Auto-resolve when the condition clears (e.g. runtime healthy again). */
export async function clearIncident(r: Repository, orgId: string, type: IncidentType, target: string, by: ActorRef): Promise<void> {
  const fingerprint = `${type}:${target}`;
  const open = (await r.list("incidents", { orgId, where: { fingerprint } })).filter(
    (i) => i.status === "open" || i.status === "investigating",
  );
  if (open.length === 0) return;
  const tx = new Tx(r);
  for (const i of open) tx.patch("incidents", i, { status: "resolved", resolvedAt: nowIso(), resolvedBy: by.id });
  await tx.commit();
}

export async function setIncidentStatus(
  r: Repository,
  actor: Actor,
  incidentId: string,
  status: Incident["status"],
  correlationId: string,
): Promise<Incident> {
  const inc = await getScoped(r, "incidents", incidentId, actor, "ops.view");
  const tx = new Tx(r);
  const next = tx.patch("incidents", inc, {
    status,
    ...(status === "resolved" || status === "ignored" ? { resolvedAt: nowIso(), resolvedBy: actor.user.id } : {}),
  });
  audit(tx, actor, { action: `incident.${status}`, orgId: inc.orgId, targetType: "incident", targetId: inc.id, correlationId });
  await tx.commit();
  return next;
}
