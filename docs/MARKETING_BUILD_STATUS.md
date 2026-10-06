# Managed BOT workforce marketing build — 2026-10-06

Status: implemented locally on `platform-v1`; not deployed or pushed.

## Public experience

- Homepage rebuilt around a coordinated BOT workforce, editorial contractor imagery, a guided workflow, operating controls, delivery, pricing and a free audit.
- Pricing, About and How it works follow the same offer and visual language. The About page names Nick Thomson without inventing a biography or client history.
- Service mega menu exposes all 13 canonical service destinations in one panel, grouped by business goal. Four primary navigation choices: Services, Service areas, How it works, Pricing. Regional/state drill-down, market search, city coverage, canonical URLs, sitemaps and footer links retained.
- Automatic exit-intent promotion and roaming BOT mascot removed from the global layout. Existing explicitly invoked plan flow remains available.
- Public intake copy aligned to a free **BOT opportunity audit** with initial recommendations within **two business days**. Existing `/api/plan` delivery endpoint retained. Audit form adds optional process context; successful conversion counting remains server-side rather than duplicated in the audit/legacy form.

## Commercial terms

Shared homepage/pricing cards use `src/config/marketing-offer.ts`.

| Scope | Setup | Monthly | Included scope |
|---|---:|---:|---|
| One BOT | $7,500 | $2,500 | One defined BOT workflow |
| Growth System | From $15,000 | From $3,500 | Initial 3–5 BOT system; expansion to 10 quoted separately |
| Enterprise | Custom | Custom | Custom BOT count, integrations and operating capacity |

The proposal defines usage, access, support, integrations and acceptance criteria. Ad spend and third-party usage charges are separate. No unlimited-capacity claim, guaranteed result, invented customer evidence or upstream benchmark presented as our performance.

## Interaction and accessibility

`BotWorkflowStory` is a fictional local-only example (`demo: true`) with Receive → Prepare → Approve → Record steps. On desktop an IntersectionObserver updates the stage while the visitor scrolls; manual buttons remain available. On smaller screens the stage is static and controlled by the buttons. Reduced-motion preferences disable automatic advancement and entrance motion. No messages, bookings, CRM writes or runtime calls are made by the example.

Approval requires an explicit click in the review step. Jumping straight to the record retains a waiting state; reset clears approval. A pure reducer has regression tests for these transitions and for preserving manual selection against programmatic scroll updates. Deliberate wheel/touch/scroll-key input resumes the narrative. Desktop menus expose expanded state and panel associations; Escape closes the panel and returns focus to the trigger. Existing mobile dialog focus handling retained.

## Imagery

Two generated, fictional editorial assets in `public/media`, clearly labeled on the page. Combined WebP size approximately 310 KB. Next Image reserves dimensions, preloads the hero and lazily loads the commercial image. Original generation outputs remain outside the repository. See `docs/ASSET-BRIEF.md` for prompts and future real-photo replacement guidance.

## Validation

- `npm run typecheck` passed. `npm run lint` passed with zero errors. `npm test` passed.
- Latest complete test run: 22 files, 169 tests passed, including workflow decision/reset and public price/scope rendering coverage.
- Lint: zero errors; five existing warnings (four generated Convex directives and one BlogArchive image warning).
- Browser QA: homepage at 320, 390, 1024 and 1280 px; pricing at 390 px; no horizontal overflow at tested sizes. Residential image loads; commercial image loads when reached. Mobile region → state navigation works; Florida hub retains 66 city destinations. Manual approval, skipped approval, reset, form required-field validation and browser error checks exercised without submitting a real lead.
- Final production verification passed with `npm run build -- --webpack`, including prebuild and postbuild gates. 13,753 static outputs generated; internal-link and SEO checks passed across 13,707 prerendered pages plus 100 dynamic routes. Topic gate passed for 13 services, 521 indexable topic/scope pages and 26 redirects. The default compiler was blocked from binding its local CSS helper port; Webpack was used for the final build. Existing middleware deprecation, Edge dependency warnings and topic-coverage notes remain.

## Follow-on evidence work

The core marketing pages now explain scope and controls instead of inventing proof. Publish measured client case studies only after deployments and permission. Older service/market examples still use their existing illustrative-data labels; this pass does not establish real performance measurements or certify every historical service claim. Audit turnaround is a delivery promise for a person to fulfill, not an automated audit engine.
