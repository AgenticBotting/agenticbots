# Local search acquisition audit and implementation plan

Prepared October 8, 2026. Status: the initial acquisition rollout below is implemented locally on `platform-v1`, following owner approval. Not pushed or deployed. The original audit and longer-term roadmap remain below as historical context.

## Owner-approved headline refinement — October 8, 2026

The owner selected **“Agentic marketing for contractors in Miami”** as the lead headline pattern. This supersedes the conventional-first H1 recommendation in the original audit below. The implemented market, service and trade templates now lead with “Agentic” while preserving a recognizable service, audience and location in a natural sentence. Examples: “Agentic marketing for contractors in Arizona,” “Agentic PPC management for contractors in Miami, FL,” and “Agentic SEO for HVAC companies.” National and regional wording follows the same approach.

Search titles use sentence case, preserve SEO/PPC/CRM/B2B acronyms, and retain the complete service and location. A shared formatter omits the brand suffix when needed and, for the longest combinations, the audience phrase. All current combinations meet the 70-character editorial budget; that is not a guaranteed Google display width. H1s retain the full sentence. Supporting introductions, service navigation, backend capability mapping, canonical routes and publication eligibility remain intact. Existing publication dates already reflect this same October 8 revision day.

Distinctiveness is a positioning hypothesis, not evidence of higher CTR or stronger rankings. After deployment and recrawling, compare Search Console impressions, clicks and CTR by page/query group, accounting for changes in position, device and geography; evaluate qualified audit requests separately. Google may choose a different title link. [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link).

## Implemented rollout — October 8, 2026

- Familiar search-facing labels, titles, descriptions, H1s and introductory copy now cover all 13 national service families and their existing state/city variants. Market hubs lead with contractor marketing + location. Agentic implementation is explained adjacent to the offer; internal service/BOT identities and canonical URLs remain unchanged.
- `src/lib/search-positioning.ts` separates acquisition vocabulary from backend capability records. Scope, BOT configuration and approval controls continue to come from the existing catalog/positioning sources. B2B research is explicitly presented as commercial-contractor prospecting, not sold homeowner enquiries.
- `src/lib/local-search-briefs.ts` adds distinct planning guidance for Florida, Arizona, Texas, Georgia and North Carolina, plus Miami, Fort Lauderdale, Phoenix, Dallas, Atlanta and Charlotte. The city SEO/PPC sections have separate service-specific decisions and required business inputs. Miami-Dade procurement and Phoenix heat resources are cited only for the limited observations they support; the other recommendations are editorial planning guidance, not asserted market statistics.
- A curated public catalog in `src/lib/industries.ts` adds six trade hubs and twelve national SEO/PPC intersections, plus `/industries`: **19 new pages**. HVAC, plumbing, electrical, roofing, remodeling and general contractors have distinct project types, buying questions, qualification, follow-up and labeled fictional workflow examples. No private prospecting data is exposed.
- Contextual links connect markets to trade hubs, SEO/PPC pages to matching trade services, and trade services to their parent/complementary/national services. The footer and HTML sitemap expose the new directory. No new city × industry cartesian expansion or URL migration was introduced.
- `src/data/search-publication.json` freezes the **565 previously indexable acquisition routes** and explicitly adds these 19 industry routes: **584 eligible routes**. This is site eligibility, not Google indexing or ranking. City enrichment no longer changes robots or XML sitemap membership. Legacy eligibility is labeled `retained-indexability`, not falsely presented as a fresh editorial review.
- Sitemap segment 1 is generated from that registry, with explicit editorial revision dates. Core content uses a stable revision date; blog entries retain their article dates. No filesystem or deployment timestamps determine lastmod.
- `scripts/search-publication-gate.mjs` checks unique declared intent ownership, actual rendered pages, robots/registry agreement, sitemap membership/dates, and visible audit/crawl paths across the whole acquisition corpus. Existing note-similarity, metadata, link and topic checks remain. These are technical checks; they do not certify semantic uniqueness, search demand or ranking quality.
- Audit submissions now carry an allowlisted current-page and first public session landing-page context when allowlisted into the existing server request event. Only known public paths generate service/trade/geography dimensions. Query strings, referrers, identity and free-form fields are excluded from the event. Structural/noindex routes are intentionally not reported as approved acquisition dimensions. The small client helper stores only a path in session storage; publication data stays server-side. The server records `request_received`, not `converted` or a paid outcome, only after successful intake delivery.

