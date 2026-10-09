/**
 * AgenticBots platform domain types.
 *
 * Everything above the runtime boundary speaks this vocabulary: Bots,
 * Runs, Conversations, Automations, Actions. Runtime-specific words live
 * only inside src/server/runtime/hermes.
 *
 * Types only — nothing here emits runtime code, so importing it from a
 * client component cannot leak data. What a client SEES is decided by the
 * projections in src/server/views.
 */
import type { BotTypeKey, Capability, IntegrationKey } from "@/config/bot-catalog";
import type { Geography, ProspectingTables, RoleFamily, SellsTo } from "@/lib/prospecting/types";

export type ID = string;
export type ISODate = string;

/** Fields every stored record carries. `version` is the optimistic-lock
 *  counter the repository checks on every patch. */
export interface Base {
  id: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
  version: number;
}

/** Records that belong to one client organization. */
export interface Tenanted extends Base {
  orgId: ID;
}

/* ───────────────────────────── Identity ───────────────────────────── */

export type PlatformRole = "superadmin" | "operator";
export type ClientRole = "client_admin" | "client_member";
export type Role = PlatformRole | ClientRole;

export interface User extends Base {
  email: string;
  name: string;
  /** scrypt$N$r$p$salt$hash — never leaves the server. */
  passwordHash?: string;
  status: "active" | "invited" | "disabled";
  /** Set for AgenticBots staff only. */
  platformRole?: PlatformRole;
  /** An explicit list limits an operator; an empty list grants no tenant access. */
  operatorOrgIds?: ID[];
  /** All tenants only when explicitly granted and no restricted list is set. */
  operatorAllOrgs?: boolean;
  termsAcceptedAt?: ISODate;
  termsVersion?: string;
  privacyVersion?: string;
  lastLoginAt?: ISODate;
  /** One-time set-password token (sha256 hex) and expiry. */
  inviteTokenHash?: string;
  inviteExpiresAt?: ISODate;
}

export interface Membership extends Tenanted {
  userId: ID;
  role: ClientRole;
}

export interface Session extends Base {
  userId: ID;
  /** sha256 of the random session secret; the secret itself is only in the cookie. */
  tokenHash: string;
  expiresAt: ISODate;
  revokedAt?: ISODate;
  userAgent?: string;
  mfaVerifiedAt?: ISODate;
}

/* ─────────────────────────── Organizations ────────────────────────── */

export type OrgStatus = "onboarding" | "active" | "past_due" | "suspended" | "canceled";
export type SuspensionReason = "billing" | "manual" | "security" | "contract_ended" | "other";

export interface Organization extends Base {
  name: string;
  slug: string;
  status: OrgStatus;
  /** Runtime tenant identifier — also the Secrets Manager path segment. */
  tenantId: string;
  environment: "demo" | "staging" | "production";
  industry?: string;
  website?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  timezone: string;
  suspension?: {
    reason: SuspensionReason;
    at: ISODate;
    by: ID;
    note?: string;
  };
  /** Operator holds that block automatic reactivation. */
  holds: { manual: boolean; security: boolean; billing: boolean };
  /** Set when a billing suspension's balance is cleared. Operator decides. */
  eligibleForReactivation?: boolean;
  lastActivityAt?: ISODate;
}

/* ─────────────────────────────── Bots ─────────────────────────────── */

/** Stored Bot status. "provisioning" is AgenticBots lifecycle; the rest is
 *  the neutral vocabulary every runtime adapter reports in. */
export type BotStatus = "provisioning" | "active" | "working" | "idle" | "disabled" | "offline" | "degraded";

