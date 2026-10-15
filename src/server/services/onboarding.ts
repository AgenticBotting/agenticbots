import "server-only";
import type {
  ClientOnboarding,
  OnboardingApprovalPolicy,
  OnboardingBotRecommendation,
  OnboardingBudgetPlan,
  OnboardingChecklistItem,
  OnboardingClassification,
  OnboardingDeploymentPlan,
  OnboardingIntegrationRequirement,
  OnboardingIntake,
  OnboardingSkillPlan,
  Organization,
} from "@/lib/platform/types";
import type { BotTypeKey, IntegrationKey } from "@/config/bot-catalog";
import { APPROVAL_DEFAULTS, BOT_CATALOG, botTypeOrThrow } from "@/config/bot-catalog";
import { getIntegrationDef } from "@/config/integrations";
import { getSkill } from "@/config/skills";
import type { Geography, Market, NicheBuyerRelationship, RoleFamily, ServiceNiche } from "@/lib/prospecting/types";
import type { Repository } from "@/server/db/repository";
import { Tx } from "@/server/db/repository";
import type { Actor } from "@/server/auth/policy";
import { can } from "@/server/auth/policy";
import { correlationId, nowIso } from "@/server/ids";
import { conflict, invalid, notFound } from "@/server/errors";
import { audit, getOrgFor } from "@/server/services/common";
import { ctxOf, asUser } from "@/server/prospecting/access";
import { createIcp, createMarket, defaultBuyerTypes, validateGeography } from "@/server/prospecting/markets";
import { configuredPricing, type Pricing } from "@/server/prospecting/providers/registry";
import { ensureOntology } from "@/server/prospecting/ontology/service";
import { normalizeName, stableId } from "@/server/prospecting/ontology/normalize";
import { packsForNiche, type VerticalPack } from "@/server/prospecting/ontology/packs";

export const ONBOARDING_COMPILER_VERSION = "onboarding/compiler-1.0.0";

type CompileOptions = { pricing?: Pricing; now?: Date };

const EMPTY_INTAKE: OnboardingIntake = {
  services: [],
  geographies: [],
  targetCustomerPreferences: [],
  existingCustomerTypes: [],
  exclusions: [],
  goals: [],
};

const STATE_NAMES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY",
  louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY", dc: "DC",
};

const STATE_ABBRS = new Set([...Object.values(STATE_NAMES), "DC"]);

const TERRITORY_ALIASES: { pattern: RegExp; geography: Geography }[] = [
  { pattern: /\bcolumbus(?:,\s*|\s+)(?:oh|ohio)\b|\bcolumbus\b.*\b(?:oh|ohio)\b/i, geography: { kind: "metro", name: "Columbus", state: "OH", radiusMiles: 45 } },
  { pattern: /\btampa(?:,\s*|\s+)(?:fl|florida)\b|\btampa\b.*\b(?:fl|florida)\b/i, geography: { kind: "metro", name: "Tampa", state: "FL", radiusMiles: 50 } },
  { pattern: /\bsouth florida\b/i, geography: { kind: "metro", name: "South Florida", state: "FL" } },
  { pattern: /\bakron(?:,\s*|\s+)(?:oh|ohio)\b|\bakron\b.*\b(?:oh|ohio)\b/i, geography: { kind: "city", name: "Akron", state: "OH", radiusMiles: 20 } },
];

function addOnce<T>(set: Set<T>, value: T | undefined): void {
  if (value !== undefined) set.add(value);
}

function detectServiceType(text: string): OnboardingIntake["serviceType"] | undefined {
  if (/\bresidential[-\s]*only\b|\bhomeowners?\b|\bsingle[-\s]*family\b/i.test(text) && !/\bcommercial\b|\bindustrial\b|\bfacilit(y|ies)\b/i.test(text)) return "residential";
  if (/\bcommercial\b|\bindustrial\b|\bfacilit(y|ies)\b|\bproperty managers?\b|\bmultifamily\b|\bschools?\b|\bmunicipal\b|\bgovernment\b/i.test(text)) return "commercial";
  if (/\bresidential\b/i.test(text) && /\bcommercial\b/i.test(text)) return "mixed";
  return undefined;
}

