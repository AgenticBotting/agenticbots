# SEO Architecture (Phases 6–7)

> **Sept 4 2026 — the national plan is adopted.** `docs/PROGRAMMATIC-SEO-PLAN.md`,
> `docs/SERVICE-CONTENT-BLUEPRINT.md` and `src/data/cities-dataset.json` are now
> the governing documents for the programmatic build-out (924 cities · 51 states ·
> 8 services · 8,783 URLs, tiered release). `scripts/validate-cities.mjs` is the
> Phase-A gate — dataset currently validates clean (tiers exactly 481/248/195,
> all 4,496 surrounding refs resolve; DC legitimately has none).
>
> **✅ DECISION RESOLVED — Sept 9 2026.** The competing 8-service lists are gone.
> The one true list is **`src/lib/catalog.ts`: 13 services**, every slug
> `agentic-`prefixed, flat at `/services/{slug}`. The decoy `services[]` key has
> been deleted from `cities-dataset.json`; `SERVICE-CONTENT-BLUEPRINT.md` §1's
> owns/excludes contract was kept and is now **implemented**, not aspirational
> (see below). `pillar` survives as a grouping field for the Bots menu tabs but
> no longer appears in any URL.
>
> **Slugs:** agentic-ppc-management · agentic-seo · agentic-content-marketing ·
> agentic-email-marketing · agentic-cro · agentic-analytics ·
> agentic-lead-generation · agentic-outbound-sdr · agentic-speed-to-lead ·
> agentic-crm-automation · agentic-proposal-automation ·
> agentic-account-management · agentic-revops
>
> **Migration completed:** `/marketing/{category}` and `/sales/{category}` (13
> pages) and the whole `/local/**` tree (3,904 pages) now 308 into
> `/services/**` via `src/lib/redirects.mjs` — 22 rules, shared verbatim with
> the build gate. `CategoryPage.tsx` is retired; the `/local` template is the
> single service template. `/marketing` and `/sales` survive as pillar hubs
> because they aggregate rather than duplicate. `/markets/*` → `/locations/*`
> remains unstarted and is the only route rename still outstanding.
>
> **Cannibalization defense (blueprint §1, now real):**
> `owns[]`/`excludes[]` live on every service record. Disjointness is enforced
> at module load in `catalog.ts` — a service cannot ship claiming a term another
> service owns, and the build throws with the offending pair named.
> `scripts/topic-gate.mjs` enforces the rest against the rendered corpus: one
> indexable page per (topic, scope), an excludes budget of 2, a non-empty owns
> check on hubs, retired-URL and redirect-shadow assertions, and per-topic
> canonical scoping. It also reports entity coverage per hub — currently 8 of 13
> cover under half their target entity set, which is the standing content
> backlog, not a build failure.
>
> **Scale:** 13,689 prerendered pages; **521 indexable** (13 hubs + 195 state +
> 312 city + 1 informational blog). Everything else is `noindex, follow` behind
> `isEnriched()` and excluded from both sitemap segments. All four gates
> (`pseo-gate`, `link-integrity`, `seo-checks`, `topic-gate`) are wired to
> pre/postbuild — `npm run gates` runs them against an existing build.


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
