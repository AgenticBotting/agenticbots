# Project-wide audit and cost foundation. Apply this only after the encrypted
# remote state bucket has been created and this directory's backend initialized.
# Regional resources are locked to the AWS project's selected Region.

variable "region" {
  type    = string
  default = "us-east-2"
  validation {
    condition     = var.region == "us-east-2"
    error_message = "This AWS project is restricted to its selected Region, us-east-2 (Ohio)."
  }
}
variable "audit_bucket_name" {
  description = "Globally unique bucket for CloudTrail evidence."
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.audit_bucket_name))
    error_message = "audit_bucket_name must be a valid lowercase S3 bucket name."
  }
}
variable "alert_email" {
  description = "Owner-controlled mailbox for security and cost alerts."
  type        = string
  validation {
    condition     = can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.alert_email))
    error_message = "alert_email must be a valid email address."
  }
}
variable "anomaly_threshold_usd" {
  description = "Daily cost anomaly summary includes anomalies at or above this absolute impact."
  type        = number
  default     = 5
  validation {
    condition     = var.anomaly_threshold_usd >= 1
    error_message = "anomaly_threshold_usd must be at least $1."
  }
}
variable "cloudtrail_retention_days" {
  description = "CloudWatch Logs retention. S3 evidence remains versioned until explicitly governed."
  type        = number
  default     = 400
  validation {
    condition     = contains([365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653], var.cloudtrail_retention_days)
    error_message = "Use a CloudWatch Logs-supported retention value of at least one year."
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      "agenticbots:stack" = "foundation"
      "managed-by"        = "terraform"
      "security-tier"     = "critical"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  trail_name     = "agenticbots-management-events"
  trail_arn      = "arn:${data.aws_partition.current.partition}:cloudtrail:${var.region}:${data.aws_caller_identity.current.account_id}:trail/${local.trail_name}"
  log_group_name = "/agenticbots/audit/cloudtrail"
  log_group_arn  = "arn:${data.aws_partition.current.partition}:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:${local.log_group_name}"
  tags           = { "agenticbots:env" = "shared" }
}

# ───────────── Encryption ─────────────
data "aws_iam_policy_document" "audit_key" {
  statement {
    sid       = "AccountAdministersKeyViaIam"
    actions   = ["kms:*"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
  }

  statement {
    sid       = "CloudTrailEncryptsAuditEvidence"
    actions   = ["kms:GenerateDataKey*", "kms:DescribeKey"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.trail_arn]
    }
    condition {
      test     = "StringLike"
      variable = "kms:EncryptionContext:aws:cloudtrail:arn"
      values   = [local.trail_arn]
    }
  }

  statement {
    sid       = "CloudWatchLogsEncryptsAuditStream"
    actions   = ["kms:Encrypt*", "kms:Decrypt*", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:Describe*"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["logs.${var.region}.amazonaws.com"]
    }
    condition {
      test     = "ArnEquals"
      variable = "kms:EncryptionContext:aws:logs:arn"
      values   = [local.log_group_arn]
    }
  }

  statement {
    sid       = "EncryptedAlertDelivery"
    actions   = ["kms:Decrypt", "kms:GenerateDataKey*"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com", "sns.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_kms_key" "audit" {
  description             = "AgenticBots CloudTrail, audit logs and security alerts"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy                  = data.aws_iam_policy_document.audit_key.json
  tags                    = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_kms_alias" "audit" {
  name          = "alias/agenticbots-audit"
  target_key_id = aws_kms_key.audit.key_id
}

# ───────────── Immutable audit destination ─────────────
resource "aws_s3_bucket" "audit" {
  bucket = var.audit_bucket_name
  tags   = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_ownership_controls" "audit" {
  bucket = aws_s3_bucket.audit.id
  rule { object_ownership = "BucketOwnerEnforced" }
}

resource "aws_s3_bucket_public_access_block" "audit" {
  bucket                  = aws_s3_bucket.audit.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "audit" {
  bucket = aws_s3_bucket.audit.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id
  rule {
    bucket_key_enabled = true
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.audit.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id
  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"
    filter {}
    abort_incomplete_multipart_upload { days_after_initiation = 7 }
  }
}

data "aws_iam_policy_document" "audit_bucket" {
  statement {
    sid       = "CloudTrailChecksBucketAcl"
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.audit.arn]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.trail_arn]
    }
  }

  statement {
    sid       = "CloudTrailWritesAccountEvidence"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.audit.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.trail_arn]
    }
  }

  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.audit.arn, "${aws_s3_bucket.audit.arn}/*"]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "audit" {
  bucket = aws_s3_bucket.audit.id
  policy = data.aws_iam_policy_document.audit_bucket.json
}

