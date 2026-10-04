/**
 * AgenticBots Prospect Graph — domain types.
 *
 * Types only (no runtime code), so UI can import them safely. What a
 * client actually SEES is decided by src/server/prospecting/views.ts.
 *
 * Two kinds of records, kept apart on purpose:
 *
 *   SHARED MARKET INTELLIGENCE  (no orgId)
 *     ontology (niches, buyer types, relationships), companies, people,
 *     contact points, email patterns, signals, source records.
 *     Public/commercial facts that may be reused across AgenticBots.
 *     These records must never carry client-private fields.
 *
 *   PRIVATE CLIENT INTELLIGENCE  (orgId required)
 *     ICPs, markets, prospects, jobs, cost events, budgets, client
 *     suppression, outbound handoffs, outcomes. Never readable by another
 *     organization; enforced in the service layer on every call.
 */
import type { Base, ID, ISODate } from "@/lib/platform/types";

/* ───────────────────────────── Ontology ───────────────────────────── */

/** "Sells To" as found in the seed CSV. Utility/Agricultural appear in the data. */
export type SellsTo = "residential" | "commercial" | "industrial" | "government" | "mixed" | "utility" | "agricultural";

export type Tier = "A" | "B" | "C";

/** Where a record's value came from. */
export type ReviewStatus = "auto_approved" | "needs_review" | "approved" | "rejected";

export interface ModeledScore {
  /** 0–100. A modeled strategic score — not an objective fact. */
  total: number;
  /** Each component 0–10, before weighting. */
  components: Record<string, number>;
  weights: Record<string, number>;
  reasoning: string[];
  /** 0–1: how much of the input was explicit vs. inferred from defaults. */
  confidence: number;
  version: string;
}

export interface ServiceNiche extends Base {
  /** Stable, derived from category + niche name (`niche_<slug>`). */
  key: string;
  category: string;
  categoryKey: string;
  /** Display name, preserved as imported. */
  name: string;
  normalizedName: string;
  sellsTo: SellsTo;
  /** Raw values exactly as imported. */
  original: { category: string; niche: string; sellsTo: string };
  /** Semantic tags the scoring and relationship rules use. */
  tags: string[];
  attractiveness: ModeledScore;
  tier: Tier;
  importRunId: ID;
}

export interface BuyerType extends Base {
  key: string;
  segment: string;
  segmentKey: string;
  name: string;
  normalizedName: string;
  /** Titles as imported, split on ";". */
  decisionMakerTitles: string[];
  /** Role families derived from the titles. */
  roleFamilies: RoleFamily[];
  tags: string[];
  /** Referral sources and consumers are not direct commercial buyers. */
  buyerKind: "institutional" | "commercial" | "community" | "referral" | "consumer";
  original: { segment: string; customerType: string; titles: string };
  importRunId: ID;
}

export type RelationshipType =
  | "direct" | "subcontract" | "referral" | "bid" | "channel" | "institutional" | "residential" | "other";

export interface NicheBuyerRelationship extends Base {
  nicheId: ID;
  buyerTypeId: ID;
  /** 1 (highest) … 5. */
  priority: number;
  /** 0–1. */
  confidence: number;
  relationshipType: RelationshipType;
  relevantDecisionMakerTitles: string[];
  relevantRoleFamilies: RoleFamily[];
  buyingMotion: "recurring_service" | "project" | "emergency" | "inspection_compliance" | "bid_procurement" | "referral";
  recurringPotential: number; // 0–10
  contractValuePotential: number; // 0–10
  outboundSuitability: number; // 0–10
  bidBoardSuitability: number; // 0–10
  seoSuitability: number; // 0–10
  ppcSuitability: number; // 0–10
  publicSignalAvailability: number; // 0–10
  status: ReviewStatus;
  /** "rules" for generated, "operator" once a person approved/edited it. */
  source: "rules" | "operator" | "llm";
  reasoning: string[];
  /** Generator version that produced it — approved rows are never regenerated. */
  generatorVersion: string;
  reviewedBy?: ID;
  reviewedAt?: ISODate;
  reviewNote?: string;
}

export interface ImportRun extends Base {
  kind: "niches" | "buyer_types";
  fileName: string;
  /** sha256 of the file contents. Same hash = nothing to do. */
  contentHash: string;
  rowsRead: number;
  inserted: number;
  updated: number;
  unchanged: number;
  duplicates: { row: number; key: string; firstRow: number }[];
  malformed: { row: number; reason: string; raw: string }[];
  importerVersion: string;
  importedBy: string;
}

