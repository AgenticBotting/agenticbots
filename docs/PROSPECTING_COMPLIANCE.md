# Prospecting compliance and safety

## The outbound gate (in code, not in a prompt)

`sendToOutbound` (`src/server/prospecting/outbound.ts`) is the only path to
an outbound system. Immediately before every handoff it checks:

1. The caller may act for this client, and the client is not suspended/canceled.
2. The prospect is **qualified**.
3. It has a decision-maker contact whose email is **VERIFIED** or
   **LIKELY_VALID**. A CATCH_ALL address needs a person to tick
   "I checked it"; a Bot cannot.
4. **No hard suppression** matches — global or this client's — on the
   email, the domain (including subdomains), the company or the person.
   Hard suppressions cannot be overridden by anyone through this path.
   Soft suppressions can be overridden by a person (audited), never a Bot.
5. Demo contacts never reach a non-demo outbound system.
6. Per-client **daily handoff cap** (`maxLeadsExportedPerRun`, default 50).

A failed check records a `rejected_policy` handoff with the reasons and an
audit entry with result `denied`. Handoffs are idempotent per prospect +
contact + sequence.

Nothing in the Prospect Graph sends email itself. It hands a
vendor-neutral payload to an `OutboundProvider` (today: the demo provider,
which sends nothing).

## Suppression rules

* Global suppressions: superadmin only (`ops.prospecting.global_suppression`).
* Client suppressions: operators covering that client; a Bot may **add**
  one for its own client (always hard) but can never lift one.
* Unsubscribes and bounces are permanent; they cannot be lifted.
* One client's suppressions never affect or reveal anything to another.

## Data handling

* Only business contact data for business decision makers. No personal
  phone numbers, home addresses, or consumer data are collected by the
  pipeline.
* No platform scraping. Decision-maker data comes only through licensed
  providers' APIs ("Decision-maker lookup" recipe).
* Email verification uses DNS (MX) and licensed verification APIs — no
  SMTP probing of mail servers.
* No signal is ever invented. Signals carry their source and expire.
* No TAM is ever invented. Market size appears only if a person records an
  estimate with its method, and it is labeled "Estimated".
* Demo data is fictional, flagged, and never sent.

## Tenant isolation

Private tables require `orgId` and are read only via `allowed()` /
`getPrivate()`, which answer *not found* across tenants. Shared tables carry
no `orgId` and no client-private fields. Tests cover cross-client reads,
scoped operators, Bot-to-other-org access, client-view leakage and
shared-table contamination.

## Spend control

No paid call without: an implemented adapter, a credential, configured
pricing, a client budget, and room in every applicable limit (run calls,
run dollars, client/market/provider/platform monthly). Hitting a limit
stops the job or pauses it for a person's approval. A Bot cannot raise a
limit or approve spend.

## Things to confirm with counsel before live outbound

CAN-SPAM requirements in the outbound system (sender identity, physical
address, working unsubscribe honored within 10 business days), state rules
where clients operate, each data vendor's terms of use and attribution
requirements (stored in provenance `usageRestrictions`/`attribution` once
real adapters exist). This document is not legal advice.
