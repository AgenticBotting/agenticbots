output "instance_id" { value = aws_instance.runtime.id }
output "data_volume_id" { value = aws_ebs_volume.data.id }
output "availability_zone" { value = aws_instance.runtime.availability_zone }
output "kms_key_arn" { value = aws_kms_key.tenant.arn }
output "runtime_secret" { value = aws_secretsmanager_secret.runtime.name }
output "profile_secrets" { value = { for k, s in aws_secretsmanager_secret.profile : k => s.name } }
output "instance_role_arn" { value = aws_iam_role.instance.arn }