/* ───────────────────────────── People / titles ───────────────────────────── */

export type RoleFamily =
  | "facilities"
  | "engineering_maintenance"
  | "property_management"
  | "asset_management"
  | "operations"
  | "owner_executive"
  | "general_management"
  | "procurement"
  | "construction_project"
  | "estimating_preconstruction"
  | "design_principal"
  | "community_board"
  | "public_works"
  | "safety_ehs"
  | "finance_admin"
  | "sales_marketing"
  | "clinical_admin"
  | "education_admin"
  | "homeowner"
  | "other";

export type Seniority = "owner_c_level" | "vp" | "director" | "manager" | "individual" | "unknown";

/* ───────────────────────────── Geography / markets ───────────────────────────── */

export interface Geography {
  kind: "county" | "city" | "metro" | "state" | "zip" | "radius";
  /** e.g. "Broward County" */
  name: string;
  /** Two-letter state. */
  state: string;
  zips?: string[];
  center?: { lat: number; lng: number };
  radiusMiles?: number;
}

export interface ClientIcp extends Base {
  orgId: ID;
  name: string;
  nicheIds: ID[];
  services: string[];
  geographies: Geography[];
  minOpportunityUsd?: number;
  preferredBuyerTypeIds: ID[];
  excludedBuyerTypeIds: ID[];
  /** Free-text exclusions (private). */
  exclusions: string[];
  decisionMakerRoleFamilies: RoleFamily[];
  /** Private client strategy notes — never shared. */
  notes?: string;
  status: "draft" | "active" | "archived";
  createdBy: ID;
}

export interface Market extends Base {
  orgId: ID;
  icpId?: ID;
  nicheId: ID;
  geography: Geography;
  buyerTypeIds: ID[];
  name: string;
  status: "active" | "paused" | "archived";
  /** Only set when a methodology exists. Never invented. */
  universeEstimate?: { count: number; methodology: string; version: string; estimatedAt: ISODate };
  lastRefreshedAt?: ISODate;
  /** Per-source discovery progress. Exhaustion is OBSERVED, never assumed. */
  discovery: MarketSourceState[];
  createdBy: ID;
}

export interface MarketSourceState {
  /** Neutral provider key. */
  provider: string;
  buyerTypeId: ID;
  cursor?: string;
  /** True only when the source itself reported no further results. */
  exhausted: boolean;
  runs: number;
  companiesSeen: number;
  lastNewCompanies: number;
  lastRunAt: ISODate;
}

/* ───────────────────────────── Provenance ───────────────────────────── */

/** Attached to every externally sourced fact. */
export interface Provenance {
  /** Neutral provider key ("demo", "native", or an adapter key). */
  provider: string;
  externalId?: string;
  sourceUrl?: string;
  observedAt: ISODate;
  fetchedAt: ISODate;
  expiresAt?: ISODate;
  /** 0–1 */
  confidence: number;
  rawRef?: string;
  usageRestrictions?: string;
  attribution?: string;
  /** True for DemoProvider output — never presented as real. */
  demo: boolean;
}

export type DataScope = "public_shared" | "licensed_shared" | "tenant_private" | "restricted";

export interface UsagePolicy {
  scope: DataScope;
  cacheAllowed: boolean;
  cacheTtlDays?: number;
  crossTenantReuseAllowed: boolean;
  rawDisplayAllowed: boolean;
  retentionLimitDays?: number;
  attributionRequired: boolean;
  derivedInsightAllowed: boolean;
  /** Human-readable source contract or internal rule reference. */
  policyRef: string;
}

export interface FactClaim extends Base {
  /** Entity type, e.g. company, person, contact_point, signal. */
  entityType: string;
  entityId: ID;
  /** Field or fact key, e.g. domain, employee_range, permit_signal. */
  field: string;
  value: string | number | boolean | null;
  orgId?: ID;
  provenance: Provenance;
  policy: UsagePolicy;
  confidence: number;
  observedAt: ISODate;
  fetchedAt: ISODate;
  expiresAt?: ISODate;
  metadata?: Record<string, string | number | boolean | null>;
}

/* ───────────────────────────── Companies (shared) ───────────────────────────── */

export interface CompanyLocation {
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
  geo?: { lat: number; lng: number };
}

