# AgenticBots.dev — Master Build Prompt for Claude Code

**How to use this file:** Don't paste all of it at once. Give Claude Code Message 1 (Context + Rules of Engagement + Phase 0), let it produce the plan, approve or correct it, then feed phases one at a time. Pasting everything in one shot produces a shallow plan across 11 topics instead of a deep one on the topic that matters.

Better still: save this file into the repo at `/docs/BUILD-SPEC.md` and open with:

> Read `/docs/BUILD-SPEC.md`. Enter plan mode. Do not write code yet. Execute Phase 0 only and report back.

---

## MESSAGE 1 — CONTEXT + RULES OF ENGAGEMENT

### Company context

AgenticBots (agenticbots.dev) is an **agentic AI infrastructure implementation agency** — not a SaaS product, not a tool vendor, not a chatbot builder. Positioning: powerful agent frameworks and models already exist on the market (Grok agents, Nous Hermes, Claude Agent SDK, OpenAI Agents SDK, LangGraph, n8n, Vercel AI SDK). Almost no business can actually wire them into their revenue operations. We are the integration and engineering layer that does that.

- **Tagline:** "Bots that get you customers."
- **Service surface:** GTM, CRO, PPC, SEO, CRM, lifecycle/email, RevOps — each delivered as autonomous agent systems, not retainer labor.
- **Buyer:** VP Marketing / VP Growth / CRO at mid-market and enterprise. Secondary: technical founders scaling GTM.
- **Competitive frame:** we look like Vercel or Linear, not like a marketing agency. Zero stock photos. Zero "unlock the power of AI." Engineering credibility is the conversion lever.
- **Primary conversion action:** booked technical scoping call. Secondary: agent audit / ROI calculator completion (email gate). Tertiary: newsletter.

### Rules of engagement (enforce these on every phase)

1. **Plan before code, always.** Every phase starts in plan mode. Produce the plan, wait for my approval, then implement.
2. **Audit before you propose.** Never recommend a change to a file you have not read. Start each phase by inventorying what actually exists in this repo.
3. **Ask, don't assume.** If the framework, CMS, hosting, design token location, or existing route structure is ambiguous — stop and ask. One round of questions up front beats a rewrite.
4. **Push back on me.** If something in this spec is a bad idea, will hurt rankings, will hurt Core Web Vitals, or is a known Google penalty pattern, say so and propose the alternative. I want the correction, not compliance. Specific things I expect you to challenge: page-count ambitions, interstitial aggression, and animation budget.
5. **Small, reviewable commits.** One concern per commit. Never a 40-file commit.
6. **No new dependencies without justification.** Name the package, the bundle cost in KB gzipped, and what it replaces or why nothing in the existing stack does the job.
7. **Ship measurable.** Every conversion element you build must emit a named analytics event from day one. An unmeasured CTA is a decoration.

### Phase 0 — Repo reconnaissance (do this first, output only)

Before any recommendation, produce a written inventory:

- Framework, version, router (App vs Pages), rendering strategy per route, package manager, Node version.
- Where design tokens live today (Tailwind config, CSS custom properties, theme file) and **every** location the current green accent appears — including hardcoded hex values, SVG `fill`/`stroke` attributes, favicon and OG image source files, email templates, and any `theme-color` meta tag.
- Existing route map, existing components, existing content/data sources, existing CMS or MDX setup.
- Current Lighthouse scores and Core Web Vitals (LCP, INP, CLS) for: homepage, one service page, one blog post. Mobile, throttled. These are the baseline every later phase is measured against.
- Existing SEO state: sitemap present?, robots.txt, canonical tags, structured data, `metadataBase`, OG tags, H1 uniqueness per page.
- What's broken, dead, or unused.

Output as a markdown report. **No code changes in Phase 0.**

---

## PHASE 1 — Brand accent migration

Replace the current green accent with `#7fa200` across the entire system.

**Do not find-and-replace.** Build a token layer first, then point everything at the tokens, so the next accent change is a one-line diff.

### Required token scale

Generate a full ramp from `#7fa200` (this is the 500-weight anchor) — 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 — with perceptually even steps (use OKLCH interpolation, not naive HSL lightness steps, which will muddy this hue into olive).

