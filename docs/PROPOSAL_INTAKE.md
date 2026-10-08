# Proposal intake — 2026-10-08

Implemented locally on `platform-v1`. Nothing deployed, pushed, or submitted to a live inbox.

## Current commercial entry

The owner replaced the $499 paid workflow audit with a no-payment proposal request. `PROPOSAL_OFFER` in `src/config/marketing-offer.ts` is the public source of truth. Primary entry label: **Begin Step-1**. Implementation pricing remains $7,500 setup + $2,500/month for one defined workflow, Growth from $15,000 + $3,500/month, and custom Enterprise. No invented completion SLA or automatic quote is promised.

Header chrome is full width: logo at the left gutter, navigation centered, Text us / Begin Step-1 at the right gutter. Large-screen outer grid tracks have equal widths. Geist, larger legible navigation, existing phone number and two-stage service/market menus remain.

## Experience

`ProposalLink` opens the single `BotPlanFlow` mounted in the marketing-only root layout without navigating away. Its real `/plan` destination supports modified clicks and a conventional landing page. Existing `AuditForm`, `BotPlanForm` and `BlogOptin` call sites are compatibility entry panels; there is only one questionnaire and submission handler. Existing `#audit` anchors remain for old inbound links. Public paid-audit copy, metadata, FAQs and CTAs have been replaced across shared page templates.

Six steps:

1. Up to three business priorities and homeowner/business customer mix.
2. Team size, current marketing/sales structure and approximate annual revenue, with a prefer-to-discuss option.
3. Existing tools, including field-service, CRM, advertising, website, email and workplace systems; optional other-tool names. No-tools and not-sure selections are exclusive.
4. Separate setup and monthly budgets, with current implementation minimums and separate ad/usage costs disclosed. Below-minimum requests can continue as a fit review or visit resources.
5. Preferred timeline and decision-making role.
6. Editable answer summary, required name/work email/company, optional website/phone, and explicit consent to follow up about this request.

The full-screen native dialog supplies background inertness and keyboard containment. Step headings receive focus; Escape/close restore focus and body scrolling. Mobile uses one content column, large controls and a persistent close bar. Answers remain only in component memory while the root remains mounted; closing/reopening preserves an unfinished brief. They are not written to browser storage. Refreshing or leaving the site clears them. No automatic popup or AI/provider call occurs. Qualification is deterministic and self-reported, not a fabricated lead score or live BOT analysis.

## Delivery and data boundaries

The existing public `/api/plan` endpoint accepts `kind: proposal`, validates bounded allowlisted choices, requires consent, and constructs a complete readable brief. It retains its five-per-ten-minute in-memory rate limit. This remains a single-instance limiter, not durable distributed abuse protection. Public acquisition has no authenticated tenant context and reads/writes no tenant or Prospect Graph records.

Proposal submissions use the existing configured inbox delivery adapter exclusively. `RESEND_API_KEY`, `FROM_EMAIL` and `CONTACT_EMAIL` must be configured for the intended deployment; missing inbox configuration fails closed even in development. A subscriber-list sink alone cannot preserve qualification data and does not count as delivery. Proposal requests do not auto-subscribe the visitor, send them marketing sequences, access their software, or create CRM records. `assertLive` blocks external enquiry delivery in demo mode. Inbox HTML escapes submitted strings. Delivery success is required before the UI shows received; errors preserve inputs and offer direct email. Client requests time out after 15 seconds.

Only allowlisted public page attribution and request receipt enter server analytics. Client events record opening, completed step number and completion, never budget, tools, revenue, identity or free text. The full private brief goes only to the configured inbox. No new database, cloud resource or paid model usage was introduced. Legacy non-proposal intake requests remain supported for existing guide/exit components.

Live deliverability has not been exercised. Tests replace network calls with mocks. A production smoke submission and any deployment require owner authorization.

## Validation

See the latest entry in `docs/MARKETING_BUILD_STATUS.md`. Unit/security tests cover step readiness, exclusive choices, bounded input, consent, deterministic fit routing, full brief delivery, privacy-safe analytics, failed delivery, rate limits, HTML escaping, demo isolation and missing configuration. Browser review covers the complete questionnaire up to submission, back/edit, close/reopen, mobile menu handoff, Escape/focus restoration and narrow/wide layouts without sending a lead.
