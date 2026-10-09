export type EventName =
  | "cta_clicked"
  | "proposal_opened"
  | "proposal_step_completed"
  | "proposal_completed"
  | "proposal_received"
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
  | "roster_bot_focused"
  | "market_searched"
  | "guide_requested"
  | "workflow_step_viewed"
  | "workflow_example_approved"
  | "audit_form_started";

/** Tracking is deliberately disabled, including server-side events. A future
 * analytics integration must ship consent and route/property allowlists first.
 * Keep call sites compatible without logging visitor/form data locally. */
export function track(event: EventName, props?: Record<string, unknown>): void { void event; void props; }
export async function trackServer(event: EventName, props?: Record<string, unknown>): Promise<void> { void event; void props; }
