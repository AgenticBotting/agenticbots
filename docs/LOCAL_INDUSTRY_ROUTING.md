# Location-preserving industry journeys — 2026-10-08

Implemented locally on `platform-v1`. No deployment, push, index publication or provider call.

## Visitor path

A trade or niche selected inside a state/city keeps that geography throughout the journey. Buckeye examples:

- Market: `/markets/arizona/buckeye`
- HVAC marketing: `/markets/arizona/buckeye/industries/hvac`
- HVAC SEO: `/markets/arizona/buckeye/industries/hvac/agentic-seo`
- Commercial HVAC: `/markets/arizona/buckeye/industries/niches/commercial-hvac`
- Commercial HVAC SEO: `/markets/arizona/buckeye/industries/niches/commercial-hvac/agentic-seo`
- Local industry directory: `/markets/arizona/buckeye/industries`

State equivalents omit the city segment. Service-first pages retain the service when linking to a trade. Header and footer service navigation preserve location and the selected trade/niche, as does the Industries link. Company, pricing, contact and legal navigation retain their normal destinations. Breadcrumbs intentionally lead to parents. Nearby-market links retain the trade/niche and selected service while changing geography.

State service links now work for all 51 dataset states/district destinations, including states without enriched cities. Existing generic city-service URLs remain the sole generic service destinations; no duplicate generic service tree was added under `/markets`.

## Implementation

- `local-market-paths.ts`: canonical path builders and the shared navigation context.
- `local-market.ts`: server-only resolver; exact state/city pairing, six trade records, 341 public niche records, and 13 service records. Unknown values, unsupported aliases and extra path segments return 404.
- Two optional catch-all page families under state/city `industries` render a directory, trade, niche or selected-service detail. Ten representative pages are prerendered; other valid destinations are generated/cached on first visit. This avoids generating millions of static documents per build.
- `LocalIndustryExperience.tsx`: server-rendered shared design, local planning, actual trade guidance, buyer mapping, scoped service information, related specialties, territory navigation and proposal conversion. Client interaction stays in existing leaf components.
- Existing public niche catalog only; no live/private prospects, invented local buyer counts, fabricated results, local-office claims or vendor/runtime details.
- `public-market-routes.json`: compact public route allowlist for attribution. Tests compare every state/city/service/trade entry with the source catalogs. If those catalogs change, regenerate this file from their slugs and rerun the tests. Buyer data is not included in the browser route allowlist.
- Proposal attribution accepts validated local industry paths and preserves state/city/trade/niche/service dimensions without accepting arbitrary path text or query strings.
- The link-integrity gate validates actual catch-all values rather than accepting every URL matching a route shape.

## Search publication and overlap

The existing 584-route publication registry is unchanged. **Every new intersection is `noindex, follow`, has a self canonical and is excluded from sitemaps pending editorial review.** Local availability does not imply search index eligibility. No claim of ranking or CTR improvement is made.

Intent ownership before publication:

| Route | Intended job |
| --- | --- |
| City/state market | Broad contractor marketing and local discovery |
| City/state service | A specific marketing service across trades |
| Local trade | Broad trade marketing and specialty selection |
| Local trade + service | That trade's specific marketing workflow |
| Local niche (+ service) | The narrower service offering, buyer roles and selected channel |

Review the city/service, broad trade and narrow niche together. If the niche is effectively the same audience and intent as its parent trade, choose one owner and consolidate rather than approving both. Review usefulness of local details, sourcing, buyer specificity, title/description length and uniqueness, and service relevance before adding an explicit publication record. Prerender approved pages so existing sitemap/rendered SEO gates can verify them. Long taxonomy titles must receive an editorial title before index approval; do not silently remove the niche and create generic duplicate service titles.

This is a conservative rollout choice informed by Google's [doorway and scaled-content guidance](https://developers.google.com/search/docs/essentials/spam-policies) and [canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls). Self canonicals are identity signals, not a guarantee against cannibalization. Local navigation alone is not sufficient original content for every intersection.

## Verification

`tests/unit/local-industry-routing.test.ts` checks the Buckeye click path; selected-service continuity; all-state navigation; all 341 niche × 13 service combinations in the sample city; all 924 city × six trade mappings; source/attribution allowlist consistency; unique representative titles/self canonicals/noindex; invalid taxonomy/geography 404s; and service-specific previews.

Browser checks cover Buckeye → HVAC → SEO → Commercial HVAC SEO, contextual desktop mega-menu destinations, 390px layout without horizontal overflow, and proposal opening from a local niche page. No lead was submitted. Final build/test results live in `docs/MARKETING_BUILD_STATUS.md`.
