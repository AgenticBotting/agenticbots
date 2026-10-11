# Deployment readiness audit — first AWS staging test

> **Hermes launch-gate update, 2026-10-11:** A full review of the official
> Hermes documentation and the pinned/current source found that the existing
> image is reproducibly pinned but predates upstream authentication hardening,
> and the API server exposes a broader default tool surface than the current
> config disables. Read
> [`research/HERMES_DOCUMENTATION_AUDIT_2026-10-11.md`](research/HERMES_DOCUMENTATION_AUDIT_2026-10-11.md)
> and [`LAUNCH_IMPLEMENTATION_PLAN.md`](LAUNCH_IMPLEMENTATION_PLAN.md). Do not
> run the first AWS apply until the version upgrade, per-profile tool allowlist,
> model route, egress policy and local contract gates are complete.

> **Vercel preview note, 2026-10-10:** The first `platform-v1` preview compiled
> but failed in npm `postbuild` after Vercel relocated Next's prerendered
> artifacts. Artifact gates now run locally and in GitHub CI for every branch
> push, while Vercel skips the duplicate post-relocation inspection. Only the
> 584 explicitly approved acquisition routes are candidates for geography
> prerendering; other valid local routes render on demand. The local production
> build now generates 1,056 pages instead of 14,124 and passed every gate.

> **Later prelaunch review, 2026-10-09:** See `SECURITY_LEGAL_AUDIT_2026-10-09.md`. The statuses below describe the earlier staging implementation, not current enterprise security/legal clearance. New findings remain open, including environment scoping of lifecycle IAM, approval ordering, storage integrity, abuse controls and production configuration. No cloud deployment was performed by the later audit.

_Audited 2026-10-03 on branch `platform-v1`. Scope: what it takes to run ONE
fake client ("AgenticBots Test Company") with ONE Bot (SEO Bot) on ONE AWS
EC2 staging runtime, end to end._

```
AgenticBots UI → server-side AgenticBots code → BotRuntime → HermesRuntimeAdapter
  → Cloudflare Tunnel + Access (secure connection) → AWS EC2 → Hermes
  → "seo" profile → Bot Run → result → Convex → AgenticBots UI
```

## How to read this

| Status | Meaning |
|---|---|
| **COMPLETE** | Implemented and tested locally (unit, contract and integration tests, `tofu validate`). |
| **PARTIAL** | Works for the staging test, with a stated limitation. |
| **PLACEHOLDER** | Present in shape only; would not work as-is. |
| **NOT IMPLEMENTED** | Absent. |

**Nothing below has run against real AWS, Cloudflare or a live Hermes yet.**
That is exactly what the staging test proves. "Before" shows what the audit
found; "Now" shows the state after the fixes in this change.

## Summary