### Accessibility constraint — this is not optional

`#7fa200` on white measures **2.97:1**. That **fails WCAG AA** for body text, links, and small UI labels (requires 4.5:1) and fails AA for large text (requires 3:1) by a hair.

Handle it this way:

- **Text on light backgrounds:** use a darkened variant. `#5f7a00` measures ~4.9:1 on white and passes AA. Ship this as `--accent-text` and use it for every inline link and label.
- **Fills, buttons, badges, chart series, borders, glows:** `#7fa200` is fine and should stay — it's a strong fill color.
- **Text on top of `#7fa200`:** use near-black (`#0a0a0a`), not white. Black on this green is ~7:1; white on it is ~2.8:1 and fails.
- **Dark mode:** `#7fa200` will vibrate against pure black. Use a 300/400 step (lighter, slightly desaturated) as the dark-mode accent and a warm near-black (`#0b0d0a`) rather than `#000` as the surface.

Run an automated contrast check across every token pairing and output a pass/fail table. Any fail is a bug, not a design choice.

### Also update

`theme-color` meta, `manifest.json`, favicon set (see Phase 7), OG/Twitter image templates, email templates, loading/skeleton states, focus rings (`:focus-visible` must be visible against both surfaces), selection highlight, chart palettes.

---

## PHASE 2 — UX/UI audit

Deliverable: a written audit at `/docs/UX-AUDIT.md`, scored, prioritized, with an effort/impact matrix. Not a redesign — an evidence-based critique.

Audit against these dimensions, page by page:

**Conversion mechanics**
- First-screen clarity: can a VP Growth tell what we do, for whom, and what to do next, in under 5 seconds without scrolling?
- CTA density, CTA hierarchy (one primary per screen), CTA copy specificity ("Book a scoping call" beats "Get started").
- Friction inventory: every form field, every click between intent and booked call. Count them.
- Trust surface: logos, named results, architecture diagrams, security posture, team faces, SOC2/DPA language for enterprise buyers.
- Objection coverage: what does the buyer worry about (cost, lock-in, data access, "will this break?", "who maintains it?") and where on the page is each answered?

**Information architecture**
- Nav depth, orphan pages, dead ends, the click-path from any city page to a conversion.
- Mobile nav usability, thumb-zone placement of primary CTA.

**Visual system**
- Type scale consistency, spacing rhythm (is there an actual 4/8px system or ad-hoc values?), component variant sprawl, alignment discipline, dark mode parity.

**Performance & accessibility**
- CWV per template, layout shift sources, font loading strategy, image formats and sizing, JS bundle by route.
- Keyboard traversal, focus order, screen-reader landmarks, alt text, motion-reduction respect (`prefers-reduced-motion`), color-independent state signaling.

Score each page 1–5 on each dimension. Rank fixes by (impact × confidence) / effort. Top 10 get implementation specs.

---

## PHASE 3 — Conversion-driven enterprise layout system

Rebuild the section library. The goal is a set of composable, reorderable sections — not bespoke one-off pages.

### Homepage section sequence (propose alternatives if you disagree)

1. **Hero** — one-line value prop, one-line proof, primary CTA + secondary ("See a bot run"). Right side: a *live* or convincingly simulated agent working, not a screenshot. This is the single highest-leverage asset on the site.
2. **Logo / proof bar** — with a real metric, not just logos.
3. **The problem, stated as an engineering problem** — the tools exist, the wiring doesn't. Diagram: 14 disconnected tools vs. one orchestrated system.
4. **What we build** — 4–6 agent system cards (SDR agent, PPC agent, SEO agent, CRM hygiene agent, lifecycle agent, RevOps agent). Each opens a detail drawer with an architecture diagram, not a marketing paragraph.
5. **Live demo section** — interactive. See Phase 5.
6. **How it works** — 4-step implementation timeline with actual week numbers. Enterprise buyers buy the process.
7. **Results / data section** — real charts. See Phase 5.
8. **Integration surface** — the stack we wire into, as a logo grid with hover detail.
9. **ROI calculator** — email-gated result. High-intent lead capture.
10. **Objection / FAQ** — accordion, `FAQPage` schema.
11. **Security & governance** — enterprise trust block: data handling, human-in-the-loop, rollback, audit logs.
12. **Final CTA** — calendar embed inline, not a link to a link.

