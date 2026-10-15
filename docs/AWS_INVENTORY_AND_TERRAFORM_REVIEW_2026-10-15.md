# AWS inventory and Terraform plan review — 2026-10-15

## Decision

**Do not apply the current plan yet.** The configuration is syntactically
valid and has a strong isolation baseline, but the AWS project's managed policy
currently denies IAM OIDC-provider operations. The first apply includes a
Vercel OIDC provider, so it would fail before the Vercel control plane could be
completed. Activate advanced AWS features, create a budget and harden the
audit/state/bootstrap path before requesting approval for an apply.

This review was read-only in AWS. No AWS, Vercel, Convex or Cloudflare resource
was created, updated or deleted. No Terraform apply was run.

## Live AWS inventory

Project facts at review time:

- plan: AWS Free plan, with the selected Region **US East (Ohio), `us-east-2`**;
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

## Reproducible local plan

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

The 27 planned resources are the shared foundation only: one VPC, three
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

Action: activate advanced AWS features in AWS Settings, then repeat the
read-only OIDC capability check and regenerate the plan.

Sources:

- https://docs.aws.amazon.com/accounts/latest/reference/scps-and-rcps-for-projects.html
- https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html

### P0 — No budget or spend alert exists

The plan creates resources with recurring cost, but AWS Budgets returned no
budget. Create a staging budget with low forecast and actual-spend alerts before
any shared foundation is applied. Keep the AWS project spend limit as a second
fail-safe; a spend limit can pause resources and is not a substitute for early
alerts.

### P0 — No CloudTrail audit trail exists or is planned

The live project has no trail, and the 27-resource plan does not add one. Before
any deployment role or runtime exists, add a single-Region management-event
trail with log-file validation, a private versioned S3 destination, encryption,
retention and an alarm path for unexpected IAM changes. CloudTrail is the
evidence needed to reconstruct who changed infrastructure.

### P0 — Remote Terraform state has not been bootstrapped

The configured S3 backend points to a placeholder bucket, and the project has no
S3 buckets. Bootstrap the state bucket in `us-east-2` with versioning, block
public access, encryption, TLS-only access and native S3 state locking before a
normal plan. Review the bootstrap separately because state can contain sensitive
values.

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

### P1 — Base foundation costs money before a client exists

AWS's Ohio price is `$0.045/hour` plus `$0.045/GB` for the planned NAT gateway;
the attached public IPv4 address is `$0.005/hour`; and the one customer-managed
KMS key is `$1/month`. At 730 hours, the empty shared foundation is therefore
about **$37.50/month before credits**, plus S3, requests, logs and data transfer.

For the first controlled staging test, one managed NAT gateway is simpler and
safer than operating a NAT instance. Time-box the test and destroy the shared
foundation when it is not being used. Before production, add an S3 gateway
endpoint so S3 traffic avoids NAT processing charges.

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

The next owner action is limited to **activating advanced AWS features** and
creating a low staging budget in AWS Settings/Billing. After that, repeat the
inventory and capability checks, add the CloudTrail and state-bootstrap
hardening, run a fresh redacted plan/cost/IAM review, and ask for explicit
approval for the exact apply. Do not create a tenant in that apply.