function detectGeographies(summary: string): Geography[] {
  const found: Geography[] = [];
  for (const alias of TERRITORY_ALIASES) if (alias.pattern.test(summary)) found.push(alias.geography);
  const statePattern = Object.keys(STATE_NAMES).sort((a, b) => b.length - a.length).join("|");
  const explicit = new RegExp(`\\b(?:in|near|around|serving|across)\\s+([A-Z][A-Za-z .'-]{1,40}?)(?:,\\s*|\\s+)(${statePattern}|[A-Z]{2})\\b`, "gi");
  let match: RegExpExecArray | null;
  while ((match = explicit.exec(summary)) !== null) {
    const rawName = match[1].replace(/\b(and|for|with|serving)$/i, "").trim();
    const rawState = match[2].trim();
    const state = rawState.length === 2 ? rawState.toUpperCase() : STATE_NAMES[normalizeName(rawState)];
    if (!rawName || !state || !STATE_ABBRS.has(state)) continue;
    if (found.some((g) => normalizeName(g.name) === normalizeName(rawName) && g.state === state)) continue;
    found.push({ kind: "metro", name: rawName, state });
  }
  return found.slice(0, 4);
}

export function intakeFromBusinessSummary(summary: string, overrides: Partial<OnboardingIntake> = {}): Partial<OnboardingIntake> {
  const text = summary.trim();
  if (!text) throw invalid("Enter a business summary.");
  const hay = normalizeName(text);
  const services = new Set<string>();
  if (/roof|reroof|tpo|coating|leak repair/.test(hay)) addOnce(services, hay.includes("commercial") ? "commercial roofing" : "roofing");
  if (/\bhvac\b|mechanical|chiller|rtu|air conditioning|refrigeration/.test(hay)) addOnce(services, hay.includes("commercial") ? "commercial HVAC" : "HVAC");
  if (/asphalt|paving|sealcoat|striping|parking/.test(hay)) addOnce(services, "asphalt paving");
  if (/review/.test(hay)) addOnce(services, "reviews");
  const preferences = new Set<string>();
  if (/property managers?/.test(hay)) preferences.add("property managers");
  if (/schools?/.test(hay)) preferences.add("schools");
  if (/industrial/.test(hay)) preferences.add("industrial buildings");
  if (/multifamily|apartments?/.test(hay)) preferences.add("multifamily owners");
  if (/facilit(y|ies)/.test(hay)) preferences.add("facilities teams");
  if (/government|municipal|public sector/.test(hay)) preferences.add("government buyers");
  if (/homeowners?/.test(hay)) preferences.add("homeowners");
  const exclusions = new Set<string>();
  if (/\bno residential\b|\bnot residential\b|\bexclude residential\b/.test(hay)) exclusions.add("residential");
  if (/\bresidential[-\s]*only\b/.test(hay)) exclusions.add("commercial buyers");
  const goals = new Set<string>();
  if (/prospect|lead|outbound|market|tam|icp/.test(hay)) goals.add("build initial ICP and market plan");
  return mergeIntake({
    ...EMPTY_INTAKE,
    description: text,
    services: [...services],
    serviceType: detectServiceType(text),
    geographies: detectGeographies(text),
    targetCustomerPreferences: [...preferences],
    exclusions: [...exclusions],
    goals: [...goals],
  }, overrides);
}

function allowedForOnboarding(actor: Actor, orgId: string, write = false): boolean {
  return can(actor, write ? "ops.clients.manage" : "ops.view", orgId) || can(actor, write ? "portal.requests.create" : "portal.view", orgId);
}

function assertOnboardingAccess(actor: Actor, orgId: string, write = false): void {
  if (!allowedForOnboarding(actor, orgId, write)) throw notFound("Onboarding");
}

function mergeIntake(base: OnboardingIntake, patch: Partial<OnboardingIntake>): OnboardingIntake {
  return {
    ...base,
    ...patch,
    services: patch.services ?? base.services ?? [],
    geographies: patch.geographies ?? base.geographies ?? [],
    targetCustomerPreferences: patch.targetCustomerPreferences ?? base.targetCustomerPreferences ?? [],
    existingCustomerTypes: patch.existingCustomerTypes ?? base.existingCustomerTypes ?? [],
    exclusions: patch.exclusions ?? base.exclusions ?? [],
    goals: patch.goals ?? base.goals ?? [],
  };
}

