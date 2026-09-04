# UX/UI Audit — Phase 2

Method: every template reviewed at 1440px and via rendered-HTML inspection against the four spec dimensions. Scores 1–5 (5 = ship-it). Evidence-based critique, not a redesign. Baseline metrics: `docs/PHASE-0-REPORT.md`.

## Scorecard

| Page | Conversion | IA | Visual | Perf/A11y | Notes |
|---|---|---|---|---|---|
| `/` (home) | 3 | 4 | 4 | 4 | Strong hero clarity; zero trust surface; no proof bar; FAQ good; final CTA is a form, not a calendar |
| `/marketing`, `/sales` (pillars) | 3 | 4 | 3 | 4 | Thin relative to category pages; header-plus-grid structure; weak differentiation between the two |
| `/{pillar}/{category}` ×13 | 4 | 5 | 4 | 4 | Best template on the site: contrast rows, numbered scope, integrations. Missing: FAQ schema, sticky sub-nav for sales links |
| `/blog` | 3 | 4 | 4 | 5 | Clean; no categories/filtering (fine at 3 posts); lead-article pattern good |
| `/blog/[slug]` | 3 | 3 | 3 | 5 | 16px/1.6 body on pure white — below the Phase 4 reading spec; no TOC, no progress, mid-article optin is good |
| `/pricing` | 3 | 4 | 4 | 4 | Placeholder prices presented as real; no objection handling near tiers; FAQ helps |
| `/how-it-works` | 4 | 4 | 4 | 4 | Phase detail is genuinely good; bullets column scans well |
| `/plan` | 4 | 5 | 4 | 4 | Focused, low-friction (3 required fields); no trust signals beside the form |
| `/about`, `/contact` | 2 | 4 | 3 | 4 | No team, no faces, no story — "About" answers nothing an enterprise buyer asks |
| 404 | 3 | 5 | 3 | 5 | Full catalog listed (good recovery); zero personality (Phase 5 comedy slot) |

## Conversion mechanics — findings

- **First-screen clarity: PASS.** What/for-whom/next-step readable in <5s ("Bots that get you customers" + fleet telemetry + one green CTA).
- **CTA hierarchy: PASS with one violation** — hero has CTA + "See how it works" + proof line + stat row; acceptable. Header + hero CTAs are identical (good repetition, single primary per screen holds).
- **Friction inventory:** modal flow = 3 card-clicks + 2 required fields → submit. **5 interactions to conversion — good.** `/plan` page = 4 required fields. ExitIntent = 2 fields. No step counts shown in the modal until inside it (minor).
- **Trust surface: 0/5. The site has no logos, no named results, no team, no security posture, no SOC2/DPA language anywhere.** For the stated buyer (VP Growth, enterprise) this is the single biggest conversion gap. Every claim ("41s median") is unattributed.
- **Objection coverage:** cost → pricing FAQ ✓ · lock-in → "everything stays yours" ✓ (buried in About) · data access/security → **nowhere** · "will it break?" → monitored-mode copy ✓ · "who maintains it?" → tuning copy ✓.
- **Measurement: nothing is instrumented.** Every CTA is currently a decoration by the spec's own definition.

## IA — findings

- Max click-depth to any page: 2 from home. ✓
- Orphans: none (footer carries full catalog). ✓
- Dead ends: legal pages have no forward path other than footer. Minor.
- Mobile nav: full-screen drawer, accordion pillars, CTA at bottom — **CTA below the fold of the drawer on small phones; thumb-zone fail.**
- No breadcrumbs on blog posts (has back-link only).

## Visual system — findings

- Spacing: consistent `section-pad` rhythm, real 4px-multiple scale. ✓
- Type scale: coherent post-Phase-1; two legacy escapes remain (`!text-[2rem]` pricing figure, StatBand numerals — intentional, documented).
- Variant sprawl: 4 button variants, all used. Card variants: `card` vs `card-dark` vs ad-hoc `bg-white p-6` grid cells — **grid cells should be a variant.**
- Dark parity: no dark mode exists (deliberate; single-look site). Spec Phase 4 wants blog dark mode — flagged as the one real gap.

## Perf/A11y — findings (from Phase 0 + inspection)

- LCP 2.7–3.2s vs 2.0 budget: font-render-delay on the hero H1. Fix: preload is present; subset + `adjustFontFallback` verification needed.
- JS 206KB vs 150 budget: framer-motion is ~45KB of it for what is mostly opacity/translate. Replaceable with CSS + IntersectionObserver.
- A11y: Lighthouse 100 on all templates; focus-visible present; `prefers-reduced-motion` respected globally. Gaps: modal flows lack focus **traps** (focus can tab behind the overlay); ExitIntent lacks `aria-modal`; BotScrollList active-row state is color-only (opacity) — needs `aria-current`.

## Top 10 fixes — ranked by (impact × confidence) / effort

| # | Fix | Impact | Conf | Effort | Where handled |
|---|---|---|---|---|---|
| 1 | Instrument every CTA/form/modal with named events | 5 | 5 | 2 | Phase 9 |
| 2 | Security & governance section (data handling, human-in-the-loop, rollback, audit logs) on home + linked from category pages | 5 | 4 | 2 | Phase 3 |
| 3 | Proof bar with a real metric under the hero | 5 | 4 | 1 | Phase 3 (needs real client data from you — ships with placeholders clearly marked) |
| 4 | Agent trace demo replacing static telemetry card claim ("see a bot run") | 5 | 4 | 4 | Phase 5 |
| 5 | Blog reading spec (measure, 19px/1.7, TOC, progress) | 4 | 5 | 3 | Phase 4 |
| 6 | Drop framer-motion → CSS reveals; meet 150KB JS budget | 4 | 5 | 2 | Phase 7 budgets |
| 7 | Structured data everywhere (Org, Service, FAQ, Article, Breadcrumb) | 4 | 5 | 2 | Phase 7 |
| 8 | Focus traps + `aria-modal` + `aria-current` in modals/scroll list | 4 | 5 | 1 | Phase 8 |
| 9 | Mobile drawer CTA into thumb zone (sticky bottom of drawer) | 3 | 4 | 1 | Phase 3 |
| 10 | Problem-as-engineering-diagram section (tools exist / wiring doesn't) | 4 | 3 | 3 | Phase 3 |

Deferred with reasons: dark mode (single-look brand decision — revisit if blog analytics show demand); pricing-page real numbers (needs your figures); team/faces on About (needs your assets).
