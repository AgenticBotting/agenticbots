# AgenticBots — Service Taxonomy & City Page Content Blueprint

Companion to `PROGRAMMATIC-SEO-PLAN.md` and `cities-dataset.json`. This file defines what goes **on** each of the 7,392 city × service pages.

---

## 1. Cannibalization fix (read before building)

The eight services as listed contain four overlapping pairs. On a single city, `agentic-ppc-management` and `agentic-google-ads-management` target the same buyer, the same intent, and would both carry `ppc agency` and `google ads agency` in the body. Google resolves that by picking one and suppressing the other — and it usually picks wrong. Same collision for SEO vs. Local SEO. Meanwhile `agentic-marketing-firm` is the parent of all seven, not a peer.

**Restructure into three tiers. Same 8 URL patterns, distinct intents.**

```
TIER A — Category parent (1)
  agentic-marketing-firm          Broad intent. Hub page. Links to all children.

TIER B — Channel disciplines (3)
  agentic-ppc-management          Paid search strategy across ALL platforms
  agentic-search-engine-optimization   Organic, national/technical scope
  agentic-email-marketing         Lifecycle and retention

TIER C — Platform / niche specialists (4)
  agentic-google-ads-management   Google-specific execution
  agentic-linkedin-ads-management LinkedIn-specific, B2B/ABM
  agentic-facebook-ads-management Meta-specific, B2C/ecom
  agentic-local-seo               GBP, map pack, multi-location
```

### The differentiation rules that make this work

| Page | Owns | Must NOT own |
|---|---|---|
| PPC Management | Cross-platform budget allocation, channel mix, attribution across Google + Meta + LinkedIn + Microsoft | Google-specific tactics (Performance Max setup, Quality Score mechanics) |
| Google Ads Management | Performance Max, Quality Score, Search/Shopping/Demand Gen, Google-native bidding | Cross-channel budget theory, Meta or LinkedIn tactics |
| SEO | Technical SEO, content architecture, national/organic authority, Core Web Vitals | Map pack, GBP, "near me", review velocity |
| Local SEO | Google Business Profile, map pack ranking, citations, review velocity, service-area targeting | Technical crawl budget, national link building |
| Marketing Firm | Full-funnel strategy, channel selection, RevOps orchestration | Any single-channel tactical depth |

**Enforce it:** each page carries an `owns[]` and `excludes[]` array in its data record. A build-time check fails if a page's body contains more than 2 instances of terms from its `excludes[]` list. Without this gate the restructure is a diagram, not a defense.

**Internal linking between them:** Tier C links up to its Tier B parent. Tier B links down to its Tier C children and up to Tier A. Tier A links down to all seven. Every link is same-city — `agentic-google-ads-management/florida/miami` links to `agentic-ppc-management/florida/miami`, never to Tampa.

---

## 2. Service definitions & semantic term sets

For each service: the H1 pattern, the exact-match variants to place deliberately, and the **supporting entities** — the domain nouns that establish topical relevance. Entities matter more than keyword repetition. A page that mentions Quality Score, negative keywords, ROAS, and Performance Max reads as a real Google Ads page. A page that says "google ads agency" eight times reads as spam.

---

### 2.1 Agentic Email Marketing Firm

**H1:** `Agentic Email Marketing Firm in {City}, {ST}`
**URL:** `/services/agentic-email-marketing/{state}/{city}`

**Exact-match variants** (place per Section 3 rules):
`email marketing company` · `email marketing agency` · `email marketing services` · `email marketing firm in {City}` · `{City} email marketing`

**Supporting entities:**
lifecycle marketing · drip campaign · segmentation · list hygiene · deliverability · sender reputation · SPF/DKIM/DMARC · open rate · click-through rate · abandoned cart · win-back sequence · re-engagement · A/B subject line testing · ESP migration · Klaviyo · HubSpot · Mailchimp · Braze · Customer.io · transactional email · preference center · suppression list · CAN-SPAM · CASL · list churn · revenue per recipient

**Agentic angle:** an agent monitors deliverability and engagement continuously, re-segments on behavior in real time, and pauses or rewrites underperforming sequences the same day — not at the next monthly review.

