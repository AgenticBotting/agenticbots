# What I need from you

Only things that require your accounts. Everything else is built.
For the **first staging test**, follow docs/runbooks/FIRST_STAGING_TEST.md instead — it covers the staging versions of these.

| # | What | Where to get it | Where it goes | How to check |
|---|---|---|---|---|
| 1 | **AWS project access** | Social login protected by MFA; selected Region `us-east-2` in AWS Settings | `aws login --profile agenticbots-staging` | `aws sts get-caller-identity --profile agenticbots-staging` succeeds |
| 2 | ~~Engine image digest~~ — **done**: pinned in `terraform.tfvars.example` (read from Docker Hub 2026-10-03). Optional re-check: `docker buildx imagetools inspect nousresearch/hermes-agent:v2026.9.24` | — | `terraform.tfvars` → `default_engine_image` | `terraform plan` accepts it |
| 3 | **Terraform state bucket + settings** | Part 2.4–2.5 of BEGINNER_SETUP | `backend.tf`, `terraform.tfvars` | `terraform init` succeeds |
| 4 | **Prepared advanced AWS features transition + Vercel env vars/OIDC** | First review replacement budgets/anomaly alerts, Region SCP, management-account recovery/MFA and CloudTrail. Activation is irreversible and removes the project spend limit. Vercel project `agenticbots` → Settings | AWS Settings only after explicit owner decision; then Vercel Environment Variables and Security → OIDC (Team) | Terraform can create/read the provider; `/ops` loads in production |
| 5 | **Convex platform secret** | `openssl rand -hex 32` | `npx convex env set PLATFORM_SERVER_SECRET … --prod` **and** Vercel | Convex shows `pf_*` tables after first sign-in |
| 6 | **Cloudflare API token, account id, zone id** | Cloudflare → My Profile → API Tokens (scopes in BEGINNER_SETUP Part 5) | Your shell when running `tenant:provision` | Provision prints the runtime hostname; `tenant:status` → tunnel connected |
| 7 | **Model provider key(s)** | e.g. Anthropic Console → API Keys | Secrets Manager `agenticbots/prod/tenants/<tenant>/providers` | A Bot Run completes with tokens recorded |
| 8 | **DNS**: `ops.` and `app.agenticbots.dev` | Vercel → Domains (it tells you the records) | GoDaddy DNS (where agenticbots.dev lives today) | Both hostnames load the sign-in page |
| 9 | **Vercel Pro** (only for an every-minute background sync in production; the Hobby plan allows one cron run per day, which is what `vercel.json` now uses) | Vercel → Billing | then set the cron in `vercel.json` back to `* * * * *` | Cron runs every minute in Vercel → Logs |
| 10 | *Later, only if you want clients to see it:* remittance details (bank name, routing/account for ACH/wire) | Your bank | Your own invoice template (not stored in the platform) | — |

Stripe is **not** needed.
