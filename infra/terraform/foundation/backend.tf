terraform {
  backend "s3" {
    bucket       = "REPLACE-agenticbots-tfstate"
    key          = "foundation/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    kms_key_id   = "REPLACE-state-kms-key-arn"
    use_lockfile = true
  }
}
