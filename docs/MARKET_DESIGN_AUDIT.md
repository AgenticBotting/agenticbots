# Geographic market design — 2026-10-08

## Scope

981 market pages: one national directory, five regional hubs, 51 state/DC hubs and 924 city hubs. Service+state and service+city pages already use the previous approved service redesign; this change connects the market experience to those pages. Existing routes, datasets and publication/indexability rules are preserved.

## Findings and implementation

| Previous problem | Current experience |
|---|---|
| Abstract operating-language hero beside an older BOT factory graphic | Benefit-led local headline and a product-style planning preview with actual location labels |
| Thirteen equally weighted service cards | Three business priorities, with concise service explanations and the actual BOT configuration |
| Coverage lists required scanning every entry | Searchable directories, regional filters, direct city lookup and explicit no-result/reset states |
| City data was presented as a dense estimate-heavy stat strip | Existing local character and planning notes beside districts/service-area context; no population, business-count or CPC estimates |
| Multiple promo bands repeated the same request | Consistent local audit anchor, concrete deliverables, price and next-step explanation |
| City, state and national pages felt unrelated | Shared type scale, 3px action corners, restrained local SVGs, coordinated spacing and mobile layouts |

## Page flow

- National/region/state: introduction and illustrative planning preview → searchable geography directory → services by priority → familiar tools → delivery and investment → FAQ → audit → nearby regions/states.
- City: introduction and illustrative planning preview → local services by priority → existing local context → familiar tools → delivery and investment → FAQ → audit → nearby markets.
- The planning preview manually switches among demand, sales and customer-value examples. Each choice links to the corresponding service group. The panel stays stable when changing priorities; nothing is sent or updated.

## Technical and content boundaries

- Server-rendered sections share `MarketExperience`; only search and the example selector use client state. No new dependencies or remote media are required.
- `market-experience.ts` defines the three priorities and pure search/filter behavior. Search supports punctuation, normalized names and state abbreviations; exact/prefix names rank before metro-context matches.
- All state links render before interaction. State pages render every metro/city link before interaction. Search supplements this tree; it does not replace crawlable navigation or add parameterized pages.
- Enriched city notes, character and districts are reused unchanged. Structural cities remain honest coverage pages and retain `noindex, follow`. No new local statistics or promises were authored.
- All 13 services link to the current city. Existing state-level service-link behavior is preserved: enriched states link to state-service pages; other states link to national services.
- Commercial terms come from the shared marketing offer. Existing audit submission handling is reused, with geographic context included. Browser verification stops at required-field validation; no real request or payment was submitted.
- The planning preview is labeled illustrative and uses `data-demo="true"`. Tool marks are explicitly scoping references. New client-facing source files are included in the white-label scan.

## Verification

- Desktop Miami: local hero, all 13 service destinations and priority switching reviewed. Following national city search → Miami market → Miami PPC → local audit reached the correct URLs and audit context.
- Desktop Florida: all 66 city destinations render in the metro directory.
- Mobile 390px: metro search, empty state and reset work; reset restores all 66 destinations. Miami preview height remains identical across priority changes. Empty audit submission triggers required-field validation.
- Narrow mobile 320px: District of Columbia heading and directory fit without horizontal overflow.
- Tablet 768px: Northeast directory shows its 12 state/DC destinations in a readable grid. National region filtering shows the four Southwest states and restores all 51 destinations.
- Local notes, service links, route handling and indexability are regression-tested. The site-wide production build checks title/description uniqueness, canonical paths, one H1, topic boundaries, local-content uniqueness and internal links.

Final command results are in `docs/MARKETING_BUILD_STATUS.md`. Conversion improvements remain design hypotheses until measured. No deployment or push is part of this change.
