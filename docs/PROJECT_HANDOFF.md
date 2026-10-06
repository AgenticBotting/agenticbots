# AgenticBots — project handoff

_For the next senior coding agent. Written 2026-10-04. Read `AGENTS.md` (repo root) first; it has the permanent rules. This file is the current state._

---

## Latest marketing update — 2026-10-06

The premium managed-workforce marketing pass is implemented locally on `platform-v1`. Homepage, pricing, About and How it works are rebuilt; direct service mega navigation, lightweight code-rendered system visuals, a stable scroll/manual BOT workflow, and shared tier pricing are in place. The scrollytelling stage keeps one constant layout frame and advances through a narrow viewport-center trigger. One BOT is $7,500 + $2,500/month; Growth starts at $15,000 + $3,500/month for 3–5 BOTS, with expansion to ten scoped separately; Enterprise is custom. The BOT workflow audit is $499 and promises written findings within two business days after payment; the request form does not charge immediately. No engine benchmarks are presented as our results. No deployment or push occurred. Details and validation: `docs/MARKETING_BUILD_STATUS.md`; visual direction: `docs/ASSET-BRIEF.md`.

The homepage and national service pages now use enterprise operating language for established contractors, typically above $2M in annual revenue. Each national service page has service-specific positioning plus a deployment profile for fit, operating model and authority. The service index adds a shared operating-standard record. Global marketing CTAs now request the $499 BOT workflow audit, and unsupported security/procurement claims were removed from the service-page governance section.

The services portfolio and all 13 national service pages now use a light, trustworthy editorial hierarchy: a pale numbered hero, UI-only operating views, restrained structural framing, translucent service icons, and a clear section index. Service detail pages add a light operating-transition block that compares the current and managed states without stock imagery or invented proof. Section surfaces alternate intentionally so the long pages scan as distinct chapters. Client-facing service copy uses BOT terminology throughout. The implementation adds no image requests and keeps the existing local SEO route and link structure intact.

## 1. Where things are

| | |
|---|---|
| Working branch | `platform-v1` (not merged; contains all of `homepage-simplify`; do not merge main from an agent task) |
| Latest commit | See `git log -1 --oneline`; this branch now includes Production Data & Spend Hardening and the Client Onboarding Orchestrator work. |
| `main` | `ea9847c` — the public marketing site (`origin/main`) |
| Other branches | `homepage-simplify` (website simplification, merged into `platform-v1`), `backup/pre-author-rewrite` (safety copy, do not delete), `gh/main` (old throwaway history, ignore) |
| Remote | GitHub `AgenticBotting/agenticbots` (private) via SSH alias `git@github-agenticbots:…`. Push only when Nick explicitly asks. |
| Owner | Nick Thomson — not a software engineer. Wants plain-English explanations, no jargon questions, and to be told before anything irreversible, expensive or security-sensitive. |
| Product | AgenticBots.dev: an implementation firm that **operates "Bots"** for contractors and local service businesses. Client-facing terms are **BOT, BOTS, BOT RUN, BOT ACTIVITY** — never "agents". |

Nothing has been deployed to AWS. The marketing site deploys to Vercel from `main` (see `docs/DEPLOY-STATE.md`).

---

## 2. Repository architecture

One Next.js 16.3.4 app (React 19, Tailwind 4, TypeScript, Convex 1.46, zod 4, Vitest 5, Playwright). **Next 16 differs from training data — read `node_modules/next/dist/docs/` before writing Next code** (e.g. `params`/`searchParams` are Promises; `middleware.ts` is deprecated in favor of `proxy` but still in use here).

