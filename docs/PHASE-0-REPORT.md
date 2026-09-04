# Phase 0 — Repo Reconnaissance

Date: 2026-09-03 · Baseline for all later phases. **No code was changed to produce this report.**

---

## 1. Framework & environment

| Item | Value |
|---|---|
| Framework | Next.js **16.3.4** (Turbopack), App Router |
| React | 19.2.8 |
| Node | v22.23.2 |
| Package manager | npm (package-lock.json) |
| Styling | Tailwind **v4** via `@tailwindcss/postcss` — tokens in CSS `@theme`, **no tailwind.config** |
| Runtime deps | framer-motion 13, lucide-react, zod 4 (installed, **currently unused** — no imports) |
| Hosting | Not deployed. No Vercel project, no env file, git repo has no remote |

### Rendering strategy per route

| Route group | Strategy |
|---|---|
| `/`, `/about`, `/blog`, `/contact`, `/how-it-works`, `/marketing`, `/sales`, `/plan`, `/plan/thanks`, `/pricing`, `/privacy`, `/terms` | ○ Static |
| `/marketing/[category]` ×6, `/sales/[category]` ×7, `/blog/[slug]` ×3 | ● SSG via `generateStaticParams` |
| `/api/plan` | ƒ Dynamic (POST only) |
| `/sitemap.xml`, `/robots.txt` | ○ Static (route handlers) |

**30 public URLs. No ISR anywhere** — everything is build-time static. Fine at this scale; Phase 6 will need ISR/PPR.

---

## 2. Design tokens & every accent location

Single source: `src/app/globals.css` (`@theme` block + `:root` semantic layer). **No Tailwind config file, no theme.ts.** The system is already token-first — Phase 1 is a re-point, not a refactor.

### Current green system (three greens, one family)

| Token | Hex | Role |
|---|---|---|
| `--color-brand-600` / `--cta-bg` | `#2FAB00` | CTA fill (label is black — white on it fails AA at 3.02:1) |
| `--color-brand-500` / `--cta-bg-hover` | `#35C000` | CTA hover |
| `--accent-text` | `#426B00` | The only green legible as text on white (6.30:1). Links, eyebrows, `.em-green` |
| `--accent` / `--color-signal-500` | `#D1F301` | Neon. Dark surfaces only (1.27:1 on white). Dots, stat numbers, pattern glow |
| `--color-signal-400` | `#E1FF02` | Neon bright |
| `--color-signal-50` | `#F2FBE0` | Tint |
| `--bg-tint` `#F1F8E6` / `--border-tint` `#C9E88A` | | Soft green surfaces |

### Every location green appears outside the token block

| Location | What | Phase-1 action |
|---|---|---|
| `globals.css:382` | Focus ring `rgba(66,107,0,0.12)` (raw `#426B00` alpha) | tokenize |
| `globals.css:435` | `.bot-glow` drop-shadow `rgba(209,243,1,0.40)` (raw neon alpha) | tokenize |
| `src/app/layout.tsx:25` | `themeColor: "#080A08"` (metadata — must be a literal) | update value |
| `src/lib/notify.ts:79` | Email template inline `#6B7A8C` (gray, not green — but email is unthemed) | update with palette |
| SVG fills | **None hardcoded** — everything is `currentColor` ✓ | none |

### Missing brand assets (Phase 7 gap)

- **No favicon at all** (scaffold default was deleted, never replaced)
- No `manifest.json`, no apple-touch-icon, no OG/Twitter image files, no dynamic OG generation
- `themeColor` exists for light only; no dark variant

---

## 3. Route map, components, content sources

### Components (all in `src/components/`)