export async function startClientOnboarding(r: Repository, actor: Actor, orgId: string, intake: Partial<OnboardingIntake> = {}): Promise<ClientOnboarding> {
  const org = await getOrgFor(r, orgId, actor, "ops.clients.manage");
  const existing = (await r.list("client_onboardings", { orgId })).find((o) => !["active", "cancelled"].includes(o.stage));
  if (existing) return existing;
  const now = nowIso();
  const tx = new Tx(r);
  const row = tx.insert("client_onboardings", {
    orgId,
    stage: "draft",
    readiness: "not_ready",
    intake: mergeIntake({ ...EMPTY_INTAKE, businessName: org.name, website: org.website }, intake),
    recommendedBotStack: [],
    recommendedIcpIds: [],
    recommendedBuyerTypeIds: [],
    recommendedDecisionMakerRoleFamilies: [],
    recommendedMarkets: [],
    marketBuildIds: [],
    integrationRequirements: [],
    skillPlan: [],
    approvalPolicies: [],
    budgetPlan: { status: "not_needed", reasoning: [] },
    outstandingClientActions: [],
    outstandingOperatorActions: [],
    readinessBlockers: [],
    decisions: [],
    compilerVersion: ONBOARDING_COMPILER_VERSION,
    createdAt: now,
  });
  audit(tx, actor, { action: "onboarding.start", orgId, targetType: "client_onboarding", targetId: row.id, correlationId: correlationId() });
  await tx.commit();
  return row;
}

export async function getClientOnboarding(r: Repository, actor: Actor, onboardingId: string): Promise<ClientOnboarding> {
  const row = await r.get("client_onboardings", onboardingId);
  if (!row || !allowedForOnboarding(actor, row.orgId)) throw notFound("Onboarding");
  return row;
}

export async function updateOnboardingIntake(r: Repository, actor: Actor, onboardingId: string, patch: Partial<OnboardingIntake>): Promise<ClientOnboarding> {
  const row = await getClientOnboarding(r, actor, onboardingId);
  assertOnboardingAccess(actor, row.orgId, true);
  const tx = new Tx(r);
  const next = tx.patch("client_onboardings", row, {
    intake: mergeIntake(row.intake, patch),
    stage: "intake_complete",
  });
  audit(tx, actor, { action: "onboarding.intake.update", orgId: row.orgId, targetType: "client_onboarding", targetId: row.id, correlationId: correlationId() });
  await tx.commit();
  return next;
}

export async function recordOnboardingDecision(r: Repository, actor: Actor, onboardingId: string, input: { key: string; value: string | number | boolean | string[] | null; note?: string }): Promise<ClientOnboarding> {
  const row = await getClientOnboarding(r, actor, onboardingId);
  if (!can(actor, "ops.clients.manage", row.orgId)) throw notFound("Onboarding");
  const decisions = row.decisions.filter((d) => d.key !== input.key);
  decisions.push({ key: input.key, value: input.value, note: input.note?.slice(0, 500), decidedBy: actor.user.id, decidedAt: nowIso() });
  const tx = new Tx(r);
  const next = tx.patch("client_onboardings", row, { decisions });
  audit(tx, actor, { action: "onboarding.decision.record", orgId: row.orgId, targetType: "client_onboarding", targetId: row.id, correlationId: correlationId(), detail: input.key });
  await tx.commit();
  return next;
}

function decision<T>(row: ClientOnboarding, key: string): T | undefined {
  const found = row.decisions.find((d) => d.key === key);
  return found?.value as T | undefined;
}

function textForClassification(org: Organization, intake: OnboardingIntake): string {
  return normalizeName([
    intake.businessName ?? org.name,
    intake.website ?? org.website ?? "",
    intake.description ?? "",
    org.industry ?? "",
    ...intake.services,
    ...intake.targetCustomerPreferences,
    ...intake.existingCustomerTypes,
    ...intake.goals,
  ].join(" "));
}

