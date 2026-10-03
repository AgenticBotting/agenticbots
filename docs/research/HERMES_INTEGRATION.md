# Runtime integration — Hermes Agent

> Internal engineering document. The runtime is an implementation detail;
> clients never see its name. AgenticBots is the product.

Researched from the upstream source on **2026-10-03** (clone of
`github.com/NousResearch/hermes-agent`), not from memory.

| | |
|---|---|
| Upstream | `NousResearch/hermes-agent` |
| License | MIT (Copyright © 2025 Nous Research) — see `THIRD_PARTY_NOTICES.md` |
| Pinned tag | **`v2026.9.24`** |
| Pinned commit | `f97608f178d1ffeca59860195ab7da295f7c8e5f` |
| Image | `nousresearch/hermes-agent:v2026.9.24@sha256:<digest>` |
| Image digest | **Resolve once and record here** — Docker Hub was not reachable from the build sandbox. Run `docker buildx imagetools inspect nousresearch/hermes-agent:v2026.9.24` and copy the `Digest:` line into `terraform.tfvars` (`default_engine_image`). Terraform and `lifecycle.sh` both refuse an image that is not pinned by digest. |

## How AgenticBots maps onto the engine

| AgenticBots | Engine | Notes |
|---|---|---|
| Client runtime | One container (`gateway run`) on the client's own EC2 | Multi-profile gateway: `gateway.multiplex_profiles` (default on in this version) serves every profile on one listener |
| Bot | Profile (`hermes profile create <name>`) | Profile name = Bot type key (`ads`, `seo`, …) |
| Bot's credential | That profile's own `API_SERVER_KEY` in `profiles/<p>/.env` | Since July 2026 each `/p/<profile>/` prefix **only** accepts its own key — the default key is rejected (verified in `api_server.py`). We generate one 32-byte key per profile and store it in Secrets Manager. Never reused. |
| Bot Run | `POST /p/<profile>/v1/runs` | Returns `run_id`. `Idempotency-Key` header: identical retry returns the same run (`Idempotency-Replayed: true`, 202), retained 24h, survives gateway restart. |
| Run status | `GET /v1/runs/{id}` | `status`, `output`, `usage` (input/output/cache_read/cache_write), `runtime` (provider/model actually served), `approval` while parked, `shutdown_requested_at` while draining |
| Run events | `GET /v1/runs/{id}/events` (SSE) | `: keepalive` comment every 10s. Events: `run.queued/started/completed/failed/cancelled/interrupted`, `tool.started/progress/completed/failed`, `message.delta/interim`, `approval.request/responded`, `subagent.start/complete`. **Consume-once buffer, expires after 5 min unconsumed** → AgenticBots appends as it reads and reconciles by polling status. |
| Stop | `POST /v1/runs/{id}/stop` | Returns `stopping`; settles as `cancelled` when the worker exits |
| Approval | `POST /v1/runs/{id}/approval` `{choice: once\|session\|always\|deny, request_id?}` | AgenticBots only ever sends `once` or `deny` (aliases approve→once accepted). Runs park in `waiting_for_approval`. |
| Conversation | `/api/sessions` (+ `/messages`, `/chat`, `/chat/stream`, `/fork`) | Client may supply the session id; runs accept `session_id` to continue a transcript |
| Automation | `/api/jobs` CRUD + `/pause` `/resume` `/run` | Body: `name`, `schedule` (cron or "every 2h"), `prompt`, `skills`, `deliver` |
| Bot Skills | `GET /v1/skills` (read) + files in `profiles/<p>/skills/` | AgenticBots deploys its own SKILL.md folders per profile |
| Toolsets | `GET /v1/toolsets` | Used by integration checks (an MCP connection appears as a toolset) |
| Health | `GET /health` (liveness, no readiness), `GET /health/detailed` (authenticated readiness: config, state DB, model, disk, platform state, active runs) | Degraded still returns 200 — inspect `status` |
| Capabilities | `GET /v1/capabilities` | Checked before relying on runs/events/stop/approval/sessions |
| Disable a Bot | `hermes -p <p> gateway stop` → writes `<profile>/gateway.parked` | Native "park": stops the profile's adapters and cron ticks without stopping the host or deleting anything; `gateway start` unparks |

