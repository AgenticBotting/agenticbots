# AgenticBots infrastructure (Terraform)

One isolated runtime per client. Nothing here runs automatically.

```
envs/prod/                  the production stack (state lives in S3, see backend.tf)
modules/network             one VPC; runtimes get NO inbound access at all
modules/tenant-runtime      per client: EC2 + encrypted data volume + KMS key + IAM role
                            + Secrets Manager paths + CloudWatch alarms + log group
modules/lifecycle-document  the ONLY remote command the web app may run (SSM document)
modules/control-plane-role  IAM role the web app assumes via Vercel OIDC (no static keys)
modules/backups             daily encrypted EBS snapshots by tag (Data Lifecycle Manager)
```

Clients are declared in `envs/prod/tenants.auto.tfvars.json`, which the
provisioning CLI writes (`npm run ops -- tenant:create`). Plan and apply:

```bash
cd infra/terraform/envs/prod
terraform init
terraform plan -out tfplan
terraform apply tfplan        # only after reading the plan
```

The CLI wraps these and refuses to apply unless `ALLOW_CLOUD_CHANGES=1`.
See docs/BEGINNER_SETUP.md for the full walkthrough.
