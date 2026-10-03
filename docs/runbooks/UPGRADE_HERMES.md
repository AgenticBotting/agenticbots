# Runbook — Upgrade the runtime engine

Never deploy `latest`. Never upgrade every client at once.

> **Known gap (see docs/DEPLOYMENT_READINESS_AUDIT.md, item 26).** An
> existing runtime reads its engine image from `/opt/agenticbots/runtime.env`,
> which is written once at first boot, and Terraform deliberately ignores
> `user_data` changes. So changing `engine_image` in Terraform alone does
> **not** upgrade a running client. Until an `upgrade-engine` lifecycle
> action exists, do steps 4/11/12 by editing `ENGINE_IMAGE=` in
> `/opt/agenticbots/runtime.env` through Session Manager, then
> `/opt/agenticbots/bin/lifecycle.sh restart-runtime none` — and also update
> Terraform so a replaced instance boots the same image.

1. **Review upstream** — read the release notes/changelog between the pinned
   tag (`docs/research/HERMES_INTEGRATION.md`) and the candidate. Look for:
   API server changes (`/v1/runs`, events, approval, jobs, sessions), auth
   changes, profile/multiplexing changes, config migrations, data/schema
   changes in `state.db`.
2. **Resolve the digest** — `docker buildx imagetools inspect nousresearch/hermes-agent:<tag>`.
3. **Back up staging** — `npm run ops -- tenant:backup --tenant <staging tenant>` (ALLOW_CLOUD_CHANGES=1).
4. **Deploy to staging** — set that tenant's `engine_image` in
   `tenants.auto.tfvars.json` to `…:<tag>@sha256:<digest>`, plan, apply,
   restart the runtime.
5. **Run contract tests** — `npm run test:hermes-contract` against staging.
6. **Review API changes** — update only `src/server/runtime/hermes/*`
   (field changes go in `hermes-mappers.ts`; new failure shapes in
   `hermes-errors.ts`), plus `tests/support/fake-hermes.ts` and
   `tests/unit/hermes-adapter.test.ts`. Run `npm test` — the shared
   adapter contract must still pass unchanged.
7. **Review data changes** — confirm sessions, memory, skills and jobs are
   intact on staging (open a Bot → runtime details; list automations).
8. **Update the pin** — `RUNTIME_ENGINE_VERSION`, `default_engine_image`, and
   the table in `HERMES_INTEGRATION.md`.
9. **Deploy the demo tenant** and click through the operator console.
10. **Verify** — health, a read-only run, an approval round-trip, an automation run-now.
11. **Roll out gradually** — one client at a time: backup → set image → apply
    → restart → verify → next. Watch Monitoring for 24h before the next batch.
12. **Rollback** — set the previous digest, apply, restart. If the new
    version migrated data in a non-backward-compatible way, restore the
    pre-upgrade snapshot (`RESTORE_CLIENT_RUNTIME.md`).