export interface Company extends Base {
  canonicalName: string;
  normalizedName: string;
  legalName?: string;
  domain?: string;
  website?: string;
  phone?: string;
  locations: CompanyLocation[];
  industry?: string;
  employeeRange?: string;
  locationCount?: number;
  /** Size of a managed/owned portfolio, when a source reports it. */
  portfolioSize?: number;
  parentCompanyId?: ID;
  profileUrls?: string[];
  /** Buyer-type classification with evidence. */
  buyerTypeIds: ID[];
  buyerClassification?: { buyerTypeId: ID; confidence: number; method: "source_category" | "rules" | "operator" | "llm"; classifiedAt: ISODate };
  /** Alternative names seen across sources, for identity resolution. */
  aliases: string[];
  identityConfidence: number;
  firstSeenAt: ISODate;
  lastSeenAt: ISODate;
  lastVerifiedAt?: ISODate;
  lastResearchedAt?: ISODate;
  demo: boolean;
}

/** One record per (provider, external id) — raw source facts, never merged away. */
export interface CompanySourceRecord extends Base {
  companyId: ID;
  provenance: Provenance;
  policy?: UsagePolicy;
  /** Facts exactly as the source reported them. */
  facts: Record<string, string | number | boolean | null>;
  matchMethod: "domain" | "phone" | "name_address" | "new";
  matchConfidence: number;
}

export interface CompanyMergeReview extends Base {
  candidateCompanyId?: ID;
  sourceRecordId?: ID;
  canonicalCompanyId?: ID;
  proposedName: string;
  evidence: { kind: "domain" | "phone" | "address" | "external_id" | "name" | "geo" | "legal_registration"; value: string; confidence: number }[];
  confidence: number;
  status: "needs_review" | "approved" | "rejected" | "merged" | "unmerged";
  reason: string;
  reviewedBy?: ID;
  reviewedAt?: ISODate;
}

/* ───────────────────────────── People (shared) ───────────────────────────── */

export interface Person extends Base {
  fullName: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  demo: boolean;
}

export interface CompanyPerson extends Base {
  companyId: ID;
  personId: ID;
  title: string;
  normalizedTitle: string;
  roleFamily: RoleFamily;
  seniority: Seniority;
  /** 0–1: does this person still work here? */
  employmentConfidence: number;
  provenance: Provenance;
}

export type EmailStatus = "VERIFIED" | "LIKELY_VALID" | "CATCH_ALL" | "RISKY" | "INVALID" | "UNKNOWN";

export interface ContactPoint extends Base {
  personId: ID;
  companyId: ID;
  kind: "work_email" | "work_phone";
  value: string;
  status: EmailStatus;
  confidence: number;
  method: "cache" | "pattern" | "provider" | "operator";
  verifiedAt?: ISODate;
  provenance: Provenance;
}

export interface DomainMailIntel extends Base {
  domain: string;
  hasMx?: boolean;
  catchAll?: boolean;
  /** e.g. "{first}.{last}" */
  pattern?: string;
  patternConfidence?: number;
  patternEvidenceCount: number;
  checkedAt: ISODate;
  provenance: Provenance;
}

/* ───────────────────────────── Signals (shared) ───────────────────────────── */

export type SignalType =
  | "building_permit" | "construction_project" | "property_acquisition" | "new_location" | "expansion"
  | "hiring" | "facilities_hiring" | "capital_improvement" | "procurement_notice" | "bid_posting"
  | "contract_expiration" | "inspection_cycle" | "weather_event" | "ownership_change" | "management_change"
  | "negative_reviews" | "new_facility" | "financed_project" | "renovation" | "tenant_improvement"
  | "infrastructure_funding" | "visible_deterioration" | "website_indicator" | "client_specific";

export interface Signal extends Base {
  companyId: ID;
  type: SignalType;
  summary: string;
  observedAt: ISODate;
  /** 0–1 */
  relevance: number;
  confidence: number;
  /** Niche tags this signal matters to; empty = any. */
  nicheTags: string[];
  buyerTypeIds: ID[];
  expiresAt: ISODate;
  provenance: Provenance;
}

/* ───────────────────────────── Prospects (private) ───────────────────────────── */

export type ProspectStatus =
  | "new" | "researching" | "review" | "qualified" | "rejected" | "sent_to_outbound"
  | "contacted" | "replied" | "meeting" | "opportunity" | "won" | "lost" | "exhausted";

export interface ScoreComponent {
  key: string;
  label: string;
  points: number;
  max: number;
  evidence: string;
  /** False when the component had no evidence (scored 0, not guessed). */
  observed: boolean;
}

