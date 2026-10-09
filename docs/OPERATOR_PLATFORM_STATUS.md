# Operator platform — 2026-10-09

## Security audit qualification

The later prelaunch review in `SECURITY_LEGAL_AUDIT_2026-10-09.md` identifies unremediated security and legal readiness gaps. The interface work below remains delivered, but its descriptions of append-only records and reviewed execution are not proof of storage immutability or atomic authorization. Local probes confirmed editable audit records, duplicate webhook claims and soft unsubscribe handling. Approval execution ordering, model budgets, MFA, environment/IAM isolation and production monitoring also need the report's release checks. No remediation or deployment was included in the audit; the owner confirms nothing is live today.

## Delivered locally

The `/ops` workspace now uses the available desktop width, larger Geist type, calmer spacing, low-radius buttons and responsive cards. Marketing styling is unchanged. Mobile navigation collapses so the menu no longer consumes the first screen.

| Area | Implemented behavior |
| --- | --- |
| Dashboard and runs | Interactive area charts from recorded daily runs, selectable outcome series, keyboard-accessible chart and numeric table. Four primary measures, a separate priority strip, scoped financial and exception data. Finished-run success excludes unfinished runs. UTC day buckets are consistent. |
| Clients and onboarding | Full-width layout, clearer grouped tabs, readable summary panels, and the existing draft compiler with an explicit context → configuration → readiness sequence. Existing client controls and forms remain available. |
| BOTS | Fleet cards with client, model route, assigned integrations, activity and direct BOT workspace links. |
| Requests | Larger board cards and a support workbench on each request. Preparation gathers this client's recorded observations and creates an editable diagnostic SOP. It makes no model call and does not start a run. A human can review the instructions and explicitly start the existing request BOT RUN. |
| Approvals | Expandable proposals explain the reason, impact, preview, decision owner, expiry and what approval releases. Confirmation before release. Reused in the queue, client, request and run views. Expired pending records display as expired and no longer inflate pending counts. |
| Automations | Click through to a persistent SOP workspace. Reorder steps by dragging or accessible buttons, edit instructions, use three templates and inspect the compiled prompt. Applying a reviewed draft requires a paused schedule; resuming is separate. |
| Integrations | Shared integration lists become responsive connection cards, retaining checks, timestamps, errors and existing controls. |
| Prospect Graph | Actual niche-to-buyer relationship explorer; explicit knowledge → buyer → ICP → prospect path. Searchable paged niche and buyer profiles, expandable decision context, ICP targeting cards and improved shared navigation/layout on all graph sections. Pending/rejected mappings are excluded from buyer-profile mapping counts. Scoped operators' cost summaries exclude other clients. |
| Infrastructure | Last attempt and last successful response are distinct. New append-only observations record state, readiness, latency and demo status. Ten-minute freshness checks prevent week-old healthy badges. Hourly history preserves unobserved gaps; backup freshness is visible. |
| Monitoring | Incident impact summary, readable incident cards and overdue-check count. Original investigation, resolution and correlation-log controls remain. |
| Billing and usage | Per-client finance summaries; contract revenue, collected cash and estimated contribution distinguished. Model/infrastructure contribution is not presented as net profit. Historical usage with current revenue/infra assumptions is labeled. |
| Skills | Each skill opens a visual strategy workspace scoped to a compatible client BOT. Reviewed strategy can update that BOT's instructions for future manual runs. Base versioned skill files and existing scheduled prompts remain unchanged. |
| Audit and settings | Searchable, paginated expandable audit timeline, preserving append-only records; settings grouped into environment, providers and team, retaining existing forms. |

## Storage and authorization

`operating_drafts` is a tenant-scoped, optimistic-versioned record for automation, support and skill procedures. Saving does not change a BOT or schedule. `sourceVersion` detects configuration changes; a stale draft must be reviewed and saved again. First-save IDs are deterministic, preventing duplicate drafts for the same target. Every save/application writes an audit entry through Repository/Tx and existing services. Credential-shaped draft content is rejected. Oversized compiled prompts fail validation rather than truncate away the final review instruction.

`runtime_health_samples` is tenant-scoped and append-only. Both new tables are registered in the platform and Convex registries. The existing sync path captures observations; polling attempts use `lastCheckedAt` to avoid tight retry loops after failure. The history starts with the first new check; no historical observations were invented.

Convex table deployment is still required before using these features in a live environment. No deployment has been performed.

## Product boundaries

- The canvas is a sequential SOP editor for one BOT, not a branching DAG engine. Natural-language instructions are compiled into the existing BOT prompt. There is no paid model call while editing. Image-to-workflow interpretation and automatic generation of arbitrary tool graphs are not implemented.
- Support preparation is a deterministic evidence brief and editable diagnosis plan. A fully autonomous support worker, automatic remediation, and automatic client replies are not enabled. Live diagnosis needs a validated read-only runtime profile and tool policy. A prompt's “human review” instruction is not a security boundary; runtime and service approval checks remain mandatory.
- Applying a skill strategy currently replaces the selected BOT's general instructions, and the confirmation explains this. It does not publish a new base skill version or modify a scheduled automation. The base skill remains visible in the workspace for reference.
- Automation application uses the existing runtime update service. Cross-system transactional deployment/reconciliation is a remaining reliability task; do not describe draft version checks as atomic deployment to the runtime.
- Health check success is not measured uptime, an SLA, a complete observability stack, or proof of recovery. High availability and model failover need staged validation. See `ENTERPRISE_RELIABILITY_PLAN.md`.

## Validation

- `npm run typecheck`: passed.
- `npm run lint`: zero errors; five existing warnings in generated Convex files and `BlogArchive.tsx`.
- `npm test`: 250 tests passed across 38 files, including 14 new operator-workspace regression tests for tenant isolation, draft conflicts, approval gates, prompt validation, health freshness and scoped costs.
- `npm run build`: passed, including link integrity, SEO, topic and search-publication checks. Existing topic-coverage notes remain advisory.
- `node scripts/white-label-scan.mjs`: 66 client bundle files clean.
- Browser checks: desktop and mobile dashboard, collapsible mobile navigation, chart outcome selection, persisted automation draft/reordering, niche-to-buyer selection, demo health observation, request diagnostic-plan preparation, and a compatible client/BOT skill editor with its base-skill reference. Preparing support created no BOT RUN and sent no message. Responsive checks included 390 px and 2560 px widths.

Local demo edits are not committed. No real messages, model calls, paid vendor requests, cloud deployment or push are part of this change.