### Section component contract

Every section component must accept: `variant` (light/dark/accent), `eyebrow`, `heading`, `sub`, `media` slot, `cta` slot, `id` (for anchor links and analytics). Sections must be reorderable without style breakage. Build a `/design` route rendering every section and every variant for visual regression.

### Enterprise layout patterns to use

- Asymmetric split heroes (60/40), not centered-everything.
- Sticky secondary nav on long pages with scroll-spy.
- Progressive disclosure over walls of text — drawers, tabs, expandable architecture diagrams.
- Anchor-linked deep sections so sales can send `agenticbots.dev/ppc#architecture`.
- Inline calendar booking. Never route a hot lead to a second page to book.

---

## PHASE 4 — Blog reading experience

Target: the calm, high-legibility reading experience of Ahrefs' blog and the reference layout at `https://nicholaus.ai/blog/why-i-trade-from-my-cave`. Fetch and analyze that reference page for measure, rhythm, and hierarchy before building.

### Hard specs

- **Measure:** 65–72 characters. Enforce with `max-width: 68ch`, centered.
- **Body type:** 19–21px, `line-height: 1.7`. Serif or a high-x-height humanist sans. Never system-ui default at 16/1.5.
- **Vertical rhythm:** paragraph spacing = 1 line-height. Heading top margin ≥ 2× bottom margin so headings bind to the text they introduce.
- **Contrast:** body at `#1a1a1a` on `#fdfdfc` (warm off-white). Pure black on pure white is fatiguing at length.
- **Headings:** clear scale ratio (1.25 or 1.333). H2 gets an accent rule or accent-colored eyebrow — this is the accent's best use on the blog.
- **Full-bleed escapes:** charts, diagrams, code, and callouts break the 68ch column to a wider container. This rhythm — narrow text, wide visual, narrow text — *is* the Ahrefs feel.
- **Sticky TOC** left rail on desktop with scroll-spy; collapsible accordion on mobile.
- **Reading progress bar** in accent, 2px, top.
- **Code blocks:** Shiki, dark theme, copy button, filename header, line highlighting.
- **Callouts:** 4 variants (note / warning / insight / result), accent-bordered, not boxed-and-shadowed.
- **Zero sidebars, zero related-post rails, zero popups during scroll.** The reading experience is the brand.
- **End-of-post CTA** only, plus author card, plus 3 related posts below the fold.
- **Dark mode** is a first-class blog requirement, not a toggle afterthought.

Build MDX components: `<Chart>`, `<Diagram>`, `<Callout>`, `<Terminal>`, `<Comparison>`, `<Stat>`, `<AgentTrace>`, `<Aside>`.

---

## PHASE 5 — The visual system that breaks the mold

This is the differentiation budget. Spend it here.

### Data visualization

Build a chart component library (Recharts or visx — evaluate both, pick one, justify) themed to the accent ramp. Charts must be SSR-safe, responsive, keyboard-accessible, and have a text-alternative table for screen readers.

Chart types to build and actually use with real data:
- Before/after agent deployment on a real client metric (animated on scroll-into-view, respecting `prefers-reduced-motion`).
- Cost-per-lead decay curve over the implementation timeline.
- Human-hours vs. agent-hours stacked area.
- Agent decision-tree / trace visualization — this is the signature visual for an agent engineering company.
- Benchmark comparison bars: our agent vs. baseline vs. human team.

### Agent-in-action demos (the hero asset)

Do not screenshot. Build:
- **Live agent trace terminal** — a stepped, timed replay of an agent doing real work: reading a CRM record, scoring a lead, drafting outreach, checking a calendar, booking. Tool calls visible. Reasoning visible. Pausable, scrubable. This is the single most persuasive thing on the site.
- **Interactive sandbox** — visitor types their own company URL, an agent (via the Anthropic API) actually researches it and returns a real mini-audit. Rate-limited, cached, email-gated at the result. This converts and doubles as the ROI calculator.
- **Before/after workflow diagram** — animated: tangled integration spaghetti collapsing into one orchestrated graph.