export interface Bot extends Tenanted {
  typeKey: BotTypeKey;
  /** Usually the catalog display name; operators may suffix ("SEO Bot — Naples"). */
  name: string;
  status: BotStatus;
  runtimeId: ID;
  /** Name of this Bot's profile inside the client runtime. Operator-only. */
  runtimeProfile: string;
  provider: string;
  model: string;
  fallbackProvider?: string;
  fallbackModel?: string;
  reasoning?: "low" | "medium" | "high";
  capabilities: Capability[];
  integrationIds: ID[];
  /** Operator-authored business context. Never shown to clients. */
  instructions?: string;
  /** Secrets Manager reference for this Bot's own runtime key. */
  credentialRef?: string;
  credentialStatus: "present" | "missing" | "rotating" | "unknown";
  currentRunId?: ID;
  lastActivityAt?: ISODate;
  lastResult?: string;
  /** Operator-visible sanitized error; clients see a fixed sentence. */
  errorState?: { code: string; message: string; at: ISODate; correlationId: string };
}

export interface SkillAssignment extends Tenanted {
  botId: ID;
  skillKey: string;
  skillVersion: string;
  assignedBy: ID;
  removedAt?: ISODate;
}

/* ───────────────────────────── Runtimes ───────────────────────────── */

export type RuntimeHealth = "healthy" | "degraded" | "offline" | "stopped" | "unknown";

/** Which runtime implementation serves a client. See src/server/runtime/runtime-factory.ts. */
export type RuntimeProvider = "demo" | "hermes";

export interface Runtime extends Tenanted {
  provider: RuntimeProvider;
  region: string;
  instanceId?: string;
  instanceType: string;
  ec2State?: "pending" | "running" | "stopping" | "stopped" | "terminated" | "unknown";
  health: RuntimeHealth;
  /** Whether the runtime answered its readiness check and capabilities. */
  ready: boolean;
  /** AgenticBots runtime bundle version (compose + config). */
  runtimeVersion: string;
  /** Pinned upstream engine version and image digest. Operator-only. */
  engineVersion: string;
  engineDigest?: string;
  /** Secrets Manager reference holding the private endpoint + tunnel auth. */
  endpointRef?: string;
  diskUsedPct?: number;
  lastHeartbeatAt?: ISODate;
  /** Last attempted health check; heartbeat advances only on a response. */
  lastCheckedAt?: ISODate;
  tunnel: "connected" | "down" | "unknown";
  backup: { lastSnapshotAt?: ISODate; status: "ok" | "failed" | "none" | "unknown"; retentionDays: number };
  lastRestartAt?: ISODate;
  restartCount24h: number;
  deploymentState: "not_provisioned" | "provisioning" | "deployed" | "updating" | "failed" | "suspended";
  capabilities?: Record<string, boolean>;
  lastError?: { code: string; message: string; at: ISODate; correlationId: string };
  estimatedMonthlyCostUsd: number;
}

/** A point-in-time observation, not a claim about availability between checks. */
export interface RuntimeHealthSample extends Tenanted {
  runtimeId: ID;
  checkedAt: ISODate;
  health: RuntimeHealth;
  ready: boolean;
  latencyMs: number;
  demo: boolean;
}

export interface OperatingDraft extends Tenanted {
  kind: "automation" | "skill" | "support";
  targetId: string;
  title: string;
  steps: { id: string; kind: "context" | "analyze" | "prepare"; title: string; instruction: string }[];
  updatedBy: ID;
  sourceVersion: number;
  formatVersion: 1;
}

export interface DeploymentEvent extends Tenanted {
  runtimeId: ID;
  kind: "provision" | "deploy_bot" | "update" | "restart" | "suspend" | "reactivate" | "backup" | "restore" | "destroy";
  status: "started" | "succeeded" | "failed";
  detail: string;
  engineVersion?: string;
  actorId: ID;
  correlationId: string;
}

/* ─────────────────────────────── Runs ─────────────────────────────── */

export type RunStatus =
  | "queued"
  | "running"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "cancelled"
  | "interrupted";