function classify(org: Organization, niches: ServiceNiche[], intake: OnboardingIntake): OnboardingClassification {
  const forced = undefined as string | undefined;
  const hay = textForClassification(org, intake);
  const serviceType = intake.serviceType;
  const scored = niches.map((n) => {
    const terms = [n.name, n.category, n.normalizedName, ...n.tags].map(normalizeName);
    let score = 0;
    for (const t of terms) {
      if (!t) continue;
      if (hay.includes(t)) score += t === normalizeName(n.name) ? 12 : 4;
      for (const part of t.split(" ")) if (part.length > 3 && hay.includes(part)) score += 1;
    }
    if (serviceType && (n.sellsTo === serviceType || n.sellsTo === "mixed")) score += 3;
    if (/roof|reroof|tpo|coating/.test(hay) && n.tags.includes("roofing")) score += 16;
    if (/\bhvac\b|mechanical|chiller|rtu|air conditioning|refrigeration/.test(hay) && (n.tags.includes("mechanical_hvac") || n.tags.includes("refrigeration"))) score += 16;
    if (/asphalt|paving|sealcoat|striping|parking/.test(hay) && n.tags.includes("paving_parking")) score += 16;
    if (/residential|homeowner/.test(hay) && n.sellsTo === "residential") score += 5;
    return { niche: n, score };
  }).sort((a, b) => b.score - a.score || b.niche.attractiveness.total - a.niche.attractiveness.total || a.niche.id.localeCompare(b.niche.id));
  const top = scored[0];
  const second = scored[1];
  const confidence = top ? Math.min(0.98, Math.round((top.score / Math.max(18, top.score + (second?.score ?? 0))) * 100) / 100) : 0;
  const reviewRequired = !top || top.score < 8 || (!!second && top.score - second.score < 3);
  const pack = top ? packsForNiche(top.niche.tags)[0] : undefined;
  return {
    primaryNicheId: forced ?? top?.niche.id,
    primaryNicheName: top?.niche.name,
    secondaryNicheIds: scored.slice(1, 4).filter((x) => x.score > 0).map((x) => x.niche.id),
    category: top?.niche.category,
    sellsTo: top?.niche.sellsTo,
    confidence,
    reviewRequired,
    reasoning: top ? [`Matched intake to ${top.niche.name} using service terms, category, sells-to profile and vertical tags.`, ...(second ? [`Next closest niche: ${second.niche.name}.`] : [])] : ["No service niche matched the intake strongly enough."],
    verticalPackKey: pack?.key,
    verticalPackLabel: pack?.label,
    prospectabilityScore: top?.niche.attractiveness.total,
    clientFitScore: top ? Math.round((top.niche.attractiveness.total * (serviceType === "residential" ? 0.75 : 1)) * 10) / 10 : undefined,
  };
}

function allowedBuyerForIntake(buyerName: string, buyerKind: string, intake: OnboardingIntake): boolean {
  const hay = normalizeName([...intake.targetCustomerPreferences, ...intake.existingCustomerTypes].join(" "));
  const exclusions = normalizeName(intake.exclusions.join(" "));
  if (exclusions && buyerName.split(" ").some((p) => p.length > 3 && exclusions.includes(p))) return false;
  if (intake.serviceType === "residential") return buyerKind === "consumer" || buyerKind === "community" || buyerName.includes("homeowner") || buyerName.includes("hoa");
  if (!hay) return buyerKind !== "consumer";
  return buyerName.split(" ").some((p) => p.length > 3 && hay.includes(p)) || buyerKind !== "consumer";
}

function recommendBots(classification: OnboardingClassification, pack: VerticalPack | undefined, intake: OnboardingIntake): OnboardingBotRecommendation[] {
  const residentialOnly = intake.serviceType === "residential" && !/commercial|industrial|property|facility|business/i.test([intake.description, ...intake.targetCustomerPreferences, ...intake.existingCustomerTypes].join(" "));
  const recommended = new Set<BotTypeKey>(residentialOnly ? ["seo", "reviews", "crm", "analytics"] : ["seo", "ads", "prospecting", "outbound", "crm", "analytics"]);
  if (pack?.key === "commercial-roofing" || pack?.key === "hvac-mechanical" || pack?.key === "paving") recommended.add("content");
  const optional = new Set<BotTypeKey>(["reviews", "reactivation", "proposal", "content"]);
  return BOT_CATALOG.map((b) => {
    const status = recommended.has(b.key) ? "recommended" : optional.has(b.key) ? "optional" : "not_recommended";
    return {
      botType: b.key,
      status,
      reasoning: status === "recommended"
        ? [`${b.displayName} has clear value for ${classification.verticalPackLabel ?? "this client"} based on the intake.`]
        : status === "optional"
          ? [`${b.displayName} may help after the core deployment is stable.`]
          : [`${b.displayName} is not part of the lean initial stack for this intake.`],
    };
  });
}

