import { describe, expect, it, vi } from "vitest";
import { world } from "../support/fixtures";
import { Tx } from "@/server/db/repository";
import type { Geography, SellsTo } from "@/lib/prospecting/types";
import type { Organization } from "@/lib/platform/types";
import {
  compileOnboardingPlan,
  getClientOnboarding,
  recordOnboardingDecision,
  startClientOnboarding,
  updateOnboardingIntake,
} from "@/server/services/onboarding";

const NOW = new Date("2026-10-04T12:00:00.000Z");

const columbus: Geography = { kind: "metro", name: "Columbus", state: "OH", radiusMiles: 45 };
const tampa: Geography = { kind: "metro", name: "Tampa", state: "FL", radiusMiles: 50 };
const southFlorida: Geography = { kind: "metro", name: "South Florida", state: "FL" };
const local: Geography = { kind: "city", name: "Akron", state: "OH", radiusMiles: 20 };

async function addOrg(slug: string, name: string, industry: string, sellsTo?: SellsTo) {
  const w = await world();
  const tx = new Tx(w.r);
  const org = tx.insert("organizations", {
    name,
    slug,
    status: "onboarding",
    tenantId: `${slug}-test`,
    environment: "demo",
    industry,
    website: `https://${slug}.example`,
    primaryContactName: "Demo Owner",
    primaryContactEmail: `owner@${slug}.example`,
    timezone: "America/New_York",
    holds: { manual: false, security: false, billing: false },
  }) as Organization;
  await tx.commit();
  return { ...w, org, sellsTo };
}

