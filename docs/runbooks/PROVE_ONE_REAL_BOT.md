# Prove one real AgenticBots BOT

_Last updated: October 16, 2026_

## What exists today

The public website and interface build successfully on Vercel. AWS has the
protected Terraform state, CloudTrail, security alarms and cost controls. The
deployed Vercel project currently has no platform environment variables, no
Convex staging database and no client runtime. There is therefore no real BOT
behind the deployed dashboard yet.

The software becomes a working system when this chain passes:

```text
Operator screen -> AgenticBots server -> Convex record -> AWS test runtime
-> Hermes BOT profile -> model response -> Convex result -> refreshed screen
```

## What can be tested immediately

Run `npm run demo`, open `http://localhost:3003/login`, and sign in with:

- email: `admin@agenticbots.demo`
- password: `agenticbots-demo`

Open **Bots**, choose a BOT, enter a task and select **Start Bot Run**. This
proves the interface, permissions, records, run states and review flow. The
answer is a labeled simulation produced by `DemoRuntimeAdapter`; it does not
call a model or AWS.

## The first real proof

Use one fictional company, one SEO BOT and one harmless task:

> List three practical local-SEO checks a roofing contractor's website should
> pass. Reply in under 120 words. Do not use tools.

The proof passes only when all of these are true:

1. The AWS runtime reports healthy and the expected Hermes version/digest.
2. The effective BOT tool list is empty; no browser, terminal, code execution,
   messaging or external integration is available.
3. `run:test` reaches `completed` and reads the result back from Convex.
4. The operator console shows the same run after a browser refresh.
5. The run stores timestamps, events, model usage, correlation id and audit
   records without a secret appearing anywhere.
6. Repeating the same idempotency key does not create a second execution.
7. Stop/start recovers the runtime and its stored state.
8. The instance can be removed with the reviewed cleanup procedure while
   required evidence and protected data volumes remain.

## What is still needed

Only three outside services are missing from the test harness:

1. A separate `agenticbots-staging` Convex project for durable platform data.
2. A Cloudflare-managed runtime domain and least-privilege API token for the
   private outbound tunnel.
3. One server-side model API key with a small provider-enforced staging limit.

Do not paste any key into chat or source code. The setup flow places values in
the correct provider secret store without printing them.

The AWS side can now stay under the existing $50 hard limit: staging defaults
to `enable_vercel_control_plane=false`, so the local operator app uses the
owner's short-lived AWS login. Advanced AWS features and Vercel OIDC are not
needed to prove the BOT and remain a later explicit owner decision.

## Execution order

1. Qualify the current stable Hermes candidate in an isolated AWS staging
   runtime. Docker runs on that server; it is not required on the owner's Mac.
2. Create/configure the separate Convex and Cloudflare staging resources.
3. Generate the exact Terraform plan and verify zero destroys/replacements and
   the current $50 hard limit.
4. Create one fictional tenant and one SEO BOT.
5. Run the task above from the command line and the operator screen.
6. Test restart, duplicate prevention, audit evidence and cleanup.

The detailed commands and recovery steps remain in
`docs/runbooks/FIRST_STAGING_TEST.md`.
