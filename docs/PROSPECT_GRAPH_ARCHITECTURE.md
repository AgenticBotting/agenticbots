# Prospect Graph — architecture

The Prospect Graph is AgenticBots' own prospecting infrastructure: a
vendor-independent map of **what contractors sell → who buys it → where those
buyers are → which companies and decision makers they are → which ones are
worth contacting now**, with every fact traceable to its source and every
dollar of data spend accounted for.

It is not a contact database to resell. It stores only what a client market
needs, enriches only prospects worth it, and treats paid data vendors as
interchangeable suppliers behind one router.

## The vertical slice

```
SERVICE NICHE ──► BUYER RELATIONSHIPS ──► GEOGRAPHY ──► MARKET (per client)
      │                                                     │
      │ (shared ontology)                                   ▼  DISCOVER_MARKET job
      │                                    COMPANY (shared identity graph)
      │                                                     │  research → signals
      │                                                     ▼
      │                                    DECISION MAKER (role family)
      │                                                     │  work email → verify
      ▼                                                     ▼
 niche attractiveness ──────────────────────► PROSPECT SCORE (fit · timing · priority)
                                                            │  rules
                                                            ▼
                                         SAVED / QUALIFIED PROSPECT (private)
                                                            │  suppression + policy (code)
                                                            ▼
                                         READY FOR OUTBOUND → OutboundProvider contract
```

## Layers

| Layer | Where | Notes |
|---|---|---|
| Domain types | `src/lib/prospecting/types.ts` | Types only, safe for UI imports |
| Storage boundary | `src/server/prospecting/store.ts` | `ProspectGraphStore` — the only way prospecting code touches storage |
| Ontology | `src/server/prospecting/ontology/*` | CSV import, taxonomy, niche scoring, relationships, titles, recipes, vertical packs |
| Identity graph | `identity.ts`, `companies.ts` | Company resolution (domain → phone → name+locality), source records |
| Router | `router.ts` | Cache → internal → value gate → providers; budgets; cost ledger |
| Providers | `providers/*` | Neutral contracts, demo provider, vendor stubs, registry, secrets |
| Signals | `signals.ts`, `freshness.ts` | Observed "why now" only, with TTLs |
| Scoring | `scoring.ts` | Deterministic fit / timing / priority + qualification rules |
| Compliance | `compliance.ts`, `outbound.ts` | Suppression + outbound policy, in code |
| Client data | `markets.ts`, `prospects.ts`, `jobs.ts` | ICPs, markets, prospects, jobs, outcomes |
| Access | `access.ts` | `Principal` (user or Bot) × action × org |
| Bot tools | `tools.ts`, `/api/bot-tools/prospecting` | Narrow, normalized, authorized |
| Views | `views.ts` | Client projection (no vendors, costs, provenance) |
| Operator console | `src/app/ops/prospecting/**` | Markets, ICPs, niches, buyers, review, companies, signals, suppression, providers & cost |
| Client portal | `src/app/portal/prospects` | One simple list |

## Shared vs private data

* **Shared market intelligence** (no `orgId`): ontology, companies, source
  records, people, company-person roles, contact points, domain mail
  intelligence, signals. Public/commercial facts reusable across clients.
* **Private client intelligence** (`orgId` required): ICPs, markets,
  prospects, jobs, outbound handoffs, outcomes.
* **Mixed** (`orgId` optional, operator-only when absent): cost events,
  budgets, suppressions.

Private rows are only ever read through `getPrivate()` / `allowed()`, which
return *not found* for another tenant. A test asserts that shared tables
never carry an `orgId` and that a client's private notes never appear in
shared records.

## Deterministic workers vs. the runtime

Jobs (`jobs.ts`) do the mechanical work — discovery, identity resolution,
enrichment through the router, scoring, rule-based qualification — with no
model in the loop. A Prospecting Bot (in the client's runtime) uses
**tools** that enqueue and run those jobs; it never sees SQL, Convex,
provider names or keys. Job states: `queued → running → completed | failed |
cancelled | paused` (paused = a budget needs a person's approval).

V1 runs a job inline right after it is enqueued (bounded by run limits).
A background runner (`runQueuedJobs`) exists for a scheduled worker later.

## Data-plane boundary

All prospecting modules use `ProspectGraphStore`. Today it is backed by the
platform repository (memory in demo/tests, Convex envelopes `pf_pg_*` in
staging/production), written in chunks of 150 operations. Convex reads now
page through `platform.page` (400 per page) so large tables work.

When the shared tables outgrow Convex (hundreds of thousands of companies),
a Postgres (+ S3 for raw payloads, ClickHouse for cost/event analytics)
implementation replaces `PlatformGraphStore` for the SHARED tables only.
Private client tables stay in the control plane. Nothing above `store.ts`
changes.

## Auditability

Every operator or Bot change (relationship review, ICP/market creation,
job enqueue/cancel/approval, qualification override, rejection, outcome,
suppression add/lift, budget change, outbound handoff or block) writes an
`audit_logs` entry with actor, org, target and correlation id. Cost events,
import runs and outcomes are append-only.
