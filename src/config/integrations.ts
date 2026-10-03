/**
 * Integration display registry. Client-safe: names and the plain-English
 * statements a client sees. Technical wiring (secret references, MCP
 * server names, scopes) lives on the integration record and is only ever
 * rendered in the operator console.
 */
import type { IntegrationKey } from "./bot-catalog";

export interface IntegrationDef {
  key: IntegrationKey;
  displayName: string;
  /** What connecting it lets AgenticBots do, in client language. */
  purpose: string;
  /** Whether a real connector exists in this codebase yet. When false the
   *  UI can track it, but it can never be marked Connected by a check —
   *  only by an operator who has verified it by hand (audited). */
  connectorImplemented: boolean;
}

export const INTEGRATIONS: readonly IntegrationDef[] = [
  { key: "google", displayName: "Google Workspace", purpose: "Documents and shared files the Bots work from.", connectorImplemented: false },
  { key: "gmail", displayName: "Gmail", purpose: "Draft and, with your approval, send follow-ups.", connectorImplemented: false },
  { key: "google_calendar", displayName: "Google Calendar", purpose: "See availability and book appointments.", connectorImplemented: false },
  { key: "google_ads", displayName: "Google Ads", purpose: "Monitor spend and search terms; propose changes for approval.", connectorImplemented: false },
  { key: "google_business_profile", displayName: "Google Business Profile", purpose: "Reviews, posts and local presence.", connectorImplemented: false },
  { key: "google_analytics", displayName: "Google Analytics", purpose: "Traffic and conversion reporting.", connectorImplemented: false },
  { key: "google_search_console", displayName: "Google Search Console", purpose: "Search rankings and indexing health.", connectorImplemented: false },
  { key: "meta", displayName: "Meta", purpose: "Facebook and Instagram ad monitoring.", connectorImplemented: false },
  { key: "hubspot", displayName: "HubSpot", purpose: "Keep contacts, deals and follow-ups current.", connectorImplemented: false },
  { key: "servicetitan", displayName: "ServiceTitan", purpose: "Jobs, customers and estimates.", connectorImplemented: false },
  { key: "salesforce", displayName: "Salesforce", purpose: "Keep contacts, opportunities and follow-ups current.", connectorImplemented: false },
  { key: "slack", displayName: "Slack", purpose: "Notifications and approvals in your workspace.", connectorImplemented: false },
  { key: "microsoft_365", displayName: "Microsoft 365", purpose: "Outlook mail and calendar.", connectorImplemented: false },
  { key: "quickbooks", displayName: "QuickBooks", purpose: "Customer and invoice history for reactivation and reporting.", connectorImplemented: false },
  { key: "rest_api", displayName: "Custom API", purpose: "A system specific to your business.", connectorImplemented: true },
  { key: "mcp_server", displayName: "Tool connection", purpose: "A system specific to your business.", connectorImplemented: true },
  { key: "webhook", displayName: "Event Automation", purpose: "Start work automatically when something happens in your systems.", connectorImplemented: true },
];

const BY_KEY = new Map(INTEGRATIONS.map((i) => [i.key, i]));

export function getIntegrationDef(key: string): IntegrationDef | undefined {
  return BY_KEY.get(key as IntegrationKey);
}