| # | Item | Before | Now |
|---|---|---|---|
| 1 | RuntimeAdapter | COMPLETE | COMPLETE |
| 2 | HermesRuntimeAdapter | COMPLETE | COMPLETE |
| 3 | DemoRuntimeAdapter | COMPLETE | COMPLETE |
| 4 | Hermes health check | PARTIAL (broken on real runtimes) | COMPLETE |
| 5 | Starting a Bot Run | COMPLETE | COMPLETE |
| 6 | Reading Bot Run status | COMPLETE | COMPLETE |
| 7 | Stopping a Bot Run | COMPLETE | COMPLETE |
| 8 | Run progress/events | PARTIAL | PARTIAL |
| 9 | Human approval | PARTIAL | PARTIAL |
| 10 | Conversations/sessions | PARTIAL | PARTIAL |
| 11 | Automations | COMPLETE | COMPLETE |
| 12 | Bot/profile mapping | COMPLETE | COMPLETE |
| 13 | AWS EC2 provisioning | PARTIAL (first boot would fail) | COMPLETE |
| 14 | Terraform | PARTIAL (prod only, collisions, IAM bug) | COMPLETE |
| 15 | AWS Systems Manager | PARTIAL | COMPLETE |
| 16 | AWS Secrets Manager | COMPLETE | COMPLETE |
| 17 | Vercel → AWS OIDC | PARTIAL | PARTIAL |
| 18 | Secure connection AgenticBots → Hermes | PARTIAL | PARTIAL (needs a Cloudflare domain) |
| 19 | Cloudflare Tunnel | PARTIAL (not re-runnable) | COMPLETE (needs a Cloudflare domain) |
| 20 | Client suspend/reactivate | COMPLETE | COMPLETE |
| 21 | Runtime health monitoring | PARTIAL (disk metric could never match) | PARTIAL |
| 22 | Runtime version tracking | PARTIAL | PARTIAL |
| 23 | EBS persistent storage | COMPLETE | COMPLETE |
| 24 | Backups | PARTIAL (manual snapshot IAM wrong) | COMPLETE |
| 25 | Hermes version pinning | PLACEHOLDER (no digest) | PARTIAL (reproducible old pin; security-reviewed upgrade required) |
| 26 | Rollback/update support | PARTIAL (runbook step would not take effect) | NOT IMPLEMENTED (as tooling; runbook corrected) |
| 27 | Convex production configuration | PARTIAL | PARTIAL |
| 28 | Vercel production configuration | PARTIAL (cron breaks Hobby deploys) | PARTIAL |
| 29 | Environment variables | PARTIAL | COMPLETE |
| 30 | Staging/demo separation | PARTIAL | COMPLETE |
| 31 | API-server tool allowlist | NOT IMPLEMENTED | NOT IMPLEMENTED (launch blocker) |
| 32 | Runtime egress allowlist | NOT IMPLEMENTED | NOT IMPLEMENTED (required before browser/web/MCP tools) |
| 33 | Native Kanban integration | NOT IMPLEMENTED | DEFERRED (not in stable `/v1` API; not launch-critical) |
| 34 | Finite run/model budgets | PARTIAL | PARTIAL (platform controls exist; exact Hermes version contract required) |
| 35 | Daily safe-update pipeline | NOT IMPLEMENTED | NOT IMPLEMENTED (daily detection, qualification, canary and rollout rings required before fleet scale) |

## Blockers found and fixed for the staging test

These would each have stopped the first staging run.

1. **First boot raced the control plane.** Terraform created the EC2
   instance and the empty runtime secret in one apply. The tunnel token and
   default key were written afterwards. Under `set -e`, the instance's
   bootstrap read an empty secret and exited, so the runtime never started.
   *Fix:* `tenant:provision` now runs in two phases (secrets first, filled
   in, then the instance). The instance also waits up to 20 minutes for the
   secret.
2. **Health checks used a key that never existed.** Runtime-level calls
   (health, capabilities) looked up `…/profiles/default`, which Terraform
   never creates. The runtime would never have been marked ready.
   *Fix:* runtime-level calls use `defaultProfileKey` from the runtime
   secret. Bot calls still use that Bot's own key. Covered by
   `tests/unit/runtime-connection.test.ts`.
3. **No model configured, so the engine reports "degraded".** Hermes's
   readiness fails its `model` check without a default model (verified in
   `gateway/readiness.py`). The platform only marks a runtime ready when the
   engine is healthy.
   *Fix:* `default_model_provider` / `default_model` flow from Terraform →
   `runtime.env` → engine `config.yaml` (root and every profile). Provider
   keys go into each profile's `.env`.
4. **Multi-profile routing was configured in the wrong file.**
   `gateway.multiplex_profiles` belongs in the DEFAULT profile's
   `config.yaml` (verified in `hermes_cli/gateway_migrate.py` and the
   multi-profile docs). It had been written into the per-Bot configs.
   *Fix:* new `infra/runtime/config/root-config.yaml`, merged on every start.