### Comedy (use precisely — it's a credibility multiplier or a killer, nothing in between)

- Dry, engineer-humor register. Linear's changelog voice, not marketing-agency-wacky.
- Placement: 404 page, empty states, loading messages, footer easter egg, the "what we don't do" section, alt text.
- Concept: "Things your bot will never do" — never asks for a raise, never quits Friday, never posts your product to the wrong Slack channel.
- One `konami`-style easter egg that spawns a rogue agent doing something absurd. Discovered, not advertised.
- **Never** in: pricing, security, case studies, or the booking flow.

### Futurist / AGI aesthetic direction

Push away from the current default of everything-in-AI looking like purple gradient orbs. Direction to explore:
- **Technical sublime:** oscilloscope traces, particle mesh networks, subtle CRT scanlines, terminal aesthetics rendered beautifully. Nature documentary meets systems engineering.
- **Living diagrams:** architecture diagrams where data visibly flows along the edges. Nothing is static.
- **Generative accent motifs:** a canvas/WebGL field in the accent green that reacts subtly to cursor — bounded to <30KB and disabled on mobile and under reduced-motion.
- **Type as structure:** oversized numerals, monospace metadata, hairline rules. Swiss grid discipline, sci-fi restraint.

Propose 3 distinct directions with a moodboard and a single hero mockup each before committing.

**Animation budget:** total JS for motion ≤ 40KB gzipped. Every animation must be interruptible and respect `prefers-reduced-motion`. No animation may cause layout shift.

---

## PHASE 6 — Programmatic SEO

Target pattern: `Agentic PPC Company In {City}, {State}`, and equivalents for every service.

### First, the honest math and the honest risk

50 states × 20–50 cities × ~8 services = **8,000 to 20,000 pages**. Read this before planning:

> Mass-generated city pages that differ only by a swapped city name are the textbook definition of doorway pages under Google's spam policies. This does not get you ranked; it gets the whole domain suppressed. The entire viability of this phase rests on genuine per-page uniqueness. If you cannot make a page uniquely useful, do not generate it.

Plan accordingly and tell me if you think the count is too aggressive for our current domain authority. I expect a staged recommendation.

### The uniqueness engine (this is the actual work)

Every generated page needs **≥60% unique, non-templated content** driven by real data. Build the dataset first, pages second.

Per-city data to source and store:
- Population, metro population, business count by SIC/NAICS, median business revenue band.
- Dominant industries in that metro (healthcare, logistics, hospitality, construction — this changes the service pitch materially).
- Local Google Ads CPC benchmarks for that metro and vertical.
- Competitor density: how many agencies serve that city.
- Nearby cities within the metro (powers internal linking and reduces cannibalization).
- Timezone, and any market-specific regulatory note.

Per-service data:
- Baseline metrics, typical agent architecture, tool stack, implementation duration, sample trace.

**Composite content generated per page:** a market-sizing paragraph derived from real numbers, a CPC-benchmark chart specific to that metro, an industry-mix breakdown, a "what an agent does for a {dominant industry} business in {city}" scenario, a nearby-market comparison table. Programmatically assembled, but factually distinct per page.

### Architecture

- Next.js App Router, `generateStaticParams`, ISR with a sensible revalidate window. Consider PPR for the shell.
- Data as typed, versioned JSON/SQLite in-repo (fast builds, git-diffable) or Supabase if the dataset outgrows it. Justify the choice.
- Route hierarchy: `/{service}` → `/{service}/{state}` → `/{service}/{state}/{city}`. State pages are real hub pages with real content, not thin indexes.
- Zod schema validation on the dataset. A missing field must fail the build, not ship a page reading "Agentic PPC Company In undefined."
- **Quality gate:** a page only generates if it meets minimum data completeness and a uniqueness threshold vs. its siblings. Compute and log the shingle/n-gram similarity across the corpus and fail the build above a set threshold.

### Indexing strategy — staged, not shotgun

- **Tier 1:** top 50 metros only. Ship, get indexed, measure rankings and engagement for 4–6 weeks.
- **Tier 2:** expand to 300 if Tier 1 pages hold rankings and show non-zero engagement.
- **Tier 3:** full rollout only on proven signal.
- Segment sitemaps by tier so Search Console coverage and impressions are readable per tier.
- Prune ruthlessly: any page with zero impressions after 90 days gets `noindex`'d or merged.

