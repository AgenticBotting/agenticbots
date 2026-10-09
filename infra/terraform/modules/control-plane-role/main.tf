# IAM role the AgenticBots web app (on Vercel) assumes through OIDC
# federation. No static AWS keys are stored in Vercel. Permissions are the
# minimum the operator console needs, scoped by tag and path.

variable "name" {
  type    = string
  default = "agenticbots-control-plane"
}
variable "vercel_team_slug" {
  description = "Your Vercel team slug (Vercel → Settings → General)."
  type        = string
}
variable "vercel_project_name" { type = string }
variable "vercel_environments" {
  description = "Which Vercel environments may assume the role."
  type        = list(string)
  default     = ["production"]
}
variable "environment" {
  type    = string
  default = "prod"
}
variable "lifecycle_document_arn" { type = string }
variable "existing_oidc_provider_arn" {
  description = "Reuse an existing Vercel OIDC provider (one per issuer URL per AWS account). Empty = create it."
  type        = string
  default     = ""
}
variable "tags" {
  type    = map(string)
  default = {}
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  issuer            = "oidc.vercel.com/${var.vercel_team_slug}"
  oidc_provider_arn = var.existing_oidc_provider_arn != "" ? var.existing_oidc_provider_arn : aws_iam_openid_connect_provider.vercel[0].arn
}

resource "aws_iam_openid_connect_provider" "vercel" {
  count          = var.existing_oidc_provider_arn == "" ? 1 : 0
  url            = "https://${local.issuer}"
  client_id_list = ["https://vercel.com/${var.vercel_team_slug}"]
  tags           = var.tags
}

data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${local.issuer}:aud"
      values   = ["https://vercel.com/${var.vercel_team_slug}"]
    }
    condition {
      test     = "StringLike"
      variable = "${local.issuer}:sub"
      values   = [for e in var.vercel_environments : "owner:${var.vercel_team_slug}:project:${var.vercel_project_name}:environment:${e}"]
    }
  }
}

resource "aws_iam_role" "control_plane" {
  name                 = var.name
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  max_session_duration = 3600
  tags                 = var.tags
}

data "aws_iam_policy_document" "permissions" {
  statement {
    sid       = "ReadInstanceState"
    actions   = ["ec2:DescribeInstances", "ec2:DescribeInstanceStatus"]
    resources = ["*"] # Describe* has no resource-level permissions in EC2.
  }
  statement {
    sid       = "RunLifecycleDocumentOnly"
    actions   = ["ssm:SendCommand"]
    resources = [var.lifecycle_document_arn]
  }
  statement {
    sid       = "OnManagedRuntimesOnly"
    actions   = ["ssm:SendCommand"]
    resources = ["arn:aws:ec2:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:instance/*"]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/agenticbots:managed"
      values   = ["true"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/agenticbots:env"
      values   = [var.environment]
    }
  }
  statement {
    sid       = "ReadCommandResults"
    actions   = ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"]
    resources = ["*"]
  }
  statement {
    sid       = "ReadTenantSecrets"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = ["arn:aws:secretsmanager:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:secret:agenticbots/${var.environment}/tenants/*"]
  }
  statement {
    sid       = "DecryptTenantSecrets"
    actions   = ["kms:Decrypt"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["secretsmanager.${data.aws_region.current.region}.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/agenticbots:managed"
      values   = ["true"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/agenticbots:env"
      values   = [var.environment]
    }
  }
  statement {
    sid       = "ReadRuntimeMetrics"
    actions   = ["cloudwatch:GetMetricStatistics", "cloudwatch:GetMetricData", "cloudwatch:DescribeAlarms"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "permissions" {
  name   = "control-plane"
  role   = aws_iam_role.control_plane.id
  policy = data.aws_iam_policy_document.permissions.json
}

output "role_arn" { value = aws_iam_role.control_plane.arn }
output "oidc_provider_arn" { value = local.oidc_provider_arn }
