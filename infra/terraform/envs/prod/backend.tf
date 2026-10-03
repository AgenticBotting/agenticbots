# Remote state. Create the bucket + lock table once (docs/BEGINNER_SETUP.md,
# step "Terraform state"), then fill in the names below.
terraform {
  backend "s3" {
    bucket       = "REPLACE-agenticbots-tfstate"
    key          = "prod/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
