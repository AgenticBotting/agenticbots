# AWS foundation and advanced-feature safety plan

_Last updated: October 16, 2026_

This is the ordered launch path for the AgenticBots AWS project. The standing
launch authorization in `AGENTS.md` permits reviewed, non-destructive applies
while the $50 hard spend limit remains active. Advanced-feature activation,
Region-policy attachment after activation and any destructive or over-budget
change still need a fresh owner decision.

## Current protection

- Selected Region: **US East (Ohio), `us-east-2`**.
- AWS project: **PAID/ACTIVE**.
- Hard project spend limit: **$50/month**, with 50%, 75% and 90% controls.
- AWS Budget: **AgenticBots Staging**, $40/month, with 85% actual, 100%
  actual and 100% forecasted alerts to `nick@agenticbots.dev`.
- Usage at the last read-only check: **$0** and no customer resources.
- Advanced features: **off**. Vercel OIDC remains blocked by the managed
  project policy.
- Protected Terraform state: **live and verified** in `us-east-2`.
- CloudTrail/audit foundation: **live** with no Terraform drift.
- Cost anomaly subscription: **confirmed** at a $5 daily threshold.
- Security-alert SNS email: **confirmed and delivery-tested**. The labeled test
  reached the owner and the alarm returned to `OK` with actions enabled.

Advanced-feature activation is irreversible and removes the hard project spend
limit. The $40 AWS Budget is only an alert; it does not stop resources. Do not
activate advanced features until the foundation below is live and verified.

## What the new Terraform layers do

### `infra/terraform/foundation-bootstrap`

Creates the one encrypted, private, versioned S3 bucket that stores Terraform's
own records and a dedicated rotating KMS key. Both resources use
`prevent_destroy`, the bucket denies non-TLS access and native S3 locking avoids
a separate lock database.

The first apply necessarily begins with a temporary local state file because
the remote bucket does not exist yet. In the same controlled session, copy
`backend.tf.example` to `backend.tf`, insert the output bucket and key ARN, run
`terraform init -migrate-state`, verify the remote object, then securely remove
the local state copies. Never email or commit a state file.

### `infra/terraform/foundation`

Creates one single-Region CloudTrail in `us-east-2`, records read/write
management events and global service events, validates log files, and sends
evidence to a private, versioned, KMS-encrypted S3 bucket and encrypted
CloudWatch log group. IAM API use and root activity produce alarms. An AWS Cost
Anomaly Detection service monitor sends a daily email when the estimated
unexpected impact reaches $5.

This is deliberately a single-Region trail because the AWS project permits
Regional resources only in its selected Region. CloudFront is global; any later
global WAF dependency and its CloudWatch Logs may use `us-east-1` as the narrow
exception defined by the project rules.

### `infra/aws-policies/region-guardrail-us-east-2.json`

A reviewed organization policy draft denies Regional actions outside
`us-east-2`. It permits only global WAF/CloudFront support and its logs in
`us-east-1`. The file is not attached by Terraform. Attach it only after
advanced features are active, first to a non-production target, then verify
allowed and denied calls before relying on it.

### Cheaper staging network

Staging no longer creates an idle NAT gateway or its Elastic IP. Each running
staging runtime can receive a public IPv4 address for outbound connections, but
its security group has no inbound rule at all. Administration stays on SSM and
the BOT API stays behind the outbound Cloudflare tunnel. Production remains in
private subnets behind NAT, and Terraform rejects a public IP on a production
runtime.

This removes the roughly $36/month NAT and NAT-address baseline from an empty
staging environment. A running staging runtime still incurs EC2, EBS, public
IPv4, KMS, logs, backup, data transfer and model costs. The shared foundation
adds two KMS keys plus small S3/CloudWatch usage; review a fresh AWS estimate
before applying.

## Safe execution order

1. **Completed — review locally.** Formatting, validation, security tests and
   exact plans passed with zero changes or deletions under the $50 limit.
2. **Completed — bootstrap state.** The state plan applied on October 16 and
   its temporary local state migrated into the encrypted backend. Encryption,
   privacy and versioning are verified.
3. **Completed — create the foundation.** The audit plan applied on October 16,
   and the owner security-alert subscription is confirmed.
4. **Completed — prove the controls.** Logging, management event selectors,
   encryption, privacy, versioning, alarms, anomaly monitoring, the first S3
   and CloudWatch delivery, native state-lock contention/release and a no-drift
   re-plan are verified. One intentional, clearly labeled alarm test reached
   the owner; the alarm returned to `OK` and no IAM change occurred.
5. **Prepare management recovery.** Complete every item in the checklist below
   and store recovery details outside the repository.
6. **Make the irreversible decision.** Stop and show the owner that the $50
   hard limit will disappear. Activation in AWS Settings requires a new owner
   decision and is outside the standing authorization.
7. **Immediately after activation:** attach and test the Region guardrail,
   verify the $40 Budget and cost anomaly subscription still work, repeat the
   read-only inventory, and confirm no resource exists outside approved
   Regions. Do not create workloads during this window.
8. **Recheck OIDC.** Confirm the OIDC API denial is gone, generate a fresh
   redacted Terraform plan, policy analysis and cost estimate, then ask for a
   separate approval for the empty-tenant staging foundation.

## Management-account safety checklist

Complete and record evidence for each item before activation:

- [ ] The Google/social identity used for AWS has a passkey or hardware MFA,
  current recovery email/phone and tested recovery codes stored offline.
- [ ] The AWS Builder ID also has MFA and recovery information. Do not change
  the IAM Identity Center identity source during launch.
- [ ] The future AWS management-account root identity has a unique password,
  hardware/passkey MFA, no access keys and tested recovery contact details.
- [ ] Security, operations and billing alternate contacts point to monitored
  owner-controlled addresses.
- [ ] Daily work uses short-lived sign-in. No IAM users or long-lived access
  keys are created.
- [ ] The management account holds governance/audit controls only. Client
  runtimes remain in the approved workload project/account design.
- [x] The state bootstrap and CloudTrail foundation are applied and verified.
- [ ] The $40 budget and $5 daily anomaly subscriptions are confirmed to the
  owner email; mark this complete after the first real alert or summary proves
  delivery. The separate security-alert delivery test has passed.
- [ ] `region-guardrail-us-east-2.json` has a tested rollback path and an owner
  copy outside the repository.
- [ ] The last inventory is empty outside `us-east-2`; only approved global
  WAF/CloudFront logging may exist in `us-east-1`.
- [ ] A written incident action says: suspend new provisioning, stop optional
  staging compute, preserve evidence, review CloudTrail, and rotate affected
  credentials. Never delete audit/state evidence during response.

## What remains intentionally unautomated

- Advanced-feature activation and the Region-policy attachment.
- Root/MFA/recovery changes.
- Any change outside the standing authorization in `AGENTS.md`.
- Creating the first client runtime.

These controls are security-sensitive and should remain explicit owner actions.

Primary references:

- https://docs.aws.amazon.com/accounts/latest/reference/activate-advanced-features.html
- https://docs.aws.amazon.com/awscloudtrail/latest/userguide/create-s3-bucket-policy-for-cloudtrail.html
- https://docs.aws.amazon.com/awscloudtrail/latest/userguide/create-kms-key-policy-for-cloudtrail.html
- https://docs.aws.amazon.com/cost-management/latest/userguide/getting-started-ad.html
- https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-requested-region.html
