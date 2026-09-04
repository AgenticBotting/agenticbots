# Analytics — event taxonomy & funnels (Phase 9)

Transport: PostHog HTTP capture API called directly from `src/lib/analytics.ts` — the posthog-js SDK (~50KB gz) was declined against the 150KB route JS budget. Named events only; autocapture off by construction. Without `NEXT_PUBLIC_POSTHOG_KEY`, events console.debug in dev and no-op in prod, so instrumentation stays correct before credentials exist.

**To activate:** set `NEXT_PUBLIC_POSTHOG_KEY` (client) and optionally `POSTHOG_SERVER_KEY` (server-side conversions) and `NEXT_PUBLIC_POSTHOG_HOST`. Session replay for converters + feature-flag A/B require adding the SDK later — do it behind a route-level dynamic import and re-measure the JS budget in the same PR.

## Naming convention

`object_action`, snake_case, past tense. One event per user intention — no page-view spam (PostHog pageviews can be enabled server-side later if wanted).

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

Common properties on every client event: `$current_url`, `path`, stable `distinct_id` (localStorage UUID; degrades to `anonymous` in private mode).

## Funnels

1. **Primary:** land → `cta_clicked` → `plan_flow_opened` → `plan_flow_step_completed` (×3) → `plan_flow_completed` → *showed* (manual/CRM until booking exists).
2. **Mat:** `mat_impressed` → `mat_converted` vs `mat_dismissed`, segmented by `mode` × `trigger` × `page_type`. **Kill rule (spec):** any variant under 1.5% conversion gets removed, not tuned.
3. **Demo engagement:** `trace_played` → `cta_clicked` same session — the hypothesis behind the hero asset.

## Server-side conversions

`/api/plan` fires `plan_form_submitted { converted: true, source_side: "server" }` after successful delivery — the client event can be lost to ad blockers; the server one cannot. Dedupe in analysis on source_side.

## Deferred (needs deployment + accounts)

Weekly automated report, GSC query pull, A/B harness at section level — each requires the site to be live with credentials. The Section component's `id` prop is the designed hook for section-level experiments.