---

### 2.2 Agentic PPC Management Firm

**H1:** `Agentic PPC Management Firm in {City}, {ST}`
**URL:** `/services/agentic-ppc-management/{state}/{city}`

**Exact-match variants:**
`pay per click` · `ppc management` · `ppc agency` · `ppc management services` · `pay per click management services` · `pay per click company` · `ppc company in {City}`

**Supporting entities:**
cost per click · cost per acquisition · ROAS · conversion tracking · attribution model · budget pacing · bid strategy · impression share · negative keywords · match types · landing page relevance · audience targeting · remarketing · cross-channel allocation · incrementality testing · Microsoft Advertising · offline conversion import · CRM-matched audiences · wasted spend · search terms report

**Owns:** cross-platform allocation and attribution. **Excludes:** platform-specific execution detail.

---

### 2.3 Agentic Search Engine Optimization Firm

**H1:** `Agentic Search Engine Optimization Firm in {City}, {ST}`
**URL:** `/services/agentic-search-engine-optimization/{state}/{city}`

**Exact-match variants:**
`seo services` · `seo company` · `seo agency` · `search engine optimization services` · `search engine optimization agency` · `search engine optimization company` · `seo firm in {City}`

**Supporting entities:**
technical SEO · on-page optimization · crawl budget · indexation · canonical tags · structured data · schema markup · Core Web Vitals · internal linking · topical authority · keyword clustering · search intent · SERP features · backlink profile · content gap analysis · log file analysis · site architecture · programmatic SEO · E-E-A-T · organic traffic

**Owns:** technical and organic authority. **Excludes:** map pack, GBP, "near me."

---

### 2.4 Agentic Google Ads Management Firm

**H1:** `Agentic Google Ads Management Firm in {City}, {ST}`
**URL:** `/services/agentic-google-ads-management/{state}/{city}`

**Exact-match variants:**
`google ads agency` · `google ads management` · `google ads company` · `adwords management` · `google ads management services`

**Supporting entities:**
Performance Max · Search campaigns · Shopping campaigns · Demand Gen · Quality Score · ad rank · responsive search ads · asset groups · Smart Bidding · Target CPA · Target ROAS · conversion value rules · audience signals · Google Merchant Center · GA4 integration · enhanced conversions · ad extensions · sitelinks · auction insights · script automation

**Owns:** Google-native mechanics. **Excludes:** Meta, LinkedIn, cross-channel budget theory.

---

### 2.5 Agentic LinkedIn Ads Management Firm

**H1:** `Agentic LinkedIn Ads Management Firm in {City}, {ST}`
**URL:** `/services/agentic-linkedin-ads-management/{state}/{city}`

**Exact-match variants:**
`linkedin ads agency` · `linkedin advertising agency` · `linkedin ads management` · `linkedin ads company`

**Supporting entities:**
account-based marketing · ABM · matched audiences · company targeting · job title targeting · seniority targeting · sponsored content · message ads · lead gen forms · conversation ads · document ads · CPL · pipeline attribution · intent data · firmographic targeting · Insight Tag · B2B demand generation · SQL · MQL · sales cycle length · CRM enrichment

**Owns:** B2B/ABM. **Excludes:** consumer targeting, ecommerce.

---

### 2.6 Agentic Facebook Ads Management Firm

**H1:** `Agentic Facebook Ads Management Firm in {City}, {ST}`
**URL:** `/services/agentic-facebook-ads-management/{state}/{city}`

**Exact-match variants:**
`facebook ads agency` · `meta ads agency` · `facebook advertising agency` · `facebook ads management` · `facebook ads company`

**Supporting entities:**
Meta Ads Manager · Advantage+ · lookalike audiences · custom audiences · Conversions API · pixel · creative testing · creative fatigue · ad set structure · CBO · frequency capping · thumb-stop rate · hook rate · CPM · CPA · catalog ads · dynamic product ads · Instagram placements · retargeting · iOS attribution · aggregated event measurement

**Owns:** Meta platform + creative velocity. **Excludes:** search intent, B2B ABM.

---

### 2.7 Agentic Local SEO Firm

