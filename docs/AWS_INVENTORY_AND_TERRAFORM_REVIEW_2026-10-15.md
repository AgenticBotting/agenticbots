# AWS inventory and Terraform plan review — 2026-10-15

## Live foundation follow-up — 2026-10-16

The earlier read-only decision below is preserved as review history and is
superseded for the state/audit foundation only. Under the standing launch
authorization, the protected state plan applied **9 additions, 0 changes and 0
deletions**, then migrated its temporary local state into the new encrypted
backend. Live checks verified KMS encryption, versioning, TLS-only policy, all
public-access blocks and a private policy result.

The audit plan then applied **21 additions, 0 changes and 0 deletions**.
CloudTrail is logging all read/write management events in `us-east-2`; the
audit bucket is private, versioned and KMS-encrypted; the CloudWatch log group
is KMS-encrypted with 400-day retention; root and IAM alarms are enabled; and
the daily Cost Anomaly Detection subscription is confirmed for anomalies at
or above $5. A post-apply Terraform plan reports no changes. The SNS
security-alert email remains pending owner confirmation. Native S3 state-lock
contention and automatic release passed, and the first CloudTrail record
reached both S3 and CloudWatch without a delivery error.

No environment stack, EC2 instance, NAT gateway, Elastic IP, client runtime,
database or model workload was created. The project is still PAID/ACTIVE, the
$40 Budget is healthy at $0 actual spend, $120 promotional credits remain and
the $50 hard spend limit remains the containment boundary. Advanced features
remain off, so Vercel OIDC and the Region policy attachment are still blocked
pending the separate irreversible owner decision.

## Decision

**Historical decision from October 15:** Do not apply the environment plan yet. The configuration is syntactically
valid and has a strong isolation baseline, but the AWS project's managed policy
currently denies IAM OIDC-provider operations. The first apply includes a
Vercel OIDC provider, so it would fail before the Vercel control plane could be
completed. Prepare the advanced-feature transition, replacement cost controls
and the audit/state/bootstrap path before requesting approval for an apply.

This review was read-only in AWS. No AWS, Vercel, Convex or Cloudflare resource
was created, updated or deleted. No Terraform apply was run.

## Live AWS inventory

Project facts at review time:

- plan at the initial review: AWS Free plan, with the selected Region **US East
  (Ohio), `us-east-2`**;
- current estimated AWS cost for 2026-10-01 through 2026-10-15: **$0.00**;
- budgets returned by the AWS Budgets API: none;
- EC2 instances, EBS volumes, Elastic IPs and NAT gateways: none;
- S3 buckets and Secrets Manager secrets: none;
- customer-managed KMS keys: none;
- CloudWatch alarms and log groups in `us-east-2`: none;
- CloudWatch log groups in `us-east-1`: none;
- SNS topics, CloudTrail trails, DLM backup policies and custom SSM documents:
  none;
- CloudFront-scope WAF web ACLs in `us-east-1`: none;
- IAM summary: no IAM users, no access keys, nine AWS-managed project roles and
  no customer-managed policies.

The IAM account-summary MFA number was `0`; that metric describes IAM users and
does not establish whether the social identity provider has MFA. The connected
social account must be protected separately.

### Paid-plan follow-up at 11:30 AM ET

The owner upgraded the project and enabled a **$50 monthly hard spend limit**
with all three early controls. A fresh read-only AWS check confirmed:

- account plan: **PAID**, **ACTIVE**;
- promotional credits remaining: **$120**;
- estimated October usage: **$0.00**;
- project resources remain empty for EC2, NAT, Elastic IP, S3, Secrets Manager,
  CloudTrail and CloudWatch alarms;
- AWS Budgets initially returned no budget; and
- `iam:ListOpenIDConnectProviders` is still explicitly denied by the managed
  service control policy.

Paid-plan activation therefore did not remove the OIDC blocker. AWS documents
advanced-feature activation as a separate, irreversible transition. It removes
project spend limits, gives the owner direct responsibility for the AWS
Organization and management account, and expands Region/service access. Do not
activate it as a routine setup click. Prepare replacement budgets, anomaly
alerts, Region guardrails, management-account recovery/MFA and an audit trail
first, then make a separate owner decision.

At 11:59 AM ET the owner created the monthly **AgenticBots Staging** budget for
**$40**. AWS reported it as healthy, with $0 actual spend and email delivery to
`nick@agenticbots.dev` for 85% actual, 100% actual and 100% forecasted
thresholds. Together with the project's $50 hard limit and its earlier
50%/75%/90% controls, staging now has both early notification and automatic
containment while advanced features remain off.

### Local hardening follow-up

The blocking AWS controls are now implemented and validated locally. Nothing
has been applied to the live project:

- `foundation-bootstrap`: **9 to add, 0 to change, 0 to destroy** — a
  versioned, private, KMS-encrypted Terraform state bucket with TLS-only
  access, native S3 locking and deletion guards;
