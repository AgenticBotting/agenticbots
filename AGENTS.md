<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AgenticBots — rules for coding agents

These rules are permanent. They apply to every change in this repository and
do not depend on any conversation history. Current state, architecture and
next tasks: `docs/PROJECT_HANDOFF.md`.

## The product and the owner

- AgenticBots operates **Bots** for contractors and local service businesses:
  a public marketing site, an operator console (`/ops`), a client portal
  (`/portal`), one isolated runtime per client on AWS, and the Prospect Graph.
- The owner is not a software engineer. Explain in plain English. Do not ask
  him a stream of technical questions — make reasonable decisions and state
  them. **Stop and explain before anything irreversible, expensive or
  security-sensitive.**
- Client-facing terminology is **BOT, BOTS, BOT RUN, BOT ACTIVITY**. Never
  rename Bots to "agents" in UI, copy, routes, types or data.

## Hard prohibitions (never, without the owner's explicit approval in the current task)

- Deploy anything (Vercel, Convex, AWS, Cloudflare) or run `terraform apply`,
  `npx convex deploy`, `vercel deploy`, or the CLI with `ALLOW_CLOUD_CHANGES=1`.
- Make destructive cloud or data changes; delete append-only records.
- Incur paid third-party API usage (data vendors, model providers, email).
- Push to GitHub, merge to `main`, force-push, or rewrite published history.
- Add, print, log or commit secrets. `.env*` files other than `*.example`
  are never committed.
- Send real email/messages or write to a real CRM/ad account from code paths
  you add without approval and policy checks.

## Engineering rules

1. **Read before writing.** Read the files you change and their tests. For
   Next.js APIs read `node_modules/next/dist/docs/` (Next 16: `params` and
   `searchParams` are Promises; server components + server actions).
2. **Keep existing working functionality intact.** No drive-by redesigns.
   The marketing site and its design (enterprise, minimal, Geist font only,
   no hype/"guru" styling) are not to be restyled unless asked.
3. **Storage only through the `Repository`** (`src/server/db/repository.ts`)
   and `Tx`; prospecting code only through `ProspectGraphStore`
   (`src/server/prospecting/store.ts`). Never call Convex from app code.
   New tables: add to `TABLE_NAMES` in `src/lib/platform/types.ts` **and**
   `convex/platformTables.ts` (and `APPEND_ONLY` in both if applicable).
4. **Authorization on every call.** Every page loader, server action and
   route checks `can()` (`src/server/auth/policy.ts`) or the prospecting
   `allowed()`/`getPrivate()` (`src/server/prospecting/access.ts`). Load the
   record, then prove access with its `orgId`; across tenants answer
   *not found*. Hidden UI is never the control.
5. **Tenant isolation.** Every tenant record carries `orgId`. Private client
   data never goes into shared tables (Prospect Graph shared tables never
   have `orgId`). Never let one client's data appear in another's view.
6. **Runtime boundary.** The engine's name, URLs, ports, headers and wire
   types live only in `src/server/runtime/hermes/**`. App code uses the
   `BotRuntime` facade (`src/server/runtime/index.ts`). UI components never
   import the runtime. Enforced by ESLint and
   `tests/security/runtime-boundary.test.ts`.
7. **Provider boundary.** Data-vendor names and credentials live only in
   `src/server/prospecting/providers/**`. Only the `EnrichmentRouter` calls
   providers. Do not invent API endpoints — implement an adapter only from
   the vendor's current documentation, with a recorded-response test, never
   live calls in tests.
8. **White-label.** Client-facing code and payloads never contain runtime or
   vendor names, provenance, costs or internal ids. Client views copy allowed
   fields in (`src/server/views/*`, `src/server/prospecting/views.ts`); they
   never filter forbidden fields out. Add new client-facing sources to
   `CLIENT_SOURCES` in `tests/security/white-label.test.ts`.
9. **Secrets** stay server-side (`server-only` modules). Never in the browser,
   portal, Bot prompt context, logs, audit details or stored records. Use
   `redactSecrets` for anything logged.
10. **Never fabricate.** No invented metrics, ROI/revenue, market sizes (TAM),
    signals, reviews or test values presented as real. Missing data is shown
    as missing; scores give unobserved components 0. Demo data is fictional,
    labeled, and flagged `demo: true`.
11. **Demo mode has zero external side effects.** Call `assertLive()` before
    any side effect that leaves the platform.
12. **Money and outbound safety.** Paid provider calls only through budgets
    that fail closed. Bots can never approve spend, change budgets, lift
    suppressions, override hard suppressions or qualification rules. Outbound
    only through `sendToOutbound` (policy gate). Nothing designed to overwhelm
    mail infrastructure.
13. **Approvals.** Anything that sends, publishes, changes ads, writes a CRM
    or deletes data stops for human approval.
14. **Audit.** Every state change by an operator or Bot writes an audit entry
    (`audit()` in `src/server/services/common.ts`).
15. **Determinism.** Scoring and other modeled outputs are deterministic for
    the same inputs and `asOf` date, versioned, and store their reasoning.
16. **Errors.** Use `AppError` helpers (`notFound`, `forbidden`, `invalid`,
    `conflict`, `unavailable`); only `publicMessage` reaches users.
17. **Skills.** Changing `runtime/skills/<key>/SKILL.md` requires bumping its
    `version` and the matching entry in `src/config/skills.ts`.
18. **Seed data.** After editing `data/prospecting/*.csv` run
    `npm run prospecting:embed-seed`.

## Before you finish any change

```bash
npm run typecheck
npm run lint            # 0 errors
npm test                # all green
npm run build           # when pages/routes/config changed
```

Add or update tests for behavior you change (security, isolation and
boundary tests especially). Update `docs/PROJECT_HANDOFF.md` and the relevant
status doc when the state of the project changes.

## Commits

- Commit logical changes to the current working branch with clear messages.
- Do not commit `.platform-data/`, `.env*` (except examples), build output,
  or generated demo state.
- Do not push unless the owner asks.
