# SEO Architecture (Phases 6–7)

> **Sept 4 2026 — the national plan is adopted.** `docs/PROGRAMMATIC-SEO-PLAN.md`,
> `docs/SERVICE-CONTENT-BLUEPRINT.md` and `src/data/cities-dataset.json` are now
> the governing documents for the programmatic build-out (924 cities · 51 states ·
> 8 services · 8,783 URLs, tiered release). `scripts/validate-cities.mjs` is the
> Phase-A gate — dataset currently validates clean (tiers exactly 481/248/195,
> all 4,496 surrounding refs resolve; DC legitimately has none).
>
> **⚠️ OPEN DECISION — two different 8-service lists ship in these files:**
> `cities-dataset.json` defines *agentic-ppc, agentic-seo, ai-sdr-agents,
> agentic-crm, ai-lead-generation, agentic-cro, ai-marketing-automation,
> ai-revops* (H1s say "Company"), while `SERVICE-CONTENT-BLUEPRINT.md` §1
> restructures into *marketing-firm parent + ppc-management / seo / email +
> google-ads / linkedin-ads / facebook-ads / local-seo* (H1s say "Firm") with
> owns/excludes cannibalization gates. These produce different 7,392-page URL
> sets. **Do not mass-generate until one list is chosen.** The blueprint reads
> as the newer thinking; the dataset's `h1_pattern`s match the older list.
>
> **Migration map (current live → plan target):** `/local/{service}/{state}/{city}`
> → `/services/{service}/{state}/{city}` and `/markets/{state}[/{city}]` →
> `/locations/{state}[/{city}]`; nothing is deployed or indexed, so slugs can
> move freely until launch. Live pages already follow the blueprint's H1
> discipline (exact "… Company in {City}, {ST}" pattern in H1 + title, flavor
> line demoted to a kicker). Release schedule, crawl-budget rules, lastmod-from-
> content-hash, and the link-graph invariants come from the plan doc verbatim.


## Data model

- `src/lib/geo/schema.ts` — Zod contracts. A row that fails parsing **fails the build** (schemas parse at module load in `data.ts`).
- `src/lib/geo/data.ts` — Tier-0 dataset: **12 metros × 4 services** (ppc, seo, crm, speed-to-lead). Population/business counts are public-source estimates; CPC bands are estimated ranges; **every page renders an estimates disclosure**. The uniqueness lever is `localNote` — a hand-written, locally-true observation per metro (min 80 chars, enforced).

## Route map — dual hierarchy (Lot Sealers pattern)

Two hierarchies that cross-link, mirroring the proven Lot Sealers structure
(`/services/{service}/{city}` × `/service-areas/{county}/{city}`):

```
SERVICE-FIRST (money pages)
/local/{service}                     4 hub pages
/local/{service}/{state}             24 state hubs
/local/{service}/{state}/{city}      48 city pages

LOCATION-FIRST (market hubs)
/markets                             index (states + cities + service links)
/markets/{state}                     6 state market hubs (character lines)
/markets/{state}/{city}              12 city market hubs (all services × city)

/site-map                            HTML sitemap (crawlable + human-usable)
```

**Internal-linking mesh** (the LS levers, all ported):
- City service page → "Other bots in {city}" cross-service block (LS's highest-leverage block) → the other 3 service×city pages
- City service page → the city market hub, nearby markets (same state first, then fill — `nearbyCities()`), state hub, service hub, breadcrumbs
- City market hub → all 4 service×city pages, nearby market hubs, state hub
- Footer → /markets + 4 service hubs; legal row → /site-map
- Click depth ≤3 to any page

**Per-page uniqueness levers:** hand-written `localNote` + `character` + named `districts` (real places: Brickell, Buckhead, The Domain…) woven into copy, plus **deterministic rotation** (`src/lib/geo/seo-rotation.ts`, djb2 hash — LS's `seo-content.ts` pattern): stable per-city value-prop and CTA lines so no two pages share framing. Per-city FAQs also in `FAQPage` JSON-LD.

## Quality gates (fail the build, not the SERP)

1. **Zod completeness** — import-time parse.
2. **`scripts/pseo-gate.mjs`** (prebuild) — 4-gram shingle Jaccard across all localNotes; any pair ≥35% similar fails. Current worst pair: 0%.
3. **`scripts/seo-checks.mjs`** (CI, post-build) — title ≤70 + unique, description ≤170 + unique, exactly one H1, across all 107 prerendered pages.

## Indexing strategy — staged

- **Tier 0 (now):** 76 local URLs in their own sitemap segment. Hold until the domain has 60–90 days of history and Tier-0 pages show impressions.
- **Tier 1 (top 50 metros)** only on Tier-0 signal; **Tier 2/3** per the build spec. The 8k–20k ambition was rejected in `PHASE-0-REPORT.md` — fresh domain + swapped-city pages is the scaled-content-abuse profile.
- Prune rule: zero impressions after 90 days → `noindex` or merge.

## Sitemaps & crawl

- Segmented via `generateSitemaps`: `/sitemap/0.xml` core (28 URLs incl. /site-map), `/sitemap/1.xml` local (95 URLs: service hierarchy + markets hierarchy); both referenced in robots.txt so Search Console coverage reads per segment. (Next 16 note: the segment `id` arrives as a **Promise resolving to a string** — resolve before comparing.)
- robots.txt disallows `/api/`, `/plan/thanks`; `/design` is meta-noindexed.

## Structured data

Hand-typed JSON-LD in `src/components/JsonLd.tsx`: `Organization` + `WebSite` (layout) · `Service` + `BreadcrumbList` + `FAQPage` (13 category pages, 48 city pages with `areaServed`) · `Article` (posts). Validate templates in the Rich Results Test before launch.

## Launch checklist (blocked on domain/deploy)

- [ ] Register/point agenticbots.dev; set `NEXT_PUBLIC_SITE_URL`
- [ ] www vs apex 301 to one canonical host (platform-level)
- [ ] Search Console: verify, submit both sitemap segments
- [ ] IndexNow key file + ping on publish (Bing/Yandex). Google's Indexing API is JobPosting/BroadcastEvent-only — **do not** use it for city pages
- [ ] Rich Results Test on: category, city, post templates
- [ ] Verify Tier-0 dataset figures before any indexing push
- [ ] Lighthouse CI budgets against the deployed preview (see ci.yml)
