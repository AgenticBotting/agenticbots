# What I need from you

Only things that require your accounts. Everything else is built.
For the **first staging test**, follow docs/runbooks/FIRST_STAGING_TEST.md instead — it covers the staging versions of these.

| # | What | Where to get it | Where it goes | How to check |
|---|---|---|---|---|
| 1 | **AWS project access** | Social login protected by MFA; selected Region `us-east-2` in AWS Settings | `aws login --profile agenticbots-staging` | `aws sts get-caller-identity --profile agenticbots-staging` succeeds |
| 2 | **Hermes staging qualification** — current `v0.22.2` metadata is recorded, but promotion is blocked | AgenticBots qualification runs on an isolated AWS staging server; Docker is not needed on your Mac | After every gate passes, update `terraform.tfvars` to the reviewed digest | Contract, smoke, SBOM, restore and staging-canary gates all pass |
| 3 | ~~Terraform state bucket + audit foundation~~ — **done** | Applied and verified October 16 | Protected S3 backends | `terraform plan` reports no changes |
| 4 | ~~AWS security-alert subscription and delivery proof~~ — **done**. Management recovery/MFA and advanced features are later production work | Advanced activation is not needed for the first real BOT proof and would remove the project spend limit. | Keep staging `enable_vercel_control_plane=false` and use the short-lived AWS profile | SNS is confirmed; the $50 hard limit stays active |
| 5 | ~~Separate Convex staging project and platform secret~~ — **done** | Created and deployed October 16 | Staging Convex environment and ignored local `.env.staging` | Functions deploy; repository health check succeeds |
| 6 | **Cloudflare runtime domain, API token, account id and zone id** | Cloudflare dashboard (least-privilege scopes in BEGINNER_SETUP Part 5) | Local environment while running `tenant:provision` | Provision prints the runtime hostname; `tenant:status` reports the tunnel connected |
| 7 | **One capped staging model-provider key** | Approved provider console; set the provider's smallest practical spend limit | Secrets Manager `agenticbots/staging/tenants/<tenant>/providers` | The harmless first BOT task completes and records usage |
| 8 | **DNS**: `ops.` and `app.agenticbots.dev` | Vercel → Domains (it tells you the records) | GoDaddy DNS (where agenticbots.dev lives today) | Both hostnames load the sign-in page |
| 9 | **Vercel Pro** (only for an every-minute background sync in production; the Hobby plan allows one cron run per day, which is what `vercel.json` now uses) | Vercel → Billing | then set the cron in `vercel.json` back to `* * * * *` | Cron runs every minute in Vercel → Logs |
| 10 | *Later, only if you want clients to see it:* remittance details (bank name, routing/account for ACH/wire) | Your bank | Your own invoice template (not stored in the platform) | — |

Stripe is **not** needed.
