# One complete AgenticBots environment (staging or prod) in one AWS account:
# network, the lifecycle SSM document, the Vercel OIDC control-plane role,
# daily backups, the runtime-bundle bucket, an alarm topic, and one isolated
# runtime per client. envs/staging and envs/prod are thin wrappers around it.
#
# Everything is named with the environment so staging and prod can share an
# account without colliding: separate VPC, document, role, DLM policy,
# secret paths (agenticbots/<env>/tenants/...) and tags.

variable "environment" {
  description = "staging or prod. Part of every name, tag and secret path."
  type        = string
  validation {
    condition     = contains(["staging", "prod"], var.environment)
    error_message = "environment must be staging or prod."
  }
}
variable "vpc_cidr" {
  type    = string
  default = "10.42.0.0/16"
}
variable "vercel_team_slug" { type = string }
variable "vercel_project_name" { type = string }
variable "vercel_environments" {
  description = "Vercel environments allowed to assume the control-plane role (production, preview, development)."
  type        = list(string)
}
variable "existing_vercel_oidc_provider_arn" {
  description = "An AWS account can hold only ONE OIDC provider per issuer URL. Leave empty in the first environment you apply; in the second, pass the first one's output `vercel_oidc_provider_arn`."
  type        = string
  default     = ""
}
variable "artifact_bucket" { type = string }
variable "alarm_email" {
  type    = string
  default = ""
}
variable "default_engine_image" { type = string }
variable "default_model_provider" {
  description = "Model provider the runtime uses by default (must match a key in the tenant's providers secret)."
  type        = string
  default     = "openrouter"
}
variable "default_model" {
  description = "Default model id for that provider."
  type        = string
}
variable "backup_retention_days" {
  type    = number
  default = 30
}
variable "tenants" {
  type = map(object({
    instance_type  = optional(string, "t3.medium")
    data_volume_gb = optional(number, 100)
    bot_profiles   = list(string)
    engine_image   = optional(string)
    bundle_version = optional(string, "1.0.0")
  }))
  default = {}
}

locals {
  tags = { "agenticbots:env" = var.environment }
}

module "network" {
  source = "../network"
  name   = "agenticbots-${var.environment}"
  cidr   = var.vpc_cidr
  tags   = local.tags
}

module "lifecycle_document" {
  source = "../lifecycle-document"
  name   = "AgenticBots-RuntimeLifecycle-${var.environment}"
  tags   = local.tags
}

module "control_plane" {
  source                     = "../control-plane-role"
  name                       = "agenticbots-control-plane-${var.environment}"
  environment                = var.environment
  vercel_team_slug           = var.vercel_team_slug
  vercel_project_name        = var.vercel_project_name
  vercel_environments        = var.vercel_environments
  existing_oidc_provider_arn = var.existing_vercel_oidc_provider_arn
  lifecycle_document_arn     = module.lifecycle_document.arn
  tags                       = local.tags
}

module "backups" {
  source         = "../backups"
  environment    = var.environment
  retention_days = var.backup_retention_days
  tags           = local.tags
}

resource "aws_s3_bucket" "artifacts" {
  bucket = var.artifact_bucket
  tags   = local.tags
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "aws:kms" }
  }
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_sns_topic" "alarms" {
  name = "agenticbots-${var.environment}-alarms"
  tags = local.tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alarm_email == "" ? 0 : 1
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

module "tenant" {
  source   = "../tenant-runtime"
  for_each = var.tenants

  tenant_id              = each.key
  environment            = var.environment
  instance_type          = each.value.instance_type
  data_volume_gb         = each.value.data_volume_gb
  bot_profiles           = each.value.bot_profiles
  engine_image           = coalesce(each.value.engine_image, var.default_engine_image)
  default_model_provider = var.default_model_provider
  default_model          = var.default_model
  runtime_bundle_version = each.value.bundle_version
  artifact_bucket        = aws_s3_bucket.artifacts.bucket
  vpc_id                 = module.network.vpc_id
  subnet_id              = module.network.subnet_ids[0]
  alarm_topic_arn        = aws_sns_topic.alarms.arn
  tags                   = local.tags
}

output "control_plane_role_arn" { value = module.control_plane.role_arn }
output "vercel_oidc_provider_arn" { value = module.control_plane.oidc_provider_arn }
output "lifecycle_document" { value = module.lifecycle_document.name }
output "artifact_bucket" { value = aws_s3_bucket.artifacts.bucket }
output "tenants" {
  value = { for k, t in module.tenant : k => {
    instance_id    = t.instance_id
    data_volume_id = t.data_volume_id
    runtime_secret = t.runtime_secret
  } }
}