function integrationRequirements(botStack: OnboardingBotRecommendation[]): OnboardingIntegrationRequirement[] {
  const rows = new Map<IntegrationKey, OnboardingIntegrationRequirement>();
  for (const rec of botStack.filter((b) => b.status === "recommended")) {
    const type = botTypeOrThrow(rec.botType);
    for (const key of type.allowedIntegrations) {
      const def = getIntegrationDef(key);
      if (!def) continue;
      const current = rows.get(key);
      const requirement = ["google_ads", "google_search_console", "google_analytics", "google_business_profile", "gmail", "microsoft_365", "hubspot", "salesforce", "servicetitan"].includes(key)
        ? "recommended"
        : "optional";
      const next: OnboardingIntegrationRequirement = current ?? {
        provider: key,
        displayName: def.displayName,
        requirement,
        botTypes: [],
        clientAction: !["rest_api", "mcp_server", "webhook"].includes(key),
        reasoning: [def.purpose],
      };
      if (!next.botTypes.includes(rec.botType)) next.botTypes.push(rec.botType);
      if (requirement === "recommended" && next.requirement === "optional") next.requirement = "recommended";
      rows.set(key, next);
    }
  }
  for (const r of rows.values()) {
    if (r.botTypes.includes("ads") && r.provider === "google_ads") r.requirement = "required";
    if (r.botTypes.includes("outbound") && (r.provider === "gmail" || r.provider === "microsoft_365")) r.requirement = "required";
    if (r.botTypes.includes("crm") && ["hubspot", "salesforce", "servicetitan"].includes(r.provider)) r.requirement = "recommended";
  }
  return [...rows.values()].sort((a, b) => a.requirement.localeCompare(b.requirement) || a.displayName.localeCompare(b.displayName));
}

function skillPlan(botStack: OnboardingBotRecommendation[]): OnboardingSkillPlan[] {
  const out: OnboardingSkillPlan[] = [];
  for (const rec of botStack.filter((b) => b.status === "recommended")) {
    const type = botTypeOrThrow(rec.botType);
    for (const key of type.defaultSkills) {
      const skill = getSkill(key);
      out.push({ botType: rec.botType, skillKey: key, skillVersion: skill?.version ?? "unknown", status: skill ? "planned" : "incompatible", reasoning: skill ? `Default skill for ${type.displayName}.` : "Skill manifest entry is missing." });
    }
  }
  return out;
}

function approvalPolicies(): OnboardingApprovalPolicy[] {
  const capabilityPolicies = Object.entries(APPROVAL_DEFAULTS).map(([capability, needsApproval]) => {
    const action = capability === "external_send" ? "external_send" : capability === "publish" ? "publish" : capability === "ad_change" ? "ad_change" : capability === "crm_update" ? "crm_update" : "recommendation_generation";
    return {
      action,
      defaultPolicy: needsApproval ? "approval_required" : "automatic",
      audience: needsApproval ? "client" : "operator",
      reasoning: needsApproval ? "This action changes an external system or sends something outside AgenticBots." : "Read-only research and drafts are safe to run automatically.",
    } as OnboardingApprovalPolicy;
  });
  return [
    { action: "analytics_read", defaultPolicy: "automatic", audience: "operator", reasoning: "Reading analytics does not change external systems." },
    { action: "seo_research", defaultPolicy: "automatic", audience: "operator", reasoning: "SEO research is read-only." },
    ...capabilityPolicies,
    { action: "budget_increase", defaultPolicy: "approval_required", audience: "operator", reasoning: "Bots cannot approve or raise spend." },
    { action: "delete_data", defaultPolicy: "prohibited", audience: "operator", reasoning: "Deletion is not part of the default onboarding policy." },
  ];
}

function budgetPlan(botStack: OnboardingBotRecommendation[], marketCount: number, pricing: Pricing, intake: OnboardingIntake): OnboardingBudgetPlan {
  const needsProspecting = botStack.some((b) => b.botType === "prospecting" && b.status === "recommended");
  if (!needsProspecting || marketCount === 0) return { status: "not_needed", reasoning: ["No initial paid prospecting acquisition is proposed for this onboarding plan."] };
  const configured = Object.values(pricing).flatMap((x) => Object.entries(x)).filter(([, v]) => typeof v === "number" && v > 0);
  if (configured.length === 0) return { status: "budget_requires_configuration", reasoning: ["Provider pricing is not configured, so the compiler refuses to invent a data acquisition budget."] };
  const unit = configured.reduce((s, [, v]) => s + Number(v), 0) / configured.length;
  const proposed = Math.min(intake.implementationBudgetUsd ? intake.implementationBudgetUsd * 0.25 : 500, Math.max(50, Math.ceil(unit * 25 * marketCount * 3)));
  return { status: "operator_approval_required", proposedMaxUsd: proposed, reasoning: ["Initial data acquisition budget is proposed from configured provider prices, number of planned markets, and a conservative first-pass enrichment depth.", "Operator approval is required before any spend."] };
}

