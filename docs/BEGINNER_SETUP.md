# Beginner setup — from zero to your first real client

Read top to bottom once. Each part says **what**, **where**, and **how to
check it worked**. You do not need Stripe or any card processor.

> **Doing the first AWS staging test?** Follow
> [runbooks/FIRST_STAGING_TEST.md](runbooks/FIRST_STAGING_TEST.md) instead —
> it is the staging-specific, step-by-step version of Parts 1–6.

---

## Part 0 — Try it first (no accounts needed)

```bash
npm install
npm run demo          # = DEMO_MODE=true next dev -p 3003
```

Open http://localhost:3003/login. Demo sign-ins are listed on the page
(password `agenticbots-demo`):

| Who | Email | Lands on |
|---|---|---|
| You (superadmin) | admin@agenticbots.demo | `/ops` — operator console |
| Operator | operator@agenticbots.demo | `/ops` |
| Client admin | owner@acmeroofing.demo | `/portal` — client portal |
| Client member | staff@acmeroofing.demo | `/portal` (cannot approve) |

Everything is fictional (Acme Roofing, Bayside Plumbing, Coastal Air &
Heat). Demo mode never calls AWS, the runtime, a model provider, email, a CRM
or an ad account. **Settings → Reset demo data** starts over.

---

## Part 1 — Accounts you need

| Account | Why | Cost (rough) |
|---|---|---|
| GitHub | Code + CI (already have) | free |
| Vercel | Hosts the app (already connected: project `agenticbots`) | Pro needed for the every-minute cron (~$20/mo) |
| Convex | Platform database (already used by the course) | free tier to start |
| AWS | One server per client | ~$45–80/month per client runtime |
| Cloudflare | Private tunnel to each client server; DNS for `agenticbots.dev` | free tier works |
| Model provider (Anthropic, OpenAI, OpenRouter…) | The Bots' AI | usage-based |
| Optional: QuickBooks/Xero | Your existing invoicing | — |

---

## Part 2 — AWS from the beginning

### 2.1 Sign in safely
1. Sign in at https://console.aws.amazon.com with the **root** email once.
2. **Turn on MFA for root:** top-right account menu → *Security credentials* →
   *Assign MFA device* → authenticator app.
3. **Stop using root.** Go to **IAM Identity Center** → *Enable* → *Users* →
   *Add user* (yourself) → *Permission sets* → create `AdministratorAccess` →
   *AWS accounts* → assign your user + that permission set. Use the Identity
   Center sign-in URL from now on, with MFA.

### 2.2 Install the tools on your Mac
```bash
brew install awscli terraform jq
aws configure sso          # session name: agenticbots, region: us-east-1
aws sso login --profile <the profile name it printed>
export AWS_PROFILE=<that profile>
aws sts get-caller-identity   # ✔ shows your account and your user — not root
```

### 2.3 Pick a region
Use **us-east-1** (N. Virginia) unless you have a reason not to. Everything
below assumes it; change `region` in `terraform.tfvars` if you pick another.

### 2.4 Terraform state (one time)
Terraform remembers what it created in a state file. Keep it in S3:
```bash
aws s3api create-bucket --bucket agenticbots-tfstate-<something-unique> --region us-east-1
aws s3api put-bucket-versioning --bucket agenticbots-tfstate-<…> --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket agenticbots-tfstate-<…> --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```
Put that bucket name into `infra/terraform/envs/prod/backend.tf`.

### 2.5 Fill in your settings
```bash
cd infra/terraform/envs/prod
cp terraform.tfvars.example terraform.tfvars
```
Edit `terraform.tfvars`: your Vercel team slug (Vercel → Settings → General
→ *Team URL*), a unique `artifact_bucket` name, your alert email, and the
pinned engine image with digest:
```bash
docker buildx imagetools inspect nousresearch/hermes-agent:v2026.9.24   # copy the Digest
```

### 2.6 Terraform plan, then apply
```bash
terraform init
terraform plan -out tfplan      # READ IT: VPC, IAM role, SSM document, backups, S3, SNS
terraform apply tfplan
terraform output control_plane_role_arn     # copy this for Vercel
```
✔ Check: AWS console → **Systems Manager → Documents → Owned by me** shows
`AgenticBots-RuntimeLifecycle`; **IAM → Roles** shows `agenticbots-control-plane`.
Confirm the SNS email subscription AWS sends you.

### 2.7 What each AWS service does for you
- **EC2** — one small server per client running that client's Bots.
- **EBS** — the server's encrypted disk; `/opt/agenticbots/data` holds all Bot state.
- **Systems Manager** — runs fixed maintenance actions (start/stop/restart,
  park a Bot) and gives you a browser shell (**Session Manager**) without SSH.
- **Secrets Manager** — every key (runtime keys, model keys, tunnel tokens).
- **CloudWatch** — alarms for a failed server or a nearly full disk (emails you).
- **Backups** — Data Lifecycle Manager snapshots every data volume daily (30 days).

---

## Part 3 — Database (Convex)

The course already uses Convex. The platform adds `pf_*` tables to the same
deployment.
```bash
npx convex deploy                                     # pushes the new schema + convex/platform.ts
openssl rand -hex 32                                  # → PLATFORM_SERVER_SECRET
npx convex env set PLATFORM_SERVER_SECRET <that value> --prod
```
✔ Check: Convex dashboard → Data shows tables like `pf_organizations`.

---

## Part 4 — Vercel

