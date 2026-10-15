# Where things stand — deployment

_Last updated: October 15, 2026_

## Current verified deployment

**Branch:** `platform-v1`

**Vercel project:** `agenticbots`

**Vercel scope:** `agentic-bots-projects`

**Verified preview:**
`https://agenticbots-j7bblgl6i-agentic-bots-projects.vercel.app`

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

No AWS resources have been applied. Terraform now describes private runtime
subnets, low-cost outbound-only staging, private production NAT, customer
encryption and isolated client runtimes. Separate local roots now prepare a
hardened Terraform state bucket and the CloudTrail/audit/anomaly foundation.
Fresh no-apply plans are 9 adds for state, 21 for audit controls and 23 for the
empty staging environment, all with 0 change / 0 destroy. The staging plan has
no NAT, Elastic IP, EC2 instance or tenant.

Applying anything still requires a separate owner-authorized operation. The
paid project blocks the staging OIDC provider until advanced features are
active. Activation is irreversible and removes the active $50 hard spend
limit. The healthy $40 AWS Budget remains live at $0 actual spend, while the
anomaly monitor, Region guardrail, hardened state and CloudTrail controls are
only prepared locally. Follow
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
