import { titleCase } from "@/lib/platform/format";

export type Tone = "good" | "live" | "watch" | "bad" | "quiet";

/** One vocabulary of states → one tone each. Every status shows its word. */
const TONES: Record<string, Tone> = {
  // generic
  active: "good", healthy: "good", connected: "good", completed: "good", paid: "good", approved: "good", resolved: "good",
  deployed: "good", succeeded: "good", ok: "good", present: "good", operational: "good", monitoring: "good", idle: "good", success: "good",
  working: "live", running: "live", in_progress: "live", queued: "live", provisioning: "live", updating: "live", started: "live",
  pending: "watch", waiting_for_approval: "watch", due: "watch", partially_paid: "watch", degraded: "watch", needs_attention: "watch",
  reviewing: "watch", waiting_on_client: "watch", submitted: "watch", onboarding: "watch", investigating: "watch", upcoming: "watch",
  sent: "watch", failing: "bad", paused: "quiet", medium: "watch", rotating: "watch",
  intake_complete: "watch", analyzing: "live", review_required: "watch", client_action_required: "watch", ready_for_operator_approval: "watch",
  ready_for_review: "watch", ready_to_provision: "good", not_ready: "quiet", budget_requires_configuration: "watch", operator_approval_required: "watch",
  failed: "bad", past_due: "bad", offline: "bad", suspended: "bad", error: "bad", interrupted: "bad", denied: "bad", down: "bad",
  open: "bad", critical: "bad", high: "bad", canceled: "bad", terminated: "bad", missing: "bad", declined: "quiet",
  disabled: "quiet", draft: "quiet", unknown: "quiet", stopped: "quiet", not_configured: "quiet", disconnected: "bad", none: "quiet",
  // prospecting
  qualified: "good", auto_approved: "good", accepted: "good", ready: "good", review: "watch", needs_review: "watch",
  researching: "live", sent_to_outbound: "live", rejected: "quiet", exhausted: "quiet", rejected_policy: "bad", not_implemented: "quiet",
  cancelled: "quiet", expired: "quiet", void: "quiet", written_off: "quiet", ignored: "quiet", low: "quiet", not_provisioned: "quiet", completed_agreement: "good",
};

export function toneOf(status: string | undefined): Tone {
  return (status && TONES[status]) || "quiet";
}

export function Status({ value, label, tone }: { value?: string; label?: string; tone?: Tone }) {
  const t = tone ?? toneOf(value);
  return <span className={`pf-status ${t}`}>{label ?? titleCase(value ?? "unknown")}</span>;
}