### What still requires real acquisition evidence

Production Search Console/analytics verification, qualified-audit reporting, confirmed payment/implementation outcomes, conversion experiments, further local editorial research and selective additional service/trade/city releases remain the next operating phase. No real requests, purchases or provider calls were made to validate the rollout. We cannot claim rank gains or paid conversion lift from local implementation. Expansion is evidence-gated, not automatic.

### Maintaining publication readiness

For a new page, write and review the actual buying content first. Check its intent against existing pages, its service capability against the backend mapping, and any factual/local claims against sources. Then add that exact canonical path, intent and content revision date to the registry. Do not bulk-regenerate approvals from city enrichment. A retained legacy route still needs substantive review before broader expansion is justified. When approved content changes, update its record date deliberately; keep unrelated dates unchanged. `npm run build -- --webpack` runs the publication checks with the existing gates.

Validation results for this implementation are recorded in `docs/MARKETING_BUILD_STATUS.md`.

## Recommendation

Lead discovery with the service and business category people recognize: contractor marketing, SEO, Google Ads management and related services. Explain agentic implementation immediately afterward as the delivery advantage. A visitor should understand both the marketing service being purchased and the managed BOT system behind it before reaching the audit form.

Recommended positioning: **Digital marketing for established contractors, powered by managed AI BOTS.** Use “agency” where we actually provide the corresponding managed marketing service. Describe nationwide remote delivery accurately; “serving Phoenix” does not claim an office in Phoenix.

“Agentic marketing implementation for businesses in the trades in Arizona” is clearer about the offer than the current headline, but leads with terminology the intended buyer may not know. My recommended H1 is **“Digital marketing for contractors in Arizona.”** An adjacent line can read **“Agentic marketing implementation, managed for you.”** This is an editorial recommendation to test, not a measured search-volume conclusion.

