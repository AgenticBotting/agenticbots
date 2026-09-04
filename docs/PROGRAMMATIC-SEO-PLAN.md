# AgenticBots — Programmatic SEO Architecture Plan

**Companion files:** `cities-dataset.json` (machine-readable, drop into `/data/`), `cities-by-state.md` (human-readable full list).

---

## 0. The numbers

| Metric | Count |
|---|---|
| States + DC | 51 |
| Cities | 924 |
| Metro clusters | 334 |
| Services | 8 |
| City × service pages | 7,392 |
| City hub pages | 924 |
| State × service pages | 408 |
| State hub pages | 51 |
| Service hub pages | 8 |
| **Total URLs** | **8,783** |

Tier 1: 481 cities (3,848 city-service pages) · Tier 2: 248 · Tier 3: 195

### Why 924 cities and not 2,500

The brief said 20–50 cities per state. That math (1,000–2,500 cities) breaks in small states. Wyoming has six cities where a B2B agentic AI service has any real addressable market; forcing it to 20 means generating pages for towns of 4,000 people. Those pages have no search volume, no unique data to fill them, and they drag down sitewide quality signals that the Tier 1 pages depend on.

The list is scaled to actual business density: California gets 68 cities, Texas 55, Florida 66, Wyoming 6, Vermont 5. Total lands at 924 real markets rather than 2,500 padded ones.

**Expand later, not now.** If Tier 1 and Tier 2 hold rankings after two quarters, the dataset supports adding a Tier 4 of suburbs and exurbs. Adding them on day one risks the whole domain.

### The risk that governs everything below

> Mass-generated location pages that differ only by a swapped city name are the textbook definition of doorway pages under Google's spam policies. The penalty is not "those pages don't rank" — it is sitewide suppression, including the money pages. The scale strategy in the brief works *only* if each page carries genuinely distinct, useful data. Section 5 is not optional polish. It is the load-bearing wall.

---

## 1. URL architecture

Service-first, three levels deep. Service is the head term and the topical authority anchor; location is the modifier.

```
/                                        Home
/services/{service}                      Service hub          (8)
/services/{service}/{state}              State × service      (408)
/services/{service}/{state}/{city}       City × service       (7,392)
/locations/{state}                       State hub            (51)
/locations/{state}/{city}                City hub             (924)
```

Examples:
```
/services/agentic-ppc
/services/agentic-ppc/florida
/services/agentic-ppc/florida/miami
/locations/florida
/locations/florida/miami
```

### Rules

- Lowercase, hyphenated, no trailing slash, no query parameters anywhere in the indexable set.
- Never change a slug after publication. If you must, 301 with a single hop and update the sitemap `lastmod`.
- `St. Petersburg` → `st-petersburg`. `Lee's Summit` → `lees-summit`. Apostrophes and periods strip, they don't become hyphens. Slugs are pre-computed in the dataset — use them, don't re-derive them at runtime.
- Duplicate city names across states are handled by the state segment. `Springfield` appears in IL, MA, MO, OH, OR, and MI — six distinct URLs, six distinct pages, no canonical conflict.

### Why not `/agentic-ppc-company-miami-fl` (flat)

Flat URLs are exact-match-keyword bait and they destroy breadcrumb hierarchy, crawl-path logic, and the ability to consolidate authority at the state level. Hierarchical wins on crawl efficiency, which is the stated priority.

---

## 2. The four-level linking model

This is the brief's structure, made rigorous. Every link direction below is mandatory and must be enforced by a build-time audit.

### Level 1 — State hub (`/locations/florida`)

Real content page, not an index. Must carry: state-level market context, business-count and industry-mix data, a map, and the state's economic profile as it relates to agentic GTM.

**Links out to:**
- All 8 service × state pages (`/services/{service}/florida`) — full service menu, descriptive anchors
- Top 15 cities in the state (`/locations/florida/miami`) — by tier, then population
- All other cities in a collapsed "All Florida markets" block (crawlable `<a>` tags, not JS-injected)
- Home, and 2 adjacent-state hubs

