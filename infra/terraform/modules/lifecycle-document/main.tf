# The ONLY command the web app can run on a client runtime. Every action is
# an enumerated value; the document runs a fixed script on the instance.
# There is no free-form shell anywhere in the control path.

variable "name" {
  type    = string
  default = "AgenticBots-RuntimeLifecycle"
}
variable "tags" {
  type    = map(string)
  default = {}
}

resource "aws_ssm_document" "lifecycle" {
  name            = var.name
  document_type   = "Command"
  document_format = "YAML"
  tags            = var.tags
  content         = <<-DOC
    schemaVersion: "2.2"
    description: "AgenticBots runtime lifecycle. Fixed actions only."
    parameters:
      action:
        type: String
        allowedValues: [status, start-runtime, stop-runtime, restart-runtime, park-bot, unpark-bot, deploy-bot, backup-now]
      profile:
        type: String
        default: "none"
        allowedPattern: "^[a-z0-9_-]{1,40}$"
      runtimeId:
        type: String
        default: "none"
        allowedPattern: "^[A-Za-z0-9_.:-]{1,80}$"
    mainSteps:
      - action: aws:runShellScript
        name: lifecycle
        inputs:
          timeoutSeconds: "600"
          runCommand:
            - "/opt/agenticbots/bin/lifecycle.sh '{{ action }}' '{{ profile }}'"
  DOC
}

output "name" { value = aws_ssm_document.lifecycle.name }
output "arn" { value = aws_ssm_document.lifecycle.arn }
