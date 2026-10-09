import "server-only";
import { isDemo } from "@/server/env";
import { unavailable } from "@/server/errors";

/** Intentionally no environment-variable override. Releasing execution requires
 * a reviewed implementation and recorded staging tests, not a dashboard toggle.
 * See docs/SECURITY_REMEDIATION_STATUS.md for the acceptance requirements. */
export function requireExecutionRelease(): void {
  if (!isDemo()) throw unavailable("Live BOT execution is not released. Spend limits and exact-action approvals must pass staging verification first.");
}
