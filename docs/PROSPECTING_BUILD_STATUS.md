# Prospecting build status

Legend: **COMPLETE** works end to end and is tested · **PARTIAL** works but
with a stated gap · **PLACEHOLDER** contract/stub only · **NOT IMPLEMENTED**.

| Area | Status | Notes |
|---|---|---|
| CSV import (niches, buyer types) | COMPLETE | Idempotent, stable ids, header validation, duplicate + malformed reporting, ImportRun per run, `npm run prospecting:seed` |
| Seed data embed + drift test | COMPLETE | `npm run prospecting:embed-seed` |
| Normalization (names, keys, Sells To, titles → role family + seniority) | COMPLETE | |
| Niche attractiveness score + tiers | COMPLETE | Modeled, 16 components, reasoning, confidence, version |
| Niche ↔ buyer relationships | COMPLETE | Rules, caps, auto-approve vs review, operator review preserved |
| LLM pass for ambiguous relationships | PLACEHOLDER | `AmbiguityClassifier` seam, off |
| Discovery recipes | PARTIAL | 18 source-class recipes mapped to buyers; only the demo source executes |
| Vertical packs | COMPLETE | 10 packs; drive qualification bars and niche pages |
| Client ICP | COMPLETE | Create/list; edit not yet in UI |
| Market creation + coverage (observed vs estimated) | COMPLETE | Exhaustion is per-source, observed only |
| Company identity graph + source records | COMPLETE | Domain/phone/name+locality; merge threshold 0.75; near matches become operator review candidates |
| Operator merge/split of companies | PARTIAL | Merge-review records + operator-only merge/unmerge helpers; no dedicated UI yet |
| People / role families / decision makers | COMPLETE | |
| Email intelligence (syntax, patterns, MX, statuses) | COMPLETE | No SMTP probing by design |
| EnrichmentRouter (cache, internal, value gate, budgets, retries, fallback, cost ledger) | COMPLETE | Paid calls reserve estimated spend and settle/release through a durable operation ledger |
| Budgets + run limits + approval to continue | COMPLETE | Platform/client/market/provider/run; reservations are patched onto budget rows to avoid concurrent overspend |
| Freshness / TTL policies | COMPLETE | |
| SignalEngine | PARTIAL | Stores observed signals with TTL; only the demo source produces them |
| Fit / Timing / Priority scoring | COMPLETE | Deterministic, `asOf`, components with `observed` |
| Qualification rules + person override | COMPLETE | |
| Suppression / compliance layer | COMPLETE | Hard/soft, global/client, Bot cannot override |
| Outbound handoff contract | COMPLETE | Policy-checked, idempotent, daily cap |
| CRM handoff | PARTIAL | Queues a `crm_queue` handoff; CRM Bot pickup not wired |
| Feedback / outcomes | PARTIAL | Append-only lifecycle + outbound outcome history; no automatic recalibration |
| MarketBuild object | PARTIAL | First-class build records attached to discovery/refresh jobs; no dedicated UI yet |
| Jobs (queued/running/completed/failed/cancelled/paused, progress) | PARTIAL | Run inline after enqueue; no scheduled background worker yet |
| Prospecting Bot tools (16) | COMPLETE | Authorization, zod args, normalized output |
| Bot tool HTTP endpoint + signed tokens | PARTIAL | Runtime/org/Bot/scoped short-lived tokens; issuing tokens to the runtime is not wired |
| Operator console (10 views) | COMPLETE | Overview, markets, ICPs, niches, buyers, review, companies, signals, suppression, providers & cost |
| Client portal prospects | COMPLETE | No vendor names, costs or provenance |
| Demo provider | COMPLETE | Deterministic, fictional, free, flagged |
| RocketReach / LeadMagic / Hunter / Prospeo / lemlist adapters | PLACEHOLDER | Declared capabilities + docs links; no HTTP until implemented and approved |
| Tenant isolation | COMPLETE | Tested, including runtime-bound Prospecting Bot tool claims |
| Vendor/runtime boundaries | COMPLETE | ESLint + tests |
| Postgres/S3/ClickHouse data plane | NOT IMPLEMENTED | Boundary (`ProspectGraphStore`) in place |
| Convex paged reads | COMPLETE (code) | **Needs `npx convex deploy` on staging** |

## Tests

`tests/prospecting/` — ontology (11), router/jobs/email (13), security/policy
(22). Full suite: 151 tests, all passing, plus `tsc` and ESLint clean.
