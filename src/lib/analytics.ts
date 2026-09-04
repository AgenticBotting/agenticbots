/**
 * Analytics (Phase 9) — Umami.
 *
 * Named events only. The Umami script loads from the layout ONLY when
 * NEXT_PUBLIC_UMAMI_URL + NEXT_PUBLIC_UMAMI_WEBSITE_ID are set; until
 * then every call console.debugs in dev and no-ops in prod, so the
 * instrumentation stays correct before the account exists.
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

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

/** Fire a named product event. Never throws; never blocks the UI. */
export function track(event: EventName, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  if (window.umami) {
    try { window.umami.track(event, props); } catch { /* never break the UI */ }
    return;
  }
  if (process.env.NODE_ENV !== "production") console.debug("[analytics]", event, props);
}

/**
 * Server-side conversion capture — Umami's /api/send endpoint.
 * No-ops without UMAMI_URL + UMAMI_WEBSITE_ID (server-side vars).
 */
export async function trackServer(event: EventName, props: Record<string, unknown> = {}): Promise<void> {
  const host = process.env.UMAMI_URL || process.env.NEXT_PUBLIC_UMAMI_URL;
  const website = process.env.UMAMI_WEBSITE_ID || process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!host || !website) return;
  try {
    await fetch(`${host.replace(/\/$/, "")}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "agenticbots-server" },
      body: JSON.stringify({
        type: "event",
        payload: { website, name: event, data: { ...props, source_side: "server" }, url: "/api/plan", hostname: "agenticbots.dev" },
      }),
    });
  } catch {
    /* the conversion still succeeded; analytics must never break the funnel */
  }
}
