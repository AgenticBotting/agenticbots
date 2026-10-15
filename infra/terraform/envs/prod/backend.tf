# Remote state. Create the state bucket once (docs/runbooks/FIRST_STAGING_TEST.md
# step "Terraform state"), then put its name below.
terraform {
  backend "s3" {
    bucket       = "REPLACE-agenticbots-tfstate"
    key          = "prod/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    kms_key_id   = "REPLACE-state-kms-key-arn"
    use_lockfile = true
  }
}