| Path | What |
|---|---|
| `src/app/{page,about,services,markets,pricing,blog,contact,how-it-works,…}`, `src/components/marketing`, `src/data` | Public website + programmatic local SEO pages (thousands of pages; build gates in `scripts/pseo-gate.mjs`, `topic-gate.mjs`, `seo-checks.mjs`, `link-integrity.mjs`). `src/app/course` = course product (Convex Auth) |
| `src/app/ops/**` | Operator console (`ops.agenticbots.dev`) |
| `src/app/portal/**` | Client portal (`app.agenticbots.dev`) |
| `src/app/login` | Platform sign-in |
| `src/app/api/**` | Route handlers (JSON via `src/server/api.ts` `handle()`/`json()`) |
| `src/lib/platform/types.ts` | Platform domain types + `TABLE_NAMES`, `APPEND_ONLY_TABLES` |
| `src/lib/prospecting/types.ts` | Prospect Graph types + table registry |
| `src/config/*` | Bot catalog, skills registry, integrations (code, not DB) |
| `src/server/db/*` | `Repository` interface, `MemoryRepository` (demo/tests), `ConvexRepository` (prod), `Tx` unit of work |
| `src/server/auth/*` | Sessions, `policy.ts` (`can()`), guards |
| `src/server/services/*` | Business logic (clients, bots, runs, approvals, requests, automations, integrations, billing hooks, monitoring, usage, notes) |
| `src/server/runtime/**` | Runtime translator layer (only place the engine is known) |
| `src/server/billing/*` | Manual billing domain + `BillingProvider` seam |
| `src/server/aws/control.ts` | AWS control via Vercel OIDC (SSM document, Secrets Manager, CloudWatch) |
| `src/server/views/*` | Client-safe projections (copy-in, never filter-out) |
| `src/server/prospecting/**` | Prospect Graph (see §5) |
| `src/server/demo/seed.ts` | Demo world (fictional orgs/users/data) |
| `convex/platform.ts`, `convex/platformTables.ts`, `convex/schema.ts` | Generic `pf_<table>` document API guarded by `PLATFORM_SERVER_SECRET` |
| `ops/cli.ts` | Provisioning CLI (`npm run ops -- …`) |
| `infra/terraform` | AWS (modules + `envs/staging`, `envs/prod`) |
| `infra/runtime` | Runtime bundle: Docker Compose, lifecycle script, engine config |
| `runtime/skills/*/SKILL.md` | Bot skills (versioned; must match `src/config/skills.ts`) |
| `data/prospecting/*.csv` | Prospect Graph seed CSVs (source of truth) |
| `tests/**` | unit, integration, security, contract, prospecting, e2e |
| `docs/**` | Architecture, runbooks, audits, ADRs |

Platform design decisions: `docs/adr/0001-platform-decisions.md`. Platform architecture with diagrams: `docs/ARCHITECTURE.md`.

---

## 3. Bot / runtime architecture

```
UI (pages, API routes) → services → BotRuntime facade (src/server/runtime/index.ts)
  → RuntimeAdapter (Demo | Hermes) → client's runtime over Cloudflare Tunnel
```

* **Bot types** live in `src/config/bot-catalog.ts` (`seo`, `ads`, `reviews`, `content`, `prospecting`, `outbound`, `reactivation`, `crm`, `analytics`, `proposal`). **Bot instances** are rows in `bots` (`orgId`, `typeKey`, `runtimeProfile`, `credentialRef`, model, capabilities, integrations).
* One runtime (one EC2, one engine deployment) **per client**. Each Bot = one engine **profile** with its own key, skills and memory.
* The engine is **Hermes Agent v2026.9.24**, pinned by digest `sha256:fca358f1…52b7`. Its name, URLs, ports, headers and wire types exist **only** under `src/server/runtime/hermes/**` (plus `runtime-types.ts` provider union and the `redact.ts` deny-list). Enforced by ESLint `no-restricted-imports` and `tests/security/runtime-boundary.test.ts`.
* Neutral vocabulary: run status `queued · running · waiting_for_approval · completed · failed · cancelled · interrupted`; events `bot.run.*`, `bot.action.*`, `bot.approval.*`; `translate.ts` turns them into client text.
* Approvals: anything that sends, publishes, changes ads, writes CRM or deletes stops for human approval.
* Results are only numbers a Bot reported on a `METRICS {...}` line — never estimates.
* Demo mode forces the `DemoRuntimeAdapter` (no network).
* Shared contract test: `tests/contract/runtime-adapter.contract.ts`, run against demo and an in-process fake Hermes (`tests/support/fake-hermes.ts`).