export interface ProspectScore {
  fit: number;
  timing: number;
  priority: number;
  fitComponents: ScoreComponent[];
  timingComponents: ScoreComponent[];
  reasons: string[];
  version: string;
  scoredAt: ISODate;
}

export interface Prospect extends Base {
  orgId: ID;
  marketId: ID;
  companyId: ID;
  buyerTypeId?: ID;
  /** Decision makers chosen for this prospect (CompanyPerson ids). */
  decisionMakerIds: ID[];
  primaryContactPointId?: ID;
  status: ProspectStatus;
  score?: ProspectScore;
  qualification?: { decision: "qualified" | "review" | "rejected"; reasons: string[]; decidedBy: string; decidedAt: ISODate };
  /** Plain-English "why this prospect" lines (client-safe). */
  whyNow: string[];
  nextAction?: string;
  createdBy: string;
  /** Private notes — client only. */
  notes?: string;
  acquisitionCostUsd: number;
}

export type JobKind =
  | "DISCOVER_MARKET" | "REFRESH_MARKET" | "RESEARCH_COMPANY" | "FIND_DECISION_MAKERS"
  | "ENRICH_CONTACT" | "VERIFY_CONTACT" | "RESCORE_PROSPECTS" | "EXPORT_TO_OUTBOUND";

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "paused";

export interface ProspectingJob extends Base {
  orgId: ID;
  kind: JobKind;
  marketId?: ID;
  prospectId?: ID;
  status: JobStatus;
  progress: { done: number; total: number; note?: string };
  params: Record<string, string | number | boolean>;
  result?: Record<string, string | number | boolean>;
  error?: string;
  /** Set when a budget stopped the job — needs operator approval to continue. */
  pausedReason?: string;
  requestedBy: string;
  startedAt?: ISODate;
  finishedAt?: ISODate;
  /** Per-run guardrails captured at enqueue time. */
  limits: { maxPaidCalls: number; maxCompanies: number; maxSpendUsd: number };
  paidCalls: number;
  spendUsd: number;
}

export interface MarketBuild extends Base {
  orgId: ID;
  icpId?: ID;
  marketId?: ID;
  nicheId: ID;
  geography: Geography;
  buyerTypeIds: ID[];
  discoveryStrategy: string[];
  maxDataAcquisitionBudgetUsd: number;
  companyDiscoveryCount: number;
  companyResearchCount: number;
  qualifiedCompanyCount: number;
  decisionMakersRequested: number;
  decisionMakersFound: number;
  contactsVerified: number;
  providerSpendUsd: number;
  coverageMethodology: string;
  status: "draft" | "planned" | "approval_required" | "discovering" | "qualifying" | "enriching" | "ready" | "refreshing" | "paused" | "failed" | "cancelled";
  createdBy: string;
  approvedBy?: ID;
  approvedAt?: ISODate;
  startedAt?: ISODate;
  finishedAt?: ISODate;
  failureReason?: string;
}

export interface CostEvent extends Base {
  /** Absent = platform-level cost not attributable to a client. */
  orgId?: ID;
  marketId?: ID;
  marketBuildId?: ID;
  jobId?: ID;
  prospectId?: ID;
  operationId?: ID;
  provider: string;
  operation: "discovery" | "enrichment" | "verification" | "research" | "signals" | "llm" | "outbound";
  units: number;
  unitCostUsd: number;
  costUsd: number;
  /** "configured" = from configured pricing; "provider_reported" = invoice/API reported. */
  pricingSource: "configured" | "provider_reported" | "free";
  success: boolean;
  demo: boolean;
}

export interface PaidOperation extends Base {
  operationId: ID;
  orgId: ID;
  marketBuildId?: ID;
  marketId?: ID;
  jobId?: ID;
  companyId?: ID;
  personId?: ID;
  prospectId?: ID;
  provider: string;
  capability: string;
  operation: CostEvent["operation"];
  estimatedCostUsd: number;
  reservedCostUsd: number;
  actualCostUsd?: number;
  status: "reserved" | "running" | "settled" | "released" | "failed" | "unknown";
  attemptCount: number;
  providerRequestId?: string;
  startedAt: ISODate;
  completedAt?: ISODate;
  lastError?: string;
  reservationMonth: string;
  reservationScopes: ("platform" | "client" | "market" | "provider")[];
  demo: boolean;
}

