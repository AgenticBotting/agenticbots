# AWS organization guardrail drafts

These JSON files are review artifacts. Nothing in this directory attaches a
policy to the AWS Organization.

`region-guardrail-us-east-2.json` denies Regional API activity outside the
project's selected Region, `us-east-2`. It permits `us-east-1` only for global
CloudFront/WAF dependencies and CloudWatch Logs supporting them. Global
services whose endpoints use `us-east-1` are explicitly exempted from the
Regional deny, following AWS's `aws:RequestedRegion` guidance.

Apply this policy only after advanced AWS features are active, from the
management account, after testing it on a non-production target. An SCP limits
permissions; it does not grant any permission. Keep the management recovery
procedure available before attaching it.

Primary references:

- https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_aws_deny-requested-region.html
- https://docs.aws.amazon.com/controltower/latest/controlreference/primary-region-deny-policy.html
- https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_syntax.html