Details: `docs/ARCHITECTURE.md` §5–8, `docs/runbooks/UPGRADE_HERMES.md`.

---

## 4. AWS staging architecture (built, never applied)

* Terraform `modules/platform-stack` wrapped by `envs/staging` and `envs/prod`; every name/tag/secret path carries the environment, so both can share one AWS account.
* Per client (`modules/tenant-runtime`): EC2 (t3.medium default, **no inbound rules**), encrypted EBS data volume, per-tenant KMS key, IAM instance role that can read **only** `agenticbots/<env>/tenants/<tenant>/*` secrets, CloudWatch alarms and log group.
* `modules/lifecycle-document`: the **only** remote command the web app may run (SSM document with enumerated actions: start/stop runtime, deploy-bot, etc.).
* `modules/control-plane-role`: role assumed by Vercel via **OIDC** (no static keys).
* `modules/backups`: DLM daily encrypted snapshots.
* Connectivity: `cloudflared` on the instance → Cloudflare Tunnel + Access service token + per-profile bearer key. Needs a domain on Cloudflare (`agenticbots.dev` DNS is at GoDaddy; a separate cheap runtime domain is recommended).
* Provisioning: `npm run ops:staging -- tenant:create …` then `tenant:provision` (two-phase: secrets first, then instance). The CLI refuses cloud changes unless `ALLOW_CLOUD_CHANGES=1`.
* Staging = separate Convex project "agenticbots-staging", `.env.staging`, `npm run staging` (port 3004).
* Full step-by-step: `docs/runbooks/FIRST_STAGING_TEST.md`. Readiness audit (30 items): `docs/DEPLOYMENT_READINESS_AUDIT.md`. Owner-side account tasks: `docs/WHAT_I_NEED_FROM_YOU.md`, `docs/BEGINNER_SETUP.md`.

---

## 5. Prospect Graph architecture

Proprietary prospecting infrastructure: **service niche → buyer relationships → geography → market (per client) → company → decision maker → score → qualified prospect → vendor-neutral outbound handoff.**

| Module (`src/server/prospecting/`) | Role |
|---|---|
| `store.ts` | `ProspectGraphStore` — the only storage access (chunked 150-op transactions). Future Postgres/S3/ClickHouse swap point for SHARED tables. |
| `access.ts` | `Principal` = user (operator/client) or Bot (bound to one org). `allowed()`, `assertAllowed()`, `getPrivate()` |
| `ontology/*` | CSV parser, normalization + stable FNV ids, taxonomy tags, niche attractiveness score + tiers, rule-based relationships, title → role family, 18 discovery recipes, 10 vertical packs, importer, `seedOntology`/`ensureOntology`/`reviewRelationship` |
| `identity.ts`, `companies.ts` | Company identity resolution (domain 0.95 → phone 0.85 → name+locality 0.8; merge ≥ 0.75) and source records; people ingestion |
| `router.ts` | **EnrichmentRouter** — cache → free internal (email patterns, MX) → value gate → providers by priority; budget check before each paid call; retries; fallback; cost event per call |
| `providers/*` | Neutral contracts, `DemoProvider`, vendor stubs, registry + pricing, server-only secrets |
| `costs.ts`, `freshness.ts` | Budgets, run limits, paid-operation reservations, cost ledger, TTLs |
| `email.ts` | Syntax, pattern inference/application, MX via injectable resolver (no SMTP probing), status vocabulary |
| `signals.ts` | Observed "why now" signals only, with expiry |
| `scoring.ts` | Deterministic Fit/Timing/Priority (`asOf` param) + qualification rules |
| `compliance.ts`, `outbound.ts` | Suppression (hard/soft, global/client) + the outbound policy gate + CRM queue |
| `markets.ts`, `prospects.ts`, `jobs.ts` | ICPs, markets, coverage (observed vs estimated), prospects, outcomes, jobs (inline runner) |
| `tools.ts` + `src/app/api/bot-tools/prospecting/route.ts` | 16 Bot tools, HMAC tool tokens, normalized outputs |
| `views.ts` | Client projection (no vendors, costs, provenance) |
| `demo-seed.ts` | Demo-only Acme Roofing market |

