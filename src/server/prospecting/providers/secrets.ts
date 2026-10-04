import "server-only";

/**
 * Provider credentials. Read ONLY inside provider adapters, on the server.
 *
 * Source: server environment variables, which in staging/production are
 * populated from the platform's secret store (the same way the platform's
 * other server-side keys are). They are never:
 *   - sent to the browser or client portal (this module is server-only)
 *   - placed in a Bot's prompt context (tools return normalized results)
 *   - written to logs, audit entries or Convex records
 *
 * `hasCredential` answers yes/no; nothing outside an adapter can read the value.
 */
export function hasCredential(setting: string): boolean {
  const v = process.env[setting];
  return typeof v === "string" && v.trim().length > 0;
}

/** For adapter internals only. */
export function readCredential(setting: string): string | undefined {
  const v = process.env[setting]?.trim();
  return v ? v : undefined;
}
