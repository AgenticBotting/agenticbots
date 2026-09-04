# SEO Architecture (Phases 6–7)

## Data model

- `src/lib/geo/schema.ts` — Zod contracts. A row that fails parsing **fails the build** (schemas parse at module load in `data.ts`).
- `src/lib/geo/data.ts` — Tier-0 dataset: **12 metros × 4 services** (ppc, seo, crm, speed-to-lead). Population/business counts are public-source estimates; CPC bands are estimated ranges; **every page renders an estimates disclosure**. The uniqueness lever is `localNote` — a hand-written, locally-true observation per metro (min 80 chars, enforced).

## Route map

```
/local/{service}                     4 hub pages (real content)
/local/{service}/{state}             24 state hubs (aggregate figures + market grid)
/local/{service}/{state}/{city}      48 city pages
```
All `generateStaticParams` SSG. Click depth ≤3 via the footer "By market" column. Composite per-page content: market snapshot rows, dominant-industry scenario, the localNote, nearby-market links, per-city FAQs (also in `FAQPage` JSON-LD).

## Quality gates (fail the build, not the SERP)

1. **Zod completeness** — import-time parse.
2. **`scripts/pseo-gate.mjs`** (prebuild) — 4-gram shingle Jaccard across all localNotes; any pair ≥35% similar fails. Current worst pair: 0%.
3. **`scripts/seo-checks.mjs`** (CI, post-build) — title ≤70 + unique, description ≤170 + unique, exactly one H1, across all 107 prerendered pages.

## Indexing strategy — staged

- **Tier 0 (now):** 76 local URLs in their own sitemap segment. Hold until the domain has 60–90 days of history and Tier-0 pages show impressions.
- **Tier 1 (top 50 metros)** only on Tier-0 signal; **Tier 2/3** per the build spec. The 8k–20k ambition was rejected in `PHASE-0-REPORT.md` — fresh domain + swapped-city pages is the scaled-content-abuse profile.
- Prune rule: zero impressions after 90 days → `noindex` or merge.

## Sitemaps & crawl

- Segmented via `generateSitemaps`: `/sitemap/0.xml` core (27 URLs), `/sitemap/1.xml` local (76 URLs); both referenced in robots.txt so Search Console coverage reads per segment. (Next 16 note: the segment `id` arrives as a **Promise resolving to a string** — resolve before comparing.)
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