**H1:** `Agentic Local SEO Firm in {City}, {ST}`
**URL:** `/services/agentic-local-seo/{state}/{city}`

**Exact-match variants:**
`local seo company` · `local seo agency` · `local seo services` · `local seo firm in {City}`

**Supporting entities:**
Google Business Profile · map pack · local pack · NAP consistency · citations · review velocity · review response · local landing pages · service area business · proximity ranking factor · category selection · GBP posts · Q&A · local schema · geo-modified keywords · "near me" searches · multi-location management · store locator · local link building · duplicate listing suppression

**Owns:** map pack + GBP. **Excludes:** technical crawl, national authority.

---

### 2.8 Agentic Marketing Firm (Tier A parent)

**H1:** `Agentic Marketing Firm in {City}, {ST}`
**URL:** `/services/agentic-marketing-firm/{state}/{city}`

**Exact-match variants:**
`marketing agency` · `marketing company` · `marketing firm in {City}` · `{City} marketing agency` · `full service marketing agency`

**Supporting entities:**
full-funnel · go-to-market · channel mix · marketing operations · RevOps · demand generation · pipeline velocity · CAC · LTV · marketing qualified lead · attribution · martech stack · CRM integration · reporting cadence · budget allocation · quarterly planning · growth strategy

**Structure:** this page is a hub. Shorter intro, then a routing block that sends the visitor to whichever of the seven child services fits their situation. It ranks for broad intent and distributes it.

---

## 3. Keyword placement rules

Reframe the goal: this is **entity coverage with controlled exact-match placement**, not sprinkling. At 7,392 pages, mechanical repetition of a phrase produces a detectable pattern across the corpus that no single page would trigger on its own. The corpus is what gets evaluated.

### Placement map

| Location | What goes there |
|---|---|
| Title tag | Primary H1 phrase, ≤60 chars |
| H1 | Exact primary, once, never repeated on page |
| First 100 words | Primary phrase once + 1 semantic variant, naturally |
| H2s (6–8 total) | 2 H2s carry a semantic variant; the rest are plain-English section names |
| Body | Each semantic variant appears **1–2 times maximum** |
| Image alt text | 1–2 variants across all images, descriptive not stuffed |
| FAQ questions | 1–2 variants phrased as real questions |
| Internal anchor text | Rotates across 5+ patterns per link type |
| Meta description | Primary phrase once + 1 variant |

### Hard limits — enforce in CI

- Total keyword density (primary + all variants) **< 2.0%** of body word count
- No single exact phrase more than **4 times** per page
- Primary phrase in H1 **only once** — not repeated in an H2
- Every page ≥ **1,200 words**, target 1,400–1,800
- Terms from the page's `excludes[]` list: **≤ 2 occurrences**
- Exact-match anchor text across the corpus: **≤ 30%** of internal links to any given URL

Write the density checker to output a per-page report and fail the build on any breach. This is the difference between a corpus that ranks and one that gets a manual action.

---

## 4. Universal page blueprint

Every city × service page assembles from these blocks in this order. Bracketed values are per-city and come from the enrichment pipeline in `PROGRAMMATIC-SEO-PLAN.md` §5 — **never generated from model memory.**

### 4.1 Hero
- H1: exact primary pattern
- One-line subhead naming the specific outcome, with the city
- Two CTAs: primary "Book a scoping call", secondary "See an agent run"
- Trust strip: [live client count] · [avg response latency] · [platforms managed]

### 4.2 Answer block — first 120 words *(this block does the ranking)*
Answer the query directly and completely in the opening paragraph: what an agentic {service} firm in {City} does, who it's for, what it costs to start. This is the featured-snippet and AI-overview target. Do not open with a hook, a story, or "In today's competitive landscape." Answer the question.

### 4.3 {City} market data *(the uniqueness engine)*
The block that makes 7,392 pages distinct. All values from real APIs.
- Paragraph: [establishment count] businesses across [metro], concentrated in [top 3 NAICS industries]
- **Coded chart:** vertical CPC benchmarks for [metro] vs. national (§5)
- **Coded chart:** industry mix for [metro]
- Paragraph: what those two charts imply for this specific service in this specific market
- Competitive note: [agency density] providers serve [city]