# ───────────── CloudTrail + reviewable alerts ─────────────
resource "aws_cloudwatch_log_group" "audit" {
  name              = local.log_group_name
  retention_in_days = var.cloudtrail_retention_days
  kms_key_id        = aws_kms_key.audit.arn
  tags              = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

data "aws_iam_policy_document" "cloudtrail_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.trail_arn]
    }
  }
}

resource "aws_iam_role" "cloudtrail_logs" {
  name               = "agenticbots-cloudtrail-to-cloudwatch"
  assume_role_policy = data.aws_iam_policy_document.cloudtrail_assume.json
  tags               = local.tags
}

data "aws_iam_policy_document" "cloudtrail_logs" {
  statement {
    sid       = "WriteOnlyThisAuditLogGroup"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.audit.arn}:*"]
  }
}

resource "aws_iam_role_policy" "cloudtrail_logs" {
  name   = "write-audit-log-group"
  role   = aws_iam_role.cloudtrail_logs.id
  policy = data.aws_iam_policy_document.cloudtrail_logs.json
}

resource "aws_cloudtrail" "management" {
  name                          = local.trail_name
  s3_bucket_name                = aws_s3_bucket.audit.id
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_log_file_validation    = true
  enable_logging                = true
  kms_key_id                    = aws_kms_key.audit.arn
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.audit.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_logs.arn
  tags                          = local.tags

  event_selector {
    include_management_events = true
    read_write_type           = "All"
  }

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [aws_s3_bucket_policy.audit]
}

resource "aws_sns_topic" "security" {
  name              = "agenticbots-security-alerts"
  kms_master_key_id = aws_kms_key.audit.arn
  tags              = local.tags
}

resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_log_metric_filter" "iam_activity" {
  name           = "agenticbots-iam-api-activity"
  log_group_name = aws_cloudwatch_log_group.audit.name
  pattern        = "{ $.eventSource = \"iam.amazonaws.com\" }"

  metric_transformation {
    name      = "IamApiActivity"
    namespace = "AgenticBots/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_activity" {
  alarm_name          = "agenticbots-iam-api-activity"
  alarm_description   = "An IAM API call occurred; review CloudTrail before approving it."
  namespace           = "AgenticBots/Security"
  metric_name         = "IamApiActivity"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.security.arn]
  tags                = local.tags
}

resource "aws_cloudwatch_log_metric_filter" "root_activity" {
  name           = "agenticbots-root-activity"
  log_group_name = aws_cloudwatch_log_group.audit.name
  pattern        = "{ $.userIdentity.type = \"Root\" }"

  metric_transformation {
    name      = "RootActivity"
    namespace = "AgenticBots/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_activity" {
  alarm_name          = "agenticbots-root-activity"
  alarm_description   = "AWS root credentials were used. Investigate immediately."
  namespace           = "AgenticBots/Security"
  metric_name         = "RootActivity"
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.security.arn]
  tags                = local.tags
}

# ───────────── Adaptive cost anomaly monitoring ─────────────
resource "aws_ce_anomaly_monitor" "services" {
  name              = "AgenticBots AWS services"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
  tags              = local.tags
}

resource "aws_ce_anomaly_subscription" "daily" {
  name             = "AgenticBots daily cost anomalies"
  frequency        = "DAILY"
  monitor_arn_list = [aws_ce_anomaly_monitor.services.arn]

  subscriber {
    type    = "EMAIL"
    address = var.alert_email
  }

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      match_options = ["GREATER_THAN_OR_EQUAL"]
      values        = [tostring(var.anomaly_threshold_usd)]
    }
  }

  tags = local.tags
}

output "cloudtrail_name" { value = aws_cloudtrail.management.name }
output "audit_bucket_name" { value = aws_s3_bucket.audit.id }
output "security_topic_arn" { value = aws_sns_topic.security.arn }
output "cost_anomaly_monitor_arn" { value = aws_ce_anomaly_monitor.services.arn }
