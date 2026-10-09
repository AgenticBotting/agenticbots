# AgenticBots — prelaunch security and legal readiness audit

**Date:** October 9, 2026. **Code reviewed:** `platform-v1`, commit `1b03fa7`. **Status: not cleared for production launch.**

The owner confirms that nothing is live, the email provider is undecided, and the intended market is the United States. This statement takes precedence over historical deployment descriptions in project documents. Findings describe risks if this code is enabled; they are not evidence of an existing breach, unlawful campaign or affected customer.

This is an audit, not a remediation release. Application behavior, credentials and infrastructure were not changed. No deployment, real purchase, paid model/vendor call, email, CRM write or production penetration test was performed.

There are **28 security findings (S01–S28)** and **5 privacy/commercial readiness findings (L01–L05)** below. Several are conditional or hardening requirements, not demonstrated exploits. Additional applicability decisions cover children, AI disclosure, accessibility and copyright. No finite source review can establish that every vulnerability has been eliminated or provide legal clearance; counsel should approve the notices/contracts and applicable-law decisions before launch.

## 1. What to address first

| Priority | Finding | Why it matters |
|---|---|---|
| Before exposing course functions | S01, S02 | Anyone can record their own paid/complimentary purchase; an unverified email can acquire another purchaser's entitlement. |
| Before enabling analytics | S07 | The root tracker can run on login, invitation, payment and client pages, including URLs containing invitation tokens. |
| Before executing client work | S09–S14 | Approval races, missing model budgets, outbound approval gaps, overridable opt-outs, duplicate webhook claims and editable audit records weaken the control system. |
| Before internet-facing operator access | S08, S16, S18–S20, S24–S26 | Vulnerable dependencies, password-only privileged access, abuse controls and deployment boundaries need hardening. |
| Before collecting real client/prospect data | L01–L03 | The current notice describes enquiry forms, not the platform's data processing. Retention, rights handling and source licensing need an operational path. |
| Before collecting money or sending campaigns | S04–S06, L04–L05 | Checkout completion, payment reconciliation, receipts, terms and sender compliance are not ready. |
| Before making enterprise uptime commitments | S27 | Health displays are not evidence of 99.9% availability, restore capability or tested failover. |

A marketing-only launch is a narrower decision than a platform launch. Keep unfinished course payment/account functions and tracking disabled at the server boundary until their findings are closed; hiding navigation is insufficient.

## 2. Your ten checks

| Requested control | Assessment | Evidence / next step |
|---|---|---|
| RLS on every table; no browser secrets | **Partial.** Convex is not PostgreSQL, so SQL RLS switches do not apply. Tenant authorization exists in services; database functions trust one server secret. Course writes have a serious exception. No genuine credential found by the limited tracked-source scan. | S01, S02, S14–S15, S22; table inventory in §6. |
| Accurate privacy notice in footer, signup and app | **Gap.** Footer link exists; notice is incomplete; course signup, invitation acceptance and platform navigation lack nearby notice links. | L01. |
| Neutral age gate / under-13 handling if applicable | **Conditional.** The current adult B2B product is not evidently child-directed. A universal date-of-birth gate is not justified by this review. An actual-knowledge handling procedure is still needed. | §5A. |
| No tracking before consent or on sensitive fields | **Gap against the requested standard.** No tracking-consent enforcement; global tracker and form-flow events exist. No installed replay or advertising pixel found. | S07. |
| Marketing unsubscribe, postal address, prompt suppression | **Not ready for campaigns.** No live campaigns; provider undecided. Suppression behavior has a confirmed defect. | S12, L04. |
| Payment terms, confirmation, easy cancellation | **Partial / conditional.** The course is a one-time purchase, not a subscription. Platform billing records manual agreements and payments. Checkout disclosures/receipts are incomplete; no consumer online cancellation flow exists. | S04–S06, L05. |
| AI disclosure in first chatbot message | **Not currently triggered by an implemented customer chatbot.** Add and test before enabling automated conversations. | §5B. |
| WCAG 2.1 AA basics | **Partially checked, not certified.** Sampled dashboard checks and proposal-dialog keyboard behavior passed; complete screen-reader, zoom, mobile and error-state coverage remains. | §5C. |
| DMCA page and registered agent for hosted user content | **Applicability review needed.** No general file-upload endpoint found; requests do store user-written content. Registration cannot be determined from source. | §5D. |
| All third-party scripts/fonts inventoried; self-host where possible | **Inventory recorded in this audit.** Geist fonts already self-host through Next. Optional Umami is the only third-party browser script found in application source; payment script integration is unfinished. | §7. |

## 3. Security findings

**Severity:** High = block the affected launch capability; Medium = hardening or operational weakness to close before an enterprise release. “Conditional” specifies the configuration, future feature, credential compromise or traffic needed. A package's advisory severity is separate from demonstrated application exploitability.

### S01 — High, confirmed source path: unauthenticated purchase forgery

**Evidence:** [convex/course.ts:157](/Users/nickthomson/Desktop/AgenticBots/convex/course.ts:157), [convex/course.ts:168](/Users/nickthomson/Desktop/AgenticBots/convex/course.ts:168), [convex/course.ts:184](/Users/nickthomson/Desktop/AgenticBots/convex/course.ts:184), [convex/course.ts:42](/Users/nickthomson/Desktop/AgenticBots/convex/course.ts:42).

