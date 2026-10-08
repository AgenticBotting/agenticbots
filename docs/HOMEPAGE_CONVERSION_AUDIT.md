# Homepage conversion audit and redesign — 2026-10-08

Status: implemented locally. No deployment, push, paid API call or real lead submission.

## What the audit found

The previous homepage described an operating architecture before explaining why a contractor should care. Its large, asymmetric headline pushed the product demonstration below the initial view. Similar technical records repeated down the page, while the paid audit competed with abstract implementation language.

| Finding | Buyer consequence | Implemented change |
|---|---|---|
| “Your operating model, extended” does not name a practical benefit | Visitors must translate the proposition themselves | “More opportunities. Less manual work.” followed by a plain description of the managed service |
| Headline size and split composition separate promise, explanation and action | The initial decision requires too much scanning | Centered hero with paired audit/preview actions and a large workspace immediately beneath |
| Architectural labels dominate the narrative | Features precede the reason to buy them | Demand, sales follow-up and repeat-business sections, each with a small product illustration and relevant service link |
| Repeated diagrams and operating records make every section feel similar | Weak visual rhythm and slow comprehension | Alternate benefit panels, connected tools, interactive workflow, launch steps, pricing, FAQ and audit deliverable/form |
| Recognizable systems lack an obvious role in the story | Visitors cannot quickly see how this fits their business | Tool constellation paired with existing-software positioning and explicit scoping language |
| Paid audit asks for context before showing its value | Unclear exchange of money for a concrete output | Deliverable preview, $499 price, turnaround after payment and implementation price qualification |
| Qualification questions dominate intake | Optional fields look like required work | Name, work email and website remain required; phone, trade and volume sit behind optional disclosure |
| No measured customer proof exists | Brand trust must rest on clarity and an accountable process | Clearly fictional previews, transparent scope/pricing, explicit approval points, named company/about link and concrete audit deliverables |

## Reference images applied

The supplied Deflexai reference informed the centered promise, restrained orbital tool marks, alternating product explanations and visible workflow states. The supplied Earnify reference informed the wide software preview, interface-led benefit panels, short implementation sequence and straightforward pricing hierarchy.

The implementation retains AgenticBots’ Geist typography and white/olive palette. Reference graphics, customer logos, testimonials and metrics were not copied. Product scenes are local HTML/CSS/SVG; no generated people or additional raster assets were introduced.

## Buying journey

1. **Understand the value:** concise benefit and managed-service description.
2. **See the product:** switch between Marketing, Sales follow-up and Repeat business examples.
3. **Find a relevant need:** three buyer outcomes lead to existing service destinations.
4. **See the fit:** familiar tools with connection details confirmed through scoping.
5. **Understand control:** manually explore Receive → Prepare → Approve → Record.
6. **Understand delivery:** audit, implementation, ongoing management.
7. **Qualify the investment:** setup, retainer, BOT scope and exclusions from the shared pricing configuration.
8. **Resolve objections:** software compatibility, management, approvals, costs and the status of demonstrations.
9. **Request the audit:** concrete deliverables beside a shorter form; no payment is taken by this form.
10. **Explore local coverage:** existing regional destinations and market hub.

## Implementation and interaction

- Homepage-specific styling lives in `src/app/home.css`; shared service-page and navigation design is preserved.
- `HomeWorkspace` is a local, manually controlled client component. Static reference illustrations stay in the server component module `HomeVisuals`.
- The existing workflow approval reducer and its tests remain intact. There is no scroll hijacking or automatic scene advancement.
- Narrow layouts stack product phases and pricing. Connected tools become a grid to avoid overlapping labels. Preview controls retain 44px minimum height.
- Reduced-motion preferences disable the new motion. Focus indicators, heading hierarchy and existing canonical service/market links remain.
- Compact audit mode preserves the existing `/api/plan` payload, validation, error and success behavior. Other form instances retain the original full layout.

## Evidence and limits

This is a conversion hypothesis, not a measured conversion increase. Evaluate qualified audit requests, paid audits and subsequent implementation acceptance after launch; distinguish those from button clicks. Existing intake success measurement remains server-side.

The greatest remaining trust gap is verified customer evidence. Add approved case studies with measured starting conditions and outcomes when available. Do not substitute upstream engine benchmarks or illustrative UI values for customer results.

Validation: typecheck, lint with zero errors, 177 tests and the full Webpack production build passed. All 13,753 static outputs generated; internal-link, SEO and topic gates passed. Rendered homepage HTML has one H1, no duplicate IDs and no unresolved in-page anchors. New tests cover shared commercial terms, required versus optional intake fields, and the fictional/local-only preview contract.

Live HTTP rendering was available. Browser automation remained attached to an earlier connection-error document and its URL security policy blocked inspection. A manual refresh was requested; no browser-policy bypass or real lead submission was attempted. New desktop/mobile screenshots and interaction checks remain unverified in this pass.
