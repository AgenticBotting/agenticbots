# ADR 0001 — Platform foundation decisions

Status: accepted · 2026-10-03

| # | Decision | Why |
|---|---|---|
| 1 | **Extend the existing Next.js 16 repo**; marketing site untouched except a wrapper that hides marketing widgets on `/ops`, `/portal`, `/login`. | Brand continuity, one deploy, no SEO risk. |
| 2 | **Convex for production data** (already in the repo for the course), via a server-only document API (`convex/platform.ts`) guarded by `PLATFORM_SERVER_SECRET`, with atomic multi-record commits and optimistic version checks. Platform tables are prefixed `pf_`. | "Use the existing stack." Supabase would add a second database and account. Authorization stays in one TypeScript policy layer. |
| 3 | **In-process store for demo and tests** behind the same `Repository` interface. | `DEMO_MODE=true` must work with no accounts at all; tests run in seconds without a database. |
| 4 | **Platform auth is built in** (scrypt passwords, server-side sessions, httpOnly cookies, rate-limited login, invite links) — separate from the course's Convex Auth. | Operators/clients and course buyers are different audiences; roles and org membership belong with platform data; works identically in demo and prod. |
| 5 | **Server components + server actions** for the UI; REST route handlers mirror the brief's API for integrations and E2E. Every action re-checks permissions. | Fewer moving parts; no client-side data fetching of tenant data. |
| 6 | **Bot types in code** (`src/config/bot-catalog.ts`, derived from the website catalog) instead of a `bot_types` table. | The website is the source of truth for names/copy/URLs; a table would drift. |
| 7 | **Engine pinned** to Hermes Agent `v2026.9.24` by image digest; per-profile keys; multi-profile gateway; Bot disable = native profile park. | Verified against current upstream source; never `latest`. |
| 8 | **Shell/code execution off by default** for all Bots. | Marketing/sales Bots do not need a shell; least capability. |
| 9 | **Private connectivity = Cloudflare Tunnel + Access service token + per-profile bearer key**; EC2 has no inbound rules. | Three independent layers; no public port. |
| 10 | **Vercel → AWS via OIDC**, one narrowly scoped role; the app can run only one SSM document with enumerated actions. | No static keys; no arbitrary remote shell. |
| 11 | **Manual, provider-agnostic billing** (agreements, invoices, payments, reversals); auto-suspend and auto-reactivate default **off**. | ACH/wire high-value B2B; humans decide on a $7.5k/month client. |
| 12 | **Results are sums of numbers a Bot reported** (`METRICS {...}` line), never estimates. | No fabricated ROI. |
| 13 | **Background sync via Vercel Cron** every minute (`/api/internal/sync`), not browser polling. | One predictable polling loop; no request storms. |
| 14 | **Vitest** for unit/integration/security; **Playwright** for E2E (demo mode). | Fast, TypeScript-native; E2E needs no external services. |
