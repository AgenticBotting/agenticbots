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

---

## Words you will see

| Word | Meaning |
|---|---|
| **Terminal** | The Mac app (Applications → Utilities → Terminal) where you paste commands. Paste one block, press Return, and wait until it finishes before the next. |
| **AWS** | Amazon's cloud, where the staging server runs. |
| **Region** | Which Amazon data center. We use `us-east-1` (N. Virginia) everywhere. |
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

## Step 1 — AWS account and a safe login (≈30 min)

1. If you do not have an AWS account: go to https://aws.amazon.com and click
   **Create an AWS Account**. This "root" login is only for billing and
   emergencies.
2. Protect the root login: AWS console → top-right account menu →
   **Security credentials** → **Assign MFA device** → follow the steps with
   an authenticator app.
3. Create the everyday login (IAM Identity Center):
   1. In the console search bar type **IAM Identity Center** and open it.
      Make sure the region (top right) says **N. Virginia (us-east-1)**.
      Click **Enable**.
   2. **Users → Add user**: your email, first and last name. You will get an
      invitation email. Open it, set a password and set up MFA.
   3. **Permission sets → Create permission set → Predefined → AdministratorAccess**
      → Next → Create.
   4. **AWS accounts** → tick your account → **Assign users or groups** →
      choose your user → choose **AdministratorAccess** → Submit.
   5. On the IAM Identity Center **Dashboard**, copy the **AWS access portal
      URL** (looks like `https://d-xxxxxxxxxx.awsapps.com/start`).
4. Install the AWS command-line tool. If `brew` is not installed, first
   install Homebrew from https://brew.sh.
   ```bash
   brew install awscli
   ```
5. Connect it to your login:
   ```bash
   aws configure sso
   ```
   Answer the questions:
   - SSO session name: `agenticbots`
   - SSO start URL: paste the access portal URL
   - SSO region: `us-east-1`
   - SSO registration scopes: press Return
   - A browser opens. Approve it.
   - Pick your account, then `AdministratorAccess`.
   - Default client Region: `us-east-1`
   - CLI default output format: `json`
   - Profile name: `agenticbots-staging`
6. **Check:**
   ```bash
   aws sts get-caller-identity --profile agenticbots-staging
   ```
   You should see your 12-digit account number. The login lasts about 8
   hours. When a command later says the token expired, run
   `aws sso login --profile agenticbots-staging`.

## Step 2 — Tools and code (≈5 min)

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
git checkout platform-v1
npm install
```

**Check:** `terraform version` prints a version.

## Step 3 — A storage bucket for Terraform's records (≈3 min)

Terraform remembers what it created in a file kept in S3. Create that
bucket once. Paste this whole block:

```bash
export AWS_PROFILE=agenticbots-staging
SUFFIX=$(openssl rand -hex 4)
aws s3api create-bucket --bucket agenticbots-tfstate-$SUFFIX --region us-east-1
aws s3api put-bucket-versioning --bucket agenticbots-tfstate-$SUFFIX --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket agenticbots-tfstate-$SUFFIX --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
echo "STATE BUCKET:     agenticbots-tfstate-$SUFFIX"
echo "ARTIFACT BUCKET:  agenticbots-staging-artifacts-$SUFFIX"
```

Write down both names it prints. Then:

1. Open `infra/terraform/envs/staging/backend.tf`, for example with
   `open -e infra/terraform/envs/staging/backend.tf`. Replace
   `REPLACE-agenticbots-tfstate` with the **state bucket** name and save.
2. Create the settings file:
   ```bash
   cp infra/terraform/envs/staging/terraform.tfvars.example infra/terraform/envs/staging/terraform.tfvars
   open -e infra/terraform/envs/staging/terraform.tfvars
   ```
   - `artifact_bucket` = the **artifact bucket** name. Terraform creates
     it; do not create it yourself.
   - `vercel_team_slug`: leave `lot-sealers-projects`. That is the slug in
     your Vercel dashboard URL, `vercel.com/<slug>/agenticbots`. Change it
     if yours differs.
   - Leave `default_engine_image` as is. It is already pinned.
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

1. Sign in at https://openrouter.ai → **Credits** → add $5.
2. **Keys → Create Key** → name it `agenticbots-staging`. Copy it, and keep
   it for Step 10. Never put it in a file.

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

This creates the following, still with no server and no cost to speak of:
- a private network with no inbound access;
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
| `Token has expired` / `SSO session` errors | `aws sso login --profile agenticbots-staging`, then repeat the command |
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
   - `AWS_REGION=us-east-1`;
   - `AWS_ROLE_ARN` and `AWS_LIFECYCLE_DOCUMENT` (from Step 8);
   - `RUNTIME_PROVIDER=hermes`;
   - `CRON_SECRET` (any random value).
3. Deploy the branch as a preview: `npx vercel deploy`. Open the preview URL
   + `/login`. Run `npm run ops:staging -- user:bootstrap …` again with
   `OPS_URL` in `.env.staging` set to the preview URL to get a sign-in link.
4. Repeat Step 12 on the preview URL. The server now reaches AWS through
   Vercel's short-lived login, with no stored AWS keys.