### Internal linking

- Programmatic, but rule-based and reciprocal: city → 5 nearest cities, city → its state hub, city → its service hub, city → 3 topically-relevant blog posts.
- Blog → city pages via contextual entity linking (mention a metro, link the page).
- Descriptive anchor text, varied — never "click here," never identical across 2,000 pages.
- Enforce max click-depth of 3 from homepage to any city page. Audit and fail the build if violated.
- Build a link-graph visualization at `/docs/link-graph` so we can see orphans.

---

## PHASE 7 — Technical SEO checklist (100%, no exceptions)

**Crawl & index**
- `robots.txt` with sitemap reference; verify no accidental disallow of JS/CSS.
- Sitemap index + segmented child sitemaps (blog, services, states, cities-tier-1/2/3), <50k URLs each, `lastmod` accurate and *actually* reflecting content changes.
- Self-referencing canonicals on every page; cross-domain canonical rules documented.
- Correct `noindex, follow` on pagination tails, search results, thank-you pages, and utility routes.
- IndexNow integration for Bing/Yandex. **Note:** Google's Indexing API is officially limited to `JobPosting` and `BroadcastEvent` — do not use it for city pages, and tell me if you find guidance suggesting otherwise.
- Search Console API integration to pull coverage and query data into a `/docs/seo-dashboard`.

**On-page**
- Exactly one H1 per page. Logical H2/H3 nesting, never skipping levels, never used for styling.
- Title tags ≤60 chars, unique across the entire corpus — validate uniqueness in CI.
- Meta descriptions ≤155 chars, unique, written to earn the click.
- Descriptive alt text on every image, including programmatic pages.
- Breadcrumbs, visible and marked up: `Home > PPC > Florida > Miami`.

**Structured data (JSON-LD, typed via `schema-dts`)**
- `Organization` + `LocalBusiness` (or `ProfessionalService`) with `areaServed`.
- `Service` on every service page. `BreadcrumbList` everywhere. `FAQPage` on FAQ blocks. `Article` + `Author` on blog posts. `WebSite` + `SearchAction`.
- Validate every template against the Rich Results Test in CI.

**Performance budgets — enforce in CI, fail the build on breach**
- LCP < 2.0s mobile, INP < 200ms, CLS < 0.05.
- JS < 150KB gzipped on first load per route. Lighthouse ≥ 95 on all four categories.
- AVIF/WebP with explicit dimensions, `next/font` with `display: swap` and preload, no render-blocking third-party scripts.

**Favicons & assets**
- Full set from one source SVG: 16/32/48 ICO, 180 Apple touch, 192/512 PNG, maskable variant, `manifest.json`, `theme-color` for light and dark, OG image 1200×630 and Twitter card — with dynamic per-page OG generation via `next/og` for blog and city pages.

**International/hygiene**
- Trailing-slash consistency, forced lowercase URLs, HTTPS enforcement, www/non-www 301 to one canonical host, no redirect chains longer than 1 hop, custom 404 and 500 with navigation.

---

## PHASE 8 — Exit intent & welcome mats (with a hard warning)

I want full-screen welcome mats on exit intent and at 50% scroll. Build it — **but implement these constraints, and argue with me if you think the whole pattern is wrong for an enterprise buyer:**

> Google's intrusive interstitial policy explicitly penalizes full-screen overlays that obscure content on mobile immediately after arrival from search. On mobile, a full-screen mat on our programmatic city pages risks demoting the exact pages Phase 6 exists to rank. Additionally, `mouseleave` exit-intent detection does not exist on touch devices.