UI: `src/app/ops/prospecting/**` (Overview, Markets, ICPs, Niches, Buyer types, Review, Companies, Signals, Suppression, Providers & cost; plus market and prospect detail) and `src/app/portal/prospects`.

Docs: `docs/PROSPECT_GRAPH_ARCHITECTURE.md`, `PROSPECTING_DATA_MODEL.md`, `PROSPECTING_PROVIDER_ADAPTERS.md`, `PROSPECTING_SCORING.md`, `PROSPECTING_COMPLIANCE.md`, `PROSPECTING_RUNBOOK.md`, `PROSPECTING_BUILD_STATUS.md`.

Seed result: 341 niches (102 A / 133 B / 106 C), 137 buyer types, ~11,357 rule-proposed relationships (6,831 auto-approved, rest need review). 5 buyer types intentionally unmapped (referral-only/non-buyers).

---

## 6. Important schemas / tables

Storage is a generic document envelope: Convex table `pf_<name>` with `pid`, `orgId?`, `doc`, `version`, indexes `by_pid`, `by_org`. Rows share `Base` (`id`, `createdAt`, `updatedAt`, `version`). All writes go through `Tx` with optimistic `version` checks. Append-only tables (never deleted): `payments`, `billing_events`, `audit_logs`, `invoices`, `service_agreements`, `deployment_events`, `pg_import_runs`, `pg_cost_events`, `pg_outcomes`.

**Platform tables** (`TABLE_NAMES`, mirrored in `convex/platformTables.ts` — keep identical): `users`, `memberships`, `sessions`, `organizations`, `client_onboardings`, `bots`, `skill_assignments`, `runtimes`, `deployment_events`, `runs`, `run_events`, `conversations`, `activity_events`, `approvals`, `requests`, `automation_jobs`, `integrations`, `usage_rollups`, `provider_configurations`, `service_agreements`, `invoices`, `payments`, `billing_events`, `incidents`, `operator_notes`, `audit_logs`, `processed_webhooks`.

**Prospect Graph tables:**
* Shared (never an `orgId`): `pg_import_runs`, `pg_niches`, `pg_buyer_types`, `pg_relationships`, `pg_companies`, `pg_company_sources`, `pg_fact_claims`, `pg_company_merge_reviews`, `pg_people`, `pg_company_people`, `pg_contact_points`, `pg_domain_intel`, `pg_signals`.
* Private (always `orgId`): `pg_icps`, `pg_markets`, `pg_prospects`, `pg_jobs`, `pg_market_builds`, `pg_handoffs`, `pg_outcomes`.
* Mixed (`orgId` optional; operator-only when absent): `pg_paid_operations`, `pg_cost_events`, `pg_budgets`, `pg_suppressions`.

Field-level detail: `docs/PROSPECTING_DATA_MODEL.md` and the type files.

---

## 7. Environment setup

```bash
cd ~/Desktop/AgenticBots      # the real repo on the owner's Mac
npm ci                        # Node 22 (no engines pin; tested on 22.22)
```

Env files: `.env.example` (production template), `.env.staging.example` (staging). Key variables:

| Variable | Purpose |
|---|---|
| `DEMO_MODE=true` | Fictional in-memory world; no external calls (`assertLive()` throws) |
| `DEMO_PERSIST`, `DEMO_STATE_FILE` | Demo state file (default `.platform-data/demo-state.json`, gitignored) |
| `PLATFORM_ENV` | `staging` or `production` |
| `CONVEX_URL`, `NEXT_PUBLIC_CONVEX_URL`, `PLATFORM_SERVER_SECRET` | Platform data |
| `CRON_SECRET` | `/api/internal/sync` |
| `AWS_REGION`, `AWS_ROLE_ARN`, `AWS_LIFECYCLE_DOCUMENT`, `ARTIFACT_BUCKET`, `AWS_PROFILE` (CLI) | AWS control |
| `ALLOW_CLOUD_CHANGES=1` | Required before the CLI changes cloud resources |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `RUNTIME_DOMAIN` | Tunnels |
| `RUNTIME_PROVIDER`, `RUNTIME_ENGINE_VERSION`, `RUNTIME_BUNDLE_VERSION` | Runtime selection/pinning |
| `OPS_HOST`, `APP_HOST`, `NEXT_PUBLIC_SITE_URL` | Hostnames |
| `RESEND_*`, `MAILERLITE_*`, `CONTACT_EMAIL`, `FROM_EMAIL`, `UMAMI_*` | Marketing site |
| `PROSPECTING_TOOL_SECRET` (≥32 chars) | Signs Prospecting Bot tool tokens; endpoint refuses without it |
| `PROSPECTING_PRICING` (JSON) | Configured vendor prices; no price = no paid call |
| `PROSPECTING_DEMO_PROVIDER=true` | Enable fictional demo data outside demo mode (staging walkthroughs only) |
| `ROCKETREACH_API_KEY`, `LEADMAGIC_API_KEY`, `HUNTER_API_KEY`, `PROSPEO_API_KEY`, `LEMLIST_API_KEY` | Vendor credentials (adapters are stubs; none set) |

Demo sign-in (demo mode only), password `agenticbots-demo`: `admin@agenticbots.demo` (superadmin), `operator@agenticbots.demo`, `owner@acmeroofing.demo` (client admin), `staff@acmeroofing.demo` (client member).

---

## 8. Commands

| Command | What |
|---|---|
| `npm run demo` | Demo app at http://localhost:3003 |
| `npm run staging` | App against staging (port 3004, loads `.env.staging`) |
| `npm run dev` / `build` / `start` | Standard Next (build runs SEO gates pre/post) |
| `npm test` | Vitest: unit, integration, security, prospecting |
| `npm run test:security`, `test:unit`, `test:white-label` | Subsets (+ built-bundle scan) |
| `npm run test:hermes-contract` | Contract test against a live engine (staging only) |
| `npm run test:e2e` | Playwright (demo mode) |
| `npm run typecheck`, `npm run lint` | `tsc --noEmit`, ESLint |
| `npm run ops -- <cmd>` / `ops:staging -- <cmd>` | Provisioning CLI (see header of `ops/cli.ts`) |
| `npm run prospecting:seed` / `prospecting:seed:staging` | Load ontology (idempotent, free) |
| `npm run prospecting:embed-seed` | Re-embed CSVs after editing them |
| `npx convex deploy` | Deploy Convex functions (owner runs it; required after `convex/` changes) |

Tooling notes for a cloud agent: scripts importing `server-only` modules need `tsx --conditions=react-server` (as the npm scripts do). Vitest aliases `server-only` to `tests/support/empty.ts` and runs with `DEMO_MODE=true`.

---

## 9. Deployment / runbooks

* `docs/runbooks/FIRST_STAGING_TEST.md` — one fake client, one SEO Bot, one EC2, end to end.
* `docs/runbooks/UPGRADE_HERMES.md` — engine upgrade (manual).
* `docs/runbooks/SUSPEND_CLIENT.md`, `RESTORE_CLIENT_RUNTIME.md`, `BILLING_AND_PAYMENTS.md`.
* `docs/PROSPECTING_RUNBOOK.md` — demo, seeding, operator flow, enabling a paid vendor.
* `docs/DEPLOY-STATE.md` — Vercel/GitHub account situation for the marketing site.
* `infra/terraform/README.md` — Terraform layout and apply flow.

**Pending owner action:** after this branch reaches staging, run `npx convex deploy` (new paged `platform.page` query) and then `npm run prospecting:seed:staging`.

---

## 10. Completed features

