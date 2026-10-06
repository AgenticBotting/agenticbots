# Public service capability audit

_Audited 2026-10-06 against `src/config/bot-catalog.ts`, `src/config/skills.ts`, the onboarding recommender and the Prospect Graph._

## Finding

The operator platform deploys **10 BOT types** with **9 versioned skills**. The public website has **13 service routes**. Those routes are valid commercial mandates, but they are not thirteen distinct runtime BOT types.

Public copy must describe:

- **10 deployable BOT types** in the managed platform;
- **13 managed service mandates** sold around business outcomes;
- a defined combination of BOT types, skills, integrations and human operating work for each mandate;
- human approval before external sending, publishing, advertising changes or CRM writes;
- proposal-specific scope rather than universal timing, performance or platform promises.

## Service-to-platform alignment

| Public service mandate | Platform delivery model | Versioned skill basis | Public boundary |
|---|---|---|---|
| Paid Media / PPC | Ads BOT | Google Ads analysis | Analysis and proposed account changes; advertising changes require approval. |
| SEO | SEO BOT | Local SEO analysis | Research, monitoring and drafting; publishing requires approval. |
| Content Marketing | Content BOT | Content production | Source-based drafting and adaptation; publishing requires approval. |
| Email Marketing | Outbound BOT, with Reactivation BOT where customer history is used | Follow-up drafting; customer reactivation | A governed messaging workflow, not a separate Email BOT type. Sending requires approval and suppression checks. |
| Conversion Rate Optimization | Analytics BOT with scoped human implementation | Existing analytics skills; no dedicated CRO skill | Diagnosis and experiment preparation are supported. Site changes require separately scoped implementation and approval. |
| Analytics & Reporting | Analytics BOT | Google Ads analysis; Local SEO analysis | Research, monitoring and reporting. Source quality and definitions remain explicit. |
| Lead Generation | Prospecting BOT | Prospect research | Prospect Graph research, qualification and governed CRM handoff. Paid enrichment is budget-gated. |
| Outbound Execution | Outbound BOT | Follow-up drafting | Approved outreach and CRM handoff with suppression, caps and human escalation. |
| Inbound Lead Handling | CRM BOT with Outbound BOT where approved response is in scope | CRM hygiene; Follow-up drafting | An inbound operating workflow, not a separate Speed-to-Lead BOT type. Telephony and instant-response commitments are not inherent platform capabilities. |
| CRM Management | CRM BOT | CRM hygiene | Monitoring, proposed updates and approved CRM writes. |
| Sales Enablement | Proposal BOT | Proposal drafting | Proposal preparation and approved delivery from client-provided systems and rules. |
| Review Generation | Reviews BOT | Review requests | Eligibility, drafting and approved requests or responses through supported integrations. |
| Customer Reactivation | Reactivation BOT | Customer reactivation; Follow-up drafting | Eligibility analysis and approved re-engagement with consent and suppression controls. |

## Copy rules

1. Call the thirteen offers **service mandates**, **workflows** or **capabilities**. Reserve **BOT type** for the ten entries in the backend catalog.
2. Describe what the system observes, prepares, routes, records and—after approval—executes.
3. Do not promise universal response times, go-live dates, rankings, lead volume, booked work, zero missed follow-up or autonomous external actions.
4. Do not advertise integrations outside the allowlists in `src/config/bot-catalog.ts` as included capabilities.
5. Present approvals, tenant isolation, BOT ACTIVITY and proposal-defined scope as operating architecture rather than marketing add-ons.
6. Treat the Prospect Graph as the strongest differentiated capability: market definition, company and buyer research, deterministic qualification, budget-gated enrichment, suppression and governed outbound handoff.

