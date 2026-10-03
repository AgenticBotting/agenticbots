# Runbook — Suspend and reactivate a client

## When to use which reason

| Reason | Use when | Effect beyond the stop |
|---|---|---|
| **Billing** | Materially past due and you have decided (after contacting them) to pause service | Billing event recorded. A later payment marks the client **eligible for reactivation** — nothing restarts by itself. |
| **Manual** | Client asked to pause, onboarding hold, anything else operational | — |
| **Security** | Suspected credential leak, abuse, compromised client account | Adds a **security hold**: reactivation is blocked until a superadmin clears it. |
| **Contract ended** | Agreement terminated | Use with the agreement status `terminated`. |

## Suspend (operator console)

1. **Clients → [client] → Suspend client.**
2. Choose the reason, add a note for the record, confirm.

What happens, in order:
1. The account is marked **Suspended** — new Bot Runs, automations and
   approval resumes are refused immediately in the app.
2. Active runs are asked to stop at the next safe point.
3. Systems Manager runs `stop-runtime` on the client's server (Docker
   Compose stop).
4. **Nothing is deleted.** The encrypted data volume keeps memory,
   sessions, skills, automations, Bot profiles, configuration and history.
   The server keeps running so Systems Manager can reach it.

The client portal shows "Service is paused" and every Bot as *Paused*.

CLI equivalent: `npm run ops -- tenant:suspend --tenant <id> --reason billing`

## Reactivate

1. Clear any **manual** or **security** hold (client → Settings → Holds).
2. **Clients → [client] → Reactivate client.**

The platform starts the runtime, waits for its health check (up to ~15s
in-app; the background sync keeps checking), verifies capabilities, then
marks the account **Active**. Bots resume with their existing state.

If it says "has not passed its health check yet": wait a minute and press
**Refresh health**, then reactivate again. See *Verification* below.

CLI equivalent: `npm run ops -- tenant:reactivate --tenant <id>`

## Verification

- Client page → Overview: Runtime *Healthy*, Ready *Yes*.
- Start a short read-only Bot Run ("Summarize yesterday's activity").
- Client portal view (**Open client portal view**) shows Bots as Active.
- Audit Log shows `client.suspend` / `client.reactivate` with your name.

## If the stop did not confirm

The app still blocks execution. Open **Infrastructure**, press **Refresh
health**, and if needed connect with Session Manager (AWS console → Systems
Manager → Session Manager → Start session → the client's instance) and run:
`sudo /opt/agenticbots/bin/lifecycle.sh stop-runtime none`.