* Marketing site + simplified homepage, offer pages, mega menu, local programmatic SEO pages.
* Operator console: dashboard, clients, Bots, runs (live SSE), requests, approvals, automations, integrations, infrastructure, usage & cost, monitoring/incidents, billing (manual ACH/wire), skills, audit log, settings, search.
* Client portal: overview, activity, approvals, requests, integrations, reports, prospects.
* Auth (scrypt, server sessions, roles, invites, rate-limited login), centralized `can()` authorization, tenant isolation.
* Runtime translator layer + Hermes adapter + demo adapter (contract-tested).
* Manual billing with suspension/reactivation workflow (auto off by default).
* Terraform staging/prod, SSM lifecycle document, OIDC control role, backups, provisioning CLI.
* Prospect Graph V1 (see `docs/PROSPECTING_BUILD_STATUS.md` for the item-by-item list).
* Client Onboarding Orchestrator V1 (`src/server/services/onboarding.ts`, `docs/ONBOARDING_ARCHITECTURE.md`): creates a draft client deployment plan from intake; classifies the business with the existing 341-niche ontology; creates actual private ICP, Market and MarketBuild draft records; recommends Bot stack, skills, integrations, approval policies and budget status; preserves manual operator decisions; stays deterministic and side-effect free.

## 11. Partial features

* Onboarding has backend/domain coverage and tests, but no polished operator/client UI yet. It does not provision runtimes, connect OAuth, send email, call paid providers or approve spend. Future work should add review screens and the final human-approved provisioner.
* Run progress events: engine delivers events once / expires after 5 minutes; status/results reconciled by polling.
* Human approvals on a live engine: unproven (rarely triggered until write integrations exist).
* Conversations: operator test entry point only; no client chat UI.
* Vercel → AWS OIDC, Convex/Vercel production configuration, runtime health/version tracking: need real accounts.
* Background sync: daily cron only on Vercel Hobby (`vercel.json`); every-minute needs Pro.
* Prospecting: jobs run inline after enqueue (no background worker); CRM handoff queues only; outcomes recorded but no recalibration; discovery recipes beyond demo not executable; Bot tool endpoint works with runtime/org/Bot-scoped tokens but token issuance to the runtime is not wired; MarketBuild has records but no dedicated UI; ICP edit UI missing.

## 12. Stubs / placeholders

* Prospecting vendor adapters: RocketReach, LeadMagic, Hunter, Prospeo, lemlist — `status()` only, **no HTTP**, throw `not_configured`/`not_implemented`.
* `AmbiguityClassifier` (LLM for relationship review) — seam, no-op.
* `BillingProvider` beyond `ManualBillingProvider` (QuickBooks/Xero/Stripe) — seam only.
* Engine upgrade/rollback automation — runbook only.
* Marketing: ProofBar/pricing stats labeled illustrative; guide PDF download not delivered; 7,392 city×service pages blocked on choosing one service taxonomy.

---

## 13. Security boundaries

1. **Tenant isolation**: every tenant row has `orgId`; services load then prove `can(actor, perm, orgId)`; cross-tenant = *not found*. Prospecting private tables via `getPrivate()`/`allowed()`.
2. **Runtime boundary**: engine specifics only in `src/server/runtime/hermes/**`. UI components never import the runtime.
3. **Provider boundary**: vendor names and credentials only in `src/server/prospecting/providers/**` (ESLint + `tests/prospecting/security.test.ts`).
4. **White-label**: client-facing sources and payloads never contain runtime/vendor terms (`CLIENT_FORBIDDEN_TERMS` in `src/server/redact.ts`; `tests/security/white-label.test.ts`; `scripts/white-label-scan.mjs` on built bundles). Client views copy allowed fields in.
5. **Secrets**: server-side only; tenant secrets in AWS Secrets Manager per-tenant paths; Convex API behind `PLATFORM_SERVER_SECRET`; nothing secret in the browser, the portal, Bot prompts, logs, audit details (`redactSecrets`) or Convex records.
6. **Demo safety**: `assertLive()` blocks external side effects in demo mode; demo data flagged `demo: true`.
7. **Cloud safety**: the CLI changes nothing without `ALLOW_CLOUD_CHANGES=1`; web app can run only the enumerated SSM document.
8. **Prospecting spend**: no paid call without an implemented adapter, credential, configured price, client budget and room in every limit; Bots cannot approve spend or change budgets.
9. **Outbound compliance**: hard suppression can never be overridden; Bots cannot override soft suppressions, qualification rules or catch-all checks; per-client daily handoff cap; demo contacts never reach a live system.
10. **Auth**: superadmin-only permissions (`ops.settings.manage`, `ops.users.manage`, `ops.destroy`, `ops.prospecting.global_suppression`); operators may be scoped to a subset of orgs (`operatorOrgIds`).

