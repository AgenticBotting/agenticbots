# Hermes Agent documentation and launch audit

_Reviewed 2026-10-11. This is an engineering audit of the official Hermes
documentation and source that affect AgenticBots. It is not a deployment
record. No cloud resources, model calls, secrets or client data were used._

## Decision

Hermes is a workable runtime engine for AgenticBots **with launch gates**. Its
profiles, API server, scheduled jobs, approvals, model-provider support and
persistent state align with the product. AgenticBots must continue to own
tenant authorization, business approvals, billing, audit records, external
write policy and the durable control plane.

The current `v2026.9.24` image is reproducibly pinned, but it is not the
approved production target. Upstream `v0.21.6`, released 2026-10-08, includes
dashboard authentication and request-hardening fixes. Before the first AWS
staging runtime, select a reviewed patch version at least as new as `v0.21.6`,
pin its immutable image digest, and pass the adapter and security contract.

## What was reviewed

- The official [Hermes documentation index](https://hermes-agent.nousresearch.com/llms.txt)
  and full documentation corpus from
  [llms-full.txt](https://hermes-agent.nousresearch.com/llms-full.txt): 257
  indexed pages and approximately 5.6 MB of text when retrieved.
- Official documentation for installation, updates, configuration, profiles,
  sessions, storage, tools, skills, plugins, MCP, cron, Kanban, goals,
  heartbeats, the API server, gateways, security, managed scope, secrets,
  network egress, providers, routing, fallback, credentials, the dashboard,
  messaging and webhooks.
- Source archives for the repository's pinned tag `v2026.9.24` and current
  release `v0.21.6`. Current documentation was not assumed to describe the
  pinned image where source behavior differed.
- The official
  [v0.21.6 release](https://github.com/NousResearch/hermes-agent/releases/tag/v0.21.6)
  and its security notes.
- AgenticBots runtime configuration, lifecycle scripts, adapter contract,
  Terraform, isolation model and staging runbooks.

## Verified fit with AgenticBots

| Need | Hermes capability | AgenticBots decision |
|---|---|---|
| One isolated client runtime | Profiles, API server and persistent local state | Keep one AWS runtime and encrypted data volume per client. A profile represents one BOT inside that client boundary. |
| Replaceable models | OpenAI, Anthropic, OpenRouter, DeepSeek, Bedrock, local/open and custom endpoints | Route through reviewed server-side credentials. Begin with one production provider and one evaluated fallback. Consumer OAuth is not a 24/7 production dependency. |
| Scheduled work | Cron jobs, fresh sessions, skills, per-job models and run-now/pause/resume | Use for bounded BOT schedules after platform authorization. Keep `allow_agent_scheduling` off. |
| Human control | Runtime tool approval modes | Keep Hermes approval fail-closed. AgenticBots business approvals remain separate and bind to the exact proposed action. |
| Durable operational state | SQLite WAL under the configured data directory | Use encrypted native EBS. Back up and restore-test it. Never share one writable EBS volume across availability zones. |
| API integration | Runs, events, stop, approval, capabilities, skills, toolsets, sessions and jobs | Keep all engine details behind `BotRuntime`; browsers never call Hermes. |
| Repeatable deployment | Profiles and filesystem configuration | Terraform creates infrastructure; the lifecycle script installs exact, reviewed configuration and skills. |

## Launch-critical surprises

### 1. The API server exposes a broad default tool surface

In the pinned source, the API server's default platform toolset includes much
more than model inference: file mutation, browser and credential operations,
skill management, delegation, cron management, web access, memory, sessions
and other tools. The existing AgenticBots config disables `terminal` and
`code_execution`, but that is not a complete allowlist.

Before staging, set `platform_toolsets.api_server` explicitly for the default
profile and every BOT profile. Use the smallest list required by that BOT,
disable MCP unless a reviewed connection is needed, and verify the effective
surface through `/v1/toolsets`. The default host profile should have no work
tools. Add a contract test that fails when an unexpected toolset appears.

The `skills` toolset can manage skills, not merely read them. AgenticBots
deploys versioned skills, so production BOTs must not rewrite those files.
Exclude skill management from runtime tools or enforce and test read-only /
write-approval behavior. Treat memory writes the same way until retention and
deletion behavior are approved.

### 2. The pinned version predates security fixes

The current upstream release notes describe fixes for login rate-limit bypass
through `X-Forwarded-For`, unbounded audit values on unauthenticated login,
unlimited bodies on public auth routes, a non-loopback native sign-in redirect
that could enable session takeover, repository filter hardening and email
sender allowlist hardening. Even though AgenticBots does not run the Hermes
dashboard, the safe production posture is to upgrade before staging and prove
the exact deployed surface.

The upgrade must be staged, digest-pinned and reversible. Do not deploy
`latest`. Current documentation is not the version contract; the selected tag
and source are.

### 3. Native Kanban is useful but is not part of the stable runtime API

Hermes Kanban is real and already present in the pinned source. It provides a
durable SQLite task board with dependencies, comments, workspaces, scheduled
tasks, per-task models, retries, worker processes and multiple boards.

Its isolation model matters:

- boards are the hard logical boundary; tenant labels are soft filters;
- workers are full operating-system processes;
- one dispatcher must own a shared board;
- `auto_decompose`, `auto_subscribe_on_create`, child promotion and review
  dispatch introduce additional autonomous work unless configured;
- concurrency defaults can be unlimited when caps are omitted.

Kanban routes are supplied by the dashboard plugin, outside the documented
stable `/v1` runtime API. AgenticBots intentionally does not run the dashboard.
Do not expose it merely to obtain Kanban. The first launch should use existing
AgenticBots requests, runs, automations and approvals. A later phase may add a
least-privilege runtime bridge or an upstream-supported API after its auth,
tenant and process model have contract tests.

### 4. Network isolation is not automatic

The container currently has normal outbound network access. Turning off shell
and code execution reduces risk, but web, browser and MCP tools can still reach
destinations allowed by the host network. Before enabling any of those tools,
define per-profile destinations, block instance metadata, and add DNS/HTTPS
egress controls and tests.

Hermes documents an egress proxy, but TLS interception, its certificate key,
runtime/socket behavior and version-specific logging limitations make it one
layer rather than a complete boundary. Adopt it only after a staging contract
test. AWS network controls and application allowlists remain required.

### 5. Managed scope is configuration control, not a sandbox

Hermes managed scope can pin settings, but a process that can edit the runtime
configuration can escape that policy. Use it to reduce accidental drift while
keeping operating-system identity, immutable images, file permissions, network
policy and AgenticBots authorization as the security boundaries.

### 6. Plugins and hooks execute trusted code

Treat every plugin as code with the runtime's privileges. Keep third-party
plugins disabled by default, review and pin any enabled package, forbid
automatic updates and add it to the version contract. Newer Hermes versions
offer more plugin isolation than the current pin, but that feature must be
verified in the selected upgrade.

### 7. Cron, goals and heartbeats have different durability semantics

Cron is the appropriate Hermes primitive for scheduled runtime work. Keep
`cron.allow_agent_scheduling=false`, use finite task/model budgets, and reserve
no-agent scripts for quiet health checks.

Heartbeats re-enter a session and goals can continue work across turns. They
are not the launch control plane and can create hard-to-predict inference and
tool usage. Leave them disabled for launch. AgenticBots and Convex remain the
source of truth for requested work, approval and completion.

### 8. Several useful defaults are unsafe as production budgets

Current documentation describes automatic provider recovery cycles after
normal retries and fallbacks (five by default), while a model-visible budget
warning only works with a finite `max_turns`. Kanban concurrency and profile
dispatch can also be unbounded when caps are omitted. The selected release
must have explicit attempts, turns, duration, concurrency, token and dollar
limits. A provider outage may delay work; it must not create an open-ended
retry bill.

Hermes also documents discounted model ids with a `-contributor` suffix whose
vendor may train on prompts and completions. Those routes are prohibited for
client data. Model and fallback allowlists must match exact ids and reviewed
data-use terms; a cheaper route is not an implicit substitute.

### 9. Bot Mode is aligned with the BOT model but adds a hidden lateral path

The official [Bot Mode documentation](https://hermes-agent.nousresearch.com/docs/user-guide/bot-mode)
confirms that a Hermes Bot is a profile, and a Bot routine is an ordinary cron
job. That validates the AgenticBots mapping. Bot Mode itself is a bundled
Desktop UI plugin; the headless EC2 runtime does not need it.

`agent.bot_mode_protocol` defaults on. Hermes injects its `message_agent` tool
dynamically when a session is titled exactly `Bot Chat` and any profile carries
the Desktop plugin's `ui_meta.hermes-bots` marker. A fresh headless runtime
normally lacks those markers, but relying on their absence would let a later
Desktop connection silently add lateral BOT-to-BOT messaging. AgenticBots now
sets `bot_mode_protocol: false` in both root and BOT profile launch configs and
tests that policy. It must also avoid Bot Mode metadata, peers and canonical Bot
Chats in production.

Bot Mode group rooms can continue driving turns after Desktop closes, and
cross-machine peers exchange direct gateway API credentials. Those paths
bypass the AgenticBots work queue, business approval, tenant audit and model
budget controls. They remain disabled. Future Chief-of-Staff or BOT delegation
must be submitted through AgenticBots records and `BotRuntime`, with stable
operation ids and the same approval policy as any other BOT RUN.

## Required production configuration contract

The exact syntax must be verified against the selected Hermes tag before it is
committed. The resulting behavior must satisfy all of these checks:

1. Dashboard and dashboard plugins are not listening.
2. The default profile cannot perform work and exposes no unnecessary tools.
3. Each BOT has an explicit API-server tool allowlist and no implicit MCP.
4. Shell, host code execution, skill mutation and credential-vault mutation
   are unavailable to ordinary BOT runs.
5. Runtime approvals are manual and unattended/scheduled dangerous actions
   fail closed.
6. Agent-managed scheduling, Kanban dispatch, goals, heartbeats, messaging and
   webhooks are disabled until separately approved. Bot Mode protocol, peers,
   group rooms and dynamic `message_agent` injection are disabled.
7. Concurrent runs, turns, retries, tokens, duration and model spend have
   finite caps. Missing budgets fail closed.
8. Only reviewed model/provider routes are available; fallback routes pass the
   same tool, privacy and structured-output tests. Contributor/training routes
   are denied for client data.
9. Every client uses separate runtime credentials, provider credentials,
   storage and network identity.
10. Effective capabilities and toolsets are captured at deployment and
    compared with the approved contract.

## Daily upstream updates without fleet breakage

Hermes may publish frequently. AgenticBots should check for stable releases
every day and automate qualification, while deploying only an immutable digest
that passed the release gates. “Current” means the newest compatible release
promoted through those gates, not an untested `latest` tag.

The official update documentation distinguishes source-checkout updates from
Docker: a Docker installation is updated by pulling the chosen image and
recreating the container with the same data mount. AgenticBots uses Docker, so
it must not run `hermes update` inside production containers. Upstream's
drain-first restart behavior is useful evidence, but our lifecycle must provide
equivalent maintenance control around container replacement.

The automated promotion pipeline should:

1. Poll stable GitHub releases and the image registry daily. Ignore drafts,
   prereleases, canaries and branch heads.
2. Resolve the exact source commit and image digest. Record release notes,
   dependency changes and security advisories. Generate/scan an SBOM when the
   publisher does not provide verifiable provenance; absence of provenance is a
   recorded risk, never treated as proof.
3. Start a disposable runtime from that digest and run API, auth, capability,
   toolset, profile-isolation, session, cron, approval, redaction and resource
   limit contracts.
4. Restore a sanitized staging snapshot into an isolated candidate runtime and
   test configuration/state migration. Preserve the pre-upgrade snapshot. Prove
   whether the previous image can read the migrated state before enabling
   automatic image rollback.
5. Promote to one fictional staging tenant. Run a read-only BOT RUN, scheduled
   job, restart, session continuation and approval round-trip. Observe a defined
   soak window; an urgent security fix may use a shorter documented window.
6. Promote by rings: internal/fake tenant, designated client canary, small
   client batch, then the remaining fleet. Stop automatically when health,
   error, latency, toolset, cost or reconciliation thresholds regress.
7. Before each client update, set a maintenance/drain flag that rejects new BOT
   RUNS, wait for in-flight work to finish within a bounded deadline, pause the
   scheduler, take a verified backup, recreate the container on the new digest,
   run readiness/contracts, then resume schedules and new work.
8. Preserve the encrypted data mount, profile paths, API keys, provider secrets,
   runtime hostname and Cloudflare route so connections do not change. Reconcile
   every run that was active near the maintenance window.
9. Roll back the image automatically only when state is proven backward
   compatible. Otherwise restore the pre-upgrade snapshot under human review.
   Never replay an ambiguous external action during recovery.

Release detection can be daily and fully automatic. Fleet promotion must stop
on failed evidence, and the currently healthy digest remains in service. This
design gives clients prompt safe updates without converting an upstream defect
into a simultaneous fleet outage.

## Model and provider strategy

- Use server-side API or AWS Bedrock credentials for unattended production.
  OAuth intended for an individual interactive account is unsuitable as the
  dependency for daily client operations.
- Start with one capable production model for plans and tool use. Route narrow,
  low-risk classification or summarization to a cheaper evaluated model only
  after task-specific tests exist.
- A free provider route is acceptable for development with fictional data. It
  must never silently receive production client data or execute a write.
- A fallback model must pass the same tool-calling, schema, privacy, retention,
  context-window and refusal/approval tests. Provider outage does not authorize
  relaxing a policy.
- Record the selected route and actual usage on each BOT RUN without exposing
  provider names or internal cost details to clients.

## Operational architecture

| Layer | Responsibility |
|---|---|
| Vercel | Public site, operator/client UI, authenticated server actions and short control-plane APIs. |
| Convex through `Repository` | Tenant records, requests, approvals, audit history, projections, desired state and reconciliation records. |
| AWS EC2 runtime | Long-running Hermes processes, client-local runtime state, BOT schedules and approved execution. |
| Terraform and lifecycle tooling | Reproducible infrastructure and exact runtime installation. No ad-hoc console state as the source of truth. |
| Model providers | Replaceable inference behind reviewed server-side routes and budgets. |
| AWS MCP or other operator tools | Read-only diagnosis and operator assistance by default. Never the production execution plane or source of truth. |

The browser never receives runtime endpoints or credentials. A Vercel request
can submit desired work, but durable execution belongs to the isolated runtime
and reconciliation worker. Every external write uses AgenticBots policy,
idempotency and audit before it reaches a provider.

## Deferred capabilities

These are feasible, but they do not belong on the critical path to the first
client pilot:

- Native Kanban boards and autonomous worker dispatch.
- Chief-of-Staff BOT meetings, Telegram or group-chat reporting.
- Goals and session heartbeats.
- Broad browser, terminal, code-execution or AWS MCP access.
- Third-party plugins and automatic skill mutation.
- Automatic high-availability failover.

The quiet first operating model is scheduled BOT work, one daily operator
summary, exception alerts, and exact-action approval for any external write.

## Readiness result

**Ready to start implementation tasks; not ready to provision the first
runtime.** The implementation plan may proceed locally. Cloud provisioning is
blocked until the selected Hermes upgrade, exact toolset contract, model route,
egress policy, restore plan, cost ceiling and first-staging approval are all
recorded and tested.