### 4.4 What the agent actually does
6–8 steps, each with a time interval. This is the credibility core.
- **Coded diagram:** agent architecture for this service (§5)
- Each step: trigger → agent action → tool called → output
- Include an actual agent trace excerpt, monospace, real tool calls visible

### 4.5 Human vs. agent operating comparison *(the persuasion block — see §7)*
- **Coded diagram:** 24-hour monitoring timeline, human vs. agent
- Comparison table on **operational cadence only**: monitoring frequency, response latency, concurrent accounts, hours of coverage, consistency of execution
- Explicit "what humans do better" row — see §7 for why this is required, not optional

### 4.6 Video section *(placeholder now, structured for later)*
Build the component and schema now, ship with a static poster + "walkthrough coming soon" state.
- 16:9 container, lazy-loaded, `loading="lazy"`, poster image, no autoplay
- `VideoObject` JSON-LD wired but only emitted when a real video exists — **never emit VideoObject schema for a placeholder**, that's a structured-data violation
- Below the player: a full text transcript block. The transcript is the indexable asset; the video is the engagement asset
- Roadmap: one generic per-service walkthrough (8 videos), then per-metro variants for Tier 1 only

### 4.7 Industries we serve in {City}
Pulled from the metro's actual top NAICS codes. Three short blocks, each: the industry, its specific challenge in this service, what the agent does about it. This block is 100% unique per city because the industry mix is.

### 4.8 Implementation timeline
4 phases with real week numbers. Enterprise buyers buy the process.
- **Coded diagram:** horizontal timeline

### 4.9 Integration surface
Logo grid of platforms wired into, for this service specifically. Google Ads page shows Google Ads/GA4/Merchant Center. Email page shows Klaviyo/HubSpot/Braze.

### 4.10 Surrounding areas
From the `surrounding` array. 4–6 cities, descriptive anchors, one line each on that submarket. Never a bare link list.

### 4.11 FAQ — 8 questions
5 fixed per service, 3 varying by city data (cost benchmarks, local competition, industry mix). `FAQPage` schema. Real questions people ask, pulled from People Also Ask and Search Console.

### 4.12 Related services in {City}
Tier-appropriate links per §1. Same city, always.

### 4.13 Final CTA
Inline calendar embed. Not a link to a booking page.

**Target: 1,400–1,800 words. ≥60% unique vs. sibling pages.**

---

## 5. Coded image library

All visuals are **build-time generated inline SVG**, not raster files. Three reasons: text inside inline SVG is crawlable and contributes to relevance, they're a fraction of the byte weight of images across 8,783 pages, and they regenerate automatically when the underlying data changes.

| Component | Data source | Appears on |
|---|---|---|
| `<CPCBenchmarkChart>` | Ads API / your accounts, per metro + vertical | All paid services |
| `<IndustryMixChart>` | Census CBP, per metro | All pages |
| `<AgentArchitectureDiagram>` | Static per service | All pages |
| `<HumanVsAgentTimeline>` | Static, service-parameterized | All pages |
| `<ImplementationTimeline>` | Static per service | All pages |
| `<AgentTraceViewer>` | Sample trace per service | All pages |
| `<ChannelAllocationDiagram>` | Static | PPC, Marketing Firm |
| `<MapPackDiagram>` | Static | Local SEO |
| `<DeliverabilityFlow>` | Static | Email |
| `<FunnelDiagram>` | Static, service-parameterized | LinkedIn, Facebook |

### Requirements

- Inline SVG in the DOM. Not `<img src="*.svg">` — that hides the text from crawlers.
- `<title>` and `<desc>` inside every SVG, plus `role="img"` and `aria-label`.
- Accent `#7fa200` for fills. Body text inside SVG uses `#5f7a00` or darker — `#7fa200` fails WCAG AA at text sizes.
- Every data chart ships with a visually-hidden `<table>` alternative for screen readers.
- Explicit `viewBox` + `width`/`height` so they contribute zero CLS.
- Cap total SVG payload per page at 40KB.
- Every chart has a one-sentence caption stating the takeaway. The caption is prose, indexable, and unique per city.

---

## 6. Schema stack per page

