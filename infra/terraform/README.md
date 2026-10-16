# AgenticBots infrastructure (Terraform)

One isolated runtime per client. Nothing here runs automatically.

```
foundation-bootstrap/        one-time encrypted/versioned/locked Terraform state bucket
foundation/                  CloudTrail, audit evidence, security alerts, cost anomalies
envs/staging/                low-cost staging; direct outbound, zero inbound ports
envs/prod/                   production; private runtimes behind managed NAT
modules/platform-stack       everything one runtime environment needs
modules/network              environment-specific outbound network
modules/tenant-runtime       per client EC2 + encrypted data volume/KMS/IAM/secrets/alarms
modules/lifecycle-document   the only remote command the web app may run
modules/control-plane-role   Vercel OIDC role; no static AWS keys
modules/backups              daily encrypted EBS snapshots by tag
../aws-policies/             reviewed organization-policy drafts; never auto-attached
```

## Required order

1. `foundation-bootstrap` was applied on October 16, 2026 and its temporary
   local state was migrated into the protected S3 backend. Re-run only from a
   reviewed saved plan under the `AGENTS.md` preflight.
2. The resulting bucket name and KMS key ARN are recorded in the backend
   blocks for `foundation`, `envs/staging` and `envs/prod`.
3. `foundation` was applied on October 16, 2026 with no post-apply drift.
   Confirm the pending SNS security email and complete the delivery proof.
4. Complete `docs/runbooks/AWS_FOUNDATION_AND_ADVANCED_FEATURES.md` before any
   advanced-feature activation.
5. Generate a new staging plan. Never reuse a saved plan after code, variables,
   credentials or live infrastructure changes.

Clients are declared in `envs/<env>/tenants.auto.tfvars.json`, which the
provisioning CLI writes (`npm run ops:staging -- tenant:create` for staging,
`npm run ops -- tenant:create` for production).

```bash
cd infra/terraform/envs/staging
terraform init
terraform plan -out tfplan
terraform show tfplan             # review every create/change/destroy
terraform apply tfplan            # allowed after AGENTS.md preflight passes
```

The CLI refuses cloud changes unless `ALLOW_CLOUD_CHANGES=1`. Staging uses
outbound-only direct internet access to avoid the idle NAT charge; its runtime
security groups still have no ingress. Production uses private subnets and NAT,
and the tenant module rejects production public IPs.

Staging and prod may share one AWS account: every name, tag, role, SSM document,
DLM policy and secret path carries the environment. Only the Vercel OIDC
provider is account-wide; pass the first environment's
`vercel_oidc_provider_arn` output to the second through
`existing_vercel_oidc_provider_arn`.

First staging test: `docs/runbooks/FIRST_STAGING_TEST.md`.
