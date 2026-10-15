# AgenticBots prod environment. All resources come from modules/platform-stack.
variable "region" {
  type    = string
  default = "us-east-2"
  validation {
    condition     = var.region == "us-east-2"
    error_message = "This AWS project is restricted to its selected Region, us-east-2 (Ohio)."
  }
}
variable "vercel_team_slug" { type = string }
variable "vercel_project_name" {
  type    = string
  default = "agenticbots"
}
variable "existing_vercel_oidc_provider_arn" {
  type    = string
  default = ""
}
variable "artifact_bucket" { type = string }
variable "alarm_email" {
  type    = string
  default = ""
}
variable "default_engine_image" {
  description = "Pinned engine image with digest. See docs/research/HERMES_INTEGRATION.md."
  type        = string
}
variable "default_model_provider" {
  type    = string
  default = "openrouter"
}
variable "default_model" { type = string }
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

module "stack" {
  source = "../../modules/platform-stack"

  environment                       = "prod"
  vpc_cidr                          = "10.42.0.0/16"
  vercel_team_slug                  = var.vercel_team_slug
  vercel_project_name               = var.vercel_project_name
  vercel_environments               = ["production"]
  existing_vercel_oidc_provider_arn = var.existing_vercel_oidc_provider_arn
  artifact_bucket                   = var.artifact_bucket
  alarm_email                       = var.alarm_email
  default_engine_image              = var.default_engine_image
  default_model_provider            = var.default_model_provider
  default_model                     = var.default_model
  backup_retention_days             = 30
  tenants                           = var.tenants
}

output "control_plane_role_arn" { value = module.stack.control_plane_role_arn }
output "vercel_oidc_provider_arn" { value = module.stack.vercel_oidc_provider_arn }
output "lifecycle_document" { value = module.stack.lifecycle_document }
output "artifact_bucket" { value = module.stack.artifact_bucket }
output "tenants" { value = module.stack.tenants }
