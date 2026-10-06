import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { BOT_CATALOG, BOT_TYPE_KEYS } from "@/config/bot-catalog";
import { SKILLS } from "@/config/skills";
import { ALL_SERVICES } from "@/lib/catalog";
import { TABLE_NAMES } from "@/lib/platform/types";
import { PLATFORM_TABLES } from "../../convex/platformTables";

describe("Bot catalog", () => {
  it("has the ten canonical keys in order", () => {
    expect(BOT_CATALOG.map((b) => b.key)).toEqual([...BOT_TYPE_KEYS]);
    expect(BOT_TYPE_KEYS).toEqual(["ads", "seo", "reviews", "content", "prospecting", "outbound", "reactivation", "crm", "analytics", "proposal"]);
  });
  it("uses the website's names, value propositions and service URLs", () => {
    const want: Record<string, [string, string]> = {
      ads: ["Ads Bot", "/services/agentic-ppc-management"], seo: ["SEO Bot", "/services/agentic-seo"],
      reviews: ["Reviews Bot", "/services/agentic-review-generation"], content: ["Content Bot", "/services/agentic-content-marketing"],
      prospecting: ["Prospecting Bot", "/services/agentic-lead-generation"], outbound: ["Outbound Bot", "/services/agentic-outbound-sdr"],
      reactivation: ["Reactivation Bot", "/services/agentic-customer-reactivation"], crm: ["CRM Bot", "/services/agentic-crm-automation"],
      analytics: ["Analytics Bot", "/services/agentic-analytics"], proposal: ["Proposal Bot", "/services/agentic-proposal-automation"],
    };
    for (const b of BOT_CATALOG) {
      expect([b.displayName, b.serviceRoute]).toEqual(want[b.key]);
      expect(ALL_SERVICES.some((s) => `/services/${s.serviceSlug}` === b.serviceRoute && s.outcome === b.shortDescription)).toBe(true);
    }
    expect(BOT_CATALOG.find((b) => b.key === "ads")!.shortDescription).toBe("Advertising spend is governed through a defined operating cadence and authority model.");
  });
  it("never calls a worker an Agent in product labels", () => {
    for (const b of BOT_CATALOG) expect(b.displayName).not.toMatch(/agent/i);
  });
});

describe("skills manifest", () => {
  it("matches runtime/skills folders and versions", () => {
    const dirs = readdirSync("runtime/skills", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
    expect(SKILLS.map((s) => s.key).sort()).toEqual(dirs);
    for (const s of SKILLS) {
      const md = readFileSync(`runtime/skills/${s.key}/SKILL.md`, "utf8");
      expect(md).toMatch(new RegExp(`^---[\\s\\S]*name: ${s.key}[\\s\\S]*version: ${s.version.replace(/\./g, "\\.")}`));
    }
  });
  it("every default skill exists and is allowed for its Bot", () => {
    for (const b of BOT_CATALOG) for (const k of b.defaultSkills) expect(SKILLS.find((s) => s.key === k)?.botTypes).toContain(b.key);
  });
});

describe("Convex platform tables", () => {
  it("mirror the domain table list", () => {
    expect([...PLATFORM_TABLES]).toEqual([...TABLE_NAMES]);
    expect(existsSync("convex/platform.ts")).toBe(true);
  });
});
