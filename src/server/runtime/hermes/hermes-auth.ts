import "server-only";
import type { RuntimeConnection } from "../runtime-types";

/**
 * Hermes addressing and authentication.
 *
 * One API listener serves every Bot under a `/p/<profile>/` prefix, and
 * each prefix accepts only THAT profile's bearer key. Private connectivity
 * adds the tunnel's service-token headers. Nothing outside this folder
 * builds these URLs or headers.
 */
export function hermesUrl(c: RuntimeConnection, path: string): string {
  const base = c.endpoint.replace(/\/+$/, "");
  const prefix = c.runtimeProfile && c.runtimeProfile !== "default" ? `/p/${encodeURIComponent(c.runtimeProfile)}` : "";
  return `${base}${prefix}${path}`;
}

export function hermesHeaders(c: RuntimeConnection, extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${c.credentials.apiKey}`,
    Accept: "application/json",
  };
  if (c.credentials.accessClientId && c.credentials.accessClientSecret) {
    h["CF-Access-Client-Id"] = c.credentials.accessClientId;
    h["CF-Access-Client-Secret"] = c.credentials.accessClientSecret;
  }
  return { ...h, ...extra };
}