5. **The engine image was not pinned.** Terraform and `lifecycle.sh`
   correctly refuse unpinned images, so nothing could deploy.
   *Fix:* pinned `nousresearch/hermes-agent:v2026.9.24@sha256:fca358f1…52b7`
   (multi-arch index digest, read from Docker Hub). The tunnel image is
   pinned by digest too.
6. **No staging environment existed.** There was only `envs/prod`, with fixed
   names: the IAM role, SSM document, DLM role and OIDC provider would have
   collided with a later prod apply in the same account.
   *Fix:* `modules/platform-stack` plus thin `envs/staging` and `envs/prod`.
   Every name, tag, backup selector and secret path carries the environment.
   Reusing the OIDC provider across environments is supported.
7. **Vercel Hobby plan rejects every-minute crons.** The project's scope
   (`lot-sealers-projects`) is a personal account. Hobby limits crons to
   once a day, and a more frequent schedule fails the whole deployment.
   *Fix:* `vercel.json` now runs the sync daily. Run views already reconcile
   on their own.
8. **New Bots were health-checked before they existed.** `provisionBot`
   fired the SSM `deploy-bot` command (asynchronous) and checked the Bot
   immediately. *Fix:* it now waits for the command, then retries the
   health check.

Also fixed: the CloudWatch disk metric dimensions (the alarm and the
dashboard query could never match, and missing data counted as
"breaching"); manual-snapshot IAM (the condition was on the wrong resource);
and engine CLI calls now go through the image's privilege-drop shim instead
of `-u hermes`. The bootstrap now waits for the engine to be healthy instead
of sleeping, and Cloudflare provisioning is re-runnable.

## Item by item

### 1. RuntimeAdapter — COMPLETE
Neutral interface `src/server/runtime/RuntimeAdapter.ts`, types in
`runtime-types.ts`, named errors in `runtime-errors.ts`, and the factory
`getRuntimeAdapter()`. The app reaches it only through the `BotRuntime`
facade (`src/server/runtime/index.ts`). This is enforced by ESLint and
`tests/security/runtime-boundary.test.ts`.

### 2. HermesRuntimeAdapter — COMPLETE
`src/server/runtime/hermes/*`. It is written against the pinned upstream
source (v2026.9.24, commit f97608f), and request and response shapes were
checked against `gateway/platforms/api_server*.py`. Tests:
- the shared engine-neutral contract (`tests/contract/runtime-adapter.contract.ts`),
  run against an in-process fake Hermes server;
- unit tests (`tests/unit/hermes-adapter.test.ts`);
- the new staging-chain test (`tests/integration/staging-chain.test.ts`),
  which drives the real services → adapter → HTTP path.

**Not yet run against a live engine.** That is `run:test` and
`npm run test:hermes-contract` in the staging test.

### 3. DemoRuntimeAdapter — COMPLETE
Timeline-based, no network. It passes the same contract. Demo mode can never
call out: the factory forces the demo adapter.

### 4. Hermes health check — COMPLETE (was PARTIAL)
`/health` and `/health/detailed` are mapped, and so are capabilities.
`refreshRuntimeHealth` stores health, readiness, capabilities, disk and
tunnel state, and raises or clears incidents. Fixed: the default key
(blocker 2) and the model readiness check (blocker 3).

