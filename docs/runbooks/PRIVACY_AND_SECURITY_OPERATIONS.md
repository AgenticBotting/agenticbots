# Privacy and security operations — prelaunch runbook

This procedure supports the non-course operator platform. It is not proof of compliance or a substitute for counsel's review. Nothing is live as of 2026-10-09. Never place passwords, identity documents, tokens, full customer lists or payment account numbers into privacy-case details or audit logs.

## Daily privacy desk

Open `/ops/privacy` as the owner. Review new, due and unresolved cases each business day. A client can submit an access, correction, deletion, marketing opt-out or cancellation request from `/portal/account`; an owner can record an email request. The portal shows a reference and status immediately. The code uses 24 hours for opt-out and 30 days for other **internal triage targets**; actual legal deadlines vary and must be determined by counsel for the requester. A portal cancellation request is a recorded request, with the effective date governed by the signed agreement.

Verify the requester through an existing business contact channel or a separately arranged secure process. Do not disclose one person's records to another account member because they share an organization. Record the method and authority in the case, not copies of identity documents. Mark *verified* only after that check. If verification fails, record a proportionate reason and response; give the requester a review path.

For access/correction/deletion, search the account records, requests, conversations, BOT runs and prepared work, prospecting records, billing, audit, backups and each activated processor. Export only the subject's allowable fields to a secure delivery channel. Correct active records and notify downstream processors where required. For deletion, remove or deidentify eligible operational data, apply lawful holds to restricted billing/audit records, and let encrypted backups expire on their schedule or execute a documented selective purge. Record each system checked, action, exception, processor confirmation and completion date in the case. The app does **not** yet automate cross-system export or deletion; never mark a case complete solely because a button was clicked.

For an opt-out, identify the exact address/phone and all associated active campaigns, add a hard suppression before the next send, confirm provider/CRM sync and keep a durable suppression key even if the prospect row is deleted. Marketing campaigns remain disabled until a provider and this workflow are verified. For cancellation, check the authorized signatory, signed agreement, renewal and final invoice; record the effective date and send a confirmation through the agreed channel. Do not quietly continue charging after an effective cancellation.

If a child under 13 is credibly identified, immediately stop marketing/BOT processing for that record, isolate it, avoid collecting more details, and consult counsel on verification, parental process and deletion. These B2B services do not currently target children; a neutral age gate is not collected by default.

## Staff access and recovery

The owner sets `PASSKEY_ORIGIN` to the exact operator origin. First enrollment also requires a 32+ character random `STAFF_ENROLLMENT_TOKEN`, `STAFF_ENROLLMENT_USER_ID` equal to the selected staff user ID and `STAFF_ENROLLMENT_EXPIRES_AT` no more than 24 hours in the future. Issue the temporary code through a separate verified channel, store these values in the environment's secret manager, and clear them after enrollment. They must not be committed or logged. Staff should register a backup security key while signed in. Privileged write actions require a recent verification; visit `/login/security` to reverify.

Lost-device recovery is an owner-controlled incident: independently verify identity, revoke all sessions, inspect audit history, disable the lost credential through a reviewed database procedure, issue a fresh short enrollment window scoped to the user, and record each step. Password reset alone must never remove MFA. No automated self-service recovery exists yet; test this procedure in staging before real staff onboarding.

## Incident response and recovery

When an alert, suspicious login, leaked token, webhook replay or cross-tenant access is suspected: contain the affected integration/BOT/client, revoke exposed sessions and provider credentials, preserve correlation IDs and append-only audit evidence, and open an incident. Determine tenants, records, time window and downstream actions; do not trust dashboard green status when heartbeats are stale. Rotate credentials through each provider and confirm revocation. Affected client communications, required notices and deadlines need counsel's determination.

Restore from an encrypted backup into an isolated staging environment, verify data consistency and tenant boundaries, then document recovery point/time and sign-off. Run a real restore exercise and an external availability probe before quoting uptime. Existing health and sync code do not prove 99.9% availability or automatic failover.

## Before live BOT execution or campaigns

Keep `requireExecutionRelease()` in place until staging evidence proves per-client and platform spend reservation, model/provider limits, exact-payload human approval, external idempotency, webhook and schedule retry reconciliation, and a kill switch. For email, require verified sender domain, lawful audience/source, the true legal postal address, a working unsubscribe link in every marketing message, suppression sync before sending and provider-specific delivery evidence. Record vendor agreements, retention and permitted uses. A sender decision is a business/legal release, not a code toggle.
