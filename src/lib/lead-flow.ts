/**
 * Global lead-flow triggers.
 *
 * Any button anywhere fires a CustomEvent; the modals live once in the
 * root layout and listen. Keeps every CTA a one-liner and avoids
 * threading open-state through the tree.
 */

export const BOT_PLAN_EVENT = "open-bot-plan";

/** Opens the multi-step bot plan flow. `source` is recorded on the lead. */
export function openBotPlan(source = "site") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BOT_PLAN_EVENT, { detail: { source } }));
}

/* ── Exit-intent suppression ──────────────────────────────────────── */

const DISMISS_KEY = "ab_exit_dismissed_at";
const SUPPRESS_DAYS = 14;

export function markExitDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* private mode — the modal simply may show again */
  }
}

export function exitIntentSuppressed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    if (!at) return false;
    return Date.now() - at < SUPPRESS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}