Implementation: `src/server/runtime/hermes/{client,adapter}.ts`. Everything
above that boundary uses AgenticBots words.

## Authentication model (defense in depth)

1. Browser → AgenticBots only (session cookie). The browser never receives
   a runtime URL, key or port.
2. AgenticBots server → `https://<tenant>.runtime.agenticbots.dev` through a
   **Cloudflare Tunnel** (outbound-only from the EC2; the instance has no
   inbound security-group rules). The hostname is protected by **Cloudflare
   Access** with a service token (`CF-Access-Client-Id/Secret`).
3. Engine bearer auth: per-profile `API_SERVER_KEY` (the engine refuses to
   start the API server with a missing/placeholder/<16-char key).

All three credentials live in Secrets Manager under
`agenticbots/<env>/tenants/<tenant>/…` and are read server-side only.

## Persistent paths

| Host | Container | Contents |
|---|---|---|
| `/opt/agenticbots/data/engine` (encrypted EBS data volume, XFS) | `/opt/data` | Everything: `config.yaml`, `.env`, `profiles/`, `state.db` (SQLite WAL), sessions, memory, skills, jobs, logs |
| `/opt/agenticbots/secrets/*.env` (root, 600) | env_file | Rebuilt from Secrets Manager on every start |
| `/opt/agenticbots/runtime` | — | Compose file, lifecycle script, skills bundle (from S3) |

The image's `/opt/hermes` is immutable by design; all mutable state is under
`/opt/data`. The data volume is a native block device (not a VM bind mount),
so SQLite WAL is safe (upstream warns about virtiofs/9p).

## Security posture (from upstream security docs)

- **Shell/code execution is off by default** for every AgenticBots Bot:
  `agent.disabled_toolsets: [terminal, code_execution]`. If a Bot ever needs
  compute, enable it for that profile only with a **cloud sandbox terminal
  backend** (`terminal.backend: vercel_sandbox | modal | daytona`) so commands
  never run on the runtime host. Do **not** mount the Docker socket.
- `approvals.mode: manual`, `unattended_mode: deny`, `cron_mode: deny`:
  API- and schedule-driven runs have no one at a keyboard, so dangerous
  commands are denied instantly instead of hanging.
- Client systems connected through MCP use `trust: untrusted`: every
  write-capable tool call parks the run for approval and surfaces in the
  AgenticBots approvals queue.
- Untrusted content (web pages, emails, documents, webhook payloads) is
  framed as data in every AgenticBots skill and in webhook-triggered tasks.
- The engine dashboard (port 9119) stores keys and is **not run**.

## Business approvals vs. runtime approvals

The engine's approval gate covers dangerous commands and untrusted MCP
writes. AgenticBots adds **deliverable approvals**: a Bot drafts (emails,
posts, ad changes) and stops; the client approves in the portal; only then
is an execution run started (idempotency key = the approval id, so a double
click can never send twice). Both kinds share one approvals table.

## Known limitations / assumptions

- `/v1/capabilities` does not advertise the jobs API as a feature flag in
  this version; the adapter assumes it from the pinned route table and the
  contract test verifies it.
- The SSE buffer is consume-once: a run nobody streams has its per-tool
  events dropped after 5 minutes. Status, output, usage and approvals are
  still reconciled by polling (`/api/internal/sync` every minute).
- Session list/messages response shapes are read defensively
  (`sessions | data | array`).
- Per-request `model`/`provider` overrides are honored on `/v1/runs`
  regardless of `direct_model_requests` — this is how AgenticBots applies
  the model chosen in the operator console without editing profile config.
- Max concurrent runs per gateway is set to 4 (HTTP 429 beyond that; the
  adapter maps it to a retryable "overloaded").

## Upgrade assumptions

Never deploy `latest`; never auto-upgrade every client. Follow
`docs/runbooks/UPGRADE_HERMES.md`: staging first, `npm run
test:hermes-contract`, then client-by-client.