### 5. Starting a Bot Run — COMPLETE
`startRun` saves the AgenticBots run first and is idempotent at both layers
(our key and the engine's `Idempotency-Key`). It sends the Bot's profile,
key, provider, model and reasoning setting. Start failures become sanitized
errors and incidents.

### 6. Reading Bot Run status — COMPLETE
`syncRun` maps status, output, usage, provider/model and pending approval.
It runs on page views, the SSE stream, the CLI and the cron.

### 7. Stopping a Bot Run — COMPLETE
`POST /v1/runs/{id}/stop`, then reconciled to `cancelled`.

### 8. Run progress/events — PARTIAL
Hermes events are translated to `bot.*` events and then to client and
operator text. **Limitation:** Hermes delivers each event once and expires
unread events after 5 minutes. Step-by-step progress is captured while
someone watches the run (operator/portal live view, or `run:test`). Status,
result, usage and approvals are always reconciled by polling.

### 9. Human approval — PARTIAL
Engine approvals (`waiting_for_approval` → `/approval` once/deny) and
AgenticBots deliverable approvals both work and are tested against the fake
engine.

**Limitation:** with `terminal` and `code_execution` disabled and
`unattended_mode: deny`, an SEO research run will rarely trigger an engine
approval on live Hermes. Approvals mainly arise from untrusted MCP write
tools (not connected yet). Prove the live approval path when the first
integration is connected.

### 10. Conversations/sessions — PARTIAL
The adapter creates, reads and lists sessions, and runs can continue one.
Only an operator test-conversation entry point exists. There is no client
chat UI, and none is needed for this test.

### 11. Automations — COMPLETE
Create, update, pause, resume, run-now and delete map onto Hermes jobs. A
sync job pulls last-run state and flags failing automations. Not exercised
in this test.

### 12. Bot/profile mapping — COMPLETE
AgenticBots UUIDs are primary keys. `Bot.runtimeProfile` is the catalog key
(`seo`), and each Bot has its own `credentialRef`
(`agenticbots/<env>/tenants/<tenant>/profiles/<profile>`). The instance
generates one 32-byte key per profile and stores it there. It is never
reused.

### 13. AWS EC2 provisioning — COMPLETE (was PARTIAL)
`ops/cli.ts tenant:provision` runs these steps:
1. bundle → S3;
2. phase-1 apply (KMS + secrets);
3. Cloudflare tunnel and Access;
4. runtime secret and provider key;
5. phase-2 apply (EC2, data volume, alarms);
6. wait for readiness;
7. deploy Bots.

Instance: Amazon Linux 2023, IMDSv2 only, no inbound rules, SSM agent,
Docker and Compose. Fixed: blockers 1–5 and 8.

### 14. Terraform — COMPLETE (was PARTIAL)
`modules/platform-stack` contains the network, lifecycle document, OIDC
role, DLM, bucket and SNS, plus one `tenant-runtime` per client.
`envs/staging` and `envs/prod` are both `tofu validate`-clean with AWS
provider 6.67, and `fmt`-clean. Deprecated `aws_region.name` was replaced.
**Never applied.**

### 15. AWS Systems Manager — COMPLETE (was PARTIAL)
`AgenticBots-RuntimeLifecycle-<env>` accepts a fixed action list only. The
control-plane role may run only that document, only on instances tagged
`agenticbots:managed=true`. Fixed: callers now wait for completion where it
matters, and `start-runtime`/`restart-runtime` re-apply keys to every
profile.

### 16. AWS Secrets Manager — COMPLETE
Per tenant, under `agenticbots/<env>/tenants/<tenant>/`:
- `runtime` (endpoint, tunnel token, Access service token, default key);
- `profiles/<p>` (one key per Bot);
- `providers` (model keys).

Each tenant has its own KMS key. The instance can read only its own
prefix, and the app can read only its environment's prefix. Values never
reach a browser.

### 17. Vercel → AWS OIDC — PARTIAL
The code (`@vercel/functions/oidc`) and Terraform (trust policy pinned to
team, project and environment) are done. Staging allows Vercel
**preview/development** and prod allows **production**.

**Still needed:** turn on OIDC (Team issuer) in Vercel and set
`AWS_ROLE_ARN` on the Preview environment. The first staging test does not
need Vercel: the app runs on your computer with your AWS login. Vercel is
the step after.

### 18. Secure connection AgenticBots → Hermes — PARTIAL
Design: the instance has no inbound ports. An outbound-only Cloudflare
Tunnel exposes `https://<tenant>.<RUNTIME_DOMAIN>`. Cloudflare Access
requires a service token, and Hermes requires the per-Bot bearer key.

**Blocker outside the code:** Cloudflare Tunnel and Access need a domain on
Cloudflare. `agenticbots.dev` uses GoDaddy nameservers today. Recommended:
register a cheap separate domain in Cloudflare for runtimes (no risk to the
website). Alternatively, move `agenticbots.dev` DNS to Cloudflare.

### 19. Cloudflare Tunnel — COMPLETE (code), blocked on the domain
Remotely managed tunnel, ingress to `http://agb-hermes:8642`, proxied DNS
CNAME, Access app with a service-token-only policy. Now re-runnable: it
reuses the tunnel, DNS record and Access app on a second run. Token scopes
are in the runbook.

Also caught: the old default `RUNTIME_DOMAIN=runtime.agenticbots.dev` would
have produced `<tenant>.runtime.agenticbots.dev`. That is two levels deep,
and Cloudflare's free Universal SSL certificate does not cover it, so TLS
would fail. `RUNTIME_DOMAIN` must now be the zone itself. There is no
default.

### 20. Client suspend/reactivate — COMPLETE
The services stop and start runtime containers through SSM
(`stop-runtime` / `start-runtime`), record holds, audit, and keep data.
Note: suspension stops the work, not the EC2 bill. Stopping the instance
itself is a separate, manual step.

### 21. Runtime health monitoring — PARTIAL
- **In place:** CloudWatch status and disk alarms → SNS email,
  `refreshRuntimeHealth` with incidents, and the Monitoring page.
- **Limitations:**
  - On Vercel Hobby the background sweep runs once a day. Health is
    refreshed when someone views or acts.
  - Every-minute sweeps need Vercel Pro, or an external scheduler calling
    `/api/internal/sync` with `CRON_SECRET`.
- **Fixed:** the disk metric dimensions and missing-data handling.

### 22. Runtime version tracking — PARTIAL
`Runtime.runtimeVersion` and `engineVersion` are recorded at creation from
env, and deployments are logged. The engine's digest is not read back from
the instance (`engineDigest` is left empty), and nothing detects drift.

### 23. EBS persistent storage — COMPLETE
A separate encrypted gp3 data volume (tenant KMS) at `/opt/agenticbots/data`
holds all engine state. It has `prevent_destroy` and survives restarts,
suspension and instance replacement. Staging defaults to 20 GB,
production to 100 GB.

### 24. Backups — COMPLETE (was PARTIAL)
DLM takes daily snapshots and keeps them 7 days on staging, 30 on prod. The
selector is environment-specific. On-demand `tenant:backup` /
`backup-now` is available; fixed: its IAM permissions.

Restore is a manual runbook (`RESTORE_CLIENT_RUNTIME.md`) and has not been
rehearsed.

### 25. Hermes version pinning — COMPLETE (was PLACEHOLDER)
Pinned by digest in `terraform.tfvars.example` and recorded in
`HERMES_INTEGRATION.md`. Terraform validation and `lifecycle.sh` refuse
floating tags. The tunnel image is pinned too.

### 26. Rollback/update support — NOT IMPLEMENTED (as tooling)
A running instance takes its image from `runtime.env`, which is written
once at first boot, and Terraform ignores `user_data` changes. The old
runbook's "set engine_image, apply, restart" would silently do nothing. The
runbook now says so and gives the manual procedure. A proper
`upgrade-engine` lifecycle action is needed before the first production
upgrade, but not for this test.

### 27. Convex production configuration — PARTIAL
- **In place:** the platform tables (`pf_*`), the secret-guarded
  server-only API with optimistic versioning, and append-only enforcement.
- **Not done:**
  - The production Convex deployment has not been given the platform
    functions or `PLATFORM_SERVER_SECRET`.
  - No staging Convex project exists yet.
- **New guard:** staging refuses to start unless `CONVEX_URL` names the
  staging deployment explicitly.

### 28. Vercel production configuration — PARTIAL
The marketing site is live. The platform branch is not deployed. Still
outstanding:
- platform env vars;
- the OIDC switch;
- `ops.` / `app.` domains;
- Git auto-deploy (see `docs/DEPLOY-STATE.md`).

The Hobby cron issue is fixed (blocker 7).

### 29. Environment variables — COMPLETE (was PARTIAL)
- `.env.example` covers production.
- New `.env.staging.example` covers staging.
- New `npm run ops:staging -- staging:check` verifies every staging
  setting, plus database reachability and AWS login, and prints what to fix.

### 30. Staging/demo separation — COMPLETE (was PARTIAL)
Three modes:
- **demo:** in-memory, no external calls possible;
- **staging:** `PLATFORM_ENV=staging`, its own Convex project, its own
  Terraform env, secret paths, IAM role, SSM document, DLM policy and VPC
  CIDR;
- **production.**

`npm run staging` and `npm run ops:staging` load `.env.staging`, which
overrides `.env.local` (where demo mode lives).

## What still needs a decision or an account (not code)

| Needed for staging | Why | Who |
|---|---|---|
| A domain on Cloudflare (e.g. a new ~$10/yr domain) | Tunnel and Access require a Cloudflare zone; `agenticbots.dev` is on GoDaddy | You |
| AWS account access (not root) | Terraform and the CLI | You |
| A model provider key (OpenRouter recommended) with a little credit | The Bot needs a model | You |
| A separate Convex project "agenticbots-staging" | Keeps staging data out of production | You |

Staging incurs AWS compute, encrypted storage, backups, KMS, Secrets Manager,
detailed monitoring and NAT gateway charges, plus model-provider usage and the
runtime domain. Prices change; review the current estimates and create budget
alerts immediately before the first authorized apply. Stop or destroy staging
resources when the test is complete.

## Verification performed for this change

- `tsc --noEmit` clean; ESLint 0 errors.
- Vitest: all suites, including the new `staging-chain` (services → Hermes
  adapter → HTTP → fake Hermes → database) and `runtime-connection` tests.
- `tofu validate` and `tofu fmt -check` on `envs/staging` and `envs/prod`
  (AWS provider 6.67).
- `shellcheck` on `lifecycle.sh` and the rendered `user_data`.
- CLI dry runs: `staging:check`, `env:apply` (refuses without
  `ALLOW_CLOUD_CHANGES=1`), `bundle:build` (bundle contains
  `root-config.yaml`).
- Production build and white-label bundle scan.

## Operator foundation update — 2026-10-09

The console redesign now persists versioned operating drafts and append-only runtime health samples. Check attempts and successful heartbeats are separate, and stale observations no longer appear healthy. This improves monitoring evidence but does not change the single-runtime availability topology or prove live deployment. New `operating_drafts` and `runtime_health_samples` tables must be deployed with the application after authorization.

Owner-approved direction: standard isolation plus optional HA, with support diagnoses and change plans requiring human execution approval. See `OPERATOR_PLATFORM_STATUS.md` for implemented behavior and `ENTERPRISE_RELIABILITY_PLAN.md` for the staging, durable-work, monitoring, restore and HA release gates. Existing live-staging blockers above remain.

## Vercel preview and infrastructure validation update — 2026-10-10

The `platform-v1` branch is pushed and its replacement Vercel preview is Ready.
The original 18-minute failure was caused by prerendering more than 12,000
noindex combinations and then inspecting a sitemap artifact after Vercel's
adapter moved it. Approved acquisition pages are now prerendered, long-tail
pages render on demand, and the preview completes in about two minutes.

The first branch CI run exposed infrastructure-definition issues before any
AWS apply: public runtime subnet addressing, provider-managed encryption on the
artifact bucket, an unencrypted alarm topic, and conflicting Compose PID-limit
fields. Terraform now defines private runtime subnets behind outbound NAT, a
rotating customer-managed key for artifacts and alarms, and one Compose PID
limit. Terraform 1.9.8 validates the production root module with AWS provider
6.68.0. No AWS resources were created or changed.
