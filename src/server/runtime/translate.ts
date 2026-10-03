import "server-only";
import type { BotRunEvent } from "./runtime-types";
import { clientSafe, redactSecrets } from "@/server/redact";

/**
 * Event translation registry.
 *
 * Second translation step. Adapters already turned engine events into
 * normalized bot.* events; this turns those into audience-separated lines.
 * Action names are still technical ("web_search", "terminal", "mcp_hubspot_
 * update_contact"). Clients see business language; operators see the
 * sanitized technical line. To teach the platform a new action, add a row
 * here — order matters, first match wins.
 */
export interface Translation {
  match: RegExp;
  /** What a client sees while this happens. */
  client: string;
  /** What an operator sees. `{action}` is replaced with the engine name. */
  operator: string;
}

export const ACTION_TRANSLATIONS: Translation[] = [
  { match: /search/i, client: "Researching", operator: "Search · {action}" },
  { match: /browser|navigate|web_extract|fetch|scrape|crawl/i, client: "Reviewing source", operator: "Browse · {action}" },
  { match: /hubspot|salesforce|servicetitan|crm|pipedrive|jobber/i, client: "Checking CRM", operator: "CRM · {action}" },
  { match: /gmail|outlook|email|mail|smtp/i, client: "Preparing email", operator: "Mail · {action}" },
  { match: /calendar|schedule_meeting/i, client: "Checking calendar", operator: "Calendar · {action}" },
  { match: /google_ads|meta_ads|ads|campaign/i, client: "Reviewing ad account", operator: "Ads · {action}" },
  { match: /review|reputation|gbp|business_profile/i, client: "Checking reviews", operator: "Reviews · {action}" },
  { match: /analytics|ga4|report/i, client: "Analyzing results", operator: "Analytics · {action}" },
  { match: /terminal|execute_code|python|shell|process/i, client: "Processing data", operator: "Compute · {action}" },
  { match: /file|document|pdf|sheet|doc/i, client: "Working on documents", operator: "Files · {action}" },
  { match: /memory|recall/i, client: "Recalling context", operator: "Memory · {action}" },
  { match: /skill/i, client: "Applying playbook", operator: "Skill · {action}" },
  { match: /delegate|subagent/i, client: "Coordinating work", operator: "Delegation · {action}" },
];

const DEFAULT_TRANSLATION: Translation = { match: /.*/, client: "Working", operator: "Action · {action}" };

export function translateAction(action: string | undefined): Translation {
  if (!action) return DEFAULT_TRANSLATION;
  return ACTION_TRANSLATIONS.find((t) => t.match.test(action)) ?? DEFAULT_TRANSLATION;
}

export interface TranslatedEvent {
  kind: "lifecycle" | "action" | "message" | "approval" | "error" | "usage";
  clientText?: string;
  operatorText: string;
  technical?: { action?: string; durationS?: number; error?: boolean; sourceEvent?: string };
}

/** Turn one runtime event into stored, audience-separated lines. Returns
 *  null for high-volume noise (token deltas) that is not worth storing. */
export function translateEvent(e: BotRunEvent): TranslatedEvent | null {
  const technical = { action: e.action, durationS: e.durationS, error: e.error, sourceEvent: e.sourceEvent };
  switch (e.type) {
    case "bot.run.queued":
      return { kind: "lifecycle", clientText: "Queued", operatorText: "Run queued", technical };
    case "bot.run.started":
      return { kind: "lifecycle", clientText: "Started", operatorText: "Run started", technical };
    case "bot.action.started": {
      const t = translateAction(e.action);
      return {
        kind: "action",
        clientText: t.client,
        operatorText: `${t.operator.replace("{action}", e.action ?? "action")}${e.preview ? ` — ${redactSecrets(e.preview, 160)}` : ""}`,
        technical,
      };
    }
    case "bot.action.completed": {
      const t = translateAction(e.action);
      const d = e.durationS !== undefined ? ` (${e.durationS.toFixed(1)}s)` : "";
      return {
        kind: e.error ? "error" : "action",
        // Clients see the start of an action, not every completion.
        clientText: undefined,
        operatorText: `${t.operator.replace("{action}", e.action ?? "action")} ${e.error ? "failed" : "done"}${d}${e.preview ? ` — ${redactSecrets(e.preview, 200)}` : ""}`,
        technical,
      };
    }
    case "bot.message":
      return e.text
        ? { kind: "message", operatorText: `Note: ${redactSecrets(e.text, 300)}`, technical }
        : null;
    case "bot.approval.requested":
      return {
        kind: "approval",
        clientText: "Waiting for approval",
        operatorText: `Approval requested — ${redactSecrets(e.approval?.description ?? "", 200)}`,
        technical,
      };
    case "bot.approval.resolved":
      return { kind: "approval", clientText: "Approval recorded", operatorText: "Approval resolved", technical };
    case "bot.run.completed":
      return { kind: "lifecycle", clientText: "Task complete", operatorText: "Run completed", technical };
    case "bot.run.failed":
      return {
        kind: "error",
        clientText: "Task could not be completed.",
        operatorText: `Run failed${e.text ? ` — ${redactSecrets(e.text, 300)}` : ""}`,
        technical,
      };
    case "bot.run.cancelled":
      return { kind: "lifecycle", clientText: "Stopped", operatorText: "Run cancelled", technical };
    case "bot.run.interrupted":
      return { kind: "error", clientText: "Paused — will be retried", operatorText: "Run interrupted (runtime restart or shutdown)", technical };
    default:
      return null;
  }
}

/** Final guard for anything headed to a client. */
export function toClientLine(text: string | undefined): string | undefined {
  return text ? clientSafe(text, 200) : undefined;
}
