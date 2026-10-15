# One client = one isolated runtime:
#   EC2 (no inbound rules) + separate encrypted EBS data volume mounted at
#   /opt/agenticbots/data + a KMS key for this tenant only + an instance role
#   that can read ONLY this tenant's secrets + CloudWatch alarms + log group.
# The data volume carries every byte of runtime state (memory, sessions,
# skills, automations, profiles). It survives container restarts, reboots,
# suspension, upgrades and instance replacement.

locals {
  # Staging secrets are deleted immediately so a test client can be
  # re-created under the same id; production keeps the 30-day safety net.
  secret_recovery_days = var.environment == "staging" ? 0 : 30
  name                 = "agenticbots-${var.tenant_id}"
  secret_prefix        = "agenticbots/${var.environment}/tenants/${var.tenant_id}"
  tags = merge(var.tags, {
    "agenticbots:managed" = "true"
    "agenticbots:tenant"  = var.tenant_id
    "agenticbots:env"     = var.environment
  })
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# ───────────── KMS: one key per tenant (EBS + secrets) ─────────────
data "aws_iam_policy_document" "kms" {
  statement {
    sid       = "AccountAdministersKeyViaIam"
    actions   = ["kms:*"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
  }
  # CloudWatch Logs can only encrypt a log group with a key whose POLICY
  # (not IAM) allows it — scoped to this tenant's log group.
  statement {
    sid       = "CloudWatchLogsForThisTenant"
    actions   = ["kms:Encrypt*", "kms:Decrypt*", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:Describe*"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["logs.${data.aws_region.current.region}.amazonaws.com"]
    }
    condition {
      test     = "ArnLike"
      variable = "kms:EncryptionContext:aws:logs:arn"
      values   = ["arn:aws:logs:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:log-group:/agenticbots/${var.environment}/${var.tenant_id}"]
    }
  }
}

resource "aws_kms_key" "tenant" {
  description             = "${local.name} data + secrets"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy                  = data.aws_iam_policy_document.kms.json
  tags                    = local.tags
}

resource "aws_kms_alias" "tenant" {
  name          = "alias/${local.name}"
  target_key_id = aws_kms_key.tenant.key_id
}

# ───────────── Secrets Manager: paths only; values are set by the CLI / instance ─────────────
resource "aws_secretsmanager_secret" "runtime" {
  name                    = "${local.secret_prefix}/runtime"
  description             = "Runtime endpoint + private connectivity credentials for ${var.tenant_id}"
  kms_key_id              = aws_kms_key.tenant.arn
  recovery_window_in_days = local.secret_recovery_days
  tags                    = local.tags
}

resource "aws_secretsmanager_secret" "profile" {
  for_each                = toset(var.bot_profiles)
  name                    = "${local.secret_prefix}/profiles/${each.key}"
  description             = "Runtime API key for the ${each.key} Bot of ${var.tenant_id}. Unique per profile; never reused."
  kms_key_id              = aws_kms_key.tenant.arn
  recovery_window_in_days = local.secret_recovery_days
  tags                    = merge(local.tags, { "agenticbots:profile" = each.key })
}

resource "aws_secretsmanager_secret" "provider" {
  name                    = "${local.secret_prefix}/providers"
  description             = "Model provider keys for ${var.tenant_id}"
  kms_key_id              = aws_kms_key.tenant.arn
  recovery_window_in_days = local.secret_recovery_days
  tags                    = local.tags
}

# ───────────── IAM: the instance may read/write ONLY its own tenant's secrets ─────────────
data "aws_iam_policy_document" "assume_ec2" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "instance" {
  name               = "${local.name}-instance"
  assume_role_policy = data.aws_iam_policy_document.assume_ec2.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cw_agent" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

data "aws_iam_policy_document" "tenant" {
  statement {
    sid       = "OwnTenantSecretsOnly"
    actions   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret", "secretsmanager:PutSecretValue"]
    resources = ["arn:aws:secretsmanager:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:secret:${local.secret_prefix}/*"]
  }
  statement {
    sid       = "OwnKmsKey"
    actions   = ["kms:Decrypt", "kms:Encrypt", "kms:GenerateDataKey*", "kms:DescribeKey"]
    resources = [aws_kms_key.tenant.arn]
  }
  # Manual backups (lifecycle.sh backup-now). CreateSnapshot is authorized
  # against the source volume (existing tags) AND the new snapshot (tags in
  # the request), so each side gets its own condition.
  statement {
    sid       = "SnapshotOwnVolume"
    actions   = ["ec2:CreateSnapshot"]
    resources = ["arn:aws:ec2:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:volume/*"]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/agenticbots:tenant"
      values   = [var.tenant_id]
    }
  }
  statement {
    sid       = "CreateTaggedSnapshot"
    actions   = ["ec2:CreateSnapshot"]
    resources = ["arn:aws:ec2:${data.aws_region.current.region}::snapshot/*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/agenticbots:tenant"
      values   = [var.tenant_id]
    }
  }
  statement {
    sid       = "TagOnSnapshotCreate"
    actions   = ["ec2:CreateTags"]
    resources = ["arn:aws:ec2:${data.aws_region.current.region}::snapshot/*"]
    condition {
      test     = "StringEquals"
      variable = "ec2:CreateAction"
      values   = ["CreateSnapshot"]
    }
  }
  statement {
    sid       = "RuntimeBundle"
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::${var.artifact_bucket}/runtime/*"]
  }
  statement {
    sid       = "RuntimeBundleKey"
    actions   = ["kms:Decrypt", "kms:DescribeKey"]
    resources = [var.artifact_kms_key_arn]
  }
}

resource "aws_iam_role_policy" "tenant" {
  name   = "tenant-scope"
  role   = aws_iam_role.instance.id
  policy = data.aws_iam_policy_document.tenant.json
}

resource "aws_iam_instance_profile" "instance" {
  name = "${local.name}-instance"
  role = aws_iam_role.instance.name
}

# ───────────── Network: no inbound rules at all ─────────────
resource "aws_security_group" "runtime" {
  name        = "${local.name}-runtime"
  description = "No inbound. Admin via SSM; API via outbound-only tunnel."
  vpc_id      = var.vpc_id
  egress {
    description = "Outbound HTTPS (model providers, tunnel, AWS APIs, client systems)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "Cloudflare Tunnel (QUIC)"
    from_port   = 7844
    to_port     = 7844
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "Cloudflare Tunnel (HTTP/2 fallback)"
    from_port   = 7844
    to_port     = 7844
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "DNS"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "HTTP for OS package mirrors"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.tags
}

# ───────────── Compute ─────────────
resource "aws_instance" "runtime" {
  ami                         = data.aws_ssm_parameter.al2023.value
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  associate_public_ip_address = var.associate_public_ip_address
  vpc_security_group_ids      = [aws_security_group.runtime.id]
  iam_instance_profile        = aws_iam_instance_profile.instance.name
  monitoring                  = true

  metadata_options {
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1          # instance credentials are host-only
    http_endpoint               = "enabled"
  }

  root_block_device {
    volume_size           = var.root_volume_gb
    volume_type           = "gp3"
    encrypted             = true
    kms_key_id            = aws_kms_key.tenant.arn
    delete_on_termination = true
  }

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    tenant_id       = var.tenant_id
    environment     = var.environment
    region          = data.aws_region.current.region
    engine_image    = var.engine_image
    bundle_version  = var.runtime_bundle_version
    artifact_bucket = var.artifact_bucket
    profiles        = join(" ", var.bot_profiles)
    model_provider  = var.default_model_provider
    model           = var.default_model
    secret_prefix   = local.secret_prefix
  })
  user_data_replace_on_change = false

  tags = merge(local.tags, { Name = local.name })

  lifecycle {
    # The AMI updates constantly; replacing a runtime is a deliberate act
    # (see docs/runbooks/RESTORE_CLIENT_RUNTIME.md), not a plan side effect.
    ignore_changes = [ami, user_data]
    precondition {
      condition     = var.environment != "prod" || can(regex("^arn:aws:sns:", var.alarm_topic_arn))
      error_message = "Production runtimes require an alarm notification topic with a tested subscription."
    }
    precondition {
      condition     = var.environment != "prod" || !var.associate_public_ip_address
      error_message = "Production runtimes must not have public IPv4 addresses; use NAT egress."
    }
  }
}

resource "aws_ebs_volume" "data" {
  availability_zone = aws_instance.runtime.availability_zone
  size              = var.data_volume_gb
  type              = "gp3"
  encrypted         = true
  kms_key_id        = aws_kms_key.tenant.arn
  tags              = merge(local.tags, { Name = "${local.name}-data", "agenticbots:backup" = "daily-${var.environment}" })

  lifecycle {
    prevent_destroy = true # client state. Destroy is a separate, confirmed procedure.
  }
}

resource "aws_volume_attachment" "data" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.data.id
  instance_id = aws_instance.runtime.id
}

# ───────────── Observability ─────────────
resource "aws_cloudwatch_log_group" "runtime" {
  name              = "/agenticbots/${var.environment}/${var.tenant_id}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.tenant.arn
  tags              = local.tags
}

resource "aws_cloudwatch_metric_alarm" "status_check" {
  alarm_name          = "${local.name}-status-check"
  namespace           = "AWS/EC2"
  metric_name         = "StatusCheckFailed"
  dimensions          = { InstanceId = aws_instance.runtime.id }
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 3
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  alarm_actions       = var.alarm_topic_arn == "" ? [] : [var.alarm_topic_arn]
  tags                = local.tags
}

resource "aws_cloudwatch_metric_alarm" "disk" {
  alarm_name          = "${local.name}-disk"
  namespace           = "AgenticBots/Runtime"
  metric_name         = "disk_used_percent"
  dimensions          = { InstanceId = aws_instance.runtime.id }
  statistic           = "Maximum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 85
  comparison_operator = "GreaterThanOrEqualToThreshold"
  # No data during first boot / while suspended is not a full disk.
  treat_missing_data = "notBreaching"
  alarm_actions      = var.alarm_topic_arn == "" ? [] : [var.alarm_topic_arn]
  tags               = local.tags
}
