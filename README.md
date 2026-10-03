# AgenticBots

**agenticbots.dev** — the marketing site, plus the **AgenticBots Platform**:
the software AgenticBots uses to build, run, monitor and bill for the Bots it
operates for clients.

AgenticBots is a managed service. Clients don't operate AI infrastructure;
they see results, approve what leaves their business, and ask for work.
The AgenticBots team runs everything from one console.

| Surface | Path (dev) | Production host | Who |
|---|---|---|---|
| Marketing site | `/` | agenticbots.dev | Everyone |
| **Operator console** | `/ops` | ops.agenticbots.dev | AgenticBots superadmins + operators |
| **Client portal** | `/portal` | app.agenticbots.dev | Client admins + members |
| Sign in | `/login` | both | — |

## Quick start

```bash
npm install
npm run demo                 # demo mode: seeded fictional clients, no accounts needed
# open http://localhost:3003/login — demo sign-ins are listed on the page
```

```bash
npm run dev -- -p 3003       # normal dev (needs .env.local — see .env.example)
npm run typecheck
npm run lint
npm test                     # unit + integration + security + white-label (demo store, ~15s)
npm run test:e2e             # Playwright, starts the app in demo mode
npm run test:white-label     # also scans built bundles after `npm run build`
npm run test:hermes-contract # optional, against a real staging runtime
npm run build
npm run ops -- help          # provisioning CLI
```

## What's in the platform

**Operator console** — Dashboard (what needs attention) · Clients (14-tab
detail: Bots, runs, requests, automations, approvals, integrations,
infrastructure, credentials, usage & cost, billing, monitoring, audit,
settings) · Bots (run, model/provider, skills, integration access,
enable/disable, runtime details, test conversation) · Runs (live timeline,
usage, stop/retry) · Requests (route to people or Bots) · Approvals ·
Automations · Integrations · Infrastructure · Usage & Cost (incl. internal
margin) · Monitoring (incidents + logs by correlation id) · Billing
(agreements, invoices, ACH/wire payments, reversals, suspension
eligibility) · Skills · Audit Log · Settings · global search.

**Client portal** — Overview (results, approvals, request box, Bots,
activity) · Activity · Approvals · Requests · Integrations · Reports.
Mobile-first navigation. No models, prompts, runtime, AWS or engine names.

## Architecture in one paragraph

Next.js 16 server components and server actions over a TypeScript service
layer (authorization, runs, approvals, requests, billing). Data in Convex
(the site already uses it) through a server-only, secret-guarded document
API; demo mode and tests use an in-process store behind the same interface.
Bots run on **one isolated AWS EC2 runtime per client** (encrypted EBS,
tenant-scoped IAM + KMS + Secrets Manager), each Bot a separate profile with
its own key in a pinned engine container, reached only through a Cloudflare
Tunnel + Access service token. The web app controls runtimes through
Vercel→AWS OIDC and a single SSM document with fixed actions. Billing is
manual and provider-agnostic (ACH/wire); no card processor is required.

Diagrams: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** · Decisions:
[docs/adr/0001-platform-decisions.md](docs/adr/0001-platform-decisions.md)

The current runtime engine is Hermes Agent (pinned; see
[docs/research/HERMES_INTEGRATION.md](docs/research/HERMES_INTEGRATION.md)).
It is infrastructure — all engine-specific code sits in
`src/server/runtime/hermes/` behind the neutral `RuntimeAdapter` and the
`BotRuntime` facade (`src/server/runtime`), and clients never see it. See
"Runtime translator layer" in docs/ARCHITECTURE.md.

## Folder structure

```
src/app/ops/            operator console
src/app/portal/         client portal
src/app/login/          sign-in, set password
src/app/api/            REST API (client + /api/ops + internal sync + webhooks + run events SSE)
src/config/             Bot catalog (from the website catalog), skills manifest, integrations
src/lib/platform/       domain types, metrics, formatting (no secrets, client-safe)
src/server/auth/        sessions, password hashing, roles & permissions (single policy)
src/server/db/          Repository: memory (demo/tests) + Convex (prod)
src/server/runtime/     RuntimeAdapter, demo adapter, hermes/ adapter, event translation, error sanitization
src/server/services/    clients, bots, runs, requests, approvals, automations, integrations, monitoring, reports, sync…
src/server/billing/     pure domain, service, BillingProvider + providers/manual
src/server/aws/         AWS control plane (OIDC, SSM lifecycle, Secrets Manager, CloudWatch)
src/server/views/       client projections (the only shapes the portal receives)
src/server/demo/        demo seed (fictional)
convex/platform.ts      server-only document API for platform tables
infra/terraform/        AWS: network, per-client runtime, lifecycle document, OIDC role, backups
infra/runtime/          docker-compose, lifecycle.sh, engine config
runtime/skills/         AgenticBots skills (proprietary playbooks)
ops/cli.ts              provisioning CLI
tests/                  unit · integration · security · e2e · contract
docs/                   architecture, setup, runbooks, research
```

## Important docs

- [docs/BEGINNER_SETUP.md](docs/BEGINNER_SETUP.md) — accounts, AWS from zero, Vercel, Cloudflare, first client, billing loop, first-client checklist
- [docs/WHAT_I_NEED_FROM_YOU.md](docs/WHAT_I_NEED_FROM_YOU.md) — the short list of things only the owner can do
- Runbooks: [suspend](docs/runbooks/SUSPEND_CLIENT.md) · [billing & payments](docs/runbooks/BILLING_AND_PAYMENTS.md) · [restore a runtime](docs/runbooks/RESTORE_CLIENT_RUNTIME.md) · [upgrade the engine](docs/runbooks/UPGRADE_HERMES.md)
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)

## Marketing site (unchanged)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Geist.
`src/lib/catalog.ts` is the single source of truth for services (the
platform's Bot catalog derives from it). `src/app/globals.css` holds the
design system the platform also uses. Design rules: zero radius + the
diagonal notch, one green accent used as a signal, borders not shadows,
no hardcoded colors in components. Adding a service: append to
`src/lib/catalog.ts`.

Marketing env vars (all optional): `NEXT_PUBLIC_SITE_URL`, `MAILERLITE_*`,
`RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_EMAIL`, Umami.
