import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { world } from "../support/fixtures";
import { portalData, portalReport } from "@/server/views/portal";
import { CLIENT_FORBIDDEN_TERMS } from "@/server/redact";

/**
 * White-label protection. The client-facing surface must never expose the
 * runtime's identity. Two layers:
 *   1. every client-facing source file (portal pages, portal components,
 *      client API routes, client views) is scanned for forbidden terms;
 *   2. every client payload built from seeded data is scanned too.
 * scripts/white-label-scan.mjs additionally scans the built browser bundles.
 */
const CLIENT_SOURCES = [
  "src/app/page.tsx",
  "src/app/industries",
  "src/components/marketing/AcquisitionAttribution.tsx",
  "src/lib/acquisition-attribution.ts",
  "src/components/marketing/IndustryExperience.tsx",
  "src/lib/search-positioning.ts",
  "src/lib/industries.ts",
  "src/components/marketing/NicheBuyerFlow.tsx",
  "src/components/marketing/NicheDirectory.tsx",
  "src/components/marketing/NicheExperience.tsx",
  "src/lib/public-niche-types.ts",
  "src/lib/public-niches.ts",
  "src/lib/niche-directory.ts",
  "src/lib/niche-planning.ts",
  "src/data/public-niche-catalog.json",
  "src/data/public-niche-routes.json",
  "src/lib/local-search-briefs.ts",
  "src/app/pricing/page.tsx",
  "src/app/about/page.tsx",
  "src/app/how-it-works/page.tsx",
  "src/components/marketing/BotWorkflowStory.tsx",
  "src/components/marketing/WorkforceSystemVisuals.tsx",
  "src/components/marketing/PricingCards.tsx",
  "src/components/marketing/AuditForm.tsx",
  "src/components/marketing/ServiceExperience.tsx",
  "src/components/marketing/ServicePortfolio.tsx",
  "src/components/marketing/ServiceWorkspace.tsx",
  "src/components/marketing/MarketExperience.tsx",
  "src/components/marketing/MarketWorkspace.tsx",
  "src/components/marketing/MarketDirectory.tsx",
  "src/config/marketing-offer.ts",
  "src/lib/marketing/workflow-example.ts",
  "src/lib/service-positioning.ts",
  "src/lib/service-experience.ts",
  "src/lib/market-experience.ts",
  "src/app/portal",
  "src/components/platform/portal.tsx",
  "src/components/platform/RequestBox.tsx",
  "src/components/platform/PortalNav.tsx",
  "src/app/api/bots",
  "src/app/api/requests",
  "src/app/api/activity",
  "src/app/api/approvals",
  "src/app/api/integrations",
  "src/app/api/reports",
  "src/app/login",
  "src/server/views/client.ts",
  "src/server/prospecting/views.ts",
  "src/config/bot-catalog.ts",
  "src/config/integrations.ts",
  "src/lib/platform/metrics.ts",
];

function files(p: string): string[] {
  if (statSync(p).isFile()) return [p];
  return readdirSync(p).flatMap((f) => files(join(p, f)));
}

const TERMS = [...CLIENT_FORBIDDEN_TERMS, "Nous"];

describe("white-label", () => {
  it("client-facing source never names the runtime", () => {
    const hits: string[] = [];
    for (const f of CLIENT_SOURCES.flatMap(files)) {
      const src = readFileSync(f, "utf8");
      for (const t of TERMS) if (src.toLowerCase().includes(t.toLowerCase())) hits.push(`${f}: ${t}`);
    }
    expect(hits).toEqual([]);
  });

  it("client payloads never name the runtime", async () => {
    const w = await world();
    for (const org of [w.acme, w.bayside, w.coastal]) {
      // Random ids (UUIDs, correlation ids) can contain "8642" by chance — strip them first.
      const blob = JSON.stringify([await portalData(org), await portalReport(org, 90)])
        .toLowerCase()
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "<id>")
        .replace(/cor_[a-z0-9_-]{12}/g, "<id>");
      for (const t of TERMS) expect(blob, `payload for ${org.name} contains ${t}`).not.toContain(t.toLowerCase());
    }
  });
});