## 14. Architectural invariants

* All storage goes through `Repository` (`ProspectGraphStore` for prospecting). Never call Convex directly from app code.
* Every write is a `Tx` commit with version checks; append-only tables are never deleted. Paid operations are mutable ledgers: reserve → running → settled/released/failed.
* Every server action and route re-checks permissions; hidden UI is never the control.
* AgenticBots ids are primary keys; runtime-side ids are opaque server-only mapping fields.
* `TABLE_NAMES` (TS) and `PLATFORM_TABLES` (Convex) stay identical; `APPEND_ONLY` sets match (tested).
* Skill versions in `runtime/skills/*/SKILL.md` match `src/config/skills.ts` (tested).
* Seed CSVs and `ontology/seed-data.ts` match (tested).
* Scores are deterministic for a given `asOf`; unobserved components score 0.
* Never invent: signals, TAM, ROI/revenue numbers, metrics, API endpoints.
* Shared prospecting tables never carry `orgId` or client-private data.
* Audit log entry for every operator/Bot state change.

## 15. Vendor / provider abstractions

* **Runtime**: `RuntimeAdapter` (Demo | Hermes) chosen by `runtime-factory.ts`. Add an engine by implementing the interface in its own folder and passing the shared contract.
* **Model providers**: `provider_configurations` rows (operator-entered rates); keys in tenant secrets.
* **Billing**: `BillingProvider` (`ManualBillingProvider` default).
* **Prospecting data**: `ProspectDataProvider`, `ContactEnrichmentProvider`, `EmailVerificationProvider`, `OutboundProvider` (`providers/types.ts`); registry in `providers/registry.ts`; only the `EnrichmentRouter` calls them; neutral `ProviderError` kinds; pricing from `PROSPECTING_PRICING`. Implementation checklist: `docs/PROSPECTING_PROVIDER_ADAPTERS.md`.
* **Email intelligence**: `MxResolver` seam (DNS in live, fake in demo/tests).

## 16. Known technical debt

* Convex `list()` loads whole tables (now paged) and filters in memory; fine to tens of thousands of rows, not beyond. Prospecting reads (e.g. `pg_cost_events` per budget check, `pg_relationships` on review pages) are full-table scans. Plan: indexed queries or the Postgres data plane behind `ProspectGraphStore`.
* `MemoryRepository` demo persistence rewrites the whole JSON file (debounced 300 ms); demo-only.
* Prospecting jobs run inline in the server action; long markets would hit request timeouts. Needs a background worker (`runQueuedJobs` exists).
* Demo provider names can repeat across buyer types (same "[Demo] Palm Holdings" in different cities) — cosmetic.
* `src/middleware.ts` uses the deprecated middleware convention (Next 16 prefers `proxy`).
* `convex/platformTables.ts` comment references `tests/unit/convex-tables.test.ts`, which does not exist; the drift check now lives in `tests/prospecting/security.test.ts`.
* Pre-existing lint warnings in `convex/_generated/*` and `src/components/marketing/BlogArchive.tsx` (`<img>`).
* Production build could not be verified in the cloud workspace (Google Fonts blocked); last verified locally on 2026-10-03 before the Prospect Graph.

## 17. Test / build status (2026-10-04, commit e90d63e)

* `npx tsc --noEmit`: clean.
* `npx eslint .`: 0 errors, 5 pre-existing warnings.
* `npx vitest run`: **19 files, 151 tests, all passing** (unit, integration incl. staging-chain via fake Hermes, security, prospecting ×46).
* Playwright E2E: not re-run since the Prospect Graph.
* `next build`: not re-run since the Prospect Graph (fonts unreachable in the cloud workspace). Run it locally before merging.
* Note: Vitest on the owner's Mac previously failed to load a native binding (rolldown/wasi); tests were run in a Linux clone.

