import "server-only";
import type { WorkRequest, RequestStatus } from "@/lib/platform/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import { can, type Actor } from "@/server/auth/policy";
import { correlationId as newCorrelationId, nowIso } from "@/server/ids";
import { conflict, invalid, notFound } from "@/server/errors";
import { redactSecrets } from "@/server/redact";
import { assertExecutable, audit, getScoped } from "./common";
import { startRun } from "./runs";

const MAX_TITLE = 160;
const MAX_BODY = 5000;

/** Client submits a request. The client never picks a Bot. */
export async function createRequest(
  r: Repository,
  actor: Actor,
  orgId: string,
  input: { title: string; description: string; priority?: WorkRequest["priority"] },
): Promise<WorkRequest> {
  if (!can(actor, "portal.requests.create", orgId) && !can(actor, "ops.requests.manage", orgId)) throw notFound();
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 3) throw invalid("Give the request a short title.");
  if (title.length > MAX_TITLE) throw invalid(`Title must be under ${MAX_TITLE} characters.`);
  if (description.length > MAX_BODY) throw invalid("Description is too long.");
  const priority = input.priority ?? "normal";
  if (!["low", "normal", "high", "urgent"].includes(priority)) throw invalid("Invalid priority.");
  const tx = new Tx(r);
  const req = tx.insert("requests", {
    orgId,
    title,
    description,
    priority,
    status: "submitted",
    submittedBy: actor.user.id,
    submittedAt: nowIso(),
    assignedBotIds: [],
    linkedRunIds: [],
    linkedApprovalIds: [],
    deliverables: [],
    messages: [],
    attachments: [],
  });
  tx.insert("activity_events", {
    orgId, at: nowIso(), requestId: req.id, visibility: "client",
    text: `New request submitted: ${title}`,
  });
  audit(tx, actor, { action: "request.create", orgId, targetType: "request", targetId: req.id, correlationId: newCorrelationId() });
  await tx.commit();
  return req;
}

/** Loads a request the actor may see — client (own org) or operator. */
export async function getRequestFor(r: Repository, actor: Actor, id: string): Promise<WorkRequest> {
  const req = await r.get("requests", id);
  if (!req) throw notFound("Request");
  if (can(actor, "ops.view", req.orgId) || can(actor, "portal.view", req.orgId)) return req;
  throw notFound("Request");
}

export async function addMessage(r: Repository, actor: Actor, id: string, text: string): Promise<WorkRequest> {
  const req = await getRequestFor(r, actor, id);
  const operator = can(actor, "ops.requests.manage", req.orgId);
  if (!operator && !can(actor, "portal.requests.comment", req.orgId)) throw notFound("Request");
  const body = text.trim();
  if (!body) throw invalid("Message is empty.");
  if (body.length > MAX_BODY) throw invalid("Message is too long.");
  const tx = new Tx(r);
  const next = tx.patch("requests", req, {
    messages: [
      ...req.messages,
      { at: nowIso(), by: actor.user.id, byName: operator ? "AgenticBots" : actor.user.name, fromAgenticBots: operator, text: redactSecrets(body, MAX_BODY) },
    ],
    // A client reply to a clarification puts the request back in review.
    status: !operator && req.status === "waiting_on_client" ? "reviewing" : req.status,
  });
  audit(tx, actor, { action: "request.message", orgId: req.orgId, targetType: "request", targetId: req.id, correlationId: newCorrelationId() });
  await tx.commit();
  return next;
}

const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  submitted: ["reviewing", "in_progress", "waiting_on_client", "declined", "completed"],
  reviewing: ["in_progress", "waiting_on_client", "declined", "completed"],
  in_progress: ["waiting_on_client", "completed", "reviewing", "declined"],
  waiting_on_client: ["reviewing", "in_progress", "completed", "declined"],
  completed: ["in_progress"],
  declined: ["reviewing"],
};

export async function updateRequest(
  r: Repository,
  actor: Actor,
  id: string,
  changes: {
    status?: RequestStatus;
    assignedOperatorId?: string | null;
    assignedBotIds?: string[];
    deliverable?: { label: string; url?: string };
    clarification?: string;
  },
): Promise<WorkRequest> {
  const req = await getScoped(r, "requests", id, actor, "ops.requests.manage");
  const patch: Partial<WorkRequest> = {};
  if (changes.status && changes.status !== req.status) {
    if (!ALLOWED_TRANSITIONS[req.status].includes(changes.status)) {
      throw conflict(`A ${req.status.replace(/_/g, " ")} request cannot move to ${changes.status.replace(/_/g, " ")}.`);
    }
    patch.status = changes.status;
    if (changes.status === "completed") patch.completedAt = nowIso();
  }
  if (changes.assignedOperatorId !== undefined) {
    patch.assignedOperatorId = changes.assignedOperatorId ?? undefined;
  }
  if (changes.assignedBotIds) {
    const bots = await r.list("bots", { orgId: req.orgId });
    const valid = new Set(bots.map((b) => b.id));
    if (!changes.assignedBotIds.every((b) => valid.has(b))) throw invalid("Unknown Bot for this client.");
    patch.assignedBotIds = changes.assignedBotIds;
  }
  if (changes.deliverable) {
    const label = changes.deliverable.label.trim();
    if (!label) throw invalid("Deliverable needs a label.");
    const url = changes.deliverable.url?.trim();
    if (url && !/^https:\/\//.test(url)) throw invalid("Deliverable links must be https.");
    patch.deliverables = [...req.deliverables, { label, url: url || undefined, addedAt: nowIso() }];
  }
  if (changes.clarification) {
    patch.status = "waiting_on_client";
    patch.messages = [
      ...req.messages,
      { at: nowIso(), by: actor.user.id, byName: "AgenticBots", fromAgenticBots: true, text: redactSecrets(changes.clarification, MAX_BODY) },
    ];
  }
  const tx = new Tx(r);
  const next = tx.patch("requests", req, patch);
  if (patch.status === "completed") {
    tx.insert("activity_events", { orgId: req.orgId, at: nowIso(), requestId: req.id, visibility: "client", text: `Request completed: ${req.title}` });
  }
  audit(tx, actor, {
    action: "request.update",
    orgId: req.orgId,
    targetType: "request",
    targetId: req.id,
    correlationId: newCorrelationId(),
    detail: Object.keys(patch).join(", "),
  });
  await tx.commit();
  return next;
}

/** Operator routes a request to a Bot and starts the work. */
export async function startRunForRequest(
  r: Repository,
  actor: Actor,
  requestId: string,
  botId: string,
  task: string,
  idempotencyKey: string,
) {
  const req = await getScoped(r, "requests", requestId, actor, "ops.requests.manage");
  const org = await r.get("organizations", req.orgId);
  if (!org) throw notFound("Request");
  assertExecutable(org);
  const bot = await r.get("bots", botId);
  if (!bot || bot.orgId !== req.orgId) throw notFound("Bot");
  return startRun(r, actor, { botId, task: task || `${req.title}\n\n${req.description}`, requestId, idempotencyKey });
}
