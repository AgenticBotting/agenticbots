# Remote state. Create the state bucket once (docs/runbooks/FIRST_STAGING_TEST.md
# step "Terraform state"), then put its name below.
terraform {
  backend "s3" {
    bucket       = "REPLACE-agenticbots-tfstate"
    key          = "staging/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true
  }
}