export const TERMINAL_RUN_STATUSES: readonly RunStatus[] = ["completed", "failed", "cancelled", "interrupted"];

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface Run extends Tenanted {
  botId: ID;
  task: string;
  status: RunStatus;
  requestId?: ID;
  conversationId?: ID;
  automationId?: ID;
  /** The runtime's own id for this run. Operator-only. */
  runtimeRunId?: string;
  idempotencyKey: string;
  correlationId: string;
  startedBy: ID;
  startedAt?: ISODate;
  endedAt?: ISODate;
  provider?: string;
  model?: string;
  usage: Usage;
  estimatedCostUsd: number;
  approvalState: "none" | "pending" | "approved" | "denied";
  /** Sanitized for operators. Clients see sanitizeRuntimeError's sentence. */
  failureReason?: string;
  /** Final output summary, already sanitized. */
  resultSummary?: string;
  operatorNotes?: string;
  lastSyncedAt?: ISODate;
  /** Highest event sequence ingested from the runtime. */
  eventCursor: number;
}

export type EventAudience = "client" | "operator";

export interface RunEvent extends Tenanted {
  runId: ID;
  seq: number;
  at: ISODate;
  kind: "lifecycle" | "action" | "message" | "approval" | "error" | "usage";
  /** Business-language line, safe for a client. Absent = not shown to clients. */
  clientText?: string;
  /** Operator line — sanitized but technical. */
  operatorText: string;
  /** Operator-only technical detail. Already redacted. */
  technical?: { action?: string; durationS?: number; error?: boolean; sourceEvent?: string };
}

export interface Conversation extends Tenanted {
  botId: ID;
  userId: ID;
  title: string;
  /** Runtime session id. Operator-only. */
  runtimeSessionId?: string;
  lastMessageAt?: ISODate;
}

/* ─────────────────────────── Activity & results ───────────────────── */

/** Countable outcomes. Results are sums of these — never estimates. */
export type ResultMetric =
  | "qualified_opportunities"
  | "prospects_researched"
  | "followups_prepared"
  | "reviews_requested"
  | "crm_records_updated"
  | "automations_completed"
  | "seo_opportunities_found"
  | "ad_issues_detected"
  | "content_completed"
  | "customers_identified"
  | "proposals_drafted";

export interface ActivityEvent extends Tenanted {
  at: ISODate;
  botId?: ID;
  runId?: ID;
  requestId?: ID;
  /** Human-readable business action. */
  text: string;
  visibility: "client" | "internal";
  metrics?: { key: ResultMetric; value: number }[];
  /** True when the activity was seeded for demo mode. */
  demo?: boolean;
}

/* ───────────────────────────── Approvals ──────────────────────────── */

export type ApprovalCategory =
  | "external_send"
  | "publish"
  | "ad_change"
  | "crm_update"
  | "destructive"
  | "runtime_action"
  | "other";

export interface Approval extends Tenanted {
  botId: ID;
  runId?: ID;
  requestId?: ID;
  /** runtime = the run is parked waiting on this decision.
   *  deliverable = review acceptance only; execution requires a separate exact runtime approval. */
  kind: "runtime" | "deliverable";
  category: ApprovalCategory;
  title: string;
  explanation: string;
  expectedImpact: string;
  risk: "low" | "medium" | "high";
  /** Client-safe preview of what will happen (e.g. the drafted email). */
  preview?: string;
  status: "pending" | "approved" | "denied" | "expired" | "cancelled";
  /** Who must decide: the client, or AgenticBots internally. */
  audience: "client" | "operator";
  requestedAt: ISODate;
  expiresAt?: ISODate;
  resolvedBy?: ID;
  resolvedAt?: ISODate;
  resolutionNote?: string;
  /** Runtime approval request id. Operator-only. */
  runtimeApprovalId?: string;
  /** Decision is committed before dispatch; uncertain dispatch is never retried blindly. */
  executionState?: "not_applicable" | "dispatching" | "acknowledged" | "unknown";
  executionError?: string;
}

/* ───────────────────────────── Requests ───────────────────────────── */

export type RequestStatus =
  | "submitted"
  | "reviewing"
  | "in_progress"
  | "waiting_on_client"
  | "completed"
  | "declined";

