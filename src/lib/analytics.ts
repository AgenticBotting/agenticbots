/**
 * Analytics (Phase 9). Named events only — autocapture is deliberately off.
 *
 * Transport: PostHog's HTTP capture endpoint, called directly. The
 * posthog-js SDK is ~50KB gz against a 150KB route budget; the capture
 * API is a fetch. Session replay and feature flags need the SDK — add it
 * behind a flag when a concrete replay need exists (docs/ANALYTICS.md).
 *
 * No key configured (NEXT_PUBLIC_POSTHOG_KEY) -> events log to console in
 * dev and no-op in prod, so instrumentation is correct before credentials.
 */

export type EventName =
  | "cta_clicked"
  | "plan_flow_opened"
  | "plan_flow_step_completed"
  | "plan_flow_completed"
  | "plan_form_submitted"
  | "mat_impressed"
  | "mat_dismissed"
  | "mat_converted"
  | "trace_played"
  | "trace_scrubbed"
  | "nav_mega_opened"
  | "roster_bot_focused";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

function distinctId(): string {
  try {
    const k = "ab_did";
    let id = localStorage.getItem(k);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(k, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

/** Fire a named product event. Never throws; never blocks the UI. */
export function track(event: EventName, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const payload = {
    api_key: KEY,
    event,
    distinct_id: distinctId(),
    properties: { ...props, $current_url: location.href, path: location.pathname },
    timestamp: new Date().toISOString(),
  };
  if (!KEY) {
    if (process.env.NODE_ENV !== "production") console.debug("[analytics]", event, props);
    return;
  }
  const body = JSON.stringify(payload);
  // sendBeacon survives page unloads (mat dismissals, exit clicks).
  if (!navigator.sendBeacon?.(`${HOST}/i/v0/e/`, body)) {
    fetch(`${HOST}/i/v0/e/`, { method: "POST", body, keepalive: true }).catch(() => {});
  }
}

/** Server-side conversion capture — used by /api/plan (Phase 9 spec). */
export async function trackServer(event: EventName, props: Record<string, unknown> = {}): Promise<void> {
  const key = process.env.POSTHOG_SERVER_KEY || KEY;
  if (!key) return;
  try {
    await fetch(`${HOST}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: "server",
        properties: { ...props, source_side: "server" },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    /* conversion still succeeded; analytics must never break the funnel */
  }
}
