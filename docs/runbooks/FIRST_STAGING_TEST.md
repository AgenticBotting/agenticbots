# First AWS staging test — step by step

**Goal:** one fake client, **AgenticBots Test Company**, with one Bot, **SEO
Bot**, on one AWS EC2 staging server. You prove this chain:

```
AgenticBots UI (your computer) → AgenticBots server code → HermesRuntimeAdapter
  → Cloudflare Tunnel + Access → AWS EC2 → Hermes → "seo" profile
  → Bot Run → result → Convex (staging) → AgenticBots UI
```

Nothing here touches production: the marketing site, the production Convex
database and production AWS resources are untouched. Every command that
creates something in the cloud refuses to run unless you put
`ALLOW_CLOUD_CHANGES=1` in front of it.

**Time:** about 2 hours the first time. Most of it is creating accounts.
**Cost:** AWS compute, encrypted storage, backups, the outbound NAT gateway,
model usage and the runtime domain all incur provider charges. Check the
current AWS and model-provider estimates before applying Terraform, set budget
alerts first, and destroy staging resources when the test is complete.

Background on what is and isn't ready: `docs/DEPLOYMENT_READINESS_AUDIT.md`.

## Mandatory preflight — complete before Step 1

The steps below predate the 2026-10-11 full Hermes audit. Do not create cloud
resources until all boxes are checked and evidence is linked from the staging
record:

- [ ] A reviewed Hermes release at least as new as `v0.21.6` is pinned by tag,
  commit and immutable image digest. `v2026.9.24` is not the staging target.
- [ ] `npm run test:hermes-contract` passes against a local disposable runtime
  using that exact image.
- [ ] The default profile and SEO BOT have explicit API-server tool allowlists;
  `/v1/toolsets` contains no unapproved capability.
- [ ] Dashboard and dashboard plugins are off. Kanban, goals, heartbeats,
  messaging, webhooks and agent-created schedules are off.
- [ ] `agent.bot_mode_protocol` is false in the root and SEO BOT profiles;
  there are no Bot Mode metadata markers, canonical Bot Chats, groups or peers.
- [ ] Terminal, host code execution, skill mutation, credential-vault mutation
  and unreviewed MCP are unavailable.
- [ ] Concurrency, turns, duration, retries, tokens and model spend have finite
  fail-closed limits at the runtime or platform boundary.
- [ ] The first model uses a server-side API or Bedrock credential. Consumer
  OAuth is not the unattended production dependency. Any fallback is disabled
  until separately evaluated.
- [ ] The SEO BOT's required outbound destinations are documented. Browser,
  web and MCP tools stay off if egress enforcement is incomplete.
- [ ] `upgrade-engine` and rollback are tested locally, or the staging plan
  includes a reviewed manual recovery with a pre-upgrade backup.
- [ ] AWS cost ceiling, budget alert, alert recipient, destroy procedure and
  Terraform plan have been reviewed by the owner.
- [ ] Before advanced AWS features are activated, replacement budgets and
  anomaly alerts, a Region SCP, management-account recovery/MFA and CloudTrail
  are reviewed. Activation is irreversible and removes the project spend limit.
- [ ] After explicit owner approval, advanced AWS features are active. The
  managed project policy otherwise blocks the IAM OIDC provider required for
  Vercel's short-lived AWS login.
- [ ] `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` pass.

See `docs/research/HERMES_DOCUMENTATION_AUDIT_2026-10-11.md` and
`docs/LAUNCH_IMPLEMENTATION_PLAN.md`. Completing this checklist still does not
authorize deployment; the owner must approve the exact cloud plan.

---

## Words you will see

| Word | Meaning |
|---|---|
| **Terminal** | The Mac app (Applications → Utilities → Terminal) where you paste commands. Paste one block, press Return, and wait until it finishes before the next. |
| **AWS** | Amazon's cloud, where the staging server runs. |
| **Region** | Which Amazon data center. This project uses its selected Region, `us-east-2` (Ohio). |
| **Profile** (AWS) | A saved login on your Mac. Ours is called `agenticbots-staging`. |
| **Terraform** | A tool that creates cloud resources from the files in `infra/terraform`. |
| **Cloudflare** | Gives the server a private, encrypted address so only AgenticBots can reach it. |
| **Convex** | The database. Staging gets its own, separate project. |
| **Tenant id** | The short id of a client, e.g. `agenticbots-test-company-k3x9`. |

All commands are run from the project folder. Open Terminal and run this
first, in every new Terminal window:

```bash
cd ~/Desktop/AgenticBots
```

---

## Step 1 — AWS project and a safe login (≈10 min)

1. Sign in through the social login connected to the AgenticBots AWS project.
   Protect that identity-provider account with MFA.
2. In **AWS Settings → View all projects → Overview → Additional Info**, confirm
   the selected Region is **US East (Ohio), `us-east-2`**. Invite any future
   team member from AWS Settings; do not create IAM users or access keys.
3. Install the AWS command-line tool. If `brew` is not installed, first
   install Homebrew from https://brew.sh.
   ```bash
   brew install awscli
   ```
4. Connect it to your login and save the selected Region:
   ```bash
   aws login --profile agenticbots-staging
   aws configure set region us-east-2 --profile agenticbots-staging
   ```
   A browser opens. Sign in and approve CLI access.
5. **Check:**
   ```bash
   aws sts get-caller-identity --profile agenticbots-staging
   ```
   You should see your 12-digit account number. The login lasts about 8
   hours. When a command later says the token expired, run
   `aws login --profile agenticbots-staging`.

## Step 2 — Tools and code (≈5 min)

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
git checkout platform-v1
npm install
```

**Check:** `terraform version` prints a version.

## Step 3 — Protected Terraform state and audit foundation

Do not create the state bucket with one-off S3 commands. The reviewed
`infra/terraform/foundation-bootstrap` configuration now creates it with a
dedicated rotating KMS key, versioning, native state locking, public-access
blocks, TLS-only access and deletion protection. Follow
`docs/runbooks/AWS_FOUNDATION_AND_ADVANCED_FEATURES.md` through the foundation
verification step. Each apply in that runbook needs a separate owner approval.

When the protected backend and audit foundation are verified:

1. Put the output state bucket and KMS key ARN into
   `infra/terraform/envs/staging/backend.tf`.
2. Choose a separate globally unique artifact bucket name, such as
   `agenticbots-staging-artifacts-<random suffix>`; Terraform creates it.
3. Create the settings file:
   ```bash
   cp infra/terraform/envs/staging/terraform.tfvars.example infra/terraform/envs/staging/terraform.tfvars
   open -e infra/terraform/envs/staging/terraform.tfvars
   ```
   - `artifact_bucket` = the chosen **artifact bucket** name. Terraform
     creates it; do not create it yourself.
   - `vercel_team_slug`: leave `lot-sealers-projects`. That is the slug in
     your Vercel dashboard URL, `vercel.com/<slug>/agenticbots`. Change it
     if yours differs.
   - Set `default_engine_image` to the newly reviewed tag and immutable digest.
     Do not use the historical `v2026.9.24` value or `latest`.
   - `default_model`: leave it, or paste another model id from
     https://openrouter.ai/models.
   - Save.

## Step 4 — Cloudflare: a private address for the server (≈20 min)

The server has no open ports. It dials out to Cloudflare, and only
AgenticBots, holding a secret token, can reach it. Cloudflare needs a domain
it manages. `agenticbots.dev` lives at GoDaddy, so buy a separate, cheap
domain just for runtimes. This keeps the website safe.

1. Create a free account at https://dash.cloudflare.com/sign-up.
2. **Domain Registration → Register Domains**. Buy a cheap name, e.g.
   `agenticbots-runtime.com` (about $10/year). It appears under
   **Websites** within a few minutes.
3. Turn on Zero Trust (needed for the private-access rules): left menu
   **Zero Trust** → pick a team name → choose the **Free** plan. It may ask
   for a card; the Free plan is $0.
4. Copy two ids. Click your new domain; on its **Overview** page, the
   right-hand column has an **API** section. Copy **Zone ID** and
   **Account ID**.
5. Create an API token: top-right profile icon → **My Profile → API Tokens
   → Create Token → Custom token → Get started**.
   - Name: `agenticbots-staging`
   - Permissions (use **+ Add more** for each row):
     - Account · **Cloudflare Tunnel** · Edit
     - Account · **Access: Apps and Policies** · Edit
     - Account · **Access: Service Tokens** · Edit
     - Zone · **DNS** · Edit
   - Account Resources: Include · your account
   - Zone Resources: Include · Specific zone · your new domain
   - **Continue to summary → Create Token**. Copy the token now; it is shown
     only once.

## Step 5 — A separate staging database in Convex (≈10 min)

1. Go to https://dashboard.convex.dev → **Create Project** → name it
   `agenticbots-staging`.
2. Open the project → choose its **Production** deployment → **Settings →
   URL & Deploy Key**.
   - Copy the **Deployment URL** (ends in `.convex.cloud`).
   - Click **Generate Production Deploy Key** and copy it.
3. In Terminal, replacing the placeholder with your deploy key:
   ```bash
   export CONVEX_DEPLOY_KEY='PASTE-THE-STAGING-DEPLOY-KEY'
   npx convex deploy -y
   openssl rand -hex 32
   ```
   The last line prints a long random value. Copy it: this is your
   **platform secret**. Then:
   ```bash
   npx convex env set PLATFORM_SERVER_SECRET PASTE-THE-RANDOM-VALUE
   unset CONVEX_DEPLOY_KEY
   ```
   **Check:** the Convex dashboard for `agenticbots-staging` lists
   functions including `platform`.

## Step 6 — A model key (≈5 min)

Choose the one provider approved in the staging readiness package. OpenRouter
is one possible provider, not a requirement. Use a server-side API key with a
strict provider budget and no real client data. Do not use a personal consumer
OAuth login for this unattended test.

If OpenRouter is the approved provider:

1. Sign in at https://openrouter.ai → **Credits** and add only the approved
   staging amount.
2. **Keys → Create Key** → name it `agenticbots-staging`. Apply a provider-side
   limit if offered. Copy it, and keep it for Step 10. Never put it in a file.

## Step 7 — Your staging settings file (≈5 min)

```bash
cp .env.staging.example .env.staging
open -e .env.staging
```

Fill in and save:

| Setting | Value |
|---|---|
| `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL` | the Deployment URL from Step 5 (both the same) |
| `PLATFORM_SERVER_SECRET` | the random value from Step 5 |
| `ARTIFACT_BUCKET` | the artifact bucket name from Step 3 |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_ZONE_ID` | from Step 4 |
| `RUNTIME_DOMAIN` | your new domain itself, e.g. `agenticbots-runtime.com` (not a subdomain) |