export interface ProspectingBudget extends Base {
  scope: "platform" | "client" | "market" | "provider";
  orgId?: ID;
  marketId?: ID;
  provider?: string;
  monthlyLimitUsd: number;
  maxPaidCallsPerRun: number;
  maxCompaniesPerJob: number;
  maxLeadsExportedPerRun: number;
  maxProviderRetries: number;
  /** "stop" fails closed; "approval" pauses the job for an operator. */
  onLimit: "stop" | "approval";
  reservedMonth?: string;
  reservedUsd?: number;
}

/* ───────────────────────────── Compliance ───────────────────────────── */

export type SuppressionReason =
  | "do_not_contact" | "client_suppression" | "global_suppression" | "bounced" | "unsubscribed"
  | "invalid_contact" | "blocked_domain" | "blocked_company" | "channel_restriction";

export interface Suppression extends Base {
  /** Absent = global (superadmin only). */
  orgId?: ID;
  kind: "email" | "domain" | "company" | "person";
  /** Normalized value: email/domain lowercase, or a record id. */
  value: string;
  reason: SuppressionReason;
  channels: ("email" | "phone" | "all")[];
  source: string;
  note?: string;
  createdBy: string;
  /** Hard suppression cannot be overridden by a Bot or a tool argument. */
  hard: boolean;
  liftedAt?: ISODate;
  liftedBy?: string;
}

export interface OutboundHandoff extends Base {
  orgId: ID;
  prospectId: ID;
  contactPointId: ID;
  provider: string;
  status: "queued" | "accepted" | "rejected_policy" | "failed";
  /** Vendor-neutral payload the Outbound Bot / provider receives. */
  payload: OutboundPayload;
  externalRef?: string;
  policyViolations: string[];
  requestedBy: string;
  demo: boolean;
}

export interface OutboundPayload {
  company: { name: string; domain?: string; city?: string; state?: string };
  contact: { fullName: string; title: string; email: string };
  reasons: string[];
  sequenceKey: string;
  marketName: string;
}

export type OutcomeStage =
  | "discovered" | "researched" | "qualified" | "enriched" | "verified" | "queued_for_outbound"
  | "contacted" | "replied" | "positive_reply" | "meeting" | "quote" | "opportunity" | "won" | "lost" | "suppressed";

export interface OutcomeEvent extends Base {
  orgId: ID;
  prospectId: ID;
  stage: OutcomeStage;
  valueCents?: number;
  source: "deterministic_worker" | "outbound_bot" | "crm_bot" | "operator" | "provider_webhook";
  note?: string;
  occurredAt: ISODate;
}

export interface ProspectingTables {
  pg_import_runs: ImportRun;
  pg_niches: ServiceNiche;
  pg_buyer_types: BuyerType;
  pg_relationships: NicheBuyerRelationship;
  pg_companies: Company;
  pg_company_sources: CompanySourceRecord;
  pg_fact_claims: FactClaim;
  pg_company_merge_reviews: CompanyMergeReview;
  pg_people: Person;
  pg_company_people: CompanyPerson;
  pg_contact_points: ContactPoint;
  pg_domain_intel: DomainMailIntel;
  pg_signals: Signal;
  pg_icps: ClientIcp;
  pg_markets: Market;
  pg_prospects: Prospect;
  pg_jobs: ProspectingJob;
  pg_market_builds: MarketBuild;
  pg_paid_operations: PaidOperation;
  pg_cost_events: CostEvent;
  pg_budgets: ProspectingBudget;
  pg_suppressions: Suppression;
  pg_handoffs: OutboundHandoff;
  pg_outcomes: OutcomeEvent;
}

/** Shared market intelligence: must never carry orgId or private fields. */
export const SHARED_PROSPECT_TABLES = [
  "pg_import_runs", "pg_niches", "pg_buyer_types", "pg_relationships", "pg_companies", "pg_company_sources",
  "pg_fact_claims", "pg_company_merge_reviews", "pg_people", "pg_company_people", "pg_contact_points", "pg_domain_intel", "pg_signals",
] as const;

/** Private client intelligence: every row carries orgId. */
export const PRIVATE_PROSPECT_TABLES = [
  "pg_icps", "pg_markets", "pg_prospects", "pg_jobs", "pg_market_builds", "pg_handoffs", "pg_outcomes",
] as const;

/** Rows may be private (orgId) or platform-level (no orgId, operator-only). */
export const MIXED_PROSPECT_TABLES = ["pg_paid_operations", "pg_cost_events", "pg_budgets", "pg_suppressions"] as const;

export const PROSPECT_TABLE_NAMES = [
  ...SHARED_PROSPECT_TABLES, ...PRIVATE_PROSPECT_TABLES, ...MIXED_PROSPECT_TABLES,
] as const;