function clientActions(reqs: OnboardingIntegrationRequirement[], intake: OnboardingIntake): OnboardingChecklistItem[] {
  const out: OnboardingChecklistItem[] = [];
  if (intake.geographies.length === 0) out.push({ key: "confirm-territory", label: "Confirm service territory", owner: "client", status: "open", blocking: true });
  for (const r of reqs.filter((x) => x.requirement === "required" && x.clientAction)) {
    out.push({ key: `connect-${r.provider}`, label: `Connect ${r.displayName}`, owner: "client", status: "open", blocking: true, reason: r.reasoning[0] });
  }
  if (reqs.some((r) => r.botTypes.includes("outbound"))) out.push({ key: "approve-outbound-policy", label: "Approve outbound sending policy", owner: "client", status: "open", blocking: true });
  return out;
}

function operatorActions(classification: OnboardingClassification, budget: OnboardingBudgetPlan, blockers: string[]): OnboardingChecklistItem[] {
  const out: OnboardingChecklistItem[] = [];
  if (classification.reviewRequired) out.push({ key: "review-niche", label: "Review ambiguous service niche classification", owner: "operator", status: "open", blocking: true });
  if (budget.status === "budget_requires_configuration") out.push({ key: "configure-pricing", label: "Configure provider pricing before paid data acquisition", owner: "operator", status: "open", blocking: true });
  if (budget.status === "operator_approval_required") out.push({ key: "approve-data-budget", label: "Approve initial prospecting data budget", owner: "operator", status: "open", blocking: true });
  out.push({ key: "approve-bot-stack", label: "Approve recommended Bot stack", owner: "operator", status: "open", blocking: true });
  out.push({ key: "approve-deployment", label: "Approve final deployment plan", owner: "operator", status: blockers.length ? "blocked" : "open", blocking: true });
  return out;
}

function deploymentPlan(row: ClientOnboarding, botStack: OnboardingBotRecommendation[], reqs: OnboardingIntegrationRequirement[], skillRows: OnboardingSkillPlan[], providersConfigured: boolean): OnboardingDeploymentPlan {
  return {
    runtime: { kind: "client_runtime", region: "us-east-2", status: providersConfigured ? "draft" : "blocked" },
    bots: botStack.filter((b) => b.status !== "not_recommended").map((b) => {
      const type = botTypeOrThrow(b.botType);
      return { botType: b.botType, runtimeProfile: type.runtimeProfile, status: b.status === "recommended" ? "planned" : "optional", skillKeys: skillRows.filter((s) => s.botType === b.botType && s.status === "planned").map((s) => s.skillKey), integrationKeys: type.allowedIntegrations.filter((k) => reqs.some((r) => r.provider === k)) };
    }),
    integrations: reqs,
    marketBuildIds: row.marketBuildIds,
    providerConfiguration: { required: true, status: providersConfigured ? "configured" : "missing" },
    notes: ["Draft only. No runtime, OAuth connection, provider call or AWS resource is created by onboarding compilation."],
  };
}

async function findOrCreateIcp(r: Repository, actor: Actor, row: ClientOnboarding, niche: ServiceNiche, buyerTypeIds: string[], families: RoleFamily[]): Promise<string> {
  const ctx = ctxOf(r, asUser(actor));
  const existingId = row.recommendedIcpIds[0];
  if (existingId && await ctx.store.get("pg_icps", existingId)) return existingId;
  const name = `${niche.name} ICP`;
  const existing = (await ctx.store.list("pg_icps", { orgId: row.orgId })).find((i) => i.name === name && i.nicheIds.includes(niche.id));
  if (existing) return existing.id;
  return (await createIcp(ctx, row.orgId, {
    name,
    nicheIds: [niche.id],
    services: row.intake.services,
    geographies: row.intake.geographies,
    minOpportunityUsd: row.intake.minimumOpportunityUsd,
    preferredBuyerTypeIds: buyerTypeIds,
    exclusions: row.intake.exclusions,
    decisionMakerRoleFamilies: families,
    notes: "Generated by onboarding compiler; review before deployment.",
  })).id;
}