- `foundation`: **21 to add, 0 to change, 0 to destroy** — a single-Region
  CloudTrail with log validation, protected audit storage, encrypted
  CloudWatch Logs, root/IAM-change alarms and AWS Cost Anomaly Detection;
- empty staging platform: **23 to add, 0 to change, 0 to destroy** — direct
  outbound staging networking with **zero NAT gateways, zero Elastic IPs and
  zero EC2 instances** until a tenant is explicitly added; and
- the review-only Region policy denies Regional work outside `us-east-2` and
  permits only the documented `us-east-1` exception for global WAF,
  CloudFront and their logs. It is not attached to any AWS organization.

Fresh read-only inventory after planning still found zero EC2 instances, NAT
gateways, Elastic IPs, S3 buckets, CloudTrail trails, anomaly monitors and
anomaly subscriptions. The live budget remained healthy at $0 actual spend.

Source:

- https://docs.aws.amazon.com/accounts/latest/reference/activate-advanced-features.html

## Original reproducible local plan

Review tooling:

- Terraform `1.16.6` for `darwin_arm64`, verified against HashiCorp's published
  SHA-256 checksum;
- HashiCorp AWS provider `6.68.0`, verified by Terraform's signed-provider flow;
- AWS CLI profile `agenticbots-staging` in `us-east-2`;
- backend disabled, `-refresh=false`, empty tenant map and no apply;
- IAM Policy Autopilot `0.3.0` used against the rendered plan JSON. Its output
  was kept local and was not uploaded or attached.

Result:

```text
Plan: 27 to add, 0 to change, 0 to destroy.
```

The following 27-resource result records the plan reviewed before the local
hardening follow-up above. It is now superseded and must not be applied. It
contained one VPC, three
subnets, route tables and associations, one internet gateway, one NAT gateway,
one Elastic IP, a locked default security group, one encrypted/versioned/private
artifact bucket, one control-plane KMS key and alias, one encrypted SNS topic,
one SSM lifecycle document, a DLM policy and role, and the Vercel OIDC provider
and control-plane role. The plan contains **zero tenant runtimes, instances,
volumes, tenant keys, tenant secrets, tenant log groups or tenant alarms**.

Local evidence files were owner-only and kept outside the repository:

- binary plan SHA-256:
  `d957fb78e087d1436d6f3b4eaa89152588293de235666b6dbbf0012ec1ac11e7`;
- rendered plan SHA-256:
  `cdab7a0f0089336bc209a3704464948b024627af1caa06581076642f79919ad2`.

Those hashes identify this review artifact only. A new plan is required after
every Terraform or variable change.

## What is already strong

- Tenant compute is designed for private subnets with no inbound security-group
  rules. Administration is through one enumerated SSM document.
- EC2 requires IMDSv2 and restricts the metadata hop limit to the host.
- Each tenant receives a separate KMS key, encrypted root/data volumes and
  tenant-scoped secret paths.
- Client data volumes use `prevent_destroy`; daily encrypted snapshots are
  selected by environment-specific tags.
- Runtime artifacts use an encrypted, versioned S3 bucket with every public
  access control enabled.
- Vercel is designed to use short-lived OIDC credentials rather than static AWS
  access keys.
- The Vercel trust policy restricts both audience and subject to the named team,
  project and approved Vercel environments.
- All environment resources are named and tagged to separate staging from
  production.

## Blocking findings

### P0 — Managed AWS policy blocks Vercel OIDC

The live read-only `iam:ListOpenIDConnectProviders` call was explicitly denied
by the project's managed service control policy, and the plan requires
`aws_iam_openid_connect_provider.vercel`. The new AWS experience documents
`iam:*Provider*` as a denied action in the managed project policy. Upgrading the
spend plan alone does not remove that restriction; the project needs **advanced
AWS features** before this OIDC design can work.

Action: prepare and review the irreversible advanced-feature transition first.
After the owner explicitly accepts removal of the hard spend limit and the
expanded administrative responsibility, activate it in AWS Settings, repeat
the read-only OIDC capability check and regenerate the plan.

Sources:

- https://docs.aws.amazon.com/accounts/latest/reference/scps-and-rcps-for-projects.html
- https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html

### P0 resolved for the managed project — Budget and spend limit exist

The paid project now has a healthy $40 monthly budget, three email alerts, a $50
hard spend limit and early controls. AWS removes the hard limit when advanced
features are activated. Preserve the $40 budget, add anomaly detection and
verify the replacement cost-control design before activation and before any
shared foundation is applied.

### P0 prepared locally — CloudTrail is not yet applied

The live project still has no trail. The separate `foundation` root now plans a
single-Region management-event trail with log-file validation, a private
versioned encrypted S3 destination, 400-day encrypted CloudWatch retention and
alarms for root and IAM API activity. Its resources have deletion guards and
must be applied before any deployment role or runtime exists.

### P0 prepared locally — Remote Terraform state is not yet bootstrapped