**Required implementation:**
- **Desktop:** full-screen mat allowed on exit intent (`mouseleave` toward the top edge, with velocity threshold to avoid false fires).
- **Mobile:** no full-screen overlay. Use a bottom sheet occupying ≤35% of viewport, triggered on scroll-velocity reversal or 60% depth. Dismissible with one thumb tap.
- **Never fire** on: first 30 seconds of a session, blog posts before 70% read depth, the booking page, or any page the user landed on from paid.
- **Frequency capping:** once per session, max once per 7 days per visitor, permanently suppressed after any dismissal or conversion. Store in `localStorage` with a versioned key.
- **Offer differentiation by intent:** blog reader → newsletter or the deep-dive guide. City page → free local agent audit. Pricing page → book a call with a named engineer. One generic offer everywhere converts at a fraction of a targeted one.
- **A11y:** proper focus trap, `Esc` to close, `aria-modal`, focus returns to trigger element, closable without a mouse.
- **Zero CLS.** Mount outside document flow. It must not affect the layout metric.
- **Instrument everything:** impression, dismissal, conversion, by trigger type and page type. Kill any variant converting under 1.5%.

---

## PHASE 9 — Measurement (build this before, not after)

- PostHog (or equivalent): autocapture off, explicit named events on, session replay on for converters, feature flags for A/B.
- Event taxonomy documented in `/docs/ANALYTICS.md` before implementation. Naming convention: `object_action` (`cta_clicked`, `calculator_completed`, `mat_dismissed`).
- Server-side conversion tracking for the booking flow.
- Funnel definitions: land → engage → tool-use → email capture → booking → showed.
- A/B testing harness at the section level so we can test hero variants without a deploy.
- Weekly automated report: CWV per template, top queries per tier, conversion by traffic source, page-level engagement.

---

## PHASE 10 — Deliverables & acceptance

At the end, I want in the repo:

1. `/docs/UX-AUDIT.md` — scored, prioritized.
2. `/docs/DESIGN-SYSTEM.md` — tokens, contrast pass table, component inventory.
3. `/docs/SEO-ARCHITECTURE.md` — data model, route map, uniqueness methodology, indexing tiers.
4. `/docs/ANALYTICS.md` — event taxonomy and funnel definitions.
5. `/design` route — every section, every variant, light and dark.
6. CI pipeline enforcing: Lighthouse budgets, title/meta uniqueness, schema validation, contrast checks, broken-link scan, click-depth audit.
7. A one-page executive summary of what changed and expected impact.

**Definition of done for any phase:** builds clean, passes CI budgets, no a11y regressions, every new interactive element emits analytics, and documentation is updated in the same commit as the code.

---

## APPENDIX — Recommended stack (evaluate, don't assume)

| Layer | Recommendation | Why |
|---|---|---|
| Framework | Next.js App Router + ISR/PPR | Static speed, dynamic freshness, best-in-class for pSEO |
| Hosting | Vercel | ISR, edge, `next/og`, analytics native |
| pSEO data | Typed JSON/SQLite in-repo → Supabase if it outgrows | Git-diffable, fast builds, no CMS latency |
| Validation | Zod + build-time gates | A bad row fails the build, not the SERP |
| Blog | MDX + Contentlayer or Velite | Custom components inline with prose |
| Schema | `schema-dts` | Type-safe JSON-LD |
| Charts | Recharts or visx | SSR-safe, themeable, accessible |
| Motion | Motion (Framer) — sparingly | Scroll reveals, layout transitions |
| Syntax | Shiki | Build-time, zero client JS |
| Search | Pagefind (static) or Typesense | Pagefind adds no server cost |
| Analytics | PostHog | Events + replay + flags + A/B in one |
| Booking | Cal.com embed | Inline, no redirect |
| Agent demos | Anthropic API, rate-limited + cached | Real agent output, not a mockup |
| Indexing | IndexNow + Search Console API | Bing/Yandex fast; GSC for measurement |
| Crawl QA | Screaming Frog + Lighthouse CI | Pre-deploy gate |
| Email | Resend + React Email | Same tokens as the site |

---

## APPENDIX — Things I want you to challenge me on

State your position on each of these in Phase 0's report:

1. Is 8,000–20,000 city pages realistic for a new domain, or should Tier 1 be 50 and stay there for two quarters?
2. Does the full-screen welcome mat pattern fit an enterprise buyer, or does it undercut the engineering-credibility positioning?
3. Is the live agent sandbox worth the API cost and abuse surface, or is a pre-recorded scrubable trace 90% as persuasive at 5% of the risk?
4. Comedy on a page selling six-figure implementations — where's the line?
5. Anything in this spec that will make the site slower without making it convert better.