async function findOrCreateMarket(r: Repository, actor: Actor, row: ClientOnboarding, niche: ServiceNiche, icpId: string, geography: Geography, buyerTypeIds: string[]): Promise<Market> {
  const ctx = ctxOf(r, asUser(actor));
  const g = validateGeography(geography);
  const existing = (await ctx.store.list("pg_markets", { orgId: row.orgId })).find((m) => m.icpId === icpId && m.nicheId === niche.id && m.geography.kind === g.kind && m.geography.name === g.name && m.geography.state === g.state);
  if (existing) return existing;
  return createMarket(ctx, row.orgId, { nicheId: niche.id, icpId, geography: g, buyerTypeIds });
}

async function findOrCreateMarketBuild(r: Repository, actor: Actor, row: ClientOnboarding, market: Market, niche: ServiceNiche, pack: VerticalPack | undefined, budget: OnboardingBudgetPlan): Promise<string> {
  const ctx = ctxOf(r, asUser(actor));
  const existing = (await ctx.store.list("pg_market_builds", { orgId: row.orgId })).find((b) => b.marketId === market.id && ["draft", "planned", "approval_required"].includes(b.status));
  if (existing) return existing.id;
  const tx = ctx.store.tx();
  const build = tx.insert("pg_market_builds", {
    id: stableId(`marketbuild_${row.id}_${market.id}`),
    orgId: row.orgId,
    icpId: market.icpId,
    marketId: market.id,
    nicheId: niche.id,
    geography: market.geography,
    buyerTypeIds: market.buyerTypeIds,
    discoveryStrategy: pack?.discoveryRecipes ?? [],
    maxDataAcquisitionBudgetUsd: budget.proposedMaxUsd ?? 0,
    companyDiscoveryCount: 0,
    companyResearchCount: 0,
    qualifiedCompanyCount: 0,
    decisionMakersRequested: 0,
    decisionMakersFound: 0,
    contactsVerified: 0,
    providerSpendUsd: 0,
    coverageMethodology: "Draft onboarding plan only. Market totals remain unknown until discovery runs.",
    status: budget.status === "operator_approval_required" ? "approval_required" : "planned",
    createdBy: actor.user.id,
  });
  audit(tx.audit, actor, { action: "onboarding.market_build.plan", orgId: row.orgId, targetType: "market_build", targetId: build.id, correlationId: correlationId(), detail: market.name });
  await tx.commit();
  return build.id;
}

