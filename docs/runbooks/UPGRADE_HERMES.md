# Runbook — Upgrade the runtime engine

Never deploy `latest`. Never upgrade every client at once.

Hermes releases may be checked daily. Detection and candidate testing should be
automatic; fleet installation follows the gates below. AgenticBots runs the
Docker image, so update by recreating the container on a chosen digest with the
same encrypted data mount. Do not run the source-checkout `hermes update`
command inside the production container.

> **Required first target, 2026-10-11:** The repository pin
> `v2026.9.24` predates security fixes described in upstream `v0.21.6`.
> Select a fully reviewed release at least as new as `v0.21.6`; do not assume
> that the newest tag is compatible. The full audit is
> `docs/research/HERMES_DOCUMENTATION_AUDIT_2026-10-11.md`.

> **Known gap (see docs/DEPLOYMENT_READINESS_AUDIT.md, item 26).** An
> existing runtime reads its engine image from `/opt/agenticbots/runtime.env`,
> which is written once at first boot, and Terraform deliberately ignores
> `user_data` changes. So changing `engine_image` in Terraform alone does
> **not** upgrade a running client. Until an `upgrade-engine` lifecycle
> action exists, the deploy, verify and rollout steps require editing `ENGINE_IMAGE=` in
> `/opt/agenticbots/runtime.env` through Session Manager, then
> `/opt/agenticbots/bin/lifecycle.sh restart-runtime none` — and also update
> Terraform so a replaced instance boots the same image.

1. **Review upstream** — read the release notes/changelog and source between the pinned
   tag (`docs/research/HERMES_INTEGRATION.md`) and the candidate. Look for:
   API server changes (`/v1/runs`, events, approval, jobs, sessions), auth
   changes, profile/multiplexing changes, config migrations, data/schema
   changes in `state.db`, platform toolset defaults, plugin isolation,
   dashboard/auth fixes and egress behavior.
2. **Resolve the digest** — `docker buildx imagetools inspect nousresearch/hermes-agent:<tag>`.
3. **Qualify the artifact** — record the source commit and digest, inspect the
   release/dependency diff, scan an SBOM and run the complete contract suite in
   a disposable container. Restore a sanitized state snapshot into a separate
   candidate runtime and test migration. Prove backward compatibility before
   allowing automatic image rollback.
4. **Back up staging** — `npm run ops -- tenant:backup --tenant <staging tenant>` (ALLOW_CLOUD_CHANGES=1).
5. **Deploy to staging** — set that tenant's `engine_image` in
   `tenants.auto.tfvars.json` to `…:<tag>@sha256:<digest>`, plan, apply,
   restart the runtime.
6. **Run contract tests** — first against a local disposable runtime, then
   `npm run test:hermes-contract` against staging. Assert `/v1/capabilities`
   and `/v1/toolsets` exactly; an unexpected toolset fails the release.
7. **Review API changes** — update only `src/server/runtime/hermes/*`
   (field changes go in `hermes-mappers.ts`; new failure shapes in
   `hermes-errors.ts`), plus `tests/support/fake-hermes.ts` and
   `tests/unit/hermes-adapter.test.ts`. Run `npm test` — the shared
   adapter contract must still pass unchanged.
8. **Review data and policy changes** — confirm sessions, memory, skills and
   jobs are intact on staging (open a Bot → runtime details; list
   automations). Prove that the default profile cannot perform work, BOTs
   cannot mutate versioned skills or credentials, dashboard routes are not
   listening, agent scheduling is off and unattended dangerous actions fail
   closed.
9. **Update the pin** — `RUNTIME_ENGINE_VERSION`, `default_engine_image`, and
   the table in `HERMES_INTEGRATION.md`.
10. **Deploy the demo tenant** and click through the operator console.
11. **Verify** — health, authenticated readiness, a read-only run, an approval
    deny/expiry/once round-trip, an automation run-now, finite budget failure,
    egress denial and redacted logs.
12. **Roll out gradually** — internal/fake tenant → designated client canary →
    small batch → remaining fleet. For every client: reject new runs → wait for
    active work within a bounded deadline → pause schedules → backup → set
    image → recreate/restart → verify → reconcile active runs → resume. Stop the
    rollout on any health, error, latency, toolset, cost or reconciliation
    regression. Use a recorded soak window; urgent security fixes may use a
    shorter, documented window.
13. **Rollback** — set the previous digest, apply, restart only when the
    migrated state is proven backward compatible. If the new
    version migrated data in a non-backward-compatible way, restore the
    pre-upgrade snapshot (`RESTORE_CLIENT_RUNTIME.md`).

## Automation target

A scheduled release watcher creates a candidate record once per day. It may
resolve metadata, run scans/tests, build the evidence package and promote a
passing candidate through the internal staging canary. It must never bypass a
failed gate, use `latest`, update multiple rings simultaneously, or reinterpret
a missing check as success. Client-ring promotion starts only under the
approved release policy, with a kill switch and the current known-good digest
retained for recovery.
