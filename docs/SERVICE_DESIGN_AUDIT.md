# Service buying-journey design — 2026-10-08

## Intent

Extend the owner-approved homepage design to the entire service journey, and reduce homepage button corners. Keep original Geist, the white/olive palette, outcome-first navigation, shared pricing and local SEO architecture.

## Findings and changes

| Previous friction | Implemented change | Buyer benefit |
|---|---|---|
| Service hero led with an abstract mandate and a synthetic operating chart | Benefit-led heading and a task workspace specific to each of the 13 services | See what the work actually looks like before reading the scope |
| Repeated deployment, transition and governance sections competed for attention | Three benefits, one deliverables panel and one consolidated approval boundary | Understand value and responsibilities without repeating the same argument |
| Product UI was decorative | Manually selectable tasks update a draft panel, labeled fictional | Explore a concrete example without involuntary scrolling or live side effects |
| Tool landscape and operating diagram fought for space | Sparse tool marks around the hero, then a dedicated service-specific connections section | Recognize familiar systems while keeping integration requirements explicit |
| Local service pages used a separate generic layout | Shared service components, retaining local context and destinations | A consistent experience for visitors arriving from local search |
| Portfolio emphasized catalogue enumeration | Three outcome groups with readable service panels and actual BOT configurations | Choose by business need and understand what each service involves |
| Audit repeated the offer without a clear deliverable | Assessment, recommended workflow and implementation priorities beside a compact form | Know what the $499 engagement buys and what happens next |
| Homepage buttons felt too rounded | 3px action radius, also used on the new service surfaces | Sharper visual treatment without changing the approved homepage |

## Current page progression

National service: introduction and preview → benefits → scope and controls → tools → audit/build/manage and investment → FAQ → audit form → related services → geographic coverage.

State/city variants retain local context, city navigation, related services and nearby destinations alongside the shared service narrative. Enriched-city character, local notes and illustrative vignettes remain. Structural city routes keep `noindex, follow`. Canonical route construction and the actual location dataset remain unchanged.

The portfolio pages use outcome anchors and grouped service links, followed by delivery/investment and the same audit offer. No navigation menu redesign was included.

## Implementation boundaries

- `service-positioning.ts` remains the source of truth for actual BOT configurations, scope and authority. The 13 service offers still map to the existing backend BOT catalogue.
- `service-experience.ts` adds buyer-facing descriptions, benefits and examples. Each example is fictional, displayed in a `data-demo="true"` workspace. Selection is local React state only.
- `ServiceWorkspace` is the isolated client component. Surrounding sections render on the server. It uses native buttons, pressed state, panel associations and a polite live region.
- Platform marks reuse the existing local platform registry. Exact integrations, access and write permissions are confirmed during scoping.
- The audit reuses the existing form/API. No payment or live lead submission was performed during verification. Required name/email/website remain; extra qualification details are optional.
- Shared $499 audit, $7,500 setup and $2,500 monthly entry pricing remain intact. Multiple-BOT scope is quoted separately; the comparison links to existing pricing.
- Motion uses transforms/opacity, with reduced-motion support. No new image requests, packages, external API calls or fabricated performance claims were added.

## Visual and interaction verification

- Desktop 1440px: national Content page and service directory reviewed; all 13 service links present. Benefits, scope, tool layout and audit sections reviewed in the browser.
- Tablet 768px: SEO connections render as a readable six-tool grid without horizontal overflow.
- Mobile 390px: Content task selection changes the draft while the preview keeps the same measured height. Audit CTA reaches the form; empty submission triggers native required-field validation. Optional context expands correctly.
- Narrow mobile 320px: Miami Content page fits the viewport, preserving 12 related service links and nearby-market navigation.
- Homepage button computed radius verified at 3px. No horizontal overflow on the tested pages/sizes and no browser console errors observed.
- Screenshot of the national service hero captured at `/tmp/agenticbots-service-design.jpg` for the task response; temporary artifact, not a repository asset.

Automated validation results are recorded in `docs/MARKETING_BUILD_STATUS.md`. Conversion improvement is a design hypothesis, not a measured result. No deployment or push is part of this change.