describe("client onboarding compiler", () => {
  it("compiles a commercial roofing intake into ICP, MarketBuild, Bot stack and review-ready plan without external calls", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const w = await addOrg("buckeye-roofing", "Buckeye Commercial Roofing", "Commercial roofing");
    const ob = await startClientOnboarding(w.r, w.operator, w.org.id, {
      description: "Commercial roofer in Columbus, Ohio selling maintenance, repairs, coatings and reroofs to property managers, schools, industrial buildings, and multifamily owners.",
      services: ["commercial roofing", "TPO reroof", "roof coatings", "leak repair"],
      serviceType: "commercial",
      geographies: [columbus],
      minimumOpportunityUsd: 15000,
      targetCustomerPreferences: ["property managers", "schools", "industrial buildings", "multifamily owners"],
      exclusions: ["single-family retail repair"],
      goals: ["build initial TAM/ICP", "qualified commercial prospects", "outbound after approval"],
    });
    const plan = await compileOnboardingPlan(w.r, w.operator, ob.id, { now: NOW, pricing: { demo: { people_search: 0.05, email_finding: 0.03, email_verification: 0.01 } } });

    expect(plan.stage).toBe("ready_for_operator_approval");
    expect(plan.readiness).toBe("ready_for_review");
    expect(plan.classification).toMatchObject({ primaryNicheName: "Commercial Roofing", reviewRequired: false, verticalPackKey: "commercial-roofing" });
    expect(plan.recommendedIcpIds).toHaveLength(1);
    expect(plan.recommendedMarkets).toHaveLength(1);
    expect(plan.marketBuildIds).toHaveLength(1);
    expect(plan.recommendedDecisionMakerRoleFamilies).toEqual(expect.arrayContaining(["facilities", "property_management"]));
    expect(plan.recommendedBotStack.filter((b) => b.status === "recommended").map((b) => b.botType)).toEqual(expect.arrayContaining(["seo", "ads", "prospecting", "outbound", "crm", "analytics"]));
    expect(plan.integrationRequirements.some((i) => i.provider === "google_ads" && i.requirement === "required")).toBe(true);
    expect(plan.approvalPolicies).toEqual(expect.arrayContaining([expect.objectContaining({ action: "external_send", defaultPolicy: "approval_required" }), expect.objectContaining({ action: "delete_data", defaultPolicy: "prohibited" })]));
    expect(plan.budgetPlan).toMatchObject({ status: "operator_approval_required" });
    const market = await w.r.get("pg_markets", plan.recommendedMarkets[0]);
    expect(market?.universeEstimate).toBeUndefined();
    const build = await w.r.get("pg_market_builds", plan.marketBuildIds[0]);
    expect(build).toMatchObject({ status: "approval_required", coverageMethodology: expect.stringMatching(/unknown until discovery/i) });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("is deterministic and rerunnable without duplicate ICP, Market or MarketBuild rows", async () => {
    const w = await addOrg("det-roofing", "Deterministic Roofing", "Commercial roofing");
    const ob = await startClientOnboarding(w.r, w.operator, w.org.id, {
      description: "Commercial roofing contractor in Columbus for property managers.",
      services: ["commercial roofing"],
      serviceType: "commercial",
      geographies: [columbus],
    });
    const a = await compileOnboardingPlan(w.r, w.operator, ob.id, { now: NOW, pricing: { demo: { people_search: 0.05 } } });
    const b = await compileOnboardingPlan(w.r, w.operator, ob.id, { now: NOW, pricing: { demo: { people_search: 0.05 } } });
    expect(b.recommendedIcpIds).toEqual(a.recommendedIcpIds);
    expect(b.recommendedMarkets).toEqual(a.recommendedMarkets);
    expect(b.marketBuildIds).toEqual(a.marketBuildIds);
    expect(await w.r.list("pg_icps", { orgId: w.org.id })).toHaveLength(1);
    expect(await w.r.list("pg_markets", { orgId: w.org.id })).toHaveLength(1);
    expect(await w.r.list("pg_market_builds", { orgId: w.org.id })).toHaveLength(1);
  });

  it("preserves manual Bot stack overrides on recompile", async () => {
    const w = await addOrg("manual-roofing", "Manual Roofing", "Commercial roofing");
    const ob = await startClientOnboarding(w.r, w.operator, w.org.id, {
      description: "Commercial roofing contractor in Columbus.",
      services: ["commercial roofing"],
      serviceType: "commercial",
      geographies: [columbus],
    });
    await recordOnboardingDecision(w.r, w.operator, ob.id, { key: "bot_stack", value: ["seo", "analytics"], note: "Start lean." });
    const plan = await compileOnboardingPlan(w.r, w.operator, ob.id, { now: NOW, pricing: { demo: { people_search: 0.05 } } });
    const statuses = new Map(plan.recommendedBotStack.map((b) => [b.botType, b.status]));
    expect(statuses.get("seo")).toBe("recommended");
    expect(statuses.get("analytics")).toBe("recommended");
    expect(statuses.get("prospecting")).toBe("optional");
  });

  it("marks weak business classification for review instead of forcing a niche", async () => {
    const w = await addOrg("ambiguous", "North Star Services", "Local services");
    const ob = await startClientOnboarding(w.r, w.operator, w.org.id, {
      description: "We help local customers with projects.",
      services: ["general services"],
      geographies: [local],
    });
    const plan = await compileOnboardingPlan(w.r, w.operator, ob.id, { now: NOW });
    expect(plan.stage).toBe("review_required");
    expect(plan.classification?.reviewRequired).toBe(true);
    expect(plan.outstandingOperatorActions.some((a) => a.key === "review-niche")).toBe(true);
  });

  it("handles HVAC Tampa and paving South Florida demo scenarios", async () => {
    const hvac = await addOrg("tampa-mechanical", "Tampa Mechanical", "Commercial HVAC");
    const hvacOb = await startClientOnboarding(hvac.r, hvac.operator, hvac.org.id, { description: "Commercial HVAC and mechanical service in Tampa for facilities teams.", services: ["commercial HVAC", "RTU replacement", "maintenance agreements"], serviceType: "commercial", geographies: [tampa] });
    const hvacPlan = await compileOnboardingPlan(hvac.r, hvac.operator, hvacOb.id, { now: NOW, pricing: { demo: { people_search: 0.04 } } });
    expect(hvacPlan.classification?.verticalPackKey).toBe("hvac-mechanical");

    const paving = await addOrg("south-florida-paving", "South Florida Paving", "Asphalt paving");
    const pavingOb = await startClientOnboarding(paving.r, paving.operator, paving.org.id, { description: "Asphalt paving, sealcoating and striping for commercial parking lots in South Florida.", services: ["asphalt paving", "sealcoating", "striping"], serviceType: "commercial", geographies: [southFlorida] });
    const pavingPlan = await compileOnboardingPlan(paving.r, paving.operator, pavingOb.id, { now: NOW, pricing: { demo: { people_search: 0.04 } } });
    expect(pavingPlan.classification?.verticalPackKey).toBe("paving");
  });

  it("does not give a residential-only local business the commercial prospecting stack", async () => {
    const w = await addOrg("akron-home-roof", "Akron Home Roof Repair", "Residential roofing");
    const ob = await startClientOnboarding(w.r, w.operator, w.org.id, { description: "Residential-only roof repair for homeowners near Akron.", services: ["roof repair"], serviceType: "residential", geographies: [local], targetCustomerPreferences: ["homeowners"], exclusions: ["commercial property managers"] });
    const plan = await compileOnboardingPlan(w.r, w.operator, ob.id, { now: NOW, pricing: { demo: { people_search: 0.04 } } });
    const statuses = new Map(plan.recommendedBotStack.map((b) => [b.botType, b.status]));
    expect(statuses.get("prospecting")).not.toBe("recommended");
    expect(statuses.get("outbound")).not.toBe("recommended");
    expect(statuses.get("seo")).toBe("recommended");
  });

  it("refuses to fabricate a data budget when provider pricing is missing", async () => {
    const w = await addOrg("budget-roofing", "Budget Roofing", "Commercial roofing");
    const ob = await startClientOnboarding(w.r, w.operator, w.org.id, { description: "Commercial roofing contractor in Columbus.", services: ["commercial roofing"], serviceType: "commercial", geographies: [columbus] });
    const plan = await compileOnboardingPlan(w.r, w.operator, ob.id, { now: NOW, pricing: {} });
    expect(plan.budgetPlan).toMatchObject({ status: "budget_requires_configuration" });
    expect(plan.budgetPlan.proposedMaxUsd).toBeUndefined();
    expect(plan.readinessBlockers).toContain("Initial prospecting data budget is not approved.");
  });

  it("enforces tenant isolation and only lets operators compile", async () => {
    const w = await world();
    const ob = await startClientOnboarding(w.r, w.operator, w.acme.id, { description: "Commercial roofing in Columbus.", services: ["commercial roofing"], serviceType: "commercial", geographies: [columbus] });
    await expect(getClientOnboarding(w.r, w.member, ob.id)).resolves.toMatchObject({ id: ob.id });
    await expect(getClientOnboarding(w.r, w.owner, "missing")).rejects.toMatchObject({ status: 404 });
    await expect(compileOnboardingPlan(w.r, w.owner, ob.id, { now: NOW })).rejects.toMatchObject({ status: 404 });
    const scoped = { ...w.operator, user: { ...w.operator.user, operatorOrgIds: [w.bayside.id] } };
    await expect(getClientOnboarding(w.r, scoped, ob.id)).rejects.toMatchObject({ status: 404 });
  });

  it("lets a client provide intake but not infrastructure work", async () => {
    const w = await world();
    const ob = await startClientOnboarding(w.r, w.operator, w.acme.id);
    const updated = await updateOnboardingIntake(w.r, w.owner, ob.id, { description: "Commercial roofing in Columbus.", services: ["commercial roofing"], serviceType: "commercial", geographies: [columbus] });
    expect(updated.stage).toBe("intake_complete");
    await expect(compileOnboardingPlan(w.r, w.owner, ob.id, { now: NOW })).rejects.toMatchObject({ status: 404 });
  });
});
