variable "region" {
  type    = string
  default = "us-east-1"
}
variable "vercel_team_slug" { type = string }
variable "vercel_project_name" {
  type    = string
  default = "agenticbots"
}
variable "artifact_bucket" {
  description = "S3 bucket for runtime bundles (created below)."
  type        = string
}
variable "alarm_email" {
  type    = string
  default = ""
}
variable "default_engine_image" {
  description = "Pinned engine image with digest. See docs/research/HERMES_INTEGRATION.md."
  type        = string
}
variable "tenants" {
  description = "Client runtimes. Written by `npm run ops -- tenant:create`."
  type = map(object({
    instance_type  = optional(string, "t3.medium")
    data_volume_gb = optional(number, 100)
    bot_profiles   = list(string)
    engine_image   = optional(string)
    bundle_version = optional(string, "1.0.0")
  }))
  default = {}
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { "agenticbots:stack" = "prod", "managed-by" = "terraform" }
  }
}

locals {
  tags = { "agenticbots:env" = "prod" }
}

module "network" {
  source = "../../modules/network"
  name   = "agenticbots-prod"
  tags   = local.tags
}

module "lifecycle_document" {
  source = "../../modules/lifecycle-document"
  tags   = local.tags
}

module "control_plane" {
  source                 = "../../modules/control-plane-role"
  vercel_team_slug       = var.vercel_team_slug
  vercel_project_name    = var.vercel_project_name
  lifecycle_document_arn = module.lifecycle_document.arn
  tags                   = local.tags
}

module "backups" {
  source = "../../modules/backups"
  tags   = local.tags
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

resource "aws_sns_topic" "alarms" {
  name = "agenticbots-prod-alarms"
  tags = local.tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alarm_email == "" ? 0 : 1
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

module "tenant" {
  source   = "../../modules/tenant-runtime"
  for_each = var.tenants

  tenant_id              = each.key
  environment            = "prod"
  instance_type          = each.value.instance_type
  data_volume_gb         = each.value.data_volume_gb
  bot_profiles           = each.value.bot_profiles
  engine_image           = coalesce(each.value.engine_image, var.default_engine_image)
  runtime_bundle_version = each.value.bundle_version
  artifact_bucket        = aws_s3_bucket.artifacts.bucket
  vpc_id                 = module.network.vpc_id
  subnet_id              = module.network.subnet_ids[0]
  alarm_topic_arn        = aws_sns_topic.alarms.arn
  tags                   = local.tags
}

output "control_plane_role_arn" { value = module.control_plane.role_arn }
output "lifecycle_document" { value = module.lifecycle_document.name }
output "tenants" {
  value = { for k, t in module.tenant : k => {
    instance_id    = t.instance_id
    data_volume_id = t.data_volume_id
    runtime_secret = t.runtime_secret
  } }
}