Google can understand related searches without every exact phrase appearing. Adding “agentic” does not guarantee visibility for the underlying agency query. Treat “PPC agency,” “pay-per-click management” and “Google Ads management” as an intent cluster when they describe the same offer; validate the cluster against actual results and customer queries. [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

## Audit scope and evidence

Reviewed local source, the last production build, route generation, metadata, rendered headings, service capability mappings, niche seed taxonomy, sitemap generation, quality gates and conversion instrumentation. Sampled public search results for contractor marketing in Arizona, HVAC marketing agencies and Miami PPC agencies. This is not a production Search Console, backlink, search-volume or live-ranking audit. Indexable below means allowed by the site's current rules, not confirmed indexed by Google.

| Page family | Existing pages | Currently indexable | Current positioning |
|---|---:|---:|---|
| National market directory and regional hubs | 6 | 6 | Coverage and discovery |
| State/DC market hubs | 51 | 15 | “[State] markets”; “More capacity for your business…” |
| City market hubs | 924 | 24 | “[City] — market hub”; generic capacity promise |
| National service pages | 13 | 13 | Agentic service names and workflow benefits |
| Service × state/DC | 663 | 195 | Agentic service + state |
| Service × city | 12,012 | 312 | Agentic service + city |
| **Total across these families** | **13,669** | **565** | Existing national coverage framework |

The remaining 900 cities and 36 states/DC are structural coverage destinations with `noindex, follow`. Their local-service variants also remain noindex. The public site has no dedicated industry route family. The internal prospecting seed contains **341 niches across 20 categories**; that is a classification resource, not evidence of search demand or permission to publish client data.

### Findings, in priority order

| Priority | Finding and source | Implication / planned correction |
|---|---|---|
| P0 | Market titles/H1s do not identify an agency service. `src/app/markets/[state]/page.tsx`, city equivalent. | Rewrite titles, H1, introductory copy and descriptive anchors around marketing + place + intended buyer. Keep the approved visual design. |
| P0 | Service metadata/H1s inherit agentic-first names. `catalog.ts`, `ServiceExperience.tsx`, service routes. | Add a separate search-facing label/intent record. Preserve route slugs, BOT identities and backend mappings. |
| P0 | One city observation is reused across all 13 city-service pages. `geo/data.ts` and city-service route. | Add useful service-specific local decisions and documented evidence. A city-name substitution or generic tourism paragraph is insufficient differentiation. |
| P0 | Indexability is city-wide via `isEnriched()`. Enriching one city enables its hub and all service pages. | Move toward explicit publication readiness per page/intent. A complete PPC page must not automatically release incomplete CRM, SEO or outbound pages. |
| P0 | `pseo-gate.mjs` compares local-note strings, not full rendered page usefulness. | Preserve the duplicate-note check but add editorial readiness and rendered main-content checks. The existing gate cannot certify search quality. |
| P1 | No public trade-specific buying journeys. | Curate a public industry catalog, beginning with six trade families and selected service intersections. |
| P1 | “Lead generation” is operationally B2B prospect research. `service-positioning.ts`, capability audit. | Own B2B prospecting/commercial lead-generation intent. Route homeowner demand to PPC/SEO; avoid implying sold consumer leads or guaranteed appointments. |
| P1 | Service topic checks rely on fixed word ownership/exclusion counts. `topic-gate.mjs`. | Add explicit intent ownership across markets, services and industries. Allow natural contextual mentions of related services; word quotas do not establish intent separation. |
| P1 | Sitemap dates use filesystem mtimes from only `catalog.ts` and `geo/data.ts`. | Track actual published content revisions per page. Current copy now also lives in market/service components and experience records. Checkout mtimes are not reliable editorial dates. |
| P1 | `serviceLd()` gives every service the same generic `serviceType`. | Describe each actual service in structured data and keep the provider identity consistent. No fictitious location entities. |
| P1 | Audit start/submission events exist; analytics depends on configuration. | Extend non-sensitive service, industry, geography and landing-page attribution through to paid audits and implementations. Verify production capture before interpreting results. |
| P2 | Historical SEO documents include obsolete counts and rigid heuristics. | Supersede 8-service/12-metro claims, arbitrary link/word limits, automatic time-based pruning and the unstarted `/markets` rename. Preserve stable URLs. |

Public examples show the conventional vocabulary we must evaluate: [SABB's Phoenix contractor page](https://sabbmarketinggroup.com/phoenix-contractor-marketing) identifies the contractor audience and local services, while [Ductwork](https://ductworkmarketing.com/) leads with SEO and Google Ads for HVAC companies. These are observed presentation patterns, not verified performance claims or proof of keyword volume. Their guarantees, testimonials and claimed results are not evidence for AgenticBots.

## Search intent and page ownership

Keep existing `/markets` and `/services/agentic-*` paths. Keyword changes do not require a URL migration. One page should own each main buying intent; related wording belongs naturally on that page.

| Intent | Preferred owner | Editorial purpose |
|---|---|---|
| Marketing agency / digital marketing + state | `/markets/{state}` | Statewide contractor marketing offer, supported cities, service selection and operating approach |
| Marketing agency / contractor marketing + city | `/markets/{state}/{city}` | Complete local marketing offer with trade fit, local decisions, scope and audit |
| SEO / SEO company / local SEO + city | Existing SEO city-service page | Search visibility, technical/local work, deliverables and relevant local constraints |
| PPC / Google Ads management + city | Existing PPC city-service page | Campaign management, account analysis, conversion review, approvals and fees |
| HVAC / plumbing / roofing marketing, nationally | Proposed `/industries/{trade}` | Trade-specific growth needs, buying process, service mix and BOT workflow |
| HVAC SEO / roofing PPC, nationally | Proposed `/industries/{trade}/{service}` | A distinct service buying journey for that trade, where evidence supports it |
| HVAC marketing + Phoenix | Initially a useful subsection of existing local pages; later an explicitly selected `/industries/hvac/arizona/phoenix` | Dedicated page only when differentiated local trade content and demand justify it |
| Service + trade + city | Initially covered by the matching service-city page's trade examples | No automatic fourth-dimension page expansion |
| Agentic / AI marketing implementation | Core service and how-it-works content | Capture informed buyers and explain implementation; add a separate page only for demonstrably distinct intent |

Broad “marketing agency Miami” traffic includes buyers outside our fit. The city page should recognize that query while clearly qualifying established contractors and service businesses. Buyer-intent terms such as “plumbing marketing agency” belong to our site; consumer searches such as “emergency plumber Miami” belong to our clients' acquisition strategies and may appear only as labeled examples here.

### Search vocabulary for all 13 services

These are research clusters, not verified volume estimates. The service map remains bound to `docs/SERVICE_CAPABILITY_AUDIT.md` and the current implementation scope.

| Existing service slug | Familiar acquisition language | Primary rollout role / boundary |
|---|---|---|
| `agentic-ppc-management` | PPC management, PPC agency, Google Ads management, pay-per-click advertising | Local acquisition priority. Google Ads scope is established; don't assume every ad network, LSA service or creative production is included. |
| `agentic-seo` | SEO services, SEO company, local SEO agency, contractor SEO | Local acquisition priority. Explain research, technical/local analysis, content planning and approved implementation. |
| `agentic-content-marketing` | Content marketing services, contractor content marketing, SEO content services | Primarily national and trade pages, plus useful existing local coverage. Content production intent; SEO page owns the wider optimization program. |
| `agentic-email-marketing` | Email marketing services, customer email campaigns, lifecycle email marketing | National/trade expansion. Existing customer/permissioned lifecycle use; keep cold prospect outreach under outbound. |
| `agentic-cro` | Conversion rate optimization, landing-page optimization, conversion optimization services | National/trade expansion. Diagnose and scope implementation; do not imply a full web-design agency offer. |
| `agentic-analytics` | Marketing analytics, marketing reporting, attribution reporting services | National/trade expansion. Claims depend on available source data and agreed definitions. |
| `agentic-lead-generation` | B2B lead generation, commercial contractor prospecting, prospect research | Commercial-first acquisition. Distinguish researched accounts from consumer leads and booked appointments. |
| `agentic-outbound-sdr` | B2B outreach services, outbound sales support, sales follow-up | Commercial trade expansion. Approval, suppression and consent rules remain explicit. |
| `agentic-speed-to-lead` | Lead follow-up automation, inbound lead management, enquiry routing | Cross-sell and problem-led search. No implied AI receptionist, voice service or instant-response SLA. |
| `agentic-crm-automation` | CRM automation services, CRM workflow implementation, CRM management | National and trade/system intent. Platform-specific landing pages require actual delivery capability. |
| `agentic-proposal-automation` | Proposal automation, estimate follow-up, sales proposal support | Trade-specific expansion. Prepared proposals and approved follow-up; not autonomous estimating or guaranteed closing. |
| `agentic-review-generation` | Review management, Google review requests, local reputation management | Next local acquisition candidate. Honest requests/responses; no review removal, fake reviews or selective solicitation promises. |
| `agentic-customer-reactivation` | Customer reactivation, customer win-back campaigns, maintenance reminder campaigns | Trade/lifecycle expansion, based on actual history and permissions. |

PPC, SEO and contractor marketing are the initial search-facing entry points. Keep every existing service available, but allocate new content effort according to observed demand, delivery fit and qualified conversion potential. Do not assume that every service needs the same number of local pages.

## Copy prototypes

Titles below are editorial examples. Validate actual rendered length, clarity and content alignment across the full dataset. The repository's 70-character title cap is an internal check; Google describes truncation by available display width rather than a universal character limit. [Google title guidance](https://developers.google.com/search/docs/appearance/title-link).

| Page | Proposed search title | Proposed H1 |
|---|---|---|
| Arizona market | Arizona Contractor Marketing Agency \| AgenticBots | Digital marketing for contractors in Arizona. |
| Miami market | Miami Marketing Agency for Contractors \| AgenticBots | Digital marketing for Miami contractors. |
| Miami PPC | Miami PPC Agency for Contractors \| AgenticBots | PPC management for Miami contractors. |
| Phoenix SEO | Phoenix SEO Agency for Contractors \| AgenticBots | SEO services for contractors in Phoenix. |
| National HVAC | HVAC Marketing Agency \| AgenticBots | Marketing built around your HVAC business. |
| National HVAC SEO | HVAC SEO Services \| AgenticBots | SEO for HVAC companies ready to grow. |

**Arizona introduction:** “Connect SEO, paid advertising and lead follow-up around your Arizona service business. We implement and manage AI BOTS within your existing tools, with clear responsibilities and your team's approval before changes go live.”

**Miami PPC introduction:** “Google Ads management for established contractors serving Miami. Managed BOTS analyze search terms, spend and conversion signals, prepare improvements and carry out approved account changes.”

**Phoenix SEO introduction:** “Build a clearer search strategy for the services and locations your business covers. We connect technical SEO analysis, local search research and content priorities through a managed BOT workflow.”

Use “Agentic marketing implementation, managed for you” as an eyebrow or explanatory subheading. Explain it once in plain English: BOTS monitor agreed signals, prepare work and connect approved actions across existing tools, while our team manages the deployment.

Retain the $499 paid qualification step. Suggested primary CTA: **“Start my $499 marketing audit.”** Service variants: **“Request my $499 PPC audit”** / **“Request my $499 SEO audit.”** These names are proposed packaging changes: first define the relevant channel-specific audit checklist and deliverables, then change the label. Preserve current payment timing, two-business-day turnaround after payment, and separate implementation pricing. Do not promise a comprehensive channel audit the current workflow cannot deliver.

## Page presentation and conversion journey

Preserve the current Geist, white/olive surfaces, product-style UI and small button corners. This is a positioning/content pass, with targeted component changes where content needs them.

1. **Recognizable service and place.** Title, H1 and lead identify the buyer and the marketing job. Explain AI delivery above the fold. Show a paid CTA and a useful “See what's included” anchor.
2. **Buyer problems and concrete scope.** PPC: search-term waste, conversion visibility, approval process. SEO: visibility gaps, technical priorities and service-area coverage. Describe deliverables before a long platform explanation.
3. **Relevant trade context.** Show a few meaningful examples for HVAC, plumbing, electrical, roofing, remodeling and general contracting. Link to the appropriate industry page when it exists. Avoid a giant niche list.
4. **Local operating decisions.** Explain service boundaries, relevant languages, seasonal planning and customer journeys only when supported. Connect each observation to a decision within that service.
5. **Agentic implementation.** Keep the interactive preview, with a service-appropriate example: account signal → prepared recommendation → human approval → recorded activity. Clearly label it illustrative.
6. **Evidence and accountability.** A real operator introduction, transparent sample audit, supported systems, approval controls and sample deliverables. Add permissioned case studies once available. Do not borrow platform benchmarks as client outcomes.
7. **Engagement and investment.** Define paid discovery, implementation and ongoing management. Keep $7,500 + $2,500/month and Growth from $15,000 + $3,500/month accurate to shared configuration and proposal scope.
8. **Buyer questions and local audit.** Address account ownership, existing agency collaboration, access, included work, reporting and delivery. Retain clear remote-delivery wording and compact form.
9. **Relevant onward navigation.** Parent geography, related local service, industry guide and nearby useful market links. Every landing page should be useful independently even if the visitor never clicks onward.

## Industry rollout

Working assumption pending the owner's priority choice: lead with HVAC, plumbing and electrical; next cover roofing, remodeling and general contractors. These are fit-based starting recommendations, not a claim that their keyword volumes or economics are highest.

| Trade | Distinct buyer context to develop | Initial service pair |
|---|---|---|
| HVAC | Service/repair versus replacement, maintenance relationships, intake and capacity constraints | SEO + PPC |
| Plumbing | Urgent work versus planned projects, service-area qualification, call/form follow-through | SEO + PPC |
| Electrical | Residential versus commercial work, project qualification, estimates and routing | SEO + PPC |
| Roofing | Repair versus replacement, residential versus commercial, estimate and proposal follow-up | SEO + PPC |
| Remodeling | Project type, budget qualification, portfolio evidence and longer consultation journeys | SEO + PPC |
| General contracting | Residential versus commercial projects, geographic scope, buyer roles and bid/proposal processes | SEO + PPC; B2B prospecting where applicable |

Use the 341-niche seed to identify synonyms and specialist subtopics. Map small variants to a parent industry page until a separate intent and meaningful offer are demonstrated. For example, roof repair, metal roofing and commercial roofing may initially be sections; residential/commercial buying processes must be explained distinctly. No automatic 341 × 13 × 924 matrix.

Create a public, reviewed industry record with a stable slug, name, parent category, query cluster, buyer type, delivery fit, relevant services, real examples and evidence. Keep it independent of private Prospect Graph/client records and scores. Do not publish internal attractiveness scores as market facts.

## Content quality and publication readiness

City pages are legitimate when they provide useful local buying information. Pages that mainly repeat a template to funnel similar city queries into one destination create a doorway/scaled-content risk. Shared design and a shared audit CTA are acceptable design choices; the page must still answer the local service decision. Google's policy focuses on purpose and value, not a magic word count or similarity percentage. [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

Before indexing each new or expanded page, require:

- A defined search intent, buyer and single canonical owner; supporting query evidence recorded with date and source.
- Accurate service deliverables mapped to the current BOT/human implementation scope.
- Useful local or trade-specific decisions beyond renamed headings, neighborhood lists and spun text.
- Sources and editorial review for objective claims. Store source URL, observation date and what the source actually supports. Label illustrative examples and planning hypotheses.
- No unverified claims about local clients, offices, ad costs, volume, market growth, partnerships, certifications or outcomes. Some current `localNote` wording makes strong claims without source fields; review and soften or substantiate it before further reuse.
- A complete buying journey: fit, scope, implementation, responsibilities, price context and a working local audit path.
- Real crawlable inbound links, correct canonical/robots/sitemap agreement and passing accessibility/layout checks.

Suggested readiness model: `draft → reviewed → publishable → indexable`, per page key `{intent, service?, industry?, geography?}`. Explicit reviewer/date/evidence records make this auditable. A code gate checks required fields and consistency; human review establishes usefulness. Do not automatically index all 13 service pages when a city receives one local note.

Preserve current indexability during the initial copy pass. Assess existing weak indexed pages individually using production data before changing their status. For unready future destinations, prefer editorial records over generating more crawlable placeholder combinations. `noindex` controls indexing, not the cost of fetching a URL.

## Geography, Maps and trust

Nationwide city pages target organic website results for businesses in those places. Google Maps/Business Profile visibility is a separate effort influenced by relevance, distance and prominence/popularity; a city page alone does not create a local office or map presence. Use only genuinely eligible business locations, with accurate service and contact information. [Google local ranking guidance](https://support.google.com/business/answer/7091), [Business Profile representation rules](https://support.google.com/business/answer/3038177).

Use Organization and accurate Service/area-served markup consistently. Do not create fabricated LocalBusiness offices for every city. Schema describes the real offer; it does not establish local presence or guarantee ranking. Keep useful on-page FAQs, but do not budget for FAQ rich-result gains: Google's current documentation says the feature stopped appearing May 7, 2026. [Google Search documentation updates](https://developers.google.com/search/updates#may-2026).

Build authority through actual operator expertise, original sample analyses, permissioned implementation stories and relevant trade relationships. Reference tools honestly; a logo is not proof of a certified integration or partnership. Publish useful guides addressing contractor buying decisions, such as what a PPC management scope includes, how to evaluate an SEO proposal, and how approved BOT workflows interact with existing marketing teams.

## Internal links and technical work

- Maintain market directory → state → city and service → state-service → city-service paths with server-rendered anchors.
- Make service-city pages link clearly to their city market hub as well as the service parent. Verify existing coverage rather than assuming breadcrumbs connect both hierarchies.
- Add industry hubs from relevant service and market sections; industry hubs link to their genuinely supported service pages and selected geography examples.
- Use descriptive, natural anchors such as “PPC management in Miami” and “SEO for HVAC companies.” Avoid mechanically rotating synonyms solely to satisfy a quota.
- Consolidate overlapping agency/company/firm variants on their intent owner. Keep distinct pages self-canonical; use redirects only for genuine merges. Do not canonical every city to its state or national page.
- Update sitemap readiness from the same publication manifest as page robots. Store a meaningful content revision date. Google ignores sitemap priority/change-frequency fields and expects accurate last-modified dates. [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- Extend intent checks to proposed industry routes and broad market intents. Existing exact-word exclusions are implementation heuristics, not search-engine rules.
- Verify metadata, headings, structured data, rendering, links, mobile layout and performance for long city/trade names. Preserve approved design, BOT types, canonical slugs, forms and commercial terms.

## Execution sequence

### Phase 1 — Baseline and concrete pilot

1. Obtain available Search Console page/query data for the last 90 days and a longer comparison period if available; segment branded/nonbranded, geography, service, device, indexed status and query intent. Review production analytics and actual paid-audit outcomes. Missing data stays unknown.
2. Build a query-to-page register using customer language, sampled results and available keyword research. Fields: query cluster, intent, candidate owner, geography, trade, evidence/source/date, delivery fit, competition observation and priority. Keyword Planner/third-party exports can refine demand; no paid API usage is assumed by this plan.
3. Prototype five state hubs (Florida, Arizona, Texas, Georgia, North Carolina), six city hubs (Miami, Fort Lauderdale, Phoenix, Dallas, Atlanta, Charlotte) and each city's SEO/PPC pages: **23 existing pages**. The choices reuse enriched coverage and span several markets; they are not a volume ranking.
4. Implement search-facing labels separately from existing service names/slugs; add local service briefs and channel-appropriate audit messaging. Preserve the current publication set.
5. Review rendered desktop/mobile pages, intent alignment, source support, actual submission attribution and SEO tests before any separately authorized deployment.

### Phase 2 — Trade authority and existing-page expansion

- Create six national trade hubs and up to twelve SEO/PPC trade intersections: **at most 18 new pages**, each requiring separate content readiness. Start with the first three trade families if editorial capacity is limited.
- Apply the approved search-facing architecture to the remaining current indexable market/service pages, adapting the content to each service's genuine scope. Technical copy improvements can reach structural noindex destinations without making them indexable.
- Publish a real sample audit and substantive methodology/decision guides. Case studies enter only when real and permissioned.
- Roll out the publication manifest, stronger intent checks and reliable sitemap revision dates before enabling more cities.

### Phase 3 — Geographic expansion driven by evidence

- Select the next small batch of city/service combinations using observed demand, qualified enquiries, delivery fit, differentiation and ability to produce useful content. Choose a reviewable batch size, not a mandatory national multiplication.
- Add city × trade pages only when existing query data or research supports a separate need and the page has distinct local/trade content. Avoid producing both `/markets/.../hvac` and `/industries/hvac/...` for the same intent.
- Evaluate indexing, impressions, qualified traffic and buyer response after recrawling and sufficient observation. Diagnose zero-impression pages before deciding to improve, consolidate or noindex; do not auto-prune solely at day 90/120.
- Keep a holdout or staggered cohort where possible. Timing, seasonality and query mix can confound before/after comparisons; results are directional without enough data.

These phases describe work order, not a promise of ranking within a fixed number of days.

## Success measurement

Measure a funnel from **nonbranded search → relevant landing page → service/scope engagement → audit start → successful request → paid audit → qualified implementation opportunity → signed deployment**. Existing `audit_form_started` and server-side `plan_form_submitted` events are useful foundations. A successful form submission is not a paid audit or revenue.

Preserve first landing page, page type, service, industry, state and city using non-sensitive identifiers. Record paid/qualified stages in the appropriate system with deduplication and consent-aware attribution; do not send form names, emails or free-text business details into analytics. Retain existing server-side submission counting to avoid duplicates.

Compare cohorts on eligible/indexed URLs, intended nonbranded query impressions, qualified organic visits, audit request rate, paid-audit rate and implementation value. Use position/CTR as diagnostic context, not the sole target. Do not set numerical growth claims before obtaining a baseline. A smaller collection of productive pages can be a better investment than a larger collection of unused destinations.

## Implementation acceptance criteria

- Every targeted page identifies a familiar service, accurate geography and intended buyer, then explains managed BOT delivery plainly.
- Search-facing names do not change BOT types, route slugs or approved product capabilities.
- Each proposed industry or geography/service page has one intent owner and a reviewed content record.
- No unintended change to current indexability; new pages require explicit readiness.
- Canonicals, sitemap entries, robots directives and internal destinations agree.
- No invented results, client proof, office locations, search volumes or integration claims.
- Paid audit terms and implementation prices remain consistent; audit focus preserves geography and service.
- Required typecheck, lint, tests and production SEO/link gates pass when implemented.

The next implementation task is Phase 1's search-facing copy architecture and 23-page pilot, followed by the curated industry layer. This audit itself leaves the website unchanged.
