# Managed BOT workforce marketing build — 2026-10-06

Status: implemented locally on `platform-v1`; not deployed or pushed.

## Enterprise positioning refinement — 2026-10-06

Homepage and national service-page language now targets established residential and commercial contractors, typically above $2M in annual revenue. The core vocabulary is operating mandate, managed deployment, authority, governance, reviewable activity and coordinated revenue lifecycle. Consumer-style phrases such as “autopilot,” “not one idle” and “different week” were removed from the primary experience.

Every national service page now uses a service-specific enterprise positioning record and adds a deployment profile covering best fit, operating model and authority. The services index adds a shared operating-standard record for existing systems, defined authority and reviewable operation. Illustrative portfolio metrics were replaced with mandate, authority and activity states. Security copy now reflects implemented tenant isolation, approval, audit and scope controls without making unsupported DPA, storage or certification claims.

## Service-page visual refinement — 2026-10-06

The services portfolio and all 13 national service pages now open with a light, numbered editorial hero and a framed product-style operating view. Detail pages add a four-part page index plus a dedicated operating-transition section that maps fragmented current-state work to the managed BOT workflow. Light neutral and pale green surfaces create clear chapters across mandate, execution, scope, national delivery, governance and audit content without making the pages feel heavy.

The visual work remains UI- and CSS-driven: no stock photography, generated people or additional image requests. Subtle translucent service icons and workflow lines sit behind the content, while large service numbers are decorative and hidden from assistive technology. Anchored sections preserve sticky-header offsets; mobile layouts collapse profiles and transition rows into a readable sequence. Existing local SEO links and routes remain unchanged. Client-facing service copy now uses BOT terminology throughout.

## Public experience

- Homepage rebuilt around a coordinated BOT workforce, code-rendered system visuals, a guided workflow, operating controls, delivery, pricing and a paid workflow audit.
- Pricing, About and How it works follow the same offer and visual language. The About page names Nick Thomson without inventing a biography or client history.
- The Services mega menu uses a two-step outcome flow: three initial cards for Get found, Close more jobs and Win repeat work, followed by the relevant BOT services after selection. Four primary navigation choices remain: Services, Service areas, How it works and Pricing. Regional/state drill-down, market search, city coverage, canonical URLs, sitemaps and footer links are retained.
- Automatic exit-intent promotion and roaming BOT mascot removed from the global layout. Existing explicitly invoked plan flow remains available.
- Public intake copy aligned to a **$499 BOT workflow audit** with written findings within **two business days after payment**. The form requests the audit without charging immediately; scope and payment are confirmed before work begins. Existing `/api/plan` delivery endpoint retained. Audit form adds optional process context; successful conversion counting remains server-side rather than duplicated in the audit/legacy form.

## Commercial terms

Shared homepage/pricing cards use `src/config/marketing-offer.ts`.

| Scope | Setup | Monthly | Included scope |
|---|---:|---:|---|
| One BOT | $7,500 | $2,500 | One defined BOT workflow |
| Growth System | From $15,000 | From $3,500 | Initial 3–5 BOT system; expansion to 10 quoted separately |
| Enterprise | Custom | Custom | Custom BOT count, integrations and operating capacity |

The proposal defines usage, access, support, integrations and acceptance criteria. Ad spend and third-party usage charges are separate. No unlimited-capacity claim, guaranteed result, invented customer evidence or upstream benchmark presented as our performance.

## Interaction and accessibility

`BotWorkflowStory` is a fictional local-only example (`demo: true`) with Receive → Prepare → Approve → Record steps. On desktop a narrow, centered IntersectionObserver updates the stage while the visitor scrolls; manual buttons remain available. The four scenes occupy one shared grid track, keeping the stage height constant while content crossfades. On smaller screens the stage is static and controlled by the buttons. Reduced-motion preferences disable automatic advancement and transitions. No messages, bookings, CRM writes or runtime calls are made by the example.

Approval requires an explicit click in the review step. Jumping straight to the record retains a waiting state; reset clears approval. A pure reducer has regression tests for these transitions and for preserving manual selection against programmatic scroll updates. Deliberate wheel/touch/scroll-key input resumes the narrative. Desktop menus expose expanded state and panel associations; Escape closes the panel and returns focus to the trigger. Existing mobile dialog focus handling retained.

## Visual system

The hero and residential/commercial sections use lightweight, code-rendered interface visuals. They make no image requests and show only illustrative workflow states, with restrained CSS handoff/status motion. The previous WebP assets remain unreferenced in `public/media` and therefore add no page transfer weight. See `docs/ASSET-BRIEF.md` for the visual direction and future real-photo guidance.

## Validation

- `npm run typecheck` passed. `npm run lint` passed with zero errors. `npm test` passed.
- Latest complete test run: 24 files, 173 tests passed, including workflow decision/reset, code-rendered visual, enterprise service-positioning coverage, public price/scope rendering coverage and the paid-audit offer contract.
- Lint: zero errors; five existing warnings (four generated Convex directives and one BlogArchive image warning).
- Browser QA from the original pass: homepage at 320, 390, 1024 and 1280 px; pricing at 390 px; no horizontal overflow at tested sizes. Mobile region → state navigation works; Florida hub retains 66 city destinations. Manual approval, skipped approval, reset, form required-field validation and browser error checks exercised without submitting a real lead. The stable scrollytelling and code-rendered visual revision is rechecked below.
- Final production verification passed with `npm run build -- --webpack`, including prebuild and postbuild gates. 13,753 static outputs generated; internal-link and SEO checks passed across 13,707 prerendered pages plus 100 dynamic routes. Topic gate passed for 13 services, 521 indexable topic/scope pages and 26 redirects. The default compiler was blocked from binding its local CSS helper port; Webpack was used for the final build. Existing middleware deprecation, Edge dependency warnings and topic-coverage notes remain.
- Revision validation passed `npm run typecheck`, `npm run lint` with zero errors, all 170 tests and the full Webpack production build. In-app browser automation could not reload localhost because the browser security layer rejected the navigation; no policy bypass was attempted.
- Enterprise positioning validation passed `npm run typecheck`, `npm run lint` with zero errors, all 172 tests and the full Webpack production build. All 13,753 static outputs generated; link integrity, metadata uniqueness and topic gates passed.
- Service-page visual refinement passed `npm run typecheck`, `npm run lint` with zero errors and the same five existing warnings, all 172 tests, in-app full-page visual review, and the full Webpack production build. All 13,753 static outputs generated; link integrity passed for 13,707 prerendered routes plus 100 dynamic routes, SEO checks passed, and the 13-service/521-page topic gate passed.
- Light service surfaces and paid-audit positioning passed `npm run typecheck`, `npm run lint` with zero errors and the same five existing warnings, all 173 tests, in-app full-page visual review, and the full Webpack production build. All 13,753 static outputs generated; link integrity passed for 13,707 prerendered routes plus 100 dynamic routes, SEO checks passed, and the 13-service/521-page topic gate passed.
- Outcome-first Services navigation passed live browser review at 1440px: three initial cards, focused service results, working return navigation and no console errors. It also passed `npm run typecheck`, `npm run lint` with zero errors and the same five existing warnings, all 173 tests, and the full Webpack production build with link, SEO and topic gates.

## Follow-on evidence work

The core marketing pages now explain scope and controls instead of inventing proof. Publish measured client case studies only after deployments and permission. Older service/market examples still use their existing illustrative-data labels; this pass does not establish real performance measurements or certify every historical service claim. Audit turnaround is a delivery promise for a person to fulfill, not an automated audit engine.
