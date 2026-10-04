/**
 * AgenticBots skill library manifest.
 *
 * The skill bodies live in runtime/skills/<key>/SKILL.md and are deployed
 * to each Bot's runtime by the provisioning CLI. This manifest is what the
 * operator console reads: name, version, and which Bot types may receive
 * the skill. A test (tests/unit/skills.test.ts) fails the build if this
 * manifest and the folders drift apart.
 *
 * Operator-only. Clients never browse the skill library.
 */
import type { BotTypeKey } from "./bot-catalog";

export interface SkillDef {
  key: string;
  name: string;
  version: string;
  description: string;
  /** Least capability: a skill can only be assigned to these Bot types. */
  botTypes: BotTypeKey[];
  /** True when the skill can trigger write actions; those still go through approvals. */
  writes: boolean;
}

export const SKILLS: readonly SkillDef[] = [
  { key: "prospecting", name: "Prospect research", version: "1.1.0", description: "Find, enrich and qualify commercial prospects against an ideal-customer profile.", botTypes: ["prospecting", "outbound"], writes: false },
  { key: "seo-analysis", name: "Local SEO analysis", version: "1.0.0", description: "Crawl, rank-track and find local-search content opportunities.", botTypes: ["seo", "analytics", "content"], writes: false },
  { key: "follow-up", name: "Follow-up drafting", version: "1.0.0", description: "Draft follow-up and outreach messages for human approval before sending.", botTypes: ["outbound", "reactivation", "proposal"], writes: true },
  { key: "google-ads-analysis", name: "Google Ads analysis", version: "1.0.0", description: "Review search terms, spend and conversions; propose negatives and budget moves.", botTypes: ["ads", "analytics"], writes: false },
  { key: "crm-hygiene", name: "CRM hygiene", version: "1.0.0", description: "Detect stale stages, duplicates and missing next steps; propose CRM updates.", botTypes: ["crm", "prospecting", "reactivation"], writes: true },
  { key: "review-generation", name: "Review requests", version: "1.0.0", description: "Prepare review requests after completed jobs and draft replies to new reviews.", botTypes: ["reviews"], writes: true },
  { key: "content-production", name: "Content production", version: "1.0.0", description: "Research topics and draft content for approval before publishing.", botTypes: ["content", "seo"], writes: true },
  { key: "reactivation", name: "Customer reactivation", version: "1.0.0", description: "Find past customers, dormant leads and unclosed estimates worth a follow-up.", botTypes: ["reactivation"], writes: false },
  { key: "proposal-automation", name: "Proposal drafting", version: "1.0.0", description: "Build proposals from site notes and price books; route for approval.", botTypes: ["proposal"], writes: true },
];

const BY_KEY = new Map(SKILLS.map((s) => [s.key, s]));

export function getSkill(key: string): SkillDef | undefined {
  return BY_KEY.get(key);
}

export function skillAllowedFor(skillKey: string, botType: BotTypeKey): boolean {
  return getSkill(skillKey)?.botTypes.includes(botType) ?? false;
}