**Links in from:** home (via a states index), every city hub in the state, every service × state page, footer state selector.

### Level 2 — State × service (`/services/agentic-ppc/florida`)

The authority consolidator. This page is what actually competes for "agentic PPC company Florida" and it passes equity down to cities.

**Links out to:**
- Its service hub (`/services/agentic-ppc`) — upward canonical authority
- Its state hub (`/locations/florida`)
- **All cities in that state for that service** (`/services/agentic-ppc/florida/miami`) — this is the primary discovery path for the 7,392 city-service pages
- The other 7 services for the same state (sibling service links)
- 2–3 case studies or blog posts relevant to the service

**Links in from:** service hub (links to all 51 states), state hub, every city × service page in that state.

### Level 3 — City × service (`/services/agentic-ppc/florida/miami`)

The money page. Target: "Agentic PPC Company in Miami, FL".

**Links out to:**
- Parent state × service page (`/services/agentic-ppc/florida`) — breadcrumb + in-body
- Its service hub
- Its city hub (`/locations/florida/miami`)
- The other 7 services in the same city — "Other agent systems we build in Miami"
- **Surrounding areas** (Level 4, below)
- 2–3 contextually relevant blog posts

**Links in from:** state × service page, city hub, surrounding-area sibling pages, blog entity links.

### Level 4 — Surrounding areas

Pre-computed in the dataset as the `surrounding` array on every city, using **metro cluster membership**, not raw distance.

Metro clustering beats a nearest-neighbor radius because it matches how buyers and Google both think about markets. Miami's surrounding set is Hialeah, Miami Gardens, Miami Beach, Homestead, Coral Gables, Doral — not "whatever is within 30 miles," which would pull in Fort Lauderdale and blur two distinct DMAs.

**Rules:**
- 4–6 surrounding links per page, capped. More than 6 dilutes equity and reads as a link farm.
- Reciprocal within the metro cluster — this creates a tight, densely-connected sub-graph per metro that concentrates topical authority.
- Cities in single-city metros (Tier 3) fall back to same-state siblings, already handled in the dataset generation.
- Anchor text: `Agentic PPC in Hialeah` — descriptive, varied, never "click here", never identical across every page. Rotate anchor patterns from a template pool of 5+ so 7,392 pages don't share one string.

### Enforced invariants

Build a link-graph audit that **fails the build** on any of these:

| Invariant | Threshold |
|---|---|
| Max click depth from home to any URL | 3 |
| Orphan pages (zero internal inbound links) | 0 |
| Outbound internal links per page | ≤ 100 |
| Reciprocal metro links resolve | 100% |
| Anchor text uniqueness across corpus | ≥ 5 variants per link type |
| Broken internal links | 0 |
| Redirect chains | 0 hops beyond 1 |

Output the graph to `/docs/link-graph.html` so orphans and dead clusters are visible, not theoretical.

---

## 3. Crawl budget — the priority requirement

At 8,783 URLs on a new domain, crawl budget is the binding constraint. Googlebot will not crawl this whole site quickly, and it will not crawl it at all if the first few thousand pages it samples look thin.

### What actually controls crawl rate

**Server response time is the single biggest lever.** Googlebot scales crawl rate directly against TTFB. Every page in this corpus must be statically generated or ISR-cached — never server-rendered on request. Target TTFB under 200ms from cache. If TTFB degrades, crawl rate drops and the tail never gets indexed.

### Do

- **Static generation with ISR.** `generateStaticParams` for Tier 1 at build time. Tier 2 and 3 generate on-demand with `dynamicParams` and cache indefinitely with on-demand revalidation. This keeps build times sane and gives Googlebot cache hits.
- **Accurate `lastmod`.** Derive from a content hash of the page's actual data, not from build time. A sitemap where all 8,783 URLs change `lastmod` on every deploy trains Google to ignore `lastmod` entirely — this is the single most common crawl-budget own-goal in programmatic SEO.
- **Flat click depth.** Three clicks maximum. Enforced above.
- **HTTP 304 support** via ETags on static assets.
- **Compress and minimize.** Every KB of HTML across 8,783 pages is crawl budget spent on markup instead of pages.
- **Prune on a schedule.** Any page with zero impressions after 120 days in Search Console gets `noindex` and drops out of the sitemap. Dead pages consume crawl budget permanently.