export interface WorkRequest extends Tenanted {
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: RequestStatus;
  submittedBy: ID;
  submittedAt: ISODate;
  assignedOperatorId?: ID;
  assignedBotIds: ID[];
  linkedRunIds: ID[];
  linkedApprovalIds: ID[];
  deliverables: { label: string; url?: string; addedAt: ISODate }[];
  /** Thread visible to the client. Internal notes live in operator_notes. */
  messages: { at: ISODate; by: ID; byName: string; fromAgenticBots: boolean; text: string }[];
  /** Attachment architecture: references to an object store, not file bodies. */
  attachments: { name: string; ref: string; size: number; contentType: string }[];
  completedAt?: ISODate;
}

/* ──────────────────────────── Automations ─────────────────────────── */

export type AutomationStatus = "active" | "paused" | "failed";

export interface AutomationJob extends Tenanted {
  botId: ID;
  name: string;
  prompt: string;
  /** Cron expression. Operator-only. */
  schedule: string;
  /** Plain-English schedule shown to clients ("Weekdays at 7:00 AM"). */
  scheduleLabel: string;
  status: AutomationStatus;
  runtimeAutomationId?: string;
  lastRunAt?: ISODate;
  lastStatus?: "succeeded" | "failed";
  nextRunAt?: ISODate;
  consecutiveFailures: number;
  lastError?: string;
  /** Webhook-triggered automations never receive destructive capabilities. */
  trigger: "schedule" | "webhook";
}

/* ──────────────────────────── Integrations ────────────────────────── */

export type IntegrationStatus = "connected" | "needs_attention" | "disconnected" | "not_configured";

export interface Integration extends Tenanted {
  provider: IntegrationKey;
  displayName: string;
  status: IntegrationStatus;
  capabilities: string[];
  /** Secrets Manager reference. Never the secret. Operator-only. */
  secretRef?: string;
  /** Bots allowed to use this integration. Empty = none. */
  botIds: ID[];
  lastCheckAt?: ISODate;
  /** Operator-only technical error (already redacted). */
  lastError?: string;
  /** How the current status was established. "check" = automated probe. */
  verifiedBy?: "check" | "operator";
  /** Operator-only technical wiring (e.g. tool-server name, scopes). */
  metadata: Record<string, string>;
  webhookSecretRef?: string;
}

/* ───────────────────────────── Onboarding ─────────────────────────── */

export type OnboardingStage =
  | "draft"
  | "intake_complete"
  | "analyzing"
  | "review_required"
  | "client_action_required"
  | "ready_for_operator_approval"
  | "approved"
  | "ready_to_provision"
  | "provisioning"
  | "active"
  | "paused"
  | "failed"
  | "cancelled";

export type OnboardingReadiness = "not_ready" | "ready_for_review" | "ready_to_provision" | "active" | "blocked";

export interface OnboardingIntake {
  businessName?: string;
  website?: string;
  description?: string;
  services: string[];
  serviceType?: "residential" | "commercial" | "industrial" | "government" | "mixed";
  geographies: Geography[];
  averageJobValueUsd?: number;
  minimumOpportunityUsd?: number;
  targetCustomerPreferences: string[];
  existingCustomerTypes: string[];
  exclusions: string[];
  goals: string[];
  implementationBudgetUsd?: number;
}

export interface OnboardingClassification {
  primaryNicheId?: ID;
  primaryNicheName?: string;
  secondaryNicheIds: ID[];
  category?: string;
  sellsTo?: SellsTo;
  confidence: number;
  reviewRequired: boolean;
  reasoning: string[];
  verticalPackKey?: string;
  verticalPackLabel?: string;
  prospectabilityScore?: number;
  clientFitScore?: number;
}

export interface OnboardingBotRecommendation {
  botType: BotTypeKey;
  status: "recommended" | "optional" | "not_recommended";
  reasoning: string[];
}

export interface OnboardingIntegrationRequirement {
  provider: IntegrationKey;
  displayName: string;
  requirement: "required" | "recommended" | "optional";
  botTypes: BotTypeKey[];
  clientAction: boolean;
  reasoning: string[];
}

export interface OnboardingSkillPlan {
  botType: BotTypeKey;
  skillKey: string;
  skillVersion: string;
  status: "planned" | "incompatible";
  reasoning: string;
}

