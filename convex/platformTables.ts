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
  "users", "memberships", "sessions", "organizations", "bots", "skill_assignments",
  "runtimes", "deployment_events", "runs", "run_events", "conversations",
  "activity_events", "approvals", "requests", "automation_jobs", "integrations",
  "usage_rollups", "provider_configurations", "service_agreements", "invoices",
  "payments", "billing_events", "incidents", "operator_notes", "audit_logs",
  "processed_webhooks",
] as const;

export const APPEND_ONLY = new Set<string>([
  "payments", "billing_events", "audit_logs", "invoices", "service_agreements", "deployment_events",
]);

export type PlatformTable = (typeof PLATFORM_TABLES)[number];

export const physical = (t: string) => `pf_${t}`;
