terraform {
  backend "s3" {
    bucket       = "agenticbots-tfstate-18ed89c0e87b"
    key          = "foundation/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    kms_key_id   = "arn:aws:kms:us-east-2:998797758891:key/555774df-3cd7-42bd-b913-673b5fd98659"
    use_lockfile = true
  }
}
