# Runbook — Billing and payments (manual, no card processor)

All money is entered in dollars and stored as exact cents. Every change is
recorded in **Billing events** and the **Audit Log** with your name.

## 1. Create a service agreement
Client → **Billing** tab → *Create service agreement*:
monthly value (e.g. 7,500), implementation/setup fees, frequency, payment
terms (e.g. Net 5), preferred method (ACH / wire), start and renewal dates,
grace period (default 7 days). Leave **auto-suspend** and **auto-reactivate
off** unless you have a reason.

## 2. Create an invoice
**Billing → Invoice** (or client Billing tab → *Create invoice*). Tick the
monthly fee and/or implementation fee, add any custom lines, adjust dates.
It is created as a **draft**.

## 3. Send it
Send the invoice through your usual process (PDF by email, your accounting
tool). Then click **Mark as sent** — the platform does not email it.

## 4. Record an ACH payment
When the ACH shows in your bank: open the invoice → **Record payment** →
amount, date received, method **ACH**, the ACH trace/reference, notes →
*Record payment*. The balance and status update immediately.

## 5. Record a wire payment
Same as ACH; method **Wire**; reference = the Fed reference / IMAD shown by
your bank.

## 6. Record a partial payment
Enter the amount actually received. The invoice becomes **Partially paid**
with the remaining balance. Record the next payment the same way.
(Overpayments are refused: record the invoice balance and note the extra.)

## 7. Mark an invoice past due
It happens automatically the day after the due date (background sync). To
do it early, open the invoice → **Mark past due**.

## 8. How the grace period works
Past due → grace period (agreement setting, default 7 days) → **Eligible for
suspension**. Eligibility only *flags* the client (dashboard, billing list,
incident). It never suspends anyone unless the agreement explicitly enables
auto-suspend.

## 9. When a client becomes eligible for suspension
Shown on the Dashboard and **Billing → Past due**. Call them first. Then
either extend (do nothing / add a note), add a **billing hold** as a flag,
or suspend.

## 10. Suspend for billing
Client page → **Suspend client** → reason **Billing**. See
`SUSPEND_CLIENT.md`.

## 11. Record a payment while suspended
Exactly as above. If the client was suspended for billing and nothing is
past due any more, you will see **PAYMENT RECEIVED — CLIENT ELIGIBLE FOR
REACTIVATION**. Nothing restarts automatically.

## 12. Reactivate
Client page → **Reactivate client**.

## 13. Correct a mistaken payment (never delete)
Open the invoice → in *Payments*, **Reverse** the wrong one with a reason.
A negative correction record is added, the original stays, the balance is
restored. Then record the correct payment. Invoices with payments cannot be
voided until the payments are reversed.

## Never
- Never enter bank logins, passwords or full account numbers anywhere.
- Never delete financial records (the system refuses).
