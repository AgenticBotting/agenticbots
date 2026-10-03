# AgenticBots infrastructure (Terraform)

One isolated runtime per client. Nothing here runs automatically.

```
envs/staging/               the staging environment (state in S3, see backend.tf)
envs/prod/                  the production environment
modules/platform-stack      everything one environment needs; both envs wrap it
modules/network             one VPC; runtimes get NO inbound access at all
modules/tenant-runtime      per client: EC2 + encrypted data volume + KMS key + IAM role
                            + Secrets Manager paths + CloudWatch alarms + log group
modules/lifecycle-document  the ONLY remote command the web app may run (SSM document)
modules/control-plane-role  IAM role the web app assumes via Vercel OIDC (no static keys)
modules/backups             daily encrypted EBS snapshots by tag (Data Lifecycle Manager)
```

Clients are declared in `envs/<env>/tenants.auto.tfvars.json`, which the
provisioning CLI writes (`npm run ops:staging -- tenant:create` for staging,
`npm run ops -- tenant:create` for production). Plan and apply:

```bash
cd infra/terraform/envs/prod
terraform init
terraform plan -out tfplan
terraform apply tfplan        # only after reading the plan
```

The CLI wraps these and refuses to apply unless `ALLOW_CLOUD_CHANGES=1`.
Staging and prod may share one AWS account: every name, tag, role, SSM
document, DLM policy and secret path carries the environment. Only the
Vercel OIDC provider is account-wide — pass the first environment's
`vercel_oidc_provider_arn` output to the second (`existing_vercel_oidc_provider_arn`).

First staging test: docs/runbooks/FIRST_STAGING_TEST.md.