The project still has no S3 buckets. The new `foundation-bootstrap` root plans a
state bucket in `us-east-2` with versioning, all public access blocked,
customer-managed KMS encryption, TLS-only access, native S3 state locking and
deletion guards. Bootstrap it first, migrate the bootstrap state into the same
protected backend, and then initialize every other Terraform root. Review the
bootstrap separately because state can contain sensitive values.

### P0 — The planned runtime image is not approved

The temporary review used the historical `v2026.9.24` example only to satisfy a
required variable; the tenant map was empty, so it would not deploy that image.
The current project handoff explicitly blocks that image. A full, immutable
`v0.21.7` candidate digest and the Hermes qualification gates are required
before adding a tenant.

### P0 — Runtime egress enforcement is incomplete

The instance security group allows HTTPS, Cloudflare tunnel traffic, DNS and
HTTP to any IPv4 destination. The host bundle includes a network-guard service,
but its destination controls and failure behavior have not been proven in a
real staging runtime. Keep browser, web and unreviewed MCP tools off until the
egress allowlist and fail-closed behavior pass staging tests.

### P0 — Bootstrap downloads executable code without integrity verification

First boot downloads a Docker Compose executable from GitHub using a fixed
version but does not verify its digest or signature. Pin the official checksum,
verify it before installation, and fail boot if verification fails. The runtime
bundle downloaded from S3 also needs a signed manifest or expected digest check
before extraction.

## Important follow-ups

### P1 reduced — Staging no longer incurs an idle NAT charge

The staging root now uses direct outbound networking. Its empty plan creates no
NAT gateway, Elastic IP or EC2 instance, avoiding the earlier fixed NAT charge.
When a staging runtime is deliberately added, its public IPv4 address is used
only for outbound traffic; the runtime security group still has no inbound
rules. Production remains on private subnets behind managed NAT.

The state, audit and platform KMS keys, CloudTrail/CloudWatch ingestion and
retention, S3 storage/requests, public IPv4 while a runtime is active and data
transfer still cost money. Keep staging tenant-free until the runtime test is
approved, set short log retention for application logs, and revisit VPC
endpoints only after measured traffic justifies their hourly cost.

Sources:

- https://aws.amazon.com/vpc/pricing/
- https://aws.amazon.com/kms/pricing/

### P1 — One NAT gateway is not a high-availability design

Both runtime subnets route through one NAT gateway in one Availability Zone.
That is acceptable for the standard staging tier but does not satisfy the
optional enterprise high-availability tier. The HA tier needs an explicit
multi-AZ egress and runtime design, tested failover and a higher cost estimate.

### P1 — Alarm delivery is optional in staging

An empty `alarm_email` produces an SNS topic with no subscriber. Require and
confirm the staging alarm recipient before the first runtime. Production already
has a runtime precondition for an alarm topic, but subscription delivery must be
tested too.

### P1 — AMI and bootstrap changes do not roll forward automatically

The runtime resolves the latest Amazon Linux image at plan time but ignores
future AMI and user-data changes for existing instances. This avoids accidental
replacement, but security patches and bootstrap fixes require a deliberate,
audited replacement procedure with backup and rollback proof.

### P1 — Deployment permissions need a dedicated role

IAM Policy Autopilot generated a deterministic baseline for the plan, but it
contains broad wildcard read/create operations and `iam:PassRole` statements.
Do not attach it as-is to the Vercel runtime role. After advanced features are
active, create a separate human-approved Terraform deployment role, refine the
Autopilot output, simulate it, and keep Vercel's runtime role limited to EC2
status, the fixed SSM document, approved runtime secrets and metrics.

### P2 — AWS managed instance policies are broader than runtime needs

Each tenant attaches `AmazonSSMManagedInstanceCore` and
`CloudWatchAgentServerPolicy`. The SSM managed policy is reasonable for the
first staging proof; replace the CloudWatch managed policy with a narrow inline
policy after the exact log/metric API calls are confirmed.

## Safe corrections made during review

- Terraform staging and production now default to and validate only
  `us-east-2`; backend and example variables match.
- Server, provisioning and demo fallbacks now use `us-east-2`.
- Beginner and first-staging instructions now use the new AWS project login
  flow and the selected Region.
- The Vercel control-plane policy can read runtime endpoints, per-BOT keys and
  integration webhook secrets, but no longer matches model-provider secrets.

## Next gate

The advanced-feature readiness controls are now concrete and reviewable, but
they are not live. The next gate is to choose globally unique state and audit
bucket names and generate one final redacted bootstrap plan. If its preflight
passes with no destroy/replacement and the $50 hard limit remains active, the
standing launch authorization permits that **state-bootstrap-only** apply
without another question. After the state and audit foundation are live and
tested, the owner can separately decide
whether to activate advanced features. Activation remains irreversible and
removes the $50 hard spend limit. Repeat the inventory and OIDC check after any
activation, then generate a fresh platform plan. Do not create a tenant in any
foundation apply.