`recordPurchase` is a public Convex mutation accepting caller-supplied email, amount, gateway reference and `PAID`/`COMP` status. Its handler has no authentication, staff check, server secret or verified payment event. Entitlement trusts those rows. Once these functions are deployed, a direct caller can grant course access without paying and contaminate purchase records. Restricting the Next purchase route does not protect the directly callable mutation. Convex documents this public/internal distinction in its [internal-function guidance](https://docs.convex.dev/functions/internal-functions).

**Fix / acceptance:** Make the entitlement-writing operation internal to a verified payment workflow, with a separate authorized and audited comp operation. Anonymous calls and client-provided status/amount must fail; only a verified, deduplicated server payment event can grant access. Do not treat a hard-to-guess function name as protection.

### S02 — High, confirmed configuration: purchase matching trusts an unverified email

**Evidence:** [convex/auth.ts:10](/Users/nickthomson/Desktop/AgenticBots/convex/auth.ts:10), [convex/course.ts:31](/Users/nickthomson/Desktop/AgenticBots/convex/course.ts:31), [convex/course.ts:126](/Users/nickthomson/Desktop/AgenticBots/convex/course.ts:126), [src/components/course/CourseSignIn.tsx:47](/Users/nickthomson/Desktop/AgenticBots/src/components/course/CourseSignIn.tsx:47).

Course authentication uses the Password provider without an email verification provider. Entitlement matches purchases by email and `claimPurchases` attaches orphan purchases without checking `emailVerificationTime`. Someone registering a buyer's email before the buyer can gain that buyer's course access. This finding concerns course accounts, not a demonstrated takeover of an operator account.

**Fix / acceptance:** Require verified ownership before email-based matching or claiming; prefer an authenticated purchase identity or expiring purchase-claim token. Test attacker registration, email changes and conflicting account claims.

### S03 — High, latent: paid lesson bodies would be sent before server authorization

**Evidence:** [[src/app/course/(secure)/portal/[lesson]/page.tsx:49]], [src/components/course/ReadLesson.tsx:35](/Users/nickthomson/Desktop/AgenticBots/src/components/course/ReadLesson.tsx:35), [convex/course.ts:82](/Users/nickthomson/Desktop/AgenticBots/convex/course.ts:82), [src/lib/course-content.ts:22](/Users/nickthomson/Desktop/AgenticBots/src/lib/course-content.ts:22).

The page passes lesson `blocks` to a client component before checking entitlement. The client hides the content after an access query, but data supplied as client props is already in the response. The query also trusts a caller-provided `free` boolean. **Only the two free previews have bodies today**, so this is a release trap for future paid content, not a demonstrated leak of existing paid lessons.

**Fix / acceptance:** Resolve the lesson's free/paid status from a server catalog, check entitlement on the server, and only then return the body. An unauthenticated or unpaid HTML/RSC/API response must contain none of a test paid lesson's text.

### S04 — High, conditional on payment activation: charge and entitlement are not reliably idempotent

**Evidence:** [src/app/api/course/purchase/route.ts:68](/Users/nickthomson/Desktop/AgenticBots/src/app/api/course/purchase/route.ts:68), [src/app/api/course/purchase/route.ts:78](/Users/nickthomson/Desktop/AgenticBots/src/app/api/course/purchase/route.ts:78), [src/app/api/course/purchase/route.ts:104](/Users/nickthomson/Desktop/AgenticBots/src/app/api/course/purchase/route.ts:104), [src/app/api/course/purchase/route.ts:117](/Users/nickthomson/Desktop/AgenticBots/src/app/api/course/purchase/route.ts:117), [src/components/course/Checkout.tsx:187](/Users/nickthomson/Desktop/AgenticBots/src/components/course/Checkout.tsx:187), [src/lib/nmi.ts:48](/Users/nickthomson/Desktop/AgenticBots/src/lib/nmi.ts:48).

The gateway is called before any durable intent claim. The optional key is merely forwarded as `orderid`; local purchase deduplication happens after the charge, and the UI generates a fresh key on each attempt. A timeout or database failure can leave a successful charge without entitlement. The fallback `PENDING` write is best-effort and no reconciliation worker or authenticated payment event handler was found. No gateway guarantee of charge idempotency has been established here.

**Fix / acceptance:** Use a persisted checkout intent, atomic claim, verified gateway idempotency/reconciliation, explicit request timeout, and recoverable payment states. Test simultaneous retries, charge-success/database-failure, delayed gateway responses, refunds and entitlement revocation with a fake gateway. Never automatically retry an uncertain charge as a new purchase.

### S05 — High, configuration-dependent: course payments bypass the demo guard

**Evidence:** [src/app/api/course/purchase/route.ts:41](/Users/nickthomson/Desktop/AgenticBots/src/app/api/course/purchase/route.ts:41), [src/lib/nmi.ts:101](/Users/nickthomson/Desktop/AgenticBots/src/lib/nmi.ts:101), [src/server/env.ts:34](/Users/nickthomson/Desktop/AgenticBots/src/server/env.ts:34).

Payment availability is based on the presence of NMI and Convex settings. Neither the payment route nor gateway helper calls `assertLive`. A demo deployment accidentally containing a real payment key can charge a real token despite the platform's zero-side-effect demo rule.

**Fix / acceptance:** Enforce a server-side payment-enabled setting, explicit environment validation and demo refusal at the gateway boundary. A test using demo mode plus dummy configured keys must prove the gateway is never invoked.

### S06 — Medium, launch prerequisite: checkout tokenization and PCI scope are unfinished

**Evidence:** [src/components/course/Checkout.tsx:178](/Users/nickthomson/Desktop/AgenticBots/src/components/course/Checkout.tsx:178), [src/components/course/Checkout.tsx:215](/Users/nickthomson/Desktop/AgenticBots/src/components/course/Checkout.tsx:215), [src/lib/nmi.ts:8](/Users/nickthomson/Desktop/AgenticBots/src/lib/nmi.ts:8).

The card form expects Collect.js to mount gateway fields and attach a token, but no script loader or initialization was found. Setting the public payment key can reveal a form whose tokenization path is incomplete. Comments asserting an SAQ category are not an assessment of PCI scope.

**Fix / acceptance:** Keep payment entry disabled until the documented provider integration works in its approved sandbox. Verify that PAN/CVV never enter application requests, logs, analytics or storage; obtain the appropriate PCI validation with the processor/acquirer. Do not choose a PCI questionnaire based only on these comments. Commercial checkout requirements are in L05.

### S07 — High, configuration-dependent: analytics can capture sensitive routes and invitation tokens

**Evidence:** [src/app/layout.tsx:84](/Users/nickthomson/Desktop/AgenticBots/src/app/layout.tsx:84), [src/server/services/accounts.ts:132](/Users/nickthomson/Desktop/AgenticBots/src/server/services/accounts.ts:132), [src/lib/analytics.ts:40](/Users/nickthomson/Desktop/AgenticBots/src/lib/analytics.ts:40), [src/lib/analytics.ts:53](/Users/nickthomson/Desktop/AgenticBots/src/lib/analytics.ts:53), [src/components/marketing/BotPlanFlow.tsx:42](/Users/nickthomson/Desktop/AgenticBots/src/components/marketing/BotPlanFlow.tsx:42), [src/components/marketing/BotPlanFlow.tsx:74](/Users/nickthomson/Desktop/AgenticBots/src/components/marketing/BotPlanFlow.tsx:74).

Umami is mounted in the root layout, outside `MarketingOnly`, whenever its environment settings exist. It is not gated on consent, public-route eligibility or sensitive URL filtering. Invitation links carry the activation token in `?u=...&t=...`. Umami's [tracker configuration](https://docs.umami.is/docs/tracker-configuration) documents query exclusion as an explicit setting; this code does not set it. Enabling the tracker could therefore disclose an unexpired invitation token to analytics. The same root includes `/ops`, `/portal`, login and checkout. No actual collection is established because nothing is live.

Form events currently report opening, step number and completion, not typed answers. Nevertheless, they run without a tracking choice, and the generic tracking helpers accept arbitrary properties. Server-side events also ignore consent. A checkbox allowing a reply to an enquiry is not analytics consent.

**Fix / acceptance:** Default tracking off; use explicit public-route and event-property allowlists, consent enforced on browser and server, query/hash removal, and unconditional exclusion of account, intake, chat, payment and sensitive-data surfaces under the owner's requested standard. Exchange invitation tokens promptly and remove them from the visible URL. Test that no tracking request occurs before consent, after withdrawal, or on excluded surfaces. No installed replay or advertising pixel was found; a Hotjar logo in a service illustration is not a tracker. US consent duties vary by activity/jurisdiction; this finding also enforces the owner's stricter requested policy.

### S08 — High, affected versions confirmed: dependency advisories need triage and updates

**Evidence:** [package-lock.json:55](/Users/nickthomson/Desktop/AgenticBots/package-lock.json:55), [package-lock.json:6865](/Users/nickthomson/Desktop/AgenticBots/package-lock.json:6865), [package-lock.json:7756](/Users/nickthomson/Desktop/AgenticBots/package-lock.json:7756), [package-lock.json:7941](/Users/nickthomson/Desktop/AgenticBots/package-lock.json:7941). Full snapshot: [dependency-audit.json](./security-audit-2026-10-09/dependency-audit.json).

The October 9 registry audit reports **10 affected packages: 2 critical and 8 high**. This is not ten proven remotely exploitable defects in this application.

| Package | Installed | Registry severity | Exposure assessment |
|---|---:|---|---|
| `next` | 16.3.4 | Critical | Production dependency. The critical `next/og` issue requires attacker-controlled SVG data in Node rendering; reviewed OG inputs are repository-derived, so that exploit was not established. Other cache/image/dev advisories still require route-specific triage. |
| `@auth/core` | 0.37.4 | Critical | Production course-auth dependency. Password auth is configured; OAuth-specific advisory reachability is not established. Upgrade with `@convex-dev/auth` compatibility checks. |
| `sharp` | 0.35.4 | High | Production image dependency; attacker-controlled image reachability needs validation. |
| `source-map-js` | 1.2.1 | High | Present in production dependency graph; untrusted input path not demonstrated. |
| `brace-expansion`, `braces`, `micromatch`, `fast-glob`, `@next/eslint-plugin-next`, `eslint-config-next` | See snapshot | High | Development/tooling graph; do not describe these automatically as internet-facing runtime flaws. |

The [Next.js maintainer advisory](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) identifies the critical issue's prerequisites and patched branches. The scan includes additional Next advisories with later fixes; fixing just this one is insufficient.

**Fix / acceptance:** Upgrade to compatible versions covering every applicable advisory, rerun the registry audit and full application checks, and record any non-reachable exception with evidence/expiry. Do not run `npm audit fix --force` blindly; its proposed major changes may not preserve this stack. Add continuous scanning under S28.

### S09 — High, confirmed ordering: approval decisions are not atomically bound to execution

**Evidence:** [src/server/services/approvals.ts:31](/Users/nickthomson/Desktop/AgenticBots/src/server/services/approvals.ts:31), [src/server/services/approvals.ts:52](/Users/nickthomson/Desktop/AgenticBots/src/server/services/approvals.ts:52), [src/server/services/approvals.ts:62](/Users/nickthomson/Desktop/AgenticBots/src/server/services/approvals.ts:62), [src/server/services/approvals.ts:97](/Users/nickthomson/Desktop/AgenticBots/src/server/services/approvals.ts:97).

For runtime approvals the external approve/deny call occurs before the database's versioned decision is committed. Two concurrent decisions can both reach the runtime before one database update loses its version race. Runtime-side idempotency might limit effects but is not a sufficient application guarantee. Deliverable approval launches another natural-language BOT task from the title/preview rather than a typed, immutable operation bound to the approval. A failed start is swallowed after the approval is recorded as approved.

**Fix / acceptance:** Claim the decision atomically, persist an execution command, and reconcile its result separately. Bind approval to tenant, tool, target, exact payload/hash, allowed amount/scope, expiry and one-time consumption. Approval of a summary must not authorize arbitrary actions generated afterward. Test simultaneous approve/deny, timeout, crash/retry and modified payloads; show an explicit execution failure instead of silent success.

### S10 — High, conditional on live models: BOT runs have no enforced spend reservation

**Evidence:** [src/server/services/runs.ts:46](/Users/nickthomson/Desktop/AgenticBots/src/server/services/runs.ts:46), [src/server/services/runs.ts:93](/Users/nickthomson/Desktop/AgenticBots/src/server/services/runs.ts:93), [infra/runtime/config/profile-config.yaml:6](/Users/nickthomson/Desktop/AgenticBots/infra/runtime/config/profile-config.yaml:6).

Run start validates status, task and idempotency format but does not reserve a tenant/run cost allowance or enforce aggregate concurrency, token or attempt budgets. The profile approval timeout is not a model spending cap. Prospecting provider budgets are a separate, stronger mechanism and do not cap general BOT model usage. Repeated authenticated jobs or runaway tasks can exhaust funds even without external writes.

**Fix / acceptance:** Enforce budgets and concurrency before dispatch, cap turns/tokens/retries at the runtime, reconcile actual usage, and fail closed if budget state is unavailable. Test simultaneous starts at a limit and exhausted budgets. Add provider-side account limits as a second layer.

### S11 — High, latent: outbound handoff lacks a human-approval requirement and atomic quota claim

**Evidence:** [src/server/prospecting/access.ts:46](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/access.ts:46), [src/server/prospecting/outbound.ts:55](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/outbound.ts:55), [src/server/prospecting/outbound.ts:87](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/outbound.ts:87), [src/server/prospecting/outbound.ts:123](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/outbound.ts:123), [src/server/prospecting/providers/vendors.ts:129](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/providers/vendors.ts:129).

A BOT principal is allowed to perform `outbound`. The handoff service checks qualification/suppression but not a human approval tied to the exact recipients and sequence. It can then call a provider that adds a contact to an outbound campaign. Daily cap and duplicate checks are reads preceding the external call, so simultaneous requests can exceed the intended cap. **The live sequencing adapter currently refuses as a stub**, so no real campaign send was demonstrated.

**Fix / acceptance:** Require a scoped, unexpired human approval before activation or external CRM/campaign writes; atomically reserve quota and dispatch through a recoverable outbox. Treat draft preparation separately. Test BOT-only attempts, concurrent cap exhaustion and duplicate retries before implementing a live sender.

### S12 — High, reproduced locally: unsubscribe can remain overridable

**Evidence:** [src/server/prospecting/compliance.ts:89](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/compliance.ts:89), [src/server/prospecting/compliance.ts:103](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/compliance.ts:103), [src/server/prospecting/compliance.ts:116](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/compliance.ts:116), [src/server/prospecting/outbound.ts:80](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/outbound.ts:80).

Adding an unsubscribe for an address with an existing soft suppression returns the old record unchanged, including its old reason and channels. A new `unsubscribed` record can also be created with `hard: false` by a human operator. Outbound allows a human to override soft restrictions. The local fixture reproduced both cases. Consequently, an unsubscribe is not reliably an irreversible stop signal under the current contract.

**Fix / acceptance:** Force hard suppression for unsubscribe/bounce/legal restrictions, atomically upgrade existing records and merge relevant channels, preserve evidence, and reject overrides. Recheck immediately before dispatch and cancel queued campaigns. Test existing-soft→unsubscribe, direct soft-unsubscribe input, repeated provider callbacks and concurrent send/unsubscribe.

### S13 — High, reproduced claim race; conditional replay: webhook deduplication is not atomic

**Evidence:** [src/server/services/integrations.ts:135](/Users/nickthomson/Desktop/AgenticBots/src/server/services/integrations.ts:135), [src/server/services/integrations.ts:158](/Users/nickthomson/Desktop/AgenticBots/src/server/services/integrations.ts:158), [[src/app/api/webhooks/[integrationId]/route.ts:30]], [src/server/services/runs.ts:58](/Users/nickthomson/Desktop/AgenticBots/src/server/services/runs.ts:58).

Two simultaneous `claimWebhookDelivery` calls with the same source/delivery both succeeded and inserted separate records in a fresh in-memory repository. The production flow has the same read-before-insert structure with random record IDs; each separate database mutation is atomic, but the combined decision is not. Additionally, the HMAC covers timestamp/body, while deduplication uses a separate unsigned delivery header. Someone possessing a valid captured request could change that header and replay it within the five-minute window. This does not let an outsider forge a signature from scratch. Run creation has a similar application-level read-before-insert idempotency pattern.

**Fix / acceptance:** Atomically claim a deterministic unique identity derived from authenticated event data; include the event identity in the signature contract or derive it from the signed payload. Persist processing status and retries rather than permanently dropping a failed claimed job. Verify simultaneous duplicate requests create one logical job and a changed unsigned header cannot bypass deduplication.

### S14 — High, reproduced locally: append-only protection blocks deletion but permits edits

**Evidence:** [src/server/db/repository.ts:38](/Users/nickthomson/Desktop/AgenticBots/src/server/db/repository.ts:38), [src/server/db/repository.ts:105](/Users/nickthomson/Desktop/AgenticBots/src/server/db/repository.ts:105), [convex/platform.ts:135](/Users/nickthomson/Desktop/AgenticBots/convex/platform.ts:135), [convex/platform.ts:149](/Users/nickthomson/Desktop/AgenticBots/convex/platform.ts:149).

`APPEND_ONLY` is only checked for deletion. A normal `Tx.patch` changed an existing audit record in the local fixture, and the Convex commit path likewise accepts patches. No public audit-edit route was found; this is an integrity gap against future server bugs, privileged misuse or compromise, not an anonymous audit-edit exploit.

**Fix / acceptance:** Reject updates to truly immutable audit/event records in both repositories and use linked correction events. Define narrow allowed state transitions for invoices/agreements that intentionally evolve; do not blindly ban every existing financial workflow. Test immutable fields and export security logs to a separate tamper-resistant destination.

### S15 — Medium, defense-in-depth: tenant ownership and record shape are not enforced at storage

**Evidence:** [convex/schema.ts:25](/Users/nickthomson/Desktop/AgenticBots/convex/schema.ts:25), [convex/platform.ts:21](/Users/nickthomson/Desktop/AgenticBots/convex/platform.ts:21), [convex/platform.ts:107](/Users/nickthomson/Desktop/AgenticBots/convex/platform.ts:107), [convex/platform.ts:140](/Users/nickthomson/Desktop/AgenticBots/convex/platform.ts:140), [src/server/services/common.ts:23](/Users/nickthomson/Desktop/AgenticBots/src/server/services/common.ts:23).

Every `pf_*` table uses an optional `orgId` and `doc: v.any()`. The database checks one broad server secret rather than a caller's tenant identity. Generic patches can change a document's `id` or `orgId` without changing its indexed envelope, causing ownership/index disagreement. Service authorization and isolation tests are useful controls, but this database layer cannot catch a service that omits scope or writes malformed data. It is **not correct to say these tables are anonymously public**: the server-secret check exists.

**Fix / acceptance:** Enforce runtime schemas and required tenant ownership per table, immutable identity/ownership fields, and privileged explicit paths for global/shared records. Narrow the database API or carry verifiable tenant-scoped capabilities. Test cross-tenant access, envelope mismatch, missing ownership, malformed patches and global-versus-tenant rows at the actual storage boundary.

### S16 — High, enterprise launch gate: privileged access is password-only

**Evidence:** [src/server/services/accounts.ts:153](/Users/nickthomson/Desktop/AgenticBots/src/server/services/accounts.ts:153), [src/server/auth/session.ts:16](/Users/nickthomson/Desktop/AgenticBots/src/server/auth/session.ts:16), [src/server/auth/policy.ts:56](/Users/nickthomson/Desktop/AgenticBots/src/server/auth/policy.ts:56).

An operator/superadmin password establishes a 12-hour session with access to client data, runtime controls and approvals. No MFA or recent-authentication requirement was found for privileged operations. Session secrets are random, hashed in storage, HttpOnly and Secure in production—these are positive controls, but they do not prevent misuse of stolen credentials.

**Fix / acceptance:** Require phishing-resistant MFA for staff, short-lived elevation for sensitive changes, recovery controls and session inventory/revocation. Support SSO as client requirements justify it. Test role changes, revocation, recovery and step-up bypasses before granting real tenant access.

### S17 — Medium, reproduced but intentional current behavior: empty operator scope grants all tenants

**Evidence:** [src/server/auth/policy.ts:86](/Users/nickthomson/Desktop/AgenticBots/src/server/auth/policy.ts:86).

An undefined or empty `operatorOrgIds` grants access to every organization. A fixture with an empty list could read an arbitrary tenant. The code documents this behavior, so it is not an accidental bypass of its current policy; the risk is that an empty or incompletely configured scope appears restricted to an administrator.

**Fix / acceptance:** Introduce an explicit all-tenants grant; empty means none. Make scope visible when inviting/editing operators and test empty, subset and explicit-global cases. Preserve the intended owner's superadmin access.

### S18 — Medium, confirmed implementation: abuse controls do not span instances and public inputs are loosely bounded

**Evidence:** [src/lib/rate-limit.ts:11](/Users/nickthomson/Desktop/AgenticBots/src/lib/rate-limit.ts:11), [src/server/services/accounts.ts:155](/Users/nickthomson/Desktop/AgenticBots/src/server/services/accounts.ts:155), [src/app/api/course/purchase/route.ts:52](/Users/nickthomson/Desktop/AgenticBots/src/app/api/course/purchase/route.ts:52), [src/server/api.ts:33](/Users/nickthomson/Desktop/AgenticBots/src/server/api.ts:33), [convex/course.ts:207](/Users/nickthomson/Desktop/AgenticBots/convex/course.ts:207).

Rate limits are process-local Maps; cold starts and multiple server instances do not share counts. Several routes derive identity from the first forwarded IP; whether that value is trustworthy depends on the hosting proxy. The generic body helper performs a TypeScript cast rather than runtime schema/size validation. Public waitlist writes have no application quota, weak email validation, unbounded note input, and a distinct `alreadyOn` response revealing list membership. Some platform services do bound inputs, so this is not a claim that all endpoints lack validation.

**Fix / acceptance:** Use a shared atomic limiter, trusted-proxy rules, body/content-type limits and endpoint schemas. Add uniform waitlist responses, length limits and abuse protection. Test multiple workers, malformed/oversized inputs, forged forwarding headers under the actual host and direct Convex calls that bypass Next limits.

### S19 — Medium, conditional: authenticated REST mutations lack uniform CSRF protection

**Evidence:** [[src/app/api/runs/[runId]/approve/route.ts:5]], [src/app/api/session/route.ts:13](/Users/nickthomson/Desktop/AgenticBots/src/app/api/session/route.ts:13), [src/server/auth/session.ts:22](/Users/nickthomson/Desktop/AgenticBots/src/server/auth/session.ts:22).

The session route checks origin, but other cookie-authenticated REST mutations do not uniformly do so; run approval is an example with a bodyless POST. SameSite=Lax substantially limits ordinary cross-site POST attacks. It does not by itself protect against a compromised same-site sibling origin. Next Server Action origin checks do not automatically protect custom route handlers.

**Fix / acceptance:** Centralize allowed-origin/CSRF validation for cookie-authenticated state changes, with a deliberate separate policy for signed webhooks. Test cross-site, same-site sibling and valid-origin requests; do not rely on CORS alone to prevent a request being sent.

### S20 — Medium, deployment-dependent: browser security headers are not specified in repository configuration

**Evidence:** [next.config.ts:15](/Users/nickthomson/Desktop/AgenticBots/next.config.ts:15), [src/app/layout.tsx:84](/Users/nickthomson/Desktop/AgenticBots/src/app/layout.tsx:84).

No application-level CSP, `frame-ancestors`, `X-Content-Type-Options`, Referrer-Policy or Permissions-Policy configuration was found. Production edge settings may provide some headers and were not inspected. Without effective framing restrictions, authenticated approval screens can be exposed to clickjacking; absent CSP increases the consequences of future injection or a compromised allowed script.

**Fix / acceptance:** Validate actual deployed headers; design/test a restrictive CSP, frame protection, referrer policy, MIME protection, permission restrictions and HTTPS/HSTS appropriate to owned subdomains. Start CSP in report-only mode where necessary, then enforce after testing Next, fonts, Convex and approved payment frames. A policy allowing arbitrary scripts is not a meaningful fix.

### S21 — Medium, confirmed coverage gap: authentication security events are not audited

**Evidence:** [src/server/services/accounts.ts:153](/Users/nickthomson/Desktop/AgenticBots/src/server/services/accounts.ts:153), [src/server/auth/session.ts:28](/Users/nickthomson/Desktop/AgenticBots/src/server/auth/session.ts:28), [src/server/auth/session.ts:45](/Users/nickthomson/Desktop/AgenticBots/src/server/auth/session.ts:45).

Business operations generally write audit records, but successful/failed authentication, session creation and logout do not write corresponding security events here. This limits investigation of credential attacks and session misuse.

**Fix / acceptance:** Record redacted authentication/security events with bounded retention, correlation and suitable alerts. Never log passwords, invitation tokens or cookie values. Test login failure bursts, session revocation and recovery paths; export to the protected log destination in S14.

### S22 — Medium, confirmed bypass of shared safeguards: legacy payment/error paths need secret hygiene

**Evidence:** [src/app/api/course/purchase/route.ts:117](/Users/nickthomson/Desktop/AgenticBots/src/app/api/course/purchase/route.ts:117), [src/app/api/course/purchase/route.ts:125](/Users/nickthomson/Desktop/AgenticBots/src/app/api/course/purchase/route.ts:125), [src/app/api/plan/route.ts:88](/Users/nickthomson/Desktop/AgenticBots/src/app/api/plan/route.ts:88), [src/lib/nmi.ts:18](/Users/nickthomson/Desktop/AgenticBots/src/lib/nmi.ts:18), [src/server/api.ts:28](/Users/nickthomson/Desktop/AgenticBots/src/server/api.ts:28).

The shared platform error handler redacts error messages, but legacy routes log raw error objects and the course route persists an unredacted error message. The payment helper also lacks the `server-only` import guard used by other credential modules. No actual secret in those logs or browser code was observed; these are avoidable leak paths if a dependency includes sensitive request information in errors or the module is accidentally imported client-side.

**Fix / acceptance:** Use redacted structured errors with safe public messages, prohibit raw request/token logging, add import-boundary enforcement, and scan built browser assets and git history with a dedicated secret scanner. Test seeded dummy credentials through each error path. A public Convex URL or payment tokenization public key is not itself a private API secret.

### S23 — Medium, live-runtime prerequisite: disconnect does not prove credential revocation

**Evidence:** [src/server/services/integrations.ts:171](/Users/nickthomson/Desktop/AgenticBots/src/server/services/integrations.ts:171), [src/server/services/runs.ts:93](/Users/nickthomson/Desktop/AgenticBots/src/server/services/runs.ts:93).

Disconnect changes integration status and BOT association records, but this operation does not revoke provider tokens or apply a verified tool/credential change to the runtime. A runtime already holding credentials could retain access. Hiding a connected badge is not revocation.

**Fix / acceptance:** Make disconnect an explicit reconciliation workflow: disable affected execution, remove runtime access, revoke/rotate credentials where supported, verify completion and audit failures. Test that an already-running BOT cannot continue using the disconnected integration.

### S24 — High, configuration-dependent: production mode has fail-open configuration combinations

**Evidence:** [src/server/env.ts:15](/Users/nickthomson/Desktop/AgenticBots/src/server/env.ts:15), [src/server/env.ts:59](/Users/nickthomson/Desktop/AgenticBots/src/server/env.ts:59), [src/server/runtime/runtime-factory.ts:64](/Users/nickthomson/Desktop/AgenticBots/src/server/runtime/runtime-factory.ts:64).

The platform defaults to production when `PLATFORM_ENV` is absent, while development runtime targets are disabled only when that variable is literally `production`. Consequently, a default-production process can accept `RUNTIME_DEV_TARGETS`. The store selector also permits a non-demo environment to use the in-memory repository, risking lost or divergent client data.

**Fix / acceptance:** Validate one coherent environment schema at startup. Real production must require durable storage, approved HTTPS runtime targets, correct environment-scoped secrets and explicit isolation from demo identities/settings. Reject contradictory combinations. Test omitted/misspelled mode values and preview/production separation without connecting real services.

### S25 — High, same-account deployment risk: lifecycle IAM targets are not environment-scoped

**Evidence:** [infra/terraform/modules/control-plane-role/main.tf:83](/Users/nickthomson/Desktop/AgenticBots/infra/terraform/modules/control-plane-role/main.tf:83), [infra/terraform/modules/control-plane-role/main.tf:88](/Users/nickthomson/Desktop/AgenticBots/infra/terraform/modules/control-plane-role/main.tf:88), [infra/terraform/modules/control-plane-role/main.tf:108](/Users/nickthomson/Desktop/AgenticBots/infra/terraform/modules/control-plane-role/main.tf:108).

`ssm:SendCommand` allows the environment's lifecycle document on any instance in the account/region tagged `agenticbots:managed=true`, without checking the instance's environment tag. If staging and production share an account, the staging role can target a production managed runtime using its allowed document. KMS decrypt also uses a broad managed tag, although the Secrets Manager read policy separately narrows secret paths.

**Fix / acceptance:** Constrain target environment and KMS key/context; prefer separate production and nonproduction accounts for stronger isolation. Verify using IAM policy simulation and a controlled staging denial test. Do not expand roles or apply Terraform as part of this audit.

### S26 — Medium, containment prerequisite: BOT network and host privileges need an enforced boundary

**Evidence:** [infra/terraform/modules/tenant-runtime/main.tf:191](/Users/nickthomson/Desktop/AgenticBots/infra/terraform/modules/tenant-runtime/main.tf:191), [infra/terraform/modules/tenant-runtime/main.tf:238](/Users/nickthomson/Desktop/AgenticBots/infra/terraform/modules/tenant-runtime/main.tf:238), [infra/runtime/docker-compose.yml:48](/Users/nickthomson/Desktop/AgenticBots/infra/runtime/docker-compose.yml:48), [infra/runtime/config/profile-config.yaml:6](/Users/nickthomson/Desktop/AgenticBots/infra/runtime/config/profile-config.yaml:6).

Outbound HTTPS is open to all destinations. IMDSv2 is required, but hop-limit 2 intentionally permits container access to instance metadata. The engine service sets no-new-privileges but does not explicitly drop Linux capabilities, enforce a read-only root filesystem or declare its user; the image's actual user was not inspected. Terminal and code execution are disabled, which reduces risk. A tool/runtime compromise still needs limits on credential retrieval and data exfiltration.

**Fix / acceptance:** Verify non-root execution, minimal capabilities, filesystem restrictions, isolated execution for untrusted code, blocked metadata/private-network access from BOT tools, and approved network destinations or a controlled egress proxy. Broker only required credentials/tools. Adversarially test prompt injection from websites, emails and documents against deterministic tenant, approval and budget policies. These are containment requirements, not proof that a prompt currently grants shell access.

### S27 — Medium, enterprise launch prerequisite: monitoring, incident response and recovery are unproven

**Evidence:** [src/server/services/sync.ts:16](/Users/nickthomson/Desktop/AgenticBots/src/server/services/sync.ts:16), [src/app/api/internal/sync/route.ts:7](/Users/nickthomson/Desktop/AgenticBots/src/app/api/internal/sync/route.ts:7), [infra/terraform/modules/tenant-runtime/main.tf:312](/Users/nickthomson/Desktop/AgenticBots/infra/terraform/modules/tenant-runtime/main.tf:312), [infra/terraform/modules/tenant-runtime/main.tf:328](/Users/nickthomson/Desktop/AgenticBots/infra/terraform/modules/tenant-runtime/main.tf:328), [docs/ENTERPRISE_RELIABILITY_PLAN.md:1](/Users/nickthomson/Desktop/AgenticBots/docs/ENTERPRISE_RELIABILITY_PLAN.md:1), [docs/runbooks/RESTORE_CLIENT_RUNTIME.md:1](/Users/nickthomson/Desktop/AgenticBots/docs/runbooks/RESTORE_CLIENT_RUNTIME.md:1).

Sync processes tenants serially within a 60-second route budget; caught errors become counters, and there is no durable per-job lease/checkpoint in this loop. A slow tenant can delay later tenants. CloudWatch alarms can be created with no notification action. Existing health samples, snapshots and a restore runbook are positive, but no live alert-delivery, full restore, database recovery, failover or measured availability evidence was supplied. The standard architecture is a single runtime per client; optional HA is a plan.

**Fix / acceptance:** Define availability SLO/error budget and recovery objectives; add independently monitored heartbeat/synthetic checks, actionable alerts, durable bounded job processing and reconciliation. Drill restoration of both runtime data and control-plane data, plus secret rotation and tenant containment. Establish an incident/breach response owner and counsel-reviewed notification process. Document on-call coverage appropriate to a one-person company. Do not promise 99.9% or a recovery time until measured/tested.

### S28 — Medium, build hardening: CI lacks dedicated security gates and immutable action pins

**Evidence:** [.github/workflows/ci.yml:13](/Users/nickthomson/Desktop/AgenticBots/.github/workflows/ci.yml:13), [.github/workflows/ci.yml:39](/Users/nickthomson/Desktop/AgenticBots/.github/workflows/ci.yml:39), [.github/workflows/ci.yml:53](/Users/nickthomson/Desktop/AgenticBots/.github/workflows/ci.yml:53).

CI has valuable type, lint, tests, build, white-label and infrastructure-validation checks. Actions use mutable version tags; workflow token permissions are not explicitly minimized. No dedicated dependency/secret/SAST/IaC vulnerability gates were found. An organization-level scanner could exist outside this repository and was not verified.

**Fix / acceptance:** Pin actions to reviewed commit hashes, declare least-privilege permissions, add dependency updates/advisory triage, secret scanning, static code/IaC/container scanning and a dependency/license inventory. Protect release branches and environments. Demonstrate that a seeded dummy credential and a known vulnerable fixture fail the security gate without publishing either.

## 4. Privacy and commercial readiness findings

These findings describe missing launch controls or mismatches with planned behavior. They do not assert that a particular statute applies regardless of revenue, data volume, customer location, contract terms or the service's role.

### L01 — High before collecting platform data: privacy notice does not cover actual capabilities

**Evidence:** [src/app/privacy/page.tsx:17](/Users/nickthomson/Desktop/AgenticBots/src/app/privacy/page.tsx:17), [convex/schema.ts:43](/Users/nickthomson/Desktop/AgenticBots/convex/schema.ts:43), [convex/schema.ts:52](/Users/nickthomson/Desktop/AgenticBots/convex/schema.ts:52), [convex/schema.ts:83](/Users/nickthomson/Desktop/AgenticBots/convex/schema.ts:83), [src/server/services/requests.ts:31](/Users/nickthomson/Desktop/AgenticBots/src/server/services/requests.ts:31), [src/server/prospecting/companies.ts:194](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/companies.ts:194). Missing nearby links: [src/components/course/CourseSignIn.tsx:70](/Users/nickthomson/Desktop/AgenticBots/src/components/course/CourseSignIn.tsx:70), [src/app/login/set-password/page.tsx:14](/Users/nickthomson/Desktop/AgenticBots/src/app/login/set-password/page.tsx:14), [src/components/platform/PortalNav.tsx:7](/Users/nickthomson/Desktop/AgenticBots/src/components/platform/PortalNav.tsx:7). Footer link exists at [src/components/layout/Footer.tsx:19](/Users/nickthomson/Desktop/AgenticBots/src/components/layout/Footer.tsx:19).

The notice describes enquiry forms and technical traffic data. The code additionally handles account/session information, purchase records/course progress, client requests, connected-business data, prospect names/roles/contact points, prompts/results and operational logs. It does not clearly explain these purposes, retention, AI processing, provider categories, controller-versus-processor roles or the shared prospect database. “We do not sell” needs a factual assessment of future data reuse and applicable definitions, not just the absence of an advertising pixel.

**Fix / acceptance:** Complete a data map, then rewrite the notice to match enabled processing; add notice links at collection/signup and inside both apps, not only the marketing footer. Identify the legal business/contact and actual provider categories. Keep optional marketing and analytics choices distinct from necessary service processing. Covered state privacy obligations, including business-contact data and recognized opt-out signals, require an applicability assessment; the [California Attorney General's guidance](https://oag.ca.gov/privacy/ccpa) is a useful primary reference, not evidence that AgenticBots already meets its thresholds.

### L02 — Medium: retention, deletion and rights handling lack a documented implementation path

**Evidence:** [src/app/privacy/page.tsx:29](/Users/nickthomson/Desktop/AgenticBots/src/app/privacy/page.tsx:29), [src/app/privacy/page.tsx:32](/Users/nickthomson/Desktop/AgenticBots/src/app/privacy/page.tsx:32), [convex/schema.ts:94](/Users/nickthomson/Desktop/AgenticBots/convex/schema.ts:94), [src/server/services/requests.ts:74](/Users/nickthomson/Desktop/AgenticBots/src/server/services/requests.ts:74), [src/server/prospecting/companies.ts:206](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/companies.ts:206).

The policy promises access, correction, deletion and unsubscribe handling, but no end-to-end rights workflow or retention schedule was found for accounts, requests, course records, shared prospect contacts, BOT history and downstream processors. An email address for requests is a valid starting point, but fulfillment and deadlines need an accountable process. Freshness/score TTLs do not erase stored personal data.

**Fix / acceptance:** Define purpose-based retention, identity verification, request tracking, export/correction/deletion, provider propagation and backup handling. Retain narrowly necessary financial/security records under documented exceptions; isolate mutable personal data from immutable event evidence. Test one fictional person's request across shared and tenant stores without exposing another client's information. Do not promise unconditional deletion where an exception is required.

### L03 — Medium: free provider data defaults to reusable without a license policy

**Evidence:** [src/server/prospecting/data-policy.ts:8](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/data-policy.ts:8), [src/server/prospecting/data-policy.ts:29](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/data-policy.ts:29), [src/server/prospecting/companies.ts:194](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/companies.ts:194).

Paid providers without a usage policy are rejected, but an unspecified non-paid provider inherits a policy permitting caching, cross-tenant reuse and raw display without attribution. Free access does not establish those rights, particularly for named professional contacts or restricted website content. Source provenance exists, which is useful, but does not itself establish a license or privacy basis.

**Fix / acceptance:** Require reviewed provider/source terms for free and paid data alike, default unknown rights to restricted, and enforce retention/reuse/display limits. Review shared professional-contact processing, sale/sharing and data-broker applicability before live enrichment. Create the client DPA/subprocessor arrangements appropriate to actual roles; contractual documents outside the repo were not available to verify.

### L04 — Medium, campaign launch gate: marketing email compliance is not implemented end to end

**Evidence:** [src/lib/notify.ts:37](/Users/nickthomson/Desktop/AgenticBots/src/lib/notify.ts:37), [src/lib/notify.ts:125](/Users/nickthomson/Desktop/AgenticBots/src/lib/notify.ts:125), [src/server/prospecting/compliance.ts:85](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/compliance.ts:85), [src/server/prospecting/outbound.ts:123](/Users/nickthomson/Desktop/AgenticBots/src/server/prospecting/outbound.ts:123).

No live marketing provider is selected. No complete sender identity/postal-address template, recipient unsubscribe endpoint, provider opt-out callback and queued-campaign stop path was found. The newer proposal branch intentionally emails an internal brief only; the legacy plan branch can add the address to MailerLite when configured without a separate subscription choice. Do not silently turn an enquiry into a campaign enrollment. This is a notice/expectation concern; CAN-SPAM is not a universal prior-opt-in law.

The [FTC CAN-SPAM guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) covers commercial B2B email too: accurate sender/subject, advertising identification as applicable, valid postal address, a clear opt-out, an opt-out mechanism available for at least 30 days, and honoring requests within 10 business days. Provider outsourcing does not remove sender responsibility. Purely transactional messages have different treatment; keep promotional content out of them unless the marketing rules are met.

**Fix / acceptance:** Choose the provider; configure and verify the real business postal address, domain authentication and recipient controls. Fix S12 first. Exercise subscribe/unsubscribe/reimport/queued-send scenarios with test records and provider sandbox events; enforce opt-outs immediately operationally rather than waiting ten days. An `sms:` contact link is user-initiated; outbound automated SMS/voice needs its own consent, revocation and federal/state telemarketing review before implementation.

### L05 — Medium, paid-launch gate: purchase terms, receipts and contract assent need completion

**Evidence:** [src/components/course/Checkout.tsx:237](/Users/nickthomson/Desktop/AgenticBots/src/components/course/Checkout.tsx:237), [src/app/api/course/purchase/route.ts:104](/Users/nickthomson/Desktop/AgenticBots/src/app/api/course/purchase/route.ts:104), [src/app/terms/page.tsx:15](/Users/nickthomson/Desktop/AgenticBots/src/app/terms/page.tsx:15), [src/app/terms/page.tsx:25](/Users/nickthomson/Desktop/AgenticBots/src/app/terms/page.tsx:25), [src/app/terms/page.tsx:35](/Users/nickthomson/Desktop/AgenticBots/src/app/terms/page.tsx:35).

The course pay button lacks adjacent linked purchase/refund terms and affirmative recorded assent, and success handling sends no purchase confirmation. Refund promises exist, but a complete verified refund/revocation workflow was not found. Website terms defer services to a separate signed SOW; no evidence of executed contracts or a versioned acceptance process was provided. “Continued use” wording alone should not be relied on to bind material paid-service terms.

**Fix / acceptance:** Present the total, billing cadence, product availability, refund/access terms and support contact before payment; record terms version and assent; send a reliable receipt and provide refund handling. For managed clients, counsel should review the MSA/SOW/DPA, authority to access accounts, approval responsibilities, acceptable use, AI limitations, termination/data return, uptime commitments and liability terms. Do not copy unverified guarantees into those documents.

There is **no live automatic subscription checkout** in this code. Manual invoice records do not automatically create a consumer negative-option subscription. Before introducing one, implement prominent renewal/cancellation terms, informed assent, confirmation and an easy online cancellation process appropriate to applicable law and the owner's requested one-click standard. [ROSCA](https://www.ftc.gov/legal-library/browse/statutes/restore-online-shoppers-confidence-act) is a relevant federal baseline; state automatic-renewal rules and the actual customer/product determine additional obligations. Do not infer a universal one-click requirement from ROSCA alone.

## 5. Conditional requirements and verification still needed

### A. Children / age handling

**Code touchpoints:** [src/components/course/CourseSignIn.tsx:70](/Users/nickthomson/Desktop/AgenticBots/src/components/course/CourseSignIn.tsx:70), [src/app/privacy/page.tsx:17](/Users/nickthomson/Desktop/AgenticBots/src/app/privacy/page.tsx:17). The adult contractor/enterprise positioning does not demonstrate a child-directed service, and no birthdate is currently collected. Do not add a birthdate field to every visitor merely to check a box. The [FTC COPPA guidance](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) distinguishes child-directed services and actual knowledge from general-audience services.

Adopt an adult business-use eligibility statement and a procedure for actual knowledge of under-13 data: stop nonessential processing, escalate, and obtain valid parental consent where appropriate or delete according to counsel-approved requirements. If the audience/product changes to a child-directed or mixed-audience service, implement neutral age screening and the applicable parental-consent flow before collection. A checkbox saying “13+” is not a substitute for the required regime.

### B. AI disclosure

**Code touchpoints:** [src/server/services/requests.ts:74](/Users/nickthomson/Desktop/AgenticBots/src/server/services/requests.ts:74), [src/server/services/runs.ts:93](/Users/nickthomson/Desktop/AgenticBots/src/server/services/runs.ts:93). Current support messages are explicitly sent by a human operator; the internal BOT runtime is not evidence of an implemented public support chatbot. Do not label existing human messages as AI.

Before activating customer-facing automated conversations, make the first message clearly say it is an **AI BOT**, explain its limited role and provide a human escalation path. Keep the owner's chosen policy: diagnose/prepare, human approves execution. Test every entry point and resumed conversation. The desired disclosure should be a product rule regardless of whether a particular state chatbot statute applies.

### C. Accessibility — partial verification, not a WCAG conformance claim

**Code touchpoints:** [src/components/marketing/BotPlanFlow.tsx:48](/Users/nickthomson/Desktop/AgenticBots/src/components/marketing/BotPlanFlow.tsx:48), [src/components/course/CourseSignIn.tsx:72](/Users/nickthomson/Desktop/AgenticBots/src/components/course/CourseSignIn.tsx:72), [src/components/platform/PortalNav.tsx:27](/Users/nickthomson/Desktop/AgenticBots/src/components/platform/PortalNav.tsx:27), [.github/workflows/ci.yml:36](/Users/nickthomson/Desktop/AgenticBots/.github/workflows/ci.yml:36).

Read-only browser sampling of the operator dashboard found no missing image alt attributes, unlabeled visible fields or failing contrast among the sampled visible leaf text elements. This was a limited computed-style check, not an axe run or a complete contrast audit. The proposal dialog exposes labeled options, uses a native modal, focuses its heading, closes with Escape and returns focus to its opener; no form was submitted.

Remaining acceptance work: automated accessibility checks across representative public, course, portal and operator routes; full keyboard-only task completion; a screen reader; 200% text resize/400% zoom and narrow-screen reflow; focus visibility/order; form errors/status announcements; chart/table alternatives; reduced-motion behavior; loading/empty/error states; and actual payment iframe accessibility once integrated. The [WCAG 2.1 standard](https://www.w3.org/TR/WCAG21/) is the requested technical benchmark. Do not call the site legally or technically AA-compliant based on these samples. No confirmed all-site AA failure is claimed here.

### D. Copyright / DMCA

**Code touchpoints:** [src/server/services/requests.ts:31](/Users/nickthomson/Desktop/AgenticBots/src/server/services/requests.ts:31), [src/app/terms/page.tsx:28](/Users/nickthomson/Desktop/AgenticBots/src/app/terms/page.tsx:28). No general binary upload endpoint was found, but client requests and drafts store user content. Whether to seek Section 512 safe-harbor protection needs a hosting/business-model review, not simply an “upload button present” test.

If relying on the relevant safe harbor, establish a notice/counter-notice process, designated agent publication and Copyright Office registration, repeat-infringer policy and appropriate response procedures. Registration is an external fact that this audit cannot verify. The [U.S. Copyright Office](https://www.copyright.gov/onlinesp/) describes the safe-harbor framework; a DMCA page by itself does not create protection. Also document licenses for site assets, fonts, dependency packages and commissioned/AI-assisted content.

### E. US focus, sensitive data and enterprise evidence

US-only marketing is a useful current scope, not an automatic exemption if the service later targets or monitors people abroad. Assess international expansion when the actual facts change. For US clients, determine which state privacy, breach-notification, telemarketing and sector-specific obligations apply. Do not assume all thresholds are met, or that professional contact information is exempt everywhere.

The general-purpose request and prompt fields could receive sensitive information. Define prohibited/allowed data, minimum necessary collection, provider retention/training settings, deletion and escalation. Do not claim HIPAA, SOC 2, ISO 27001, PCI certification or guaranteed uptime without the corresponding scope and evidence. Real cloud configuration, legal entity/address, processor contracts, incident contacts, backup restore results, WAF settings, domain/email authentication and provider data-use terms remain outside this source-only verification.

## 6. Database / RLS coverage inventory

Source: [convex/platformTables.ts:11](/Users/nickthomson/Desktop/AgenticBots/convex/platformTables.ts:11), [convex/schema.ts:25](/Users/nickthomson/Desktop/AgenticBots/convex/schema.ts:25), [src/lib/prospecting/types.ts:647](/Users/nickthomson/Desktop/AgenticBots/src/lib/prospecting/types.ts:647). All platform logical names below are physically prefixed **`pf_`**. Every one uses the same generic Convex envelope and server-secret boundary described in S15; none has an independent SQL RLS policy. Business-layer `can`, `getScoped`, `allowed` and `getPrivate` checks provide the current authorization boundary.

| Table group | Every table in the group | Current control / review outcome |
|---|---|---|
| Platform identity/global and operational | `users`, `memberships`, `sessions`, `organizations`, `bots`, `skill_assignments`, `runtimes`, `deployment_events`, `runs`, `run_events`, `conversations`, `activity_events`, `approvals`, `requests`, `automation_jobs`, `integrations`, `client_onboardings`, `usage_rollups`, `provider_configurations`, `service_agreements`, `invoices`, `payments`, `billing_events`, `incidents`, `operator_notes`, `audit_logs`, `processed_webhooks`, `runtime_health_samples`, `operating_drafts` | Service-level role/scope checks; some records are intentionally platform-global. Storage does not enforce each table's ownership/shape. Do not indiscriminately add `orgId` to global identities. S14–S15, S17. |
| Shared Prospect Graph | `pg_import_runs`, `pg_niches`, `pg_buyer_types`, `pg_relationships`, `pg_companies`, `pg_company_sources`, `pg_fact_claims`, `pg_company_merge_reviews`, `pg_people`, `pg_company_people`, `pg_contact_points`, `pg_domain_intel`, `pg_signals` | Shared market intelligence, not arbitrary tenant-private fields. Operator/BOT access policy and client allowlisted projections exist. Shared personal data still needs L01–L03. |
| Private Prospect Graph | `pg_icps`, `pg_markets`, `pg_prospects`, `pg_jobs`, `pg_market_builds`, `pg_handoffs`, `pg_outcomes` | `orgId` required by domain convention; `getPrivate` checks it. Generic storage does not enforce that convention. |
| Mixed-scope Prospect Graph | `pg_paid_operations`, `pg_cost_events`, `pg_budgets`, `pg_suppressions` | Tenant rows plus intentionally platform-level rows; need explicit schema/policy for both. |
| Course tables, no `pf_` prefix | `users`, `purchases`, `progress`, `waitlist` | Separate course identity system. Entitlement/progress queries require auth; purchase creation does not. Waitlist insertion intentionally public but inadequately bounded. S01–S03, S18. |
| Imported course-auth tables | `authSessions`, `authAccounts`, `authRefreshTokens`, `authVerificationCodes`, `authVerifiers`, `authRateLimits` | Auth-library controlled functions; not independently reimplemented or proven through a live database audit. Dependency and verification findings S02/S08 apply. |

This covers the schema/table registry, not every possible state in a deployed database. Before release, test anonymous, customer A, customer B, scoped operator and superadmin against the deployed staging function surface. The source schema is not evidence that a cloud deployment has applied it.

## 7. Browser script, font and service inventory

| Item | Evidence | Browser behavior / recommendation |
|---|---|---|
| Geist and Geist Mono | [src/app/layout.tsx:2](/Users/nickthomson/Desktop/AgenticBots/src/app/layout.tsx:2), [src/app/layout.tsx:10](/Users/nickthomson/Desktop/AgenticBots/src/app/layout.tsx:10) | `next/font/google` downloads at build time and self-hosts font files with the app. Visitors need not contact Google Fonts. Keep this approach; retain font license records. Verified against the installed Next font guide. |
| Umami | [src/app/layout.tsx:84](/Users/nickthomson/Desktop/AgenticBots/src/app/layout.tsx:84), [src/lib/analytics.ts:53](/Users/nickthomson/Desktop/AgenticBots/src/lib/analytics.ts:53) | Optional script from configured Umami host; optional server events. Hosting/provider choice not confirmed. Apply S07 and inventory the actual URL/version before enabling. |
| Next/React/application bundles | [src/app/layout.tsx:73](/Users/nickthomson/Desktop/AgenticBots/src/app/layout.tsx:73), [package-lock.json:6865](/Users/nickthomson/Desktop/AgenticBots/package-lock.json:6865) | First-party-served framework/application code; dependency hardening under S08. Development tooling must not be exposed as a production server. |
| Convex course client/auth | [src/components/course/CourseProvider.tsx:3](/Users/nickthomson/Desktop/AgenticBots/src/components/course/CourseProvider.tsx:3), [src/components/course/CourseProvider.tsx:14](/Users/nickthomson/Desktop/AgenticBots/src/components/course/CourseProvider.tsx:14) | Bundled library opens network connections to the configured Convex backend for the course. Not a remotely injected analytics script, but still a processor/connection in the data map. |
| Collect.js / gateway frames | [src/components/course/Checkout.tsx:215](/Users/nickthomson/Desktop/AgenticBots/src/components/course/Checkout.tsx:215) | Referenced but loader/initialization absent. Not currently a discovered installed script. When implemented, inventory approved gateway origins and frame behavior. Do not self-host payment collection code contrary to the provider's integration requirements. |
| JSON-LD | [src/components/JsonLd.tsx:11](/Users/nickthomson/Desktop/AgenticBots/src/components/JsonLd.tsx:11) | Inline structured data, not third-party executable JavaScript. Currently repository-derived; safely encode if untrusted CMS/user content is ever introduced. |
| Icons and brand marks | [src/components/marketing/ServicePlatformConstellation.tsx:36](/Users/nickthomson/Desktop/AgenticBots/src/components/marketing/ServicePlatformConstellation.tsx:36) | Local components/package assets. Google Analytics/Hotjar/vendor logos do not mean those trackers are installed. Confirm trademark/license usage separately. |

No additional advertising pixel, session replay script, remote Google Fonts stylesheet or arbitrary third-party script tag was found in reviewed application source. Dynamic provider content, production edge injections, tag-manager settings, browser extensions and externally configured scripts were not observable from this repository and are not certified absent.

Server-side dependencies must also appear in the processing/vendor inventory when activated: Convex; hosting; AWS Secrets Manager/SSM/EC2/CloudWatch/backups; Cloudflare connectivity; configured model providers/runtime; NMI/EasyPayDirect; Resend; the legacy MailerLite path; and prospecting providers. The listed prospecting vendor adapters are stubs rather than proof of working paid integrations. Keep enabled vendors, data categories, purposes, retention, regions, agreements and removal procedures in an owner-maintained register. The undecided email provider must not be described as selected in the privacy notice.

## 8. Evidence and limits

| Check | Result |
|---|---|
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed with **0 errors, 5 existing warnings**. |
| `npm test` | **250 tests passed across 38 files**. An initial restricted run could not bind local fake servers; rerunning with the required local permission passed. No paid/live service calls. |
| `npm audit --json` | Registry scan completed; **10 affected packages, 2 critical / 8 high**. Dependency details saved alongside this report. |
| Temporary memory-only security probes | Audit patch accepted; two identical concurrent webhook claims accepted; unsubscribe failed to upgrade an existing soft restriction; direct soft unsubscribe accepted; empty operator scope granted arbitrary-tenant access. Results saved alongside this report. |
| Tracked-source secret-pattern scan | 593 text files examined. Only matches were explicitly fictional redaction test fixtures at [tests/unit/sanitize.test.ts:8](/Users/nickthomson/Desktop/AgenticBots/tests/unit/sanitize.test.ts:8). Tracked environment files are examples only. This limited scan is not a git-history, entropy, deployed-secret or compiled-bundle certification. |
| Browser sampling | Operator dashboard basic labels/alt/contrast sample; public contact/privacy-link inspection; proposal modal labels, focus/keyboard/Escape/return-focus. No form submission or transaction. |
| Production build / full E2E / cloud penetration test | Not run for this audit. No application pages/routes/config changed; deployed headers, IAM, DNS, provider consoles and live auth/payment behavior remain unverified. |

**Controls worth retaining:** tenant-aware loaders/services with cross-tenant not-found responses; client response allowlists; runtime/provider boundaries and tests; secret redaction utilities; hashed sessions and secure cookies; status/approval gates; fail-closed paid prospecting budgets; fictional demo labeling; no public inbound runtime security-group rules; encrypted volumes; pinned runtime images; backup and staging runbooks. Their presence is not proof that the gaps above are closed.

The fixture results are preserved in [proof-results.json](./security-audit-2026-10-09/proof-results.json). To reproduce against the audited source with no persistent data or external calls:

```bash
node --conditions=react-server --import tsx docs/security-audit-2026-10-09/reproduce.mjs
```

This script reports observed behavior; it is not a passing security regression test and should not be used to bless the defects. After remediation, the unsafe outcomes should change or be rejected.

## 9. Remediation order and release evidence

1. **Close public entry points first:** S01/S02, S07/S08, S18–S20. Leave payment and sensitive tracking off. Verify direct database-function access, not just UI paths.
2. **Make authorization and execution durable:** S09–S15, S17, S21–S24. Build regression tests for approval races, atomic claims, immutable audit events, opt-outs, run budgets and real credential revocation.
3. **Harden operator/runtime deployment:** S16, S25–S28. Prove environment separation, MFA, alerts, least privilege, recovery and job reconciliation in an explicitly authorized staging environment. Keep the standard isolated tier; implement/test optional HA before selling it as available.
4. **Finish collection and commercial controls:** L01–L05, S03–S06. Have counsel review actual data processing, selected vendors, notices and agreements. Complete sandbox payment/email acceptance testing before enabling those capabilities.
5. **Record release evidence:** production-like headers and consent network trace; anonymous/cross-tenant negative tests; no browser secrets; dependency exceptions; WCAG task checklist; payment reconciliation/refund proof; unsubscribe proof; backup restore evidence; signed vendor/client terms and named incident-response ownership. Repeat after material changes.

No finding is marked remediated by this audit. Each closure should name its implementation commit, test evidence and any remaining deployment action. A successful test suite is necessary but does not replace this release review.