export async function compileOnboardingPlan(r: Repository, actor: Actor, onboardingId: string, opts: CompileOptions = {}): Promise<ClientOnboarding> {
  const row = await getClientOnboarding(r, actor, onboardingId);
  if (!can(actor, "ops.clients.manage", row.orgId)) throw notFound("Onboarding");
  await ensureOntology(r);
  const org = await r.get("organizations", row.orgId);
  if (!org) throw notFound("Client");
  const ctx = ctxOf(r, asUser(actor), opts.now ?? new Date());
  const niches = await ctx.store.list("pg_niches");
  const classification = classify(org, niches, row.intake);
  const confirmedNicheId = decision<string>(row, "confirmed_niche_id");
  if (confirmedNicheId) {
    const confirmed = await ctx.store.get("pg_niches", confirmedNicheId);
    if (confirmed) Object.assign(classification, { primaryNicheId: confirmed.id, primaryNicheName: confirmed.name, category: confirmed.category, sellsTo: confirmed.sellsTo, reviewRequired: false, confidence: 1, reasoning: ["Operator confirmed this service niche."], verticalPackKey: packsForNiche(confirmed.tags)[0]?.key, verticalPackLabel: packsForNiche(confirmed.tags)[0]?.label });
  }
  const niche = classification.primaryNicheId ? await ctx.store.get("pg_niches", classification.primaryNicheId) : null;
  if (!niche) throw conflict("Onboarding needs a service niche before it can compile a deployment plan.");
  const pack = packsForNiche(niche.tags)[0];
  let buyerTypeIds = await defaultBuyerTypes(ctx, niche.id);
  const buyers = await Promise.all(buyerTypeIds.map((id) => ctx.store.get("pg_buyer_types", id)));
  buyerTypeIds = buyers
    .filter((b): b is NonNullable<typeof b> => !!b)
    .filter((b) => allowedBuyerForIntake(normalizeName(b.name), b.buyerKind, row.intake))
    .slice(0, 6)
    .map((b) => b.id);
  if (buyerTypeIds.length === 0) buyerTypeIds = (await defaultBuyerTypes(ctx, niche.id)).slice(0, 3);
  const rels = (await ctx.store.list("pg_relationships", { where: { nicheId: niche.id } }))
    .filter((rel): rel is NicheBuyerRelationship => buyerTypeIds.includes(rel.buyerTypeId) && (rel.status === "approved" || rel.status === "auto_approved"))
    .sort((a, b) => a.priority - b.priority || b.confidence - a.confidence);
  const families = [...new Set<RoleFamily>([...rels.flatMap((r) => r.relevantRoleFamilies), ...(pack?.roleFamilies ?? [])])].slice(0, 8);
  const botStack = recommendBots(classification, pack, row.intake);
  const overriddenStack = decision<string[]>(row, "bot_stack");
  const finalBotStack = overriddenStack?.length
    ? botStack.map((b) => ({ ...b, status: overriddenStack.includes(b.botType) ? "recommended" as const : b.status === "recommended" ? "optional" as const : b.status }))
    : botStack;
  const reqs = integrationRequirements(finalBotStack);
  const skills = skillPlan(finalBotStack);
  const pricing = opts.pricing ?? configuredPricing();
  const budget = budgetPlan(finalBotStack, Math.max(1, row.intake.geographies.length), pricing, row.intake);
  const approvedBudget = decision<number>(row, "approved_data_budget_usd");
  if (typeof approvedBudget === "number") {
    budget.status = "approved";
    budget.proposedMaxUsd = approvedBudget;
    budget.reasoning = ["Operator approved the initial data acquisition budget."];
  }
  const icpId = await findOrCreateIcp(r, actor, row, niche, buyerTypeIds, families);
  const markets: Market[] = [];
  for (const g of row.intake.geographies) markets.push(await findOrCreateMarket(r, actor, row, niche, icpId, g, buyerTypeIds));
  const marketBuildIds: string[] = [];
  for (const m of markets) marketBuildIds.push(await findOrCreateMarketBuild(r, actor, row, m, niche, pack, budget));
  const providerConfigured = (await r.list("provider_configurations")).some((p) => p.status === "operational" && p.models.length > 0);
  const blockers: string[] = [];
  if (classification.reviewRequired) blockers.push("Service niche needs operator review.");
  if (row.intake.geographies.length === 0) blockers.push("Service territory is missing.");
  if (budget.status === "budget_requires_configuration" || budget.status === "operator_approval_required") blockers.push("Initial prospecting data budget is not approved.");
  if (!providerConfigured) blockers.push("Model provider configuration is missing.");
  if (reqs.some((r) => r.requirement === "required")) blockers.push("Required client integrations are not connected yet.");
  const client = clientActions(reqs, row.intake);
  const operator = operatorActions(classification, budget, blockers);
  const deployment = deploymentPlan({ ...row, marketBuildIds }, finalBotStack, reqs, skills, providerConfigured);
  const readiness = blockers.length === 0 ? "ready_to_provision" : "ready_for_review";
  const stage = readiness === "ready_to_provision" ? "ready_to_provision" : classification.reviewRequired ? "review_required" : "ready_for_operator_approval";
  const tx = new Tx(r);
  const next = tx.patch("client_onboardings", row, {
    stage,
    readiness,
    classification,
    recommendedBotStack: finalBotStack,
    recommendedIcpIds: [icpId],
    recommendedBuyerTypeIds: buyerTypeIds,
    recommendedDecisionMakerRoleFamilies: families,
    recommendedMarkets: markets.map((m) => m.id),
    marketBuildIds,
    integrationRequirements: reqs,
    skillPlan: skills,
    approvalPolicies: approvalPolicies(),
    budgetPlan: budget,
    deploymentPlan: deployment,
    outstandingClientActions: client,
    outstandingOperatorActions: operator,
    readinessBlockers: blockers,
    compilerVersion: ONBOARDING_COMPILER_VERSION,
    lastCompiledAt: (opts.now ?? new Date()).toISOString(),
  });
  audit(tx, actor, { action: "onboarding.compile", orgId: row.orgId, targetType: "client_onboarding", targetId: row.id, correlationId: correlationId(), detail: ONBOARDING_COMPILER_VERSION });
  await tx.commit();
  return next;
}