`.env.staging` is git-ignored and never leaves your computer.

**Check:**

```bash
npm run ops:staging -- staging:check
```

Everything should be ✔ except **"A model provider is configured"**, which
Step 9 fixes. For each ✖ it tells you what to do.

## Step 8 — Create the shared staging infrastructure (≈5 min)

This creates the following shared runtime foundation, with no EC2 server yet.
Staging no longer creates an idle NAT gateway. A running staging runtime uses a
public IPv4 address only for outbound traffic and still exposes no inbound
security-group rules. Review the current estimate before applying; KMS, S3,
logs, backups, a running EC2 instance, its public IPv4 address, EBS, data
transfer and model use can still cost money.
- an isolated staging network with no inbound access;
- the one allowed remote command;
- the login role Vercel will use later;
- daily backups;
- the bucket for the runtime bundle;
- an alarm topic.

```bash
ALLOW_CLOUD_CHANGES=1 npm run ops:staging -- env:apply
```

Terraform shows a plan ending in `Plan: N to add, 0 to change, 0 to
destroy` and asks you to type `yes`. If the plan says **destroy**, type
`no` and stop. At the end it prints `AWS_ROLE_ARN=…` and
`AWS_LIFECYCLE_DOCUMENT=…`. Save these for Vercel later; nothing needs
changing now.

## Step 9 — Start AgenticBots on your computer and sign in (≈5 min)

1. Create your operator login, replacing the email and name:
   ```bash
   npm run ops:staging -- user:bootstrap --email imnickthomson@gmail.com --name "Nick Thomson"
   ```
   It prints a link starting `http://localhost:3004/login/set-password…`.
2. Open a **second** Terminal window. Run `cd ~/Desktop/AgenticBots`, then:
   ```bash
   npm run staging
   ```
   Wait for `Ready`. Leave this window open; it is the app.
3. Open the link from step 1 in Chrome, choose a password, and sign in. You
   land on the operator console (`/ops`).
4. Back in the first window, tell AgenticBots which model Bots use. Use the
   same id as `default_model` in Step 3:
   ```bash
   npm run ops:staging -- provider:add --provider openrouter --model anthropic/claude-sonnet-4.6
   ```

## Step 10 — Create the test client and its server (≈15 min, mostly waiting)

1. ```bash
   npm run ops:staging -- tenant:create --name "AgenticBots Test Company" --bots seo
   ```
   Copy the **tenant id** it prints, e.g. `agenticbots-test-company-k3x9`.
2. Optional: preview what will be created. Replace `TENANT_ID`:
   ```bash
   npm run ops:staging -- tenant:plan --tenant TENANT_ID
   ```
