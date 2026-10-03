# Daily encrypted snapshots of every runtime data volume (tag
# agenticbots:backup=daily-<env>), kept for `retention_days`. Snapshots of a
# canceled client are NOT deleted with the client; they age out on this
# schedule, or are removed deliberately (see the destroy procedure).

variable "environment" { type = string }
variable "retention_days" {
  type    = number
  default = 30
}
variable "tags" {
  type    = map(string)
  default = {}
}

data "aws_iam_policy_document" "dlm_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["dlm.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "dlm" {
  name               = "agenticbots-dlm-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.dlm_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "dlm" {
  role       = aws_iam_role.dlm.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

resource "aws_dlm_lifecycle_policy" "daily" {
  description        = "AgenticBots ${var.environment} runtime data - daily"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"
  tags               = var.tags

  policy_details {
    resource_types = ["VOLUME"]
    # Environment-specific value so a staging and a prod policy in the same
    # account never snapshot each other's volumes.
    target_tags = { "agenticbots:backup" = "daily-${var.environment}" }

    schedule {
      name = "daily"
      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["07:00"]
      }
      retain_rule {
        interval      = var.retention_days
        interval_unit = "DAYS"
      }
      copy_tags = true
      tags_to_add = {
        "agenticbots:snapshot" = "daily"
      }
    }
  }
}
