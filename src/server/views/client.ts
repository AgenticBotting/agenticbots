import "server-only";
import type { ActivityEvent, Approval, Bot, Integration, IntegrationStatus, Organization, ResultMetric, WorkRequest } from "@/lib/platform/types";
import { getBotType } from "@/config/bot-catalog";
import { clientSafe } from "@/server/redact";

/**
 * Client projections. Every object the client portal renders (and every
 * client API response) is built here. These functions copy only the fields
 * a client is allowed to see — provider, model, profile, credentials,
 * runtime ids, operator notes and errors are dropped by construction, not
 * filtered out after the fact. Free text passes through clientSafe().
 */

export type ClientBotStatus = "Working" | "Monitoring" | "Active" | "Paused" | "Setting up" | "Needs attention";

export interface ClientBotView {
  id: string;
  name: string;
  icon: string;
  status: ClientBotStatus;
  description: string;
  lastActivityAt?: string;
  recentResult?: string;
}

export function clientBotStatus(b: Pick<Bot, "status">, orgSuspended: boolean): ClientBotStatus {
  if (orgSuspended) return "Paused";
  switch (b.status) {
    case "working":
      return "Working";
    case "monitoring":
      return "Monitoring";
    case "active":
      return "Active";
    case "disabled":
      return "Paused";
    case "provisioning":
      return "Setting up";
    case "error":
      return "Needs attention";
  }
}

export function toClientBot(b: Bot, org: Pick<Organization, "status">): ClientBotView {
  const type = getBotType(b.typeKey);
  return {
    id: b.id,
    name: b.name,
    icon: type?.icon ?? "00",
    status: clientBotStatus(b, org.status === "suspended"),
    description: type?.shortDescription ?? "",
    lastActivityAt: b.lastActivityAt,
    recentResult: b.lastResult ? clientSafe(b.lastResult, 180) : undefined,
  };
}

export interface ClientActivityView {
  id: string;
  at: string;
  text: string;
  botName?: string;
  botIcon?: string;
  metrics?: { key: ResultMetric; value: number }[];
}

export function toClientActivity(a: ActivityEvent, bots: Map<string, Bot>): ClientActivityView | null {
  if (a.visibility !== "client") return null;
  const bot = a.botId ? bots.get(a.botId) : undefined;
  return {
    id: a.id,
    at: a.at,
    text: clientSafe(a.text, 240),
    botName: bot?.name,
    botIcon: bot ? getBotType(bot.typeKey)?.icon : undefined,
    metrics: a.metrics,
  };
}

export interface ClientApprovalView {
  id: string;
  botName: string;
  botIcon: string;
  title: string;
  explanation: string;
  expectedImpact: string;
  preview?: string;
  risk: Approval["risk"];
  category: string;
  requestedAt: string;
  expiresAt?: string;
  status: Approval["status"];
  resolvedAt?: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  external_send: "Send messages",
  publish: "Publish content",
  ad_change: "Change ads",
  crm_update: "Update CRM",
  destructive: "Delete or overwrite data",
  runtime_action: "Continue task",
  other: "Approve action",
};

export function toClientApproval(a: Approval, bots: Map<string, Bot>): ClientApprovalView | null {
  if (a.audience !== "client") return null;
  const bot = bots.get(a.botId);
  return {
    id: a.id,
    botName: bot?.name ?? "Bot",
    botIcon: bot ? getBotType(bot.typeKey)?.icon ?? "00" : "00",
    title: clientSafe(a.title, 160),
    explanation: clientSafe(a.explanation, 400),
    expectedImpact: clientSafe(a.expectedImpact, 300),
    preview: a.preview ? clientSafe(a.preview, 1200) : undefined,
    risk: a.risk,
    category: CATEGORY_LABEL[a.category] ?? "Approve action",
    requestedAt: a.requestedAt,
    expiresAt: a.expiresAt,
    status: a.status,
    resolvedAt: a.resolvedAt,
  };
}

export interface ClientRequestView {
  id: string;
  title: string;
  description: string;
  priority: WorkRequest["priority"];
  status: WorkRequest["status"];
  statusLabel: string;
  submittedAt: string;
  completedAt?: string;
  deliverables: { label: string; url?: string; addedAt: string }[];
  messages: { at: string; byName: string; fromAgenticBots: boolean; text: string }[];
}

export const REQUEST_STATUS_LABEL: Record<WorkRequest["status"], string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  in_progress: "In Progress",
  waiting_on_client: "Waiting on you",
  completed: "Completed",
  declined: "Declined",
};

/** Note what is NOT here: assigned operator, assigned Bots, linked runs.
 *  The client cares about the result, not who or what produced it. */
export function toClientRequest(r: WorkRequest): ClientRequestView {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: r.status,
    statusLabel: REQUEST_STATUS_LABEL[r.status],
    submittedAt: r.submittedAt,
    completedAt: r.completedAt,
    deliverables: r.deliverables,
    messages: r.messages.map((m) => ({ at: m.at, byName: m.byName, fromAgenticBots: m.fromAgenticBots, text: clientSafe(m.text, 5000) })),
  };
}

export interface ClientIntegrationView {
  id: string;
  name: string;
  status: "Connected" | "Needs Attention" | "Disconnected";
  purpose?: string;
  message?: string;
}

const STATUS_LABEL: Record<IntegrationStatus, ClientIntegrationView["status"]> = {
  connected: "Connected",
  needs_attention: "Needs Attention",
  disconnected: "Disconnected",
  not_configured: "Disconnected",
};

export function toClientIntegration(i: Integration, purpose?: string): ClientIntegrationView {
  const status = STATUS_LABEL[i.status];
  return {
    id: i.id,
    name: i.provider === "webhook" ? "Event Automation" : i.displayName,
    status,
    purpose,
    message:
      status === "Needs Attention"
        ? `${i.displayName} connection needs attention. AgenticBots will reach out if anything is needed from you.`
        : undefined,
  };
}