3. Build it:
   ```bash
   ALLOW_CLOUD_CHANGES=1 npm run ops:staging -- tenant:provision --tenant TENANT_ID --provider openrouter
   ```
   - When it asks **"Paste the openrouter API key"**, paste the key from
     Step 6 and press Return. Nothing shows while you paste; that is
     intentional.
   - It uploads the runtime bundle and creates the client's encryption key
     and secrets.
   - It sets up the Cloudflare address and creates the EC2 server and its
     data disk.
   - Then it waits for the server to install and start (usually 5–8
     minutes; dots appear while it waits).
   - It ends with `✔ AgenticBots Test Company is live.`

## Step 11 — Prove the chain from the command line (≈2 min)

```bash
npm run ops:staging -- run:test --tenant TENANT_ID --bot seo
```

Expected output:
- `status: running`, then `status: completed`;
- **Final status (from the database): completed**;
- a short SEO answer;
- `✔ End-to-end chain verified`.

This shows the full path: the AgenticBots server, the adapter, Cloudflare,
EC2, Hermes, the SEO profile, the result, and Convex.

## Step 12 — Prove it in the UI (≈5 min)

In Chrome at http://localhost:3004/ops:

1. **Clients → AgenticBots Test Company**: the runtime shows **healthy**.
2. **Bots → SEO Bot**: under **Runtime details** the engine is reachable.
   Type a task, e.g. *"Suggest five blog topics for a roofing company in
   Naples, FL. Do not use any tools."*, and click **Start Bot Run**.
3. The run page shows live progress, then **Task complete** and the result.
4. Refresh the page: the result is still there, read back from Convex.

That is the whole chain. 🎉

## Step 13 — When you are done testing (stop paying for the server)

- **Keep it but pause the work:**
  `npm run ops:staging -- tenant:suspend --tenant TENANT_ID --reason manual`.
  The EC2 server still runs and costs about $1/day.
- **Stop paying for the server:**
  ```bash
  ALLOW_CLOUD_CHANGES=1 npm run ops:staging -- tenant:destroy --tenant TENANT_ID
  ```
  Type the tenant id to confirm. This deletes the server, keeps the data
  disk (about $1.60/month) and keeps the snapshots.

---

## If something goes wrong

| Symptom | What to do |
|---|---|
| `Token has expired` / login session errors | `aws login --profile agenticbots-staging`, then repeat the command |
| `staging:check` says the database is unreachable | Check `CONVEX_URL` in `.env.staging`, and that you ran Step 5 (deploy + `env set`) |
| Cloudflare `failed: … Authentication` | The API token is missing a permission from Step 4 |
| Provision waits and then says "did not become healthy" | Look at the server (below), then run the same `tenant:provision` command again; it is safe to re-run |
| `run:test` says **failed** with `runtime_auth` | The server is still starting; wait two minutes and retry |
| `run:test` fails with a provider error | Check OpenRouter credit, and that the model id exists on openrouter.ai |

**Looking at the server:** AWS console → **EC2 → Instances** → tick
`agenticbots-<tenant id>` → **Connect → Session Manager → Connect**. In the
black window:

```bash
sudo tail -100 /var/log/agenticbots-bootstrap.log
sudo docker ps
sudo docker logs agb-hermes --tail 100
sudo docker logs agb-tunnel --tail 50
```

Copy the output into a chat with Claude.

---

## After this works: the same test from Vercel (staging on a Preview deployment)

1. Vercel → `agenticbots` → **Settings → Security → OpenID Connect**:
   set **Issuer Mode** to **Team**.
2. **Settings → Environment Variables**, **Preview** environment only:
   - `DEMO_MODE=false`, `PLATFORM_ENV=staging`;
   - `CONVEX_URL`, `NEXT_PUBLIC_CONVEX_URL` and `PLATFORM_SERVER_SECRET`
     (staging values);
   - `AWS_REGION=us-east-2`;
   - `AWS_ROLE_ARN` and `AWS_LIFECYCLE_DOCUMENT` (from Step 8);
   - `RUNTIME_PROVIDER=hermes`;
   - `CRON_SECRET` (any random value).
3. Deploy the branch as a preview: `npx vercel deploy`. Open the preview URL
   + `/login`. Run `npm run ops:staging -- user:bootstrap …` again with
   `OPS_URL` in `.env.staging` set to the preview URL to get a sign-in link.
4. Repeat Step 12 on the preview URL. The server now reaches AWS through
   Vercel's short-lived login, with no stored AWS keys.
