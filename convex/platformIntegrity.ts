/** Pure storage invariants shared by the Convex mutation and local repository. */
export const IMMUTABLE = new Set([
  "audit_logs", "billing_events", "deployment_events", "pg_import_runs",
  "pg_cost_events", "pg_outcomes", "runtime_health_samples",
]);
const TENANTED = new Set([
  "memberships", "bots", "skill_assignments", "runtimes", "runtime_health_samples",
  "operating_drafts", "deployment_events", "runs", "run_events", "conversations",
  "activity_events", "approvals", "requests", "automation_jobs", "integrations",
  "client_onboardings", "usage_rollups", "service_agreements", "invoices", "payments",
  "billing_events", "incidents", "operator_notes", "pg_icps", "pg_markets",
  "pg_prospects", "pg_jobs", "pg_market_builds", "pg_handoffs", "pg_outcomes", "pg_paid_operations",
]);
const SHARED = new Set([
  "users", "sessions", "passkeys", "auth_challenges", "security_counters", "operation_leases", "organizations", "provider_configurations", "pg_import_runs",
  "pg_niches", "pg_buyer_types", "pg_relationships", "pg_companies", "pg_company_sources",
  "pg_company_merge_reviews", "pg_people", "pg_company_people", "pg_contact_points", "pg_domain_intel", "pg_signals",
]);

export function validateRecord(table: string, id: string, doc: Record<string, unknown>): void {
  if (!doc || typeof doc !== "object" || Array.isArray(doc) || doc.id !== id || typeof id !== "string" || !id || id.length > 200) throw new Error("Invalid record identity.");
  if (!Number.isSafeInteger(doc.version) || Number(doc.version) < 1) throw new Error("Invalid record version.");
  for (const field of ["createdAt", "updatedAt"]) {
    if (typeof doc[field] !== "string" || !Number.isFinite(Date.parse(doc[field] as string))) throw new Error("Invalid record timestamp.");
  }
  if (TENANTED.has(table) && (typeof doc.orgId !== "string" || !doc.orgId.trim())) throw new Error("Tenant ownership is required.");
  if (SHARED.has(table) && doc.orgId !== undefined) throw new Error("Shared records cannot carry tenant data.");
  if (doc.orgId !== undefined && (typeof doc.orgId !== "string" || !doc.orgId.trim())) throw new Error("Invalid tenant ownership.");
  for (const [field, value] of Object.entries(doc)) {
    if (field.endsWith("At") && value !== undefined && (typeof value !== "string" || !Number.isFinite(Date.parse(value)))) throw new Error("Invalid event timestamp.");
  }
  const enums: Record<string, Record<string, string[]>> = {
    users: { status: ["active", "invited", "disabled"], platformRole: ["superadmin", "operator"] },
    organizations: { status: ["onboarding", "active", "past_due", "suspended", "canceled"], environment: ["demo", "staging", "production"] },
    memberships: { role: ["client_admin", "client_member"] },
    auth_challenges: { purpose: ["register", "authenticate"] },
    approvals: { status: ["pending", "approved", "denied", "expired", "cancelled"], kind: ["runtime", "deliverable"] },
  };
  for (const [field, allowed] of Object.entries(enums[table] ?? {})) {
    if (doc[field] === undefined && field === "platformRole") continue;
    if (!allowed.includes(doc[field] as string)) throw new Error("Invalid security state.");
  }
  if (["sessions", "passkeys", "auth_challenges"].includes(table) && (typeof doc.userId !== "string" || !doc.userId)) throw new Error("User binding is required.");
  if (table === "security_counters" && (!Number.isSafeInteger(doc.count) || Number(doc.count) < 0)) throw new Error("Invalid security counter.");
  if (table === "users" && doc.operatorOrgIds !== undefined && (!Array.isArray(doc.operatorOrgIds) || doc.operatorOrgIds.some(id => typeof id !== "string" || !id))) throw new Error("Invalid operator scope.");
  if (table === "users" && doc.operatorAllOrgs !== undefined && typeof doc.operatorAllOrgs !== "boolean") throw new Error("Invalid operator grant.");
  if (table === "pg_fact_claims") {
    const policy = doc.policy as { scope?: string } | undefined;
    if (policy?.scope === "tenant_private" && !doc.orgId) throw new Error("Private facts require a tenant.");
  }
}

export function validatePatch(table: string, patch: Record<string, unknown>, existing?: Record<string, unknown>): void {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw new Error("Invalid record patch.");
  if (IMMUTABLE.has(table)) throw new Error("Immutable history cannot be edited. Record a correction event.");
  for (const key of ["id", "orgId", "createdAt", "version", "__proto__", "constructor", "prototype"]) {
    if (Object.hasOwn(patch, key)) throw new Error("Record identity and ownership cannot be changed.");
  }
  const boundFields: Record<string, string[]> = {
    sessions: ["userId", "tokenHash", "expiresAt"],
    passkeys: ["userId", "credentialId", "publicKey"],
    auth_challenges: ["userId", "sessionId", "purpose", "challenge", "expiresAt"],
    organizations: ["tenantId", "environment"],
    approvals: ["botId", "runId", "runtimeApprovalId", "kind", "preview", "category", "audience", "expiresAt"],
    privacy_cases: ["subjectUserId", "contactEmail", "kind", "details", "dueAt"],
    processed_webhooks: ["source", "externalId"],
  };
  if ((boundFields[table] ?? []).some(key => Object.hasOwn(patch, key))) throw new Error("Security binding cannot be changed.");
  // A payment is immutable except for a one-time link to its correction payment.
  if (table === "payments") {
    if (Object.keys(patch).some(k => !["updatedAt", "reversedByPaymentId"].includes(k)) ||
        typeof patch.reversedByPaymentId !== "string" || !patch.reversedByPaymentId || existing?.reversedByPaymentId) throw new Error("Payments can only be corrected once by a linked reversal.");
  }
}