1. **Environment variables** (Project → Settings → Environment Variables →
   Production). Copy names from `.env.example`. At minimum:
   `CONVEX_URL`, `NEXT_PUBLIC_CONVEX_URL`, `PLATFORM_SERVER_SECRET` (same
   value as Convex), `CRON_SECRET` (`openssl rand -hex 24`), `AWS_REGION`,
   `AWS_ROLE_ARN` (from 2.6), `OPS_HOST=ops.agenticbots.dev`,
   `APP_HOST=app.agenticbots.dev`, `PLATFORM_ENV=production`,
   `DEMO_MODE=false`. **No AWS access keys. No Stripe keys.**
2. **OIDC:** Project → Settings → **Security → Secure backend access with
   OIDC federation** → enable, issuer mode *Team*. (The Terraform role
   already trusts `oidc.vercel.com/<your team>` for the `production`
   environment of project `agenticbots`.)
3. **Domains:** Project → Settings → Domains → add `ops.agenticbots.dev`
   and `app.agenticbots.dev`.
4. **Deploy** (push to `main` or *Redeploy*). `vercel.json` adds the
   every-minute cron to `/api/internal/sync`.
5. **First superadmin** (from your Mac, with the production Convex env):
   ```bash
   CONVEX_URL=… PLATFORM_SERVER_SECRET=… OPS_URL=https://ops.agenticbots.dev \
     npm run ops -- user:bootstrap --email you@agenticbots.dev --name "Your Name"
   ```
   Open the printed link, set a 12+ character password.

✔ Check: https://ops.agenticbots.dev shows the sign-in, you land on the
dashboard; Vercel → Logs show `/api/internal/sync` returning 200 each minute.

---

## Part 5 — Cloudflare (private runtime connectivity)

1. Make sure `agenticbots.dev` DNS is on Cloudflare (it is if the site already resolves through it).
2. **API token:** My Profile → API Tokens → *Create Token* → custom:
   Account · *Cloudflare Tunnel: Edit*, Account · *Access: Apps and Policies: Edit*,
   Account · *Access: Service Tokens: Edit*, Zone `agenticbots.dev` · *DNS: Edit*.
3. Note your **Account ID** and **Zone ID** (domain overview page, right column).
4. Put them in your shell when provisioning (never in Vercel):
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`.

The CLI creates, per client: a tunnel, `<tenant>.<RUNTIME_DOMAIN>`,
and an Access application that only accepts AgenticBots' service token.

---

## Part 6 — Model provider

Create an API key with your provider (e.g. Anthropic Console → API Keys).
Store it per client in Secrets Manager (`agenticbots/prod/tenants/<tenant>/providers`)
as JSON, e.g. `{"ANTHROPIC_API_KEY":"…"}` — the runtime reads it on start.
In the console: **Settings → Model providers** — add the provider/model ids
and **check the per-token rates against the provider's price list** (they
drive every cost estimate).

---

## Part 7 — Your first real client

```bash
export AWS_PROFILE=… ARTIFACT_BUCKET=… CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_ZONE_ID=…
export CONVEX_URL=… PLATFORM_SERVER_SECRET=…        # production database
npm run ops -- tenant:create --name "Acme Roofing" --bots ads,seo,crm
npm run ops -- tenant:plan --tenant <printed tenant id>          # read the plan
ALLOW_CLOUD_CHANGES=1 npm run ops -- tenant:provision --tenant <tenant id>
npm run ops -- tenant:status --tenant <tenant id>
```
Then in the console: client → **Settings → Invite a portal user** (send them
the one-time link), add integrations, and set up their service agreement.

---

## Part 8 — The manual billing loop

1. Create the **service agreement** (client → Billing).
2. Create the **invoice** and send it through your usual process; click **Mark as sent**.
3. The client pays by **ACH or wire**.
4. When the money is in the bank, open the invoice → **Record payment**.
5. The billing dashboard updates (balance, status, receivables).
6. If an invoice becomes materially past due, the client is **flagged** —
   you decide whether to call, extend, or **suspend**.
7. Suspension stops the Bots but **keeps every bit of state**.
8. When it is resolved, record the payment and **Reactivate** — by hand.

Details: `docs/runbooks/BILLING_AND_PAYMENTS.md`.

---

## Exactly what you need before your first real client

- [ ] **Production domain**: `ops.` and `app.agenticbots.dev` added in Vercel and resolving
- [ ] **Auth**: your superadmin set up via `user:bootstrap`; demo mode OFF in production
- [ ] **Database**: Convex schema deployed; `PLATFORM_SERVER_SECRET` set in both Convex and Vercel
- [ ] **AWS**: root MFA on; Identity Center admin user; base Terraform applied
- [ ] **Secrets Manager**: provider key stored for the client (`…/providers`)
- [ ] **Cloudflare**: API token, account id, zone id ready in your shell
- [ ] **Provider credentials**: model rates entered in Settings → Model providers
- [ ] **Backups**: AWS console → EC2 → Lifecycle Manager shows the daily policy *Enabled*
- [ ] **Monitoring**: SNS alert email confirmed; Vercel cron returning 200
- [ ] **Service agreement** created for the client
- [ ] **Invoice** drafted (implementation fee and/or first month)
- [ ] **Payment method** agreed (ACH or wire) and your remittance details sent from your own invoice template
- [ ] **First tenant** provisioned and *Healthy*
- [ ] **First Bot** deployed and answering (Bot → View runtime details)
- [ ] **Test request** submitted from the client portal and completed
- [ ] **Approval** round-trip tested (drafted → client approves → executed)
- [ ] **Suspension** tested (suspend → runs blocked → state intact)
- [ ] **Reactivation** tested (reactivate → healthy → a run works)