export interface OnboardingApprovalPolicy {
  action: ApprovalCategory | "analytics_read" | "seo_research" | "recommendation_generation" | "budget_increase" | "delete_data";
  defaultPolicy: "automatic" | "approval_required" | "prohibited";
  audience: "client" | "operator";
  reasoning: string;
}

export interface OnboardingBudgetPlan {
  status: "not_needed" | "budget_requires_configuration" | "operator_approval_required" | "approved";
  proposedMaxUsd?: number;
  reasoning: string[];
  approvedBy?: ID;
  approvedAt?: ISODate;
}

export interface OnboardingChecklistItem {
  key: string;
  label: string;
  status: "open" | "done" | "blocked" | "not_needed";
  owner: "client" | "operator" | "system";
  blocking: boolean;
  reason?: string;
}

export interface OnboardingDeploymentPlan {
  runtime: { kind: "client_runtime"; region: string; status: "draft" | "ready" | "blocked" };
  bots: { botType: BotTypeKey; runtimeProfile: string; status: "planned" | "optional" | "blocked"; skillKeys: string[]; integrationKeys: IntegrationKey[] }[];
  integrations: OnboardingIntegrationRequirement[];
  marketBuildIds: ID[];
  providerConfiguration: { required: boolean; status: "configured" | "missing" };
  notes: string[];
}

export interface OnboardingDecision {
  key: string;
  value: string | number | boolean | string[] | null;
  decidedBy: ID;
  decidedAt: ISODate;
  note?: string;
}

export interface ClientOnboarding extends Tenanted {
  stage: OnboardingStage;
  readiness: OnboardingReadiness;
  intake: OnboardingIntake;
  classification?: OnboardingClassification;
  recommendedBotStack: OnboardingBotRecommendation[];
  recommendedIcpIds: ID[];
  recommendedBuyerTypeIds: ID[];
  recommendedDecisionMakerRoleFamilies: RoleFamily[];
  recommendedMarkets: ID[];
  marketBuildIds: ID[];
  integrationRequirements: OnboardingIntegrationRequirement[];
  skillPlan: OnboardingSkillPlan[];
  approvalPolicies: OnboardingApprovalPolicy[];
  budgetPlan: OnboardingBudgetPlan;
  deploymentPlan?: OnboardingDeploymentPlan;
  outstandingClientActions: OnboardingChecklistItem[];
  outstandingOperatorActions: OnboardingChecklistItem[];
  readinessBlockers: string[];
  decisions: OnboardingDecision[];
  compilerVersion: string;
  lastCompiledAt?: ISODate;
  completedAt?: ISODate;
}

/* ───────────────────────────── Usage ──────────────────────────────── */

export interface UsageRollup extends Tenanted {
  botId: ID;
  /** YYYY-MM */
  period: string;
  runs: number;
  failedRuns: number;
  usage: Usage;
  modelCostUsd: number;
}

export interface ProviderConfiguration extends Base {
  provider: string;
  displayName: string;
  status: "operational" | "degraded" | "down" | "unknown";
  models: {
    id: string;
    label: string;
    /** USD per million tokens. Operator-entered estimates, not invoices. */
    inputPerM: number;
    outputPerM: number;
    cacheReadPerM?: number;
    cacheWritePerM?: number;
  }[];
  note?: string;
}

/* ───────────────────────────── Billing ────────────────────────────── */

export type PaymentMethod = "ach" | "wire" | "bank_transfer" | "check" | "other" | "stripe_optional";

export type AgreementStatus = "draft" | "active" | "past_due" | "suspended" | "terminated" | "completed";

export interface ServiceAgreement extends Tenanted {
  name: string;
  /** Amounts are integer cents. */
  monthlyValueCents: number;
  implementationFeeCents: number;
  setupFeeCents: number;
  billingFrequency: "monthly" | "quarterly" | "annual";
  paymentTermsDays: number;
  preferredPaymentMethod: PaymentMethod;
  startDate: string; // YYYY-MM-DD
  renewalDate?: string;
  endDate?: string;
  status: AgreementStatus;
  gracePeriodDays: number;
  autoSuspendEnabled: boolean;
  autoReactivateOnPayment: boolean;
  notes?: string;
  createdBy: ID;
}

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "due"
  | "partially_paid"
  | "paid"
  | "past_due"
  | "void"
  | "written_off";

