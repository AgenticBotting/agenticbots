# Analytics — event taxonomy & funnels (Phase 9)

Transport: **Umami** (the user's standard). The tracker script loads from the layout only when `NEXT_PUBLIC_UMAMI_URL` + `NEXT_PUBLIC_UMAMI_WEBSITE_ID` are set — until then every `track()` console.debugs in dev and no-ops in prod, so instrumentation stays correct before the account exists. Named events via `window.umami.track`; server-side conversions post to Umami's `/api/send` (set `UMAMI_URL` + `UMAMI_WEBSITE_ID` server-side).

Deliberately dormant for now — activate when there's traffic worth reading.

## Naming convention

`object_action`, snake_case, past tense. One event per user intention — Umami records pageviews itself; custom events stay intention-level.

## Event catalog (typed in `analytics.ts` — adding an event means extending `EventName`)

| Event | Fired from | Properties |
|---|---|---|
| `cta_clicked` | every `PlanCta` | `source`, `label` |
| `plan_flow_opened` | BotPlanFlow on open | `source` |
| `plan_flow_step_completed` | each card pick | `step`, `field`, `value`, `source` |
| `plan_flow_completed` | flow submit success | `source`, `focus` |
| `plan_form_submitted` | BotPlanForm success (client) **and** `/api/plan` (server, `converted: true`) | `source`, `focus` |
| `mat_impressed` | ExitIntent show | `mode` (mat/sheet), `trigger` (exit_intent/scroll_depth/scroll_reversal), `page_type` |
| `mat_dismissed` | any dismissal | `mode`, `how` (x/esc/backdrop/no_thanks) |
| `mat_converted` | mat form success | `mode` |
| `trace_played` | AgentTrace play | `replay` |
| `trace_scrubbed` | AgentTrace scrub | — |
| `nav_mega_opened` | header Bots menu | — |
| `roster_bot_focused` | reserved for BotScrollList focus dwell | `slug` |

Umami attaches URL/referrer itself; event `data` carries the properties above.

## Funnels

1. **Primary:** land → `cta_clicked` → `plan_flow_opened` → `plan_flow_step_completed` (×3) → `plan_flow_completed` → *showed* (manual/CRM until booking exists).
2. **Mat:** `mat_impressed` → `mat_converted` vs `mat_dismissed`, segmented by `mode` × `trigger` × `page_type`. **Kill rule (spec):** any variant under 1.5% conversion gets removed, not tuned.
3. **Demo engagement:** `trace_played` → `cta_clicked` same session — the hypothesis behind the hero asset.

## Server-side conversions

`/api/plan` fires `plan_form_submitted { converted: true, source_side: "server" }` via Umami `/api/send` after successful delivery — the client event can be lost to ad blockers; the server one cannot. Dedupe on source_side.

## Deferred (needs deployment + accounts)

Weekly automated report, GSC query pull, A/B harness at section level, session replay (Umami has none — would be a separate tool if ever wanted) — each requires the site to be live. The Section component's `id` prop is the designed hook for section-level experiments.
