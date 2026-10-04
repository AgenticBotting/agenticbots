# Prospecting provider adapters

Vendors are interchangeable suppliers behind four neutral contracts
(`src/server/prospecting/providers/types.ts`):

| Contract | Capabilities | Used by |
|---|---|---|
| `ProspectDataProvider` | `company_discovery`, `company_research`, `signals` | discovery jobs, `researchCompany` |
| `ContactEnrichmentProvider` | `people_search`, `email_finding` | `findDecisionMakers`, `resolveWorkEmail` |
| `EmailVerificationProvider` | `email_verification` | `verifyContact` |
| `OutboundProvider` | `outbound` | `sendToOutbound` (after policy checks) |

Errors are `ProviderError` with a neutral kind: `not_configured`,
`not_implemented`, `auth_failed`, `rate_limited`, `quota_exceeded`,
`unavailable`, `bad_response`. Transient kinds are retried (budget's
`maxProviderRetries`); all but `bad_response` fall through to the next
provider.

## Status today

| Provider | Key | Capabilities | Status | Credential setting | Docs |
|---|---|---|---|---|---|
| Demo data / contacts / verification / outbound | `demo` | all | **Working** in demo mode (or `PROSPECTING_DEMO_PROVIDER=true`); free; fictional; sends nothing | — | — |
| RocketReach | `rocketreach` | people search, email finding, company discovery | **Stub** (no HTTP) | `ROCKETREACH_API_KEY` | https://docs.rocketreach.co/reference/people-search-api |
| LeadMagic | `leadmagic` | email finding, verification | **Stub** | `LEADMAGIC_API_KEY` | https://leadmagic.io/docs/api-reference/email-finder |
| Hunter | `hunter` | people search (domain search), email finding, verification | **Stub** | `HUNTER_API_KEY` | https://hunter.io/api-documentation (base `https://api.hunter.io/v2/`) |
| Prospeo | `prospeo` | email finding, verification | **Stub** | `PROSPEO_API_KEY` | https://prospeo.io/api |
| lemlist | `lemlist` | outbound (add lead to campaign) | **Stub** | `LEMLIST_API_KEY` | https://developer.lemlist.com/api-reference/endpoints/leads/create-lead-in-campaign |

A stub reports `not_configured` with no credential and `not_implemented`
with one. The router skips both, so **no vendor can be called and no money
can be spent** until an adapter is implemented, priced and budgeted. Tests
assert no `fetch` happens.

## Order of operations in the router

1. **Cache** — fresh fact in the graph (TTLs in `freshness.ts`: people 60d,
   found email 90d, verification 30d, domain intel 14d, research 60d).
2. **Internal** — free intelligence: learned email pattern for the domain,
   MX lookup via DNS (no SMTP probing), syntax and role-address checks.
3. **Value gate** — paid calls only when the prospect's pre-contact fit is
   ≥ 35 (`ENRICH_PRELIM_MIN`).
4. **Providers by priority** — skipped if not ready or not priced; budget
   checked before each paid call; failures recorded and fallen through.

Every call writes a `pg_cost_events` row (success or failure).

## Pricing

Never guessed. Set `PROSPECTING_PRICING` (server env) from your contract:

```json
{"hunter": {"email_finding": 0.049, "email_verification": 0.01}}
```

A paid provider with no price for a capability is not called.

## Credentials

Server-side only (`providers/secrets.ts`, importable only inside
`providers/**` — enforced by ESLint and a boundary test). Values come from
server environment variables populated from the platform secret store. They
never reach the browser, the client portal, a Bot's prompt context, logs,
audit entries or stored records. The operator console shows only whether a
credential is set.

## Implementing a real adapter (checklist)

1. Read the vendor's current API docs (link above). Do not guess endpoints.
2. Implement the methods in `vendors.ts` with `fetch` and `readCredential()`.
3. Map vendor statuses to the neutral ones (e.g. accept-all → `CATCH_ALL`).
4. Map HTTP 401/403 → `auth_failed`, 429 → `rate_limited`, 5xx → `unavailable`,
   402/quota → `quota_exceeded`.
5. Set `implemented = true`, add pricing to `PROSPECTING_PRICING`.
6. Add a contract test using a recorded response (never a live call in CI).
7. Get approval for paid usage, set a client budget, then enable.

## Demo provider

Deterministic fictional data: every company is `[Demo] …` on a reserved
`.example` domain with no phone number, demo people, demo signals dated
relative to today, verification outcomes from a hash, and an outbound
provider that records but never sends. Everything it writes is flagged
`demo: true`, and the outbound policy refuses to hand a demo contact to any
non-demo outbound system.