## 18. Current blockers

1. **Owner accounts for staging**: AWS IAM Identity Center login, a Cloudflare-hosted runtime domain, a model provider key, the Convex staging project, Vercel env/OIDC (see `docs/WHAT_I_NEED_FROM_YOU.md`).
2. **Convex functions not redeployed** with the new `platform.page` query (owner runs `npx convex deploy`).
3. **No real prospecting data source**: every vendor adapter is a stub; implementing one requires reading current vendor docs and the owner's explicit approval for paid usage plus a budget.
4. `platform-v1` not pushed or merged.

## 19. Recommended next five tasks (in order)

1. **Verify locally and push**: run `npm run build`, `npm test`, `npm run test:e2e` on the owner's machine; fix anything; ask the owner before pushing `platform-v1`.
2. **First AWS staging test** per `docs/runbooks/FIRST_STAGING_TEST.md` (owner supplies accounts; no apply without `ALLOW_CLOUD_CHANGES=1` and owner approval). Include `npx convex deploy` and `prospecting:seed:staging`.
3. **Background job worker for prospecting**: run `pg_jobs` outside the request (Vercel cron route calling `runQueuedJobs`, guarded by `CRON_SECRET`); make server actions enqueue only.
4. **Wire Prospecting Bot tool access**: issue the existing runtime/org/Bot-scoped short-lived tool tokens server-side to the Prospecting Bot's runtime profile (via the runtime facade, never exposing other secrets) and expose the 16 tools to the skill.
5. **First real data adapter, with approval**: implement one contact/verification vendor (from current docs, recorded-response contract test, configured price, client budget, small run), then one discovery source.

## 20. Read these first

1. `AGENTS.md`
2. `docs/PROJECT_HANDOFF.md` (this file)
3. `docs/adr/0001-platform-decisions.md`
4. `docs/ARCHITECTURE.md`
5. `src/lib/platform/types.ts`, `src/server/db/repository.ts`, `src/server/auth/policy.ts`, `src/server/services/common.ts`
6. `src/server/runtime/index.ts`, `RuntimeAdapter.ts`, `runtime-factory.ts`
7. `docs/DEPLOYMENT_READINESS_AUDIT.md`, `docs/runbooks/FIRST_STAGING_TEST.md`
8. `docs/PROSPECT_GRAPH_ARCHITECTURE.md`, `docs/PROSPECTING_BUILD_STATUS.md`, `src/lib/prospecting/types.ts`, `src/server/prospecting/access.ts`, `router.ts`, `outbound.ts`
9. `eslint.config.mjs`, `tests/security/*`, `tests/prospecting/security.test.ts`, `tests/support/fixtures.ts`
10. `node_modules/next/dist/docs/` for any Next.js API you touch

## 21. Do NOT redesign or break

* The marketing site, its design language (enterprise, minimal, **Geist font only**, no "guru" styling), URLs and local SEO pages.
* Client terminology: **Bot / Bots / Bot Run / Bot Activity**. Never rename to "agent".
* The `Repository`/`Tx`/Convex envelope storage model and `pf_` prefix.
* The runtime translator layer and its boundary (no engine specifics outside `src/server/runtime/hermes/**`).
* `can()` centralized authorization and *not found* for cross-tenant access.
* White-label client projections and the forbidden-terms checks.
* One runtime per client; per-profile keys; no inbound ports; OIDC (no static AWS keys); the single SSM lifecycle document.
* Engine pin by digest; shell/code execution off by default.
* Manual billing; auto-suspend/auto-reactivate default off.
* The Prospect Graph shared/private split, `ProspectGraphStore` boundary, EnrichmentRouter as the only provider caller, fail-closed budgets, the outbound policy gate, and Bot restrictions.
* Existing AWS/Terraform staging work and the provisioning CLI safety switch.
* Demo mode's guarantee of zero external side effects.