- **ui/**: Button/ButtonLink, Container, Reveal, SectionHeader, Logo, BotFace (traced brand glyph, 3.112:1), BotIndex (numeral system), BotPattern (SVG field, 84 seeded marks), BrandMark (AB watermark)
- **marketing/**: BotPlanForm, BotPlanFlow (4-step modal), ExitIntent, PlanCta, PipelineMockup (fleet telemetry), StatBand, CapabilityGrid, FaqAccordion, BlogOptin, BotScrollList (scrollytelling roster), PillarPage + CategoryPage (templates ×15 pages), LegalPage
- **layout/**: Header (two-step mega menu), Footer

### Content sources — no CMS

- `src/lib/catalog.ts` — the whole service taxonomy (2 pillars, 13 categories, ~105 capabilities, contrast pairs, FAQs). Single source of truth; routes/nav/sitemap all derive from it.
- `src/lib/posts.ts` — blog as typed content blocks. **No MDX pipeline.** 3 posts.
- **Phase 4 conflict:** spec wants MDX + Shiki + 8 custom components. Current blog is typed-blocks-in-TS. This is a migration decision, flagged below.

### Lead capture (existing)

`/api/plan` — validated, rate-limited (5/10min in-memory), fans out to MailerLite + Resend (both env-gated, fail-soft, **no credentials configured**). Fed by 5 sources: BotPlanForm, BotPlanFlow, ExitIntent, BlogOptin, PlanCta. `source` field is recorded per lead — a proto-taxonomy Phase 9 can formalize.

---

## 4. Performance baseline (Lighthouse 12, mobile emulation + throttling, production build via `next start`)

| Page | Perf | A11y | BP | SEO | LCP | TBT | CLS | Weight |
|---|---|---|---|---|---|---|---|---|
| `/` | 93 | **100** | 96 | **100** | **3.2s** | 20ms | **0** | 372 KiB |
| `/marketing/paid-media` | 94 | **100** | 96 | **100** | **3.0s** | 10ms | **0** | 369 KiB |
| `/blog/speed-to-lead…` | 97 | **100** | 96 | **100** | **2.7s** | 0ms | **0** | 343 KiB |

Local numbers — no network RTT, no CDN. Treat as optimistic on LCP-from-network but honest on JS/render cost.

**Against the spec's Phase 7 budgets:**

- ❌ **LCP < 2.0s: failing on all three** (2.7–3.2s). CLS and INP-proxy (TBT) pass with room.
- ❌ **JS < 150KB gzipped: failing** — 206KB across 7 chunks. Prime suspect: **framer-motion (~13.x)** imported by 6 components for what is mostly opacity/translate reveals. Largest single win available (~54–69 KiB flagged unused per route).
- ✅ CLS 0.05: perfect 0 everywhere.
- ⚠️ Lighthouse ≥95 all categories: Perf 93–97 (borderline), BP 96 (headless-Chrome artifact, likely 100 in real Chrome).

**LCP diagnosis:** text-based LCP (hero H1) waiting on preloaded Geist woff2 + render-delay. Fixes are cheap: subset fonts, ensure `display: swap` is doing its job, consider inlining critical text styles. Not an image problem — there are almost no images.

---

## 5. SEO state

| Item | State |
|---|---|
| Sitemap | ✅ `sitemap.ts` — all 27 canonical URLs, priorities, lastmod (but lastmod = build time, not content change — spec violation to fix) |
| robots.txt | ✅ allows all, disallows `/api/` + `/plan/thanks`, references sitemap |
| Canonicals | ✅ 13 of 15 page files set `alternates.canonical`; **missing on `/` (home) and legal pages** |
| `metadataBase` | ✅ set from `NEXT_PUBLIC_SITE_URL`, defaults `https://agenticbots.dev` |
| OG tags | ✅ site-level + per-page titles/descriptions; **no OG images exist** |
| H1 uniqueness | ✅ exactly one H1 per page (verified on 4 templates), unique text |
| Structured data | ❌ **None.** No Organization, Service, Article, FAQPage, BreadcrumbList — nothing |
| Breadcrumbs | Visible on category pages, **no `BreadcrumbList` markup** |
| Title uniqueness | ✅ unique via template + per-page titles (not CI-enforced yet) |
| Analytics | ❌ **None. Zero measurement of any kind.** Every CTA currently fires unmeasured |
| Domain | ⚠️ Unconfirmed whether agenticbots.dev is registered/pointed. **Blocker for everything in Phase 6/7** |

---

## 6. Broken / dead / unused

| Item | Status |
|---|---|
| `zod` | Installed, never imported. `/api/plan` validates by hand. Use it (spec wants Zod anyway) or drop it |
| `lucide-react` | Used for ~10 utility icons (arrows, check, menu). Cheap, tree-shaken; fine |
| `Button` (non-link) | Exported, zero imports — dead |
| `BotFace` | Only used by ExitIntent's chip + BotPattern internals — fine |
| `docs/` | Created just now for this spec; otherwise empty |
| CI | ❌ None. No GitHub remote, no pipeline, no budgets enforced |
| Fonts | Geist + Geist Mono only (Montserrat removed earlier today) ✓ |

---

## 7. Positions on the challenge questions (Appendix)

**1. 8,000–20,000 city pages?** No. This domain is **unregistered-or-unlaunched with zero authority, zero backlinks, zero indexed pages**. Launching five figures of programmatic pages on a fresh domain is the exact profile Google's March-2024 scaled-content policies were built to catch — and this niche ("agentic PPC company in Wichita") has near-zero query volume to reward the risk. My recommendation: **Tier 0 = the 13 service pages + 10–20 metro pages max**, hand-tuned, shipped after the domain has real content, real links and 60–90 days of indexing history. Hold there for two quarters. The uniqueness engine in the spec is the right design *if* we ever go past 300 pages — but the dataset work (per-metro CPC benchmarks, industry mix) is weeks of effort that should follow proven Tier-0 signal, not precede it.

**2. Full-screen welcome mats for an enterprise buyer?** The desktop exit-intent version is defensible; the **50%-scroll mat is not, and I'd kill it**. A VP Growth mid-read who gets a full-screen takeover files the site under the exact "marketing agency" bucket the positioning exists to escape. The engineering-credibility strategy and interruption marketing pull in opposite directions. What I'd build: exit-intent (desktop only, velocity-gated) + the mobile bottom-sheet ≤35%, both with the spec's frequency caps. Note: a compliant version **mostly exists** — `ExitIntent.tsx` already does mouseleave + 8s dwell + once-per-session + 14-day localStorage suppression. It needs the velocity threshold, paid-traffic exclusion, focus trap, and instrumentation.

**3. Live sandbox vs. recorded trace?** **Recorded, scrubbable trace first — it's 90% of the persuasion at ~0% of the risk**, and it's on the critical path of the hero anyway ("see a bot run"). The live sandbox is a real differentiator but it's also an abuse surface (prompt injection against your own marketing site is a bad look for an agent-engineering company), an API cost, and a latency lottery in the highest-stakes spot on the page. Ship the trace in Phase 5; ship the sandbox later as an email-gated `/audit` tool where a 20-second wait is expected and rate limits are natural.

**4. Comedy line?** The spec's placement list is right and the register matters more than the placement: the joke must be *observational about systems*, never *wacky*. "Never posts your product to the wrong Slack channel" works because it's a real incident every buyer has lived. Hard line: nothing humorous within one viewport of a price, a security claim, or the booking flow — and no humor in error states that cost the user something (a failed form submit is not funny to the person who typed it twice).

**5. What makes the site slower without converting better?**
- **The generative WebGL cursor field (Phase 5).** Even at <30KB it's the classic pay-JS-for-vibes trade, invisible on mobile, and the current SVG bot field already owns that aesthetic slot. Cut it or ship it as the easter egg.
- **framer-motion at 13KB×many for opacity fades.** Already the biggest JS line item; most `Reveal` usage is replaceable with CSS `@starting-style`/IntersectionObserver at ~1KB. The spec's 40KB motion budget should mostly be *spent on the agent trace*, not on scroll reveals.
- **Session replay on all sessions (Phase 9).** Spec already scopes it to converters — hold that line; replay JS on every pageview would be the single worst perf regression available.
- **Sticky scroll-spy secondary nav on *every* long page (Phase 3).** Worth it on service pages; on the blog it fights the "zero distractions" reading spec from Phase 4. Pick per-template.

---

## 8. Corrections to the spec before Phase 1 (accepting the "push back" invitation)

1. **Phase 1's premise conflicts with today's design decisions.** The spec mandates `#7fa200` as the new accent anchor. The current system was *just* rebuilt (same day) around three greens with distinct jobs — `#2FAB00` CTA (user-chosen), `#D1F301` neon (sampled from the supplied pattern artwork so screen accent == artwork glow), `#426B00` text. Migrating to a `#7fa200` ramp changes the CTA color the user picked hours ago and un-matches the neon from the brand artwork. **Needs an explicit decision before Phase 1 runs:** (a) `#7fa200` replaces all three greens via OKLCH ramp as spec'd, (b) `#7fa200` replaces only the CTA/fill green and the artwork-matched neon stays, or (c) skip Phase 1 — the token layer the phase exists to create already exists.
2. **Phase 1's contrast math checks out against my measurements** (`#2FAB00` white-text failure mirrors `#7fa200`'s 2.97:1 — same hue family, same trap; black-label rule already applied here). The AA table requirement is already half-built: keep it.
3. **Phase 4's reference URL** (`nicholaus.ai/blog/...`) — that site is this user's own previous project, archived locally at `~/Desktop/_archive-nicholaus-ai`. I can read the actual source rather than fetching a possibly-dead URL.
4. **Phase 6/7 are blocked on a domain.** No registrar/DNS/hosting confirmed. Cheap to resolve, but nothing in the SEO phases is real until `agenticbots.dev` resolves and can accrue history.
5. **"Current Lighthouse scores" now exist** (§4) and CI budgets can be enforced from day one of Phase 1 — but there's no CI because there's no remote. Creating the GitHub repo (NicholausAI account only) is a prerequisite I need your go-ahead for.

---

## Suggested phase order (impact-adjusted)

1. **Phase 9-lite first** (analytics + event taxonomy) — the spec itself says build measurement before, not after; every later phase is unmeasurable without it.
2. **Phase 1** (accent tokens) *after* the §8.1 decision.
3. **Phase 7 hygiene subset** (favicon/OG/manifest/structured data/canonical gaps) — small, compounding, unblocks social sharing.
4. Phases 2 → 3 → 5 → 4 as spec'd.
5. Phase 6 only post-launch with indexing history.
