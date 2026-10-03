# What I need from you

Only things that require your accounts. Everything else is built.

| # | What | Where to get it | Where it goes | How to check |
|---|---|---|---|---|
| 1 | **AWS admin access** (not root) | AWS → IAM Identity Center user with AdministratorAccess, MFA on | `aws configure sso` on your Mac | `aws sts get-caller-identity` shows your user |
| 2 | **Engine image digest** | `docker buildx imagetools inspect nousresearch/hermes-agent:v2026.9.24` | `infra/terraform/envs/prod/terraform.tfvars` → `default_engine_image` | `terraform plan` accepts it (it rejects unpinned images) |
| 3 | **Terraform state bucket + settings** | Part 2.4–2.5 of BEGINNER_SETUP | `backend.tf`, `terraform.tfvars` | `terraform init` succeeds |
| 4 | **Vercel env vars + OIDC** | Vercel project `agenticbots` → Settings | Environment Variables; Security → OIDC (Team) | `/ops` loads in production; sync cron returns 200 |
| 5 | **Convex platform secret** | `openssl rand -hex 32` | `npx convex env set PLATFORM_SERVER_SECRET … --prod` **and** Vercel | Convex shows `pf_*` tables after first sign-in |
| 6 | **Cloudflare API token, account id, zone id** | Cloudflare → My Profile → API Tokens (scopes in BEGINNER_SETUP Part 5) | Your shell when running `tenant:provision` | Provision prints the runtime hostname; `tenant:status` → tunnel connected |
| 7 | **Model provider key(s)** | e.g. Anthropic Console → API Keys | Secrets Manager `agenticbots/prod/tenants/<tenant>/providers` | A Bot Run completes with tokens recorded |
| 8 | **DNS**: `ops.` and `app.agenticbots.dev` | Vercel → Domains (it tells you the records) | Cloudflare DNS | Both hostnames load the sign-in page |
| 9 | **Vercel Pro** (for the every-minute cron) | Vercel → Billing | — | Cron runs every minute in Vercel → Logs |
| 10 | *Later, only if you want clients to see it:* remittance details (bank name, routing/account for ACH/wire) | Your bank | Your own invoice template (not stored in the platform) | — |

Stripe is **not** needed.
