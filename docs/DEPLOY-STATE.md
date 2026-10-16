# Where things stand — deployment

_Last updated: October 16, 2026_

## Current verified deployment

**Branch:** `platform-v1`

**Vercel project:** `agenticbots`

**Vercel scope:** `agentic-bots-projects`

**Verified preview:**
`https://agenticbots-j7bblgl6i-agentic-bots-projects.vercel.app`

**Current branch preview alias:**
`https://agenticbots-git-platform-v1-agentic-bots-projects.vercel.app`

On October 16, 2026, the standing launch authorization was committed as
`6f62a9c` and `platform-v1` was pushed through that commit. Vercel built the
resulting preview successfully:
`https://agenticbots-ao1uxhk2z-agentic-bots-projects.vercel.app`. An
authenticated smoke check returned 200 for `/` with the expected security
headers and 307 for `/ops` to `/login?next=/ops` with private/no-store caching.
No production alias changed.

The preview reached **Ready** in about two minutes. It is protected by Vercel
Authentication, so automated public requests receive the expected sign-in
redirect. Authenticated checks with `vercel curl` passed for:

- `/` — 200, prerendered;
- `/services/agentic-seo/florida/miami` — 200, prerendered;
- `/services/agentic-seo/alaska/anchorage` — 200, rendered on demand;
- `/sitemap/1.xml` — 200 XML;
- `/ops` — 307 to `/login?next=/ops`, with private/no-store controls.

The first preview for commit `2d60efe` took about 18 minutes and failed after
generating 14,124 pages because the Vercel adapter moved a generated sitemap
artifact before the npm postbuild gate read it. Commit `40c06ee` corrected the
build strategy:

- only approved search-acquisition routes are prerendered;
- valid long-tail routes still render on demand;
- the local/CI build remains the authoritative exact-artifact gate;
- GitHub CI now runs on every branch push.

The same production build now completes locally in roughly 30 seconds and
generates 1,056 routes instead of 14,124. The replacement Vercel preview took
about two minutes. `.vercelignore` excludes local Next.js, dependency,
Terraform-provider and test caches so CLI releases upload source only.

## Release gate

Production promotion waits for the current GitHub CI run to pass. CI runs the
application build, unit tests, browser tests, Terraform formatting and
validation, container-compose validation, shell syntax checks, and the Trivy
secret/infrastructure scan. The preview is the reviewable release candidate;
do not promote a failing commit.

The reviewed AWS state and audit foundations are live in `us-east-2`. The state
bootstrap applied **9 adds, 0 changes, 0 destroys** and was migrated into its
KMS-encrypted, versioned, private S3 backend. The audit foundation applied **21
adds, 0 changes, 0 destroys**: active single-Region CloudTrail, protected S3
and CloudWatch evidence, root/IAM alarms, encrypted SNS security alerts and a
$5 daily cost-anomaly monitor. A post-apply Terraform plan reports no drift.
Native S3 state locking passed a live contention test, and CloudTrail delivered
its first record to both S3 and CloudWatch without error.
The SNS security-alert email is waiting for its owner confirmation; the cost
anomaly email is already confirmed.

No runtime environment or client workload has been applied. Terraform still
describes private runtime subnets, low-cost outbound-only staging, private
production NAT, customer encryption and isolated client runtimes. The fresh
empty staging plan remains 23 adds with 0 change / 0 destroy and contains no
NAT gateway, Elastic IP, EC2 instance or tenant.

The standing launch authorization in `AGENTS.md` now permits reviewed,
non-destructive applies while the $50 hard spend limit remains active, without
another per-command confirmation. The paid project still blocks the staging
OIDC provider until advanced features are active. Activation is irreversible
and removes the hard limit, so that activation still needs a new owner
decision. The healthy $40 AWS Budget remains live at $0 actual spend. The
hardened state, CloudTrail and anomaly controls are live; the Region guardrail
remains a review-only file until advanced features exist. Follow
`docs/runbooks/AWS_FOUNDATION_AND_ADVANCED_FEATURES.md` and
`docs/AWS_INVENTORY_AND_TERRAFORM_REVIEW_2026-10-15.md`.

## Production configuration still required

The public marketing pages can run without the private operator platform, but
real lead delivery and the platform require environment-specific credentials.
Configure these in Vercel rather than committing them:

- `NEXT_PUBLIC_SITE_URL` for the production domain;
- one approved lead-delivery provider configuration;
- production database/auth secrets for `/ops` and `/portal`;
- Vercel OIDC and the production AWS role only after the AWS staging release
  gates pass.

Analytics remains disabled unless consent-gated configuration is deliberately
added. Model-provider, email, CRM and advertising credentials are not required
for the marketing-site release and must not be added until their live flows
have been approved and tested.

## Source control

The private GitHub repository is `AgenticBotting/agenticbots`. This working
copy is the authoritative checkout at `~/Desktop/AgenticBots`, and its SSH
remote uses the local `github-agenticbots` host alias. Never commit `.env`
files, generated demo state or cloud credentials.
