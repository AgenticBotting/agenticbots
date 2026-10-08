# Public service-niche and buyer experience — 2026-10-08

## Source and scope

The owner requested the Prospect Graph's service catalog and buyer intelligence on public industry pages. The local demo admin at `/ops/prospecting` was inspected and reconciled with the shared ontology: 341 service niches, 137 buyer types and 11,357 relationships, including 4,526 pending review. These are catalog counts, not customer, lead or deployment results.

The public snapshot includes all 341 niche definitions and all 137 buyer definitions. It includes only `approved` and `auto_approved` relationships: 6,831 relationships across 228 niches. Human-approved relationships are labeled reviewed; automatic matches are explicitly modeled fit. Pending and rejected matches are omitted. Some pending matches were plainly too broad, such as residential roofing to boat owners; they were not promoted for marketing purposes.

113 niches therefore have no included buyer map and show a buyer-profile scoping path. 25 buyer types have no included relationship; five of these have no backend relationship at all. They remain in the buyer glossary and filter, with an explicit empty state. No missing mappings were invented or silently approved. Backend relationships and review status were not changed.

## Public experience

- `/industries`: searchable directory of all 341 service niches in 20 categories. Combine service search, category and one of 137 buyer types. Native category disclosures keep the interface compact while every niche link remains in initial HTML. A glossary exposes the buyer definitions and typical roles.
- `/industries/niches/[niche]`: 341 dedicated pages. Each has a natural Agentic marketing headline, niche-specific buyer choices and roles, a category planning brief, relevant service paths, managed delivery, the shared $499 audit and related specialties.
- Existing six trade hubs and twelve trade SEO/PPC pages now include a featured specialty's buyer map, clearly identify that specialty and link all other specialties in the category. SEO and PPC versions adapt the execution node to that channel. Broad service and market pages link to the expanded directory through their existing industry section.
- The interactive flow connects ideal customer profile → evidence to verify → go-to-market approach → human approval → a useful buyer brief. Switching a buyer changes its roles, buying motion and research sources. Household, referral, procurement and commercial relationships have distinct routing logic. Nothing in the illustration looks up people, scores real businesses or triggers sending.
- Existing Geist, white/olive design, button radii, commercial terms, menus and public service URLs are retained. New visuals use HTML/CSS and existing icons. Animations are finite, replayable and disabled under reduced motion; replay preserves keyboard focus. Mobile stacks the workflow in reading order.

## Public/private boundary

`src/server/prospecting/public-catalog.ts` requires ontology-review permission before reading exactly three shared tables through `ProspectGraphStore`: niches, buyer types and relationships. Its explicit allowlist copies public vocabulary into a new shape. It never loads companies, people, markets, clients or private prospect records, and never exports internal record IDs, model scores/rationales, provider names, prices/costs or provenance. Typical titles are role categories, not named people. Research source labels describe possible scoping inputs, not live integrations.

The marketing site reads a static, reviewed-in-code snapshot (`src/data/public-niche-catalog.json`), not the runtime database. There is no public admin export endpoint. Full catalog data is server-only; the directory receives only names, categories and buyer-slug associations, and a detail page receives only that niche's allowed profiles. The 16KB public-route list is separate so analytics never imports the full 1.2MB catalog.

The local export uses an explicitly supplied demo snapshot and active operator identity. Its read-only repository overrides all persistence paths, including the memory repository's automatic exit flush. It writes only the two public projection files, never the source state. It cannot connect to the configured cloud repository or call providers.

Refresh from the reviewed local admin state:

```bash
node --conditions=react-server --import tsx scripts/export-public-niches.ts \
  --demo-state=.platform-data/demo-state.json \
  --operator-email=admin@agenticbots.demo
```

Review the resulting public changes and run the required checks. Never commit the demo snapshot or credentials. A production/cloud export would need separately authorized implementation; this script intentionally has no cloud mode. Catalog changes do not auto-publish or auto-deploy.

## Search publication and measurement

All 341 new niche pages have self-canonical URLs and `noindex, follow`. They are discoverable through real links but excluded from the search sitemap until editorial review establishes enough niche-specific content and validates the audience assumptions. This avoids treating a category brief as 341 fully researched SEO pages. Existing eligibility remains 584 acquisition routes. No niche × city × service route explosion was introduced.

To release a niche, review the audience, relevant roles, actual capability fit, unique buying guidance and conversion path; then use the existing explicit publication registry workflow. Do not index the batch based on route existence or catalog counts. No ranking, CTR or conversion improvement is asserted.

Audit attribution now accepts exactly the generated public niche route list and emits the niche slug, including session landing attribution. It rejects unknown, query-bearing and private paths. The audit is a request, not payment; all shared price/scope terms remain. No live audit was submitted.

## Verification

New tests verify all source definitions are present, every niche has a planning brief, all links render server-side, metadata is unique and within budget, unknown routes fail, noindex defaults remain, filtering handles unmapped buyers, buyer/channel paths differ, and audit terms remain. Security tests verify authorization before reads, exact table access, no writes, explicit projection keys and relationship-review decisions. All new public sources are in the white-label scan. Final build and browser results are recorded in `MARKETING_BUILD_STATUS.md`.