```
Organization (sitewide)
LocalBusiness / ProfessionalService  → areaServed: {City}, {ST}
Service                              → serviceType, provider, areaServed
BreadcrumbList                       → Home > Services > {Service} > {State} > {City}
FAQPage                              → the 8 FAQ items
WebPage                              → primaryImageOfPage, datePublished, dateModified
VideoObject                          → ONLY when a real video exists
```

**No fake NAP.** Use `areaServed` for service-area targeting against one real business address. Inventing a Miami street address is a GBP suspension trigger and a trust liability that outlives any ranking gain.

---

## 7. The persuasion arc — done so it survives scrutiny

The goal is moving visitors toward agentic systems. The framing matters more than the volume.

**Don't write:** "Humans can't manage your marketing as well as AI." Unfalsifiable, unprovable, and it reads as vendor puffery to exactly the buyer you want — a VP Growth who has been pitched AI six times this quarter. It also invites an FTC-adjacent substantiation problem if repeated as fact across 7,392 pages.

**Do write:** specific, verifiable operational comparisons. These are true, checkable, and far more persuasive:

| Dimension | Human team | Agent system |
|---|---|---|
| Monitoring frequency | Business hours, daily-to-weekly review | Continuous |
| Response to anomaly | Next business day | Minutes |
| Concurrent accounts | 5–15 per manager | Unbounded |
| Execution consistency | Varies by workload and tenure | Deterministic |
| Coverage | ~40 hrs/week | 168 hrs/week |
| Weekend/holiday budget drift | Unmonitored | Monitored |

The argument that converts isn't "AI is smarter." It's **"your budget spends 128 hours a week that nobody is watching."** That's concrete, the buyer can verify it against their own operation, and it creates urgency without a superiority claim.

### Include a "what humans do better" row

Creative judgment, brand voice calls, negotiation, strategic pivots, client relationships. Naming this makes every other claim on the page credible and it maps to your actual positioning: you're an implementation and engineering firm, humans architect the system, agents run it. Removing this row makes the page weaker, not stronger.

### Placement

The arc runs: answer their question honestly → show local market reality → show what the agent does mechanically → show the coverage gap → offer the scoping call. Persuasion appears in §4.5 and the final CTA. It does **not** appear in §4.2, §4.3, or the FAQ — those blocks earn trust by being useful, and that trust is what makes §4.5 land.

---

## 8. CI gates

Build fails on any of these:

- Keyword density ≥ 2.0% · any exact phrase > 4× · H1 phrase repeated
- Word count < 1,200
- `excludes[]` terms > 2 occurrences (cannibalization guard)
- Sibling-page similarity above threshold (§5 of the SEO plan)
- Duplicate title, H1, or meta description anywhere in the corpus
- Any numeric value not traceable to a data source
- `VideoObject` emitted without a video file
- Schema validation failure
- SVG missing `<title>`/`<desc>` or table alternative
- Any SVG text at `#7fa200` on light background (contrast)
- Cross-city related-service links (must be same-city)

---

## 9. Instruction for Claude Code

> Read `SERVICE-CONTENT-BLUEPRINT.md` alongside `PROGRAMMATIC-SEO-PLAN.md` and `cities-dataset.json`. Enter plan mode. No templates yet.
>
> **Phase A** — Encode the §1 taxonomy: add `tier`, `owns[]`, `excludes[]`, `parent`, `children[]` to each service record. Report any term appearing in two services' entity sets and propose which page keeps it.
>
> **Phase B** — Propose the page template as composable blocks per §4, with a per-block word budget summing to 1,400–1,800. Show me which blocks are static, which are city-parameterized, and compute the resulting uniqueness percentage before building anything.
>
> **Phase C** — Build the coded-image library per §5 as typed React components with the accessibility and CLS requirements. Start with `<HumanVsAgentTimeline>` and `<AgentArchitectureDiagram>` — those two carry the argument.
>
> **Phase D** — Build the CI gates in §8 as a single script that runs against the full generated corpus, not a sample.
>
> Then stop. Tell me: whether the 1,400–1,800 word target is achievable at 60% uniqueness given the available data fields, and which of the eight services has the weakest unique-content story.
