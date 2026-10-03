import "server-only";
import type { Bot, Organization } from "@/lib/platform/types";
import { repo } from "@/server/db";
import { getIntegrationDef } from "@/config/integrations";
import {
  toClientActivity, toClientApproval, toClientBot, toClientIntegration, toClientRequest,
  type ClientActivityView, type ClientApprovalView, type ClientBotView, type ClientIntegrationView, type ClientRequestView,
} from "./client";
import { clientReport, type ClientReport } from "@/server/services/reports";

/**
 * Everything the client portal renders for one organization, already
 * projected into client views. Portal pages import only this module and
 * the view types — never repositories or raw records.
 */
export interface PortalData {
  bots: ClientBotView[];
  activity: ClientActivityView[];
  approvals: ClientApprovalView[];
  requests: ClientRequestView[];
  integrations: ClientIntegrationView[];
  notices: string[];
}

export async function portalData(org: Organization): Promise<PortalData> {
  const r = await repo();
  const [bots, activity, approvals, requests, integrations, incidents] = await Promise.all([
    r.list("bots", { orgId: org.id, order: "asc" }), r.list("activity_events", { orgId: org.id }), r.list("approvals", { orgId: org.id }),
    r.list("requests", { orgId: org.id }), r.list("integrations", { orgId: org.id, order: "asc" }), r.list("incidents", { orgId: org.id }),
  ]);
  const botMap = new Map<string, Bot>(bots.map((b) => [b.id, b]));
  return {
    // Bots still being set up are shown; nothing technical about them is.
    bots: bots.map((b) => toClientBot(b, org)),
    activity: activity
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((a) => toClientActivity(a, botMap))
      .filter((x): x is ClientActivityView => !!x),
    approvals: approvals.map((a) => toClientApproval(a, botMap)).filter((x): x is ClientApprovalView => !!x),
    requests: requests.map(toClientRequest),
    integrations: integrations
      .filter((i) => i.status !== "not_configured")
      .map((i) => toClientIntegration(i, getIntegrationDef(i.provider)?.purpose)),
    notices: [
      ...(org.status === "suspended" ? ["Service is paused. Contact AgenticBots to resume — your Bots' history and settings are kept."] : []),
      ...incidents.filter((i) => (i.status === "open" || i.status === "investigating") && i.clientMessage).map((i) => i.clientMessage!),
    ],
  };
}

export async function portalReport(org: Organization, days = 30): Promise<ClientReport> {
  return clientReport(await repo(), org.id, days);
}