### Don't

- **No faceted navigation, no filter parameters, no sort parameters.** A single `?sort=` parameter on a 924-city index page creates a combinatorial crawl trap that will eat the entire budget.
- **No infinite scroll or JS-only pagination** on any index. Real `<a href>` links or nothing.
- **No calendar, no session IDs, no tracking params in internal links.** UTMs belong in outbound campaigns, never in internal hrefs.
- **No soft 404s.** A city page missing its data must return a real 404 or not exist. Returning a 200 with empty content is the fastest way to get the template devalued.
- **Don't submit Tier 3 before Tier 1 is indexed.** See the release schedule.

### robots.txt

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /*?
Disallow: /admin/
Disallow: /_next/data/

Sitemap: https://agenticbots.dev/sitemap.xml
```

The `Disallow: /*?` is the crawl-trap guard. Verify no legitimate indexable URL uses a query string before shipping this.

---

## 4. Sitemap architecture

A sitemap index pointing to segmented children. Segmentation is what makes Search Console's coverage report legible — with one monolithic sitemap you learn "6,200 indexed of 8,783" and nothing actionable. With segments you learn "Tier 1 is 94% indexed, Tier 3 is 11%," which is a decision.

```
/sitemap.xml                          (index)
├── /sitemaps/core.xml                Home, about, pricing, contact
├── /sitemaps/services.xml            8 service hubs
├── /sitemaps/states.xml              51 state hubs
├── /sitemaps/state-services.xml      408 state × service
├── /sitemaps/cities-tier1.xml        481 city hubs
├── /sitemaps/cities-tier2.xml        248
├── /sitemaps/cities-tier3.xml        195
├── /sitemaps/city-services-t1-*.xml  3,848 (split at 5k URLs each)
├── /sitemaps/city-services-t2-*.xml  1,984
├── /sitemaps/city-services-t3-*.xml  1,560
└── /sitemaps/blog.xml
```

### Rules

- Max 5,000 URLs per child sitemap. The spec allows 50,000; 5,000 gives finer-grained diagnostics and faster processing.
- `lastmod` only. **Drop `priority` and `changefreq` entirely** — Google has stated it ignores both, and populating them signals an SEO following a 2010 checklist.
- All URLs absolute, HTTPS, canonical form, matching internal links exactly.
- Only include URLs that return 200 and are self-canonical and indexable. A `noindex` URL in a sitemap is a contradiction Google will flag.
- Generate at build time from the same dataset that generates pages — never hand-maintained, never drifting.
- Register each child sitemap individually in Search Console for per-segment coverage data.

### IndexNow

Ping IndexNow on publish and on material content change. Covers Bing, Yandex, Naver, Seznam.

**Google does not support IndexNow.** Google's Indexing API is officially restricted to `JobPosting` and `BroadcastEvent` schema types — do not use it for city pages. If any tool or guide suggests otherwise, it is describing a ToS violation. Google discovery comes from sitemaps and internal links only.

---

## 5. The uniqueness engine

Without this, everything above is a doorway-page scheme with good architecture. Target: **≥60% non-templated content per page**, driven by real data.

### Per-city data to source

| Field | Source | Powers |
|---|---|---|
| Population, metro population | Census ACS API | Market-sizing paragraph |
| Business establishments by NAICS | Census County Business Patterns | Industry-mix chart |
| Dominant industries in metro | Derived from CBP | Service framing per city |
| Median business revenue band | Census CBP | Qualification copy |
| Google Ads CPC benchmark by vertical | Keyword Planner API / your own ad accounts | CPC chart — highest-value unique asset |
| Competitor agency density | SERP scrape or manual | Competitive angle |
| Metro GDP | BEA API | Market-sizing |
| Timezone, county | Census / static | Contact and scheduling copy |

**The dataset ships with the structural fields only** (city, state, metro, slug, tier, surrounding). Numeric fields are deliberately empty. Fill them from the APIs above at build time — do not let any model, including me, generate population or CPC figures from memory. Fabricated statistics on 7,392 pages is a legal and reputational exposure, not just an SEO one.

### Per-page composite content

Each city × service page assembles from real data:
1. Market-sizing paragraph derived from actual establishment counts
2. CPC benchmark chart for that metro and vertical
3. Industry-mix breakdown specific to that metro
4. A scenario: "what an agentic PPC system does for a {dominant industry} business in {city}"
5. Nearby-market comparison table (uses the `surrounding` array)
6. City-specific FAQ, 3 of 5 questions varying by market characteristics

### The gate

Compute pairwise n-gram (shingle) similarity across the corpus. **Fail the build** if any page exceeds a set similarity threshold against its siblings — start at 40% and tighten. A page that can't clear the gate doesn't generate. Log the distribution to `/docs/uniqueness-report.html`.

---

## 6. Release schedule

Do not ship 8,783 URLs on day one. A new domain dumping 8,783 pages into a sitemap is the strongest possible spam signal.

| Week | Release | URLs | Gate to proceed |
|---|---|---|---|
| 0 | Core + 8 service hubs + 51 state hubs | 60 | Indexed, ranking for brand |
| 2 | 408 state × service | 408 | ≥70% indexed at 3 weeks |
| 6 | Tier 1 city hubs + top 3 services | 1,924 | ≥60% indexed, non-zero impressions |
| 12 | Tier 1 remaining 5 services | 2,405 | Tier 1 holding rankings, no manual action |
| 20 | Tier 2 full | 2,232 | Tier 1 impressions growing |
| 32 | Tier 3 full | 1,755 | Tier 2 clearing 40% indexed |

Re-evaluate at every gate. **If a tier stalls below its threshold, stop and fix rather than expanding.** More pages never fixes an indexing problem; it deepens it.

---

## 7. Per-template requirements

### Every page
- One H1, unique across the corpus (CI-validated)
- Title ≤60 chars, unique (CI-validated)
- Meta description ≤155 chars, unique
- Self-referencing canonical
- Visible breadcrumbs + `BreadcrumbList` JSON-LD
- `Organization` + `LocalBusiness` with `areaServed`
- OG image generated per-page via `next/og`

### City × service specifically
- H1: `Agentic PPC Company in Miami, FL`
- H2s: What we build · Miami market data · How it works · Industries we serve in Miami · Surrounding areas · FAQ
- `Service` schema with `areaServed: {City}` and `provider`
- `FAQPage` schema on the FAQ block
- **No fake NAP.** Do not invent a Miami street address. Use `areaServed` for service-area targeting and a single real business address. Fabricated local addresses are a Google Business Profile suspension trigger and a trust liability.

### CI gates
Title uniqueness · H1 uniqueness · meta uniqueness · schema validation against Rich Results Test · link-graph invariants · uniqueness threshold · Lighthouse budgets (LCP <2.0s, INP <200ms, CLS <0.05) · zero broken internal links.

---

## 8. Instruction for Claude Code

> Read `PROGRAMMATIC-SEO-PLAN.md` and load `cities-dataset.json` into `/data/`. Enter plan mode. Do not write page templates yet.
>
> Phase A: validate the dataset — Zod schema, slug collision check across states, verify every `surrounding` reference resolves to a real city, report any anomalies.
>
> Phase B: propose the data-enrichment pipeline for the Census/BEA/Ads API fields in Section 5, including caching, rate limits, and a build-time failure mode when a field is missing. Do not generate any numeric value from your own knowledge.
>
> Phase C: propose the route structure and the sitemap generator. Show me the `lastmod` derivation before implementing it.
>
> Phase D: propose the link-graph audit script and its failure conditions.
>
> Then stop and wait. Report on: whether 924 cities is right, whether the release schedule is too slow or too fast for our domain authority, and anything in this plan that will burn crawl budget without earning rankings.
