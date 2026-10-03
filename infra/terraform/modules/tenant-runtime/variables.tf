variable "tenant_id" {
  description = "Stable tenant identifier, e.g. acme-roofing-x7k2. Also the Secrets Manager path segment."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{2,62}$", var.tenant_id))
    error_message = "tenant_id: lowercase letters, numbers and dashes."
  }
}
variable "environment" {
  description = "prod or staging — part of every secret path."
  type        = string
  default     = "prod"
}
variable "instance_type" {
  type    = string
  default = "t3.medium"
}
variable "data_volume_gb" {
  type    = number
  default = 100
}
variable "root_volume_gb" {
  type    = number
  default = 30
}
variable "subnet_id" { type = string }
variable "vpc_id" { type = string }
variable "bot_profiles" {
  description = "Runtime profiles (Bots) to provision, e.g. [\"ads\",\"seo\"]. Only purchased Bots."
  type        = list(string)
}
variable "engine_image" {
  description = "Pinned runtime image INCLUDING digest: nousresearch/hermes-agent:v2026.9.24@sha256:..."
  type        = string
  validation {
    condition     = can(regex("@sha256:[a-f0-9]{64}$", var.engine_image))
    error_message = "engine_image must be pinned by digest (…@sha256:<64 hex>). Never deploy a floating tag."
  }
}
variable "runtime_bundle_version" {
  type    = string
  default = "1.0.0"
}
variable "artifact_bucket" {
  description = "S3 bucket holding the runtime bundle (compose file, lifecycle script, skills)."
  type        = string
}
variable "alarm_topic_arn" {
  type    = string
  default = ""
}
variable "suspended" {
  description = "When true the runtime service is stopped (storage untouched). Normally driven by the app via SSM, not Terraform."
  type        = bool
  default     = false
}
variable "tags" {
  type    = map(string)
  default = {}
}
