/**
 * The AgenticBots Bot Catalog — the canonical list of Bot TYPES.
 *
 * The marketing site (src/lib/catalog.ts) is the source of truth for copy,
 * service URLs and the numeral identity. This file selects the ten Bot
 * types the platform sells and operates, and adds the operational fields
 * (capabilities, default skills, allowed integrations) the website never
 * needed. Nothing in the authenticated product hardcodes a Bot name: it
 * reads from here, so renaming a Bot on the website renames it everywhere.
 *
 * Client-safe: no runtime vocabulary lives in this file.
 */

import { getServiceByCategorySlug, type Service } from "@/lib/catalog";

export const BOT_TYPE_KEYS = [
  "ads",
  "seo",
  "reviews",
  "content",
  "prospecting",
  "outbound",
  "reactivation",
  "crm",
  "analytics",
  "proposal",
] as const;

export type BotTypeKey = (typeof BOT_TYPE_KEYS)[number];

export type BotCategory = "marketing" | "sales";

/** Capabilities are coarse permission families, not features. Anything
 *  marked `write` is gated by approval policy (see APPROVAL_DEFAULTS). */
export type Capability =
  | "research"
  | "monitor"
  | "report"
  | "draft"
  | "external_send"
  | "publish"
  | "ad_change"
  | "crm_update";

export type IntegrationKey =
  | "google"
  | "gmail"
  | "google_calendar"
  | "google_ads"
  | "google_business_profile"
  | "google_analytics"
  | "google_search_console"
  | "meta"
  | "hubspot"
  | "servicetitan"
  | "salesforce"
  | "slack"
  | "microsoft_365"
  | "quickbooks"
  | "rest_api"
  | "mcp_server"
  | "webhook";

export interface BotType {
  key: BotTypeKey;
  displayName: string;
  /** Value proposition, verbatim from the website's service page. */
  shortDescription: string;
  /** One-line blurb from the website, for denser surfaces. */
  blurb: string;
  serviceRoute: string;
  /** The website's zero-padded numeral — the brand's icon system for Bots. */
  icon: string;
  category: BotCategory;
  displayOrder: number;
  defaultCapabilities: Capability[];
  /** Keys into src/config/skills.ts. Least capability: only these by default. */
  defaultSkills: string[];
  allowedIntegrations: IntegrationKey[];
  enabledByDefault: boolean;
  /** The runtime profile name a deployment of this Bot uses. Server-side
   *  only in effect; kept here so provisioning never invents names. */
  runtimeProfile: string;
}

interface Operational {
  categorySlug: string;
  defaultCapabilities: Capability[];
  defaultSkills: string[];
  allowedIntegrations: IntegrationKey[];
  enabledByDefault: boolean;
}

const OPERATIONAL: Record<BotTypeKey, Operational> = {
  ads: {
    categorySlug: "paid-media",
    defaultCapabilities: ["research", "monitor", "report", "ad_change"],
    defaultSkills: ["google-ads-analysis"],
    allowedIntegrations: ["google_ads", "meta", "google_analytics", "hubspot", "servicetitan"],
    enabledByDefault: true,
  },
  seo: {
    categorySlug: "seo",
    defaultCapabilities: ["research", "monitor", "report", "draft", "publish"],
    defaultSkills: ["seo-analysis"],
    allowedIntegrations: ["google_search_console", "google_business_profile", "google_analytics"],
    enabledByDefault: true,
  },
  reviews: {
    categorySlug: "reviews",
    defaultCapabilities: ["monitor", "draft", "external_send", "publish"],
    defaultSkills: ["review-generation"],
    allowedIntegrations: ["google_business_profile", "servicetitan", "hubspot", "gmail"],
    enabledByDefault: true,
  },
  content: {
    categorySlug: "content",
    defaultCapabilities: ["research", "draft", "publish"],
    defaultSkills: ["content-production"],
    allowedIntegrations: ["google_business_profile", "google", "meta"],
    enabledByDefault: false,
  },
  prospecting: {
    categorySlug: "lead-generation",
    defaultCapabilities: ["research", "report", "crm_update"],
    defaultSkills: ["prospecting"],
    allowedIntegrations: ["hubspot", "salesforce", "google"],
    enabledByDefault: true,
  },
  outbound: {
    categorySlug: "outbound",
    defaultCapabilities: ["draft", "external_send", "crm_update"],
    defaultSkills: ["follow-up"],
    allowedIntegrations: ["gmail", "microsoft_365", "hubspot", "salesforce", "google_calendar"],
    enabledByDefault: true,
  },
  reactivation: {
    categorySlug: "reactivation",
    defaultCapabilities: ["research", "draft", "external_send", "crm_update"],
    defaultSkills: ["reactivation", "follow-up"],
    allowedIntegrations: ["servicetitan", "hubspot", "quickbooks", "gmail"],
    enabledByDefault: false,
  },
  crm: {
    categorySlug: "crm",
    defaultCapabilities: ["monitor", "report", "crm_update"],
    defaultSkills: ["crm-hygiene"],
    allowedIntegrations: ["hubspot", "salesforce", "servicetitan", "gmail", "google_calendar"],
    enabledByDefault: true,
  },
  analytics: {
    categorySlug: "analytics",
    defaultCapabilities: ["research", "monitor", "report"],
    defaultSkills: ["google-ads-analysis", "seo-analysis"],
    allowedIntegrations: ["google_analytics", "google_ads", "meta", "hubspot", "servicetitan", "quickbooks"],
    enabledByDefault: true,
  },
  proposal: {
    categorySlug: "enablement",
    defaultCapabilities: ["draft", "external_send", "crm_update"],
    defaultSkills: ["proposal-automation"],
    allowedIntegrations: ["hubspot", "servicetitan", "quickbooks", "gmail", "google"],
    enabledByDefault: false,
  },
};

function build(key: BotTypeKey, order: number): BotType {
  const op = OPERATIONAL[key];
  const svc: Service | undefined = getServiceByCategorySlug(op.categorySlug);
  if (!svc) {
    throw new Error(`bot-catalog: website catalog has no service for "${op.categorySlug}"`);
  }
  return {
    key,
    displayName: svc.botName,
    shortDescription: svc.outcome,
    blurb: svc.blurb,
    serviceRoute: `/services/${svc.serviceSlug}`,
    icon: svc.index,
    category: svc.pillar,
    displayOrder: order,
    defaultCapabilities: op.defaultCapabilities,
    defaultSkills: op.defaultSkills,
    allowedIntegrations: op.allowedIntegrations,
    enabledByDefault: op.enabledByDefault,
    runtimeProfile: key,
  };
}

export const BOT_CATALOG: readonly BotType[] = BOT_TYPE_KEYS.map((k, i) => build(k, i + 1));

const BY_KEY = new Map(BOT_CATALOG.map((b) => [b.key, b]));

export function getBotType(key: string): BotType | undefined {
  return BY_KEY.get(key as BotTypeKey);
}

export function botTypeOrThrow(key: string): BotType {
  const t = getBotType(key);
  if (!t) throw new Error(`Unknown Bot type: ${key}`);
  return t;
}

export function isBotTypeKey(key: string): key is BotTypeKey {
  return BY_KEY.has(key as BotTypeKey);
}

/** Which capability families require a human approval by default. Read-only
 *  research runs autonomously; anything that leaves the building does not. */
export const APPROVAL_DEFAULTS: Record<Capability, boolean> = {
  research: false,
  monitor: false,
  report: false,
  draft: false,
  external_send: true,
  publish: true,
  ad_change: true,
  crm_update: true,
};
