/**
 * Platform table names, mirrored from src/lib/platform/types.ts
 * (TABLE_NAMES). Convex bundles this folder on its own, so the list is
 * duplicated here rather than imported across the boundary; a unit test
 * (tests/unit/convex-tables.test.ts) fails if the two ever drift.
 *
 * Every platform table is prefixed `pf_` so it can never collide with the
 * course tables (`users` in particular) that already live in this
 * deployment.
 */
export const PLATFORM_TABLES = [
  "privacy_cases", "security_counters", "operation_leases", "passkeys", "auth_challenges",
  "users", "memberships", "sessions", "organizations", "bots", "skill_assignments",
  "runtimes", "deployment_events", "runs", "run_events", "conversations",
  "activity_events", "approvals", "requests", "automation_jobs", "integrations",
  "client_onboardings", "usage_rollups", "provider_configurations", "service_agreements", "invoices",
  "payments", "billing_events", "incidents", "operator_notes", "audit_logs",
  "processed_webhooks", "runtime_health_samples", "operating_drafts",
  // Prospect Graph
  "pg_import_runs", "pg_niches", "pg_buyer_types", "pg_relationships", "pg_companies", "pg_company_sources",
  "pg_fact_claims", "pg_company_merge_reviews", "pg_people", "pg_company_people", "pg_contact_points", "pg_domain_intel", "pg_signals",
  "pg_icps", "pg_markets", "pg_prospects", "pg_jobs", "pg_market_builds", "pg_handoffs", "pg_outcomes",
  "pg_paid_operations", "pg_cost_events", "pg_budgets", "pg_suppressions",
] as const;

export const APPEND_ONLY = new Set<string>([
  "payments", "billing_events", "audit_logs", "invoices", "service_agreements", "deployment_events",
  "pg_import_runs", "pg_cost_events", "pg_outcomes", "runtime_health_samples",
]);

export type PlatformTable = (typeof PLATFORM_TABLES)[number];

export const physical = (t: string) => `pf_${t}`;