export interface Invoice extends Tenanted {
  invoiceNumber: string;
  serviceAgreementId?: ID;
  issueDate: string;
  dueDate: string;
  currency: "USD";
  lineItems: { description: string; quantity: number; unitCents: number; kind: "recurring" | "implementation" | "setup" | "usage" | "custom" }[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceDueCents: number;
  status: InvoiceStatus;
  notes?: string;
  preferredPaymentMethod: PaymentMethod;
  externalAccountingId?: string;
  accountingSync?: { provider: string; status: "synced" | "pending" | "error"; lastSyncAt?: ISODate; error?: string };
  sentAt?: ISODate;
  createdBy: ID;
}

export interface Payment extends Tenanted {
  invoiceId: ID;
  amountCents: number;
  dateReceived: string;
  method: PaymentMethod;
  source: "ach_received" | "wire_received" | "bank_transfer_received" | "check_received" | "manual_adjustment" | "other";
  referenceNumber?: string;
  operatorNotes?: string;
  externalAccountingId?: string;
  /** Corrections never delete: a reversal is a new negative record pointing here. */
  reversesPaymentId?: ID;
  reversedByPaymentId?: ID;
  createdBy: ID;
}

export type BillingEventType =
  | "agreement_created"
  | "agreement_updated"
  | "invoice_created"
  | "invoice_sent"
  | "invoice_due"
  | "invoice_past_due"
  | "invoice_voided"
  | "payment_recorded"
  | "payment_adjusted"
  | "payment_reversed"
  | "billing_hold_added"
  | "billing_hold_removed"
  | "client_eligible_for_suspension"
  | "client_suspended_for_billing"
  | "client_eligible_for_reactivation"
  | "client_reactivated";

export interface BillingEvent extends Tenanted {
  type: BillingEventType;
  actorId: ID;
  amountCents?: number;
  invoiceId?: ID;
  paymentId?: ID;
  reference?: string;
  correlationId: string;
  detail?: string;
}

/* ─────────────────────── Incidents, notes, audit ──────────────────── */

export type IncidentType =
  | "runtime_offline"
  | "runtime_degraded"
  | "ec2_failure"
  | "disk_nearly_full"
  | "repeated_restart"
  | "provider_failure"
  | "integration_failure"
  | "automation_failure"
  | "run_failure_spike"
  | "tunnel_unavailable"
  | "billing_issue"
  | "past_due_account"
  | "aging_approval"
  | "deployment_failure"
  | "api_failure";

export interface Incident extends Tenanted {
  type: IncidentType;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  /** Operator detail — sanitized. */
  detail: string;
  /** Shown to the client only when set, e.g. "Google Ads connection needs attention." */
  clientMessage?: string;
  status: "open" | "investigating" | "resolved" | "ignored";
  firstSeenAt: ISODate;
  lastSeenAt: ISODate;
  occurrences: number;
  correlationIds: string[];
  botId?: ID;
  runId?: ID;
  integrationId?: ID;
  runtimeId?: ID;
  /** Dedup key: one open incident per (type, target). */
  fingerprint: string;
  resolvedBy?: ID;
  resolvedAt?: ISODate;
}

export type NoteTarget = "client" | "bot" | "request" | "run" | "incident" | "integration" | "invoice" | "payment";

export interface OperatorNote extends Tenanted {
  targetType: NoteTarget;
  targetId: ID;
  text: string;
  authorId: ID;
  authorName: string;
}

export interface AuditLog extends Base {
  orgId?: ID;
  actorId: ID;
  actorName: string;
  action: string;
  targetType: string;
  targetId?: ID;
  result: "success" | "failure" | "denied";
  correlationId: string;
  /** Redacted, never secrets. */
  detail?: string;
}

export interface ProcessedWebhook extends Base {
  status?: "processing" | "completed" | "failed";
  runId?: ID;
  source: string;
  externalId: string;
  orgId?: ID;
}

/* ─────────────────────────── Table registry ───────────────────────── */

export interface Passkey extends Base {
  userId: ID;
  credentialId: string;
  /** Public verification key only; private keys never leave the authenticator. */
  publicKey: string;
  counter: number;
  transports: string[];
}
export interface AuthChallenge extends Base {
  userId: ID;
  sessionId: ID;
  purpose: "register" | "authenticate";
  challenge: string;
  expiresAt: ISODate;
  usedAt?: ISODate;
}
export interface SecurityCounter extends Base {
  count: number;
  expiresAt: ISODate;
}
export interface OperationLease extends Base {
  cursor?: string;
  holder: string;
  expiresAt: ISODate;
  completedAt?: ISODate;
}

export interface PrivacyCase extends Base {
  orgId?: ID;
  subjectUserId?: ID;
  contactEmail: string;
  kind: "access" | "correct" | "delete" | "opt_out" | "cancel";
  details: string;
  status: "received" | "verified" | "completed" | "declined";
  dueAt: ISODate;
  verifiedAt?: ISODate;
  resolvedAt?: ISODate;
  resolution?: string;
}

export interface Tables extends ProspectingTables {
  privacy_cases: PrivacyCase;
  passkeys: Passkey;
  auth_challenges: AuthChallenge;
  security_counters: SecurityCounter;
  operation_leases: OperationLease;
  users: User;
  memberships: Membership;
  sessions: Session;
  organizations: Organization;
  bots: Bot;
  skill_assignments: SkillAssignment;
  runtimes: Runtime;
  runtime_health_samples: RuntimeHealthSample;
  operating_drafts: OperatingDraft;
  deployment_events: DeploymentEvent;
  runs: Run;
  run_events: RunEvent;
  conversations: Conversation;
  activity_events: ActivityEvent;
  approvals: Approval;
  requests: WorkRequest;
  automation_jobs: AutomationJob;
  integrations: Integration;
  client_onboardings: ClientOnboarding;
  usage_rollups: UsageRollup;
  provider_configurations: ProviderConfiguration;
  service_agreements: ServiceAgreement;
  invoices: Invoice;
  payments: Payment;
  billing_events: BillingEvent;
  incidents: Incident;
  operator_notes: OperatorNote;
  audit_logs: AuditLog;
  processed_webhooks: ProcessedWebhook;
}

export type TableName = keyof Tables;

export const TABLE_NAMES: readonly TableName[] = [
  "privacy_cases", "security_counters", "operation_leases", "passkeys", "auth_challenges",
  "users", "memberships", "sessions", "organizations", "bots", "skill_assignments",
  "runtimes", "deployment_events", "runs", "run_events", "conversations",
  "activity_events", "approvals", "requests", "automation_jobs", "integrations",
  "client_onboardings", "usage_rollups", "provider_configurations", "service_agreements", "invoices",
  "payments", "billing_events", "incidents", "operator_notes", "audit_logs",
  "processed_webhooks", "runtime_health_samples", "operating_drafts",
  // Prospect Graph (see src/lib/prospecting/types.ts)
  "pg_import_runs", "pg_niches", "pg_buyer_types", "pg_relationships", "pg_companies", "pg_company_sources",
  "pg_fact_claims", "pg_company_merge_reviews", "pg_people", "pg_company_people", "pg_contact_points", "pg_domain_intel", "pg_signals",
  "pg_icps", "pg_markets", "pg_prospects", "pg_jobs", "pg_market_builds", "pg_handoffs", "pg_outcomes",
  "pg_paid_operations", "pg_cost_events", "pg_budgets", "pg_suppressions",
];

/** Tables whose rows are never hard-deleted (financial + audit history). */
export const APPEND_ONLY_TABLES: readonly TableName[] = [
  "payments", "billing_events", "audit_logs", "invoices", "service_agreements", "deployment_events",
  "pg_import_runs", "pg_cost_events", "pg_outcomes", "runtime_health_samples",
];
