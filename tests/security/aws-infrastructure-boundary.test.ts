import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

describe("AWS infrastructure boundary", () => {
  it("keeps model-provider secrets outside the Vercel control-plane role", () => {
    const policy = readFileSync(join(ROOT, "infra/terraform/modules/control-plane-role/main.tf"), "utf8");

    expect(policy).toContain("/tenants/*/runtime-*");
    expect(policy).toContain("/tenants/*/profiles/*");
    expect(policy).toContain("/tenants/*/integrations/*/webhook-*");
    expect(policy).not.toContain("/tenants/*/providers");
    expect(policy).not.toMatch(/secret:agenticbots\/\$\{var\.environment\}\/tenants\/\*"\]/);
  });

  it("fails closed outside the AWS project's selected Region", () => {
    for (const environment of ["staging", "prod"]) {
      const config = readFileSync(join(ROOT, `infra/terraform/envs/${environment}/main.tf`), "utf8");
      expect(config).toContain('default = "us-east-2"');
      expect(config).toContain('condition     = var.region == "us-east-2"');
    }
  });

  it("uses low-cost direct egress only in staging and preserves private production egress", () => {
    const staging = readFileSync(join(ROOT, "infra/terraform/envs/staging/main.tf"), "utf8");
    const production = readFileSync(join(ROOT, "infra/terraform/envs/prod/main.tf"), "utf8");
    const network = readFileSync(join(ROOT, "infra/terraform/modules/network/main.tf"), "utf8");
    const runtime = readFileSync(join(ROOT, "infra/terraform/modules/tenant-runtime/main.tf"), "utf8");

    expect(staging).toContain('network_egress_mode               = "direct"');
    expect(production).toContain('network_egress_mode               = "nat"');
    expect(network).toContain('count  = var.egress_mode == "nat" ? 1 : 0');
    expect(network).toContain('value       = var.egress_mode == "direct"');
    expect(runtime).toContain("associate_public_ip_address = var.associate_public_ip_address");
    expect(runtime).toContain('condition     = var.environment != "prod" || !var.associate_public_ip_address');

    const runtimeSecurityGroup = runtime.slice(
      runtime.indexOf('resource "aws_security_group" "runtime"'),
      runtime.indexOf('resource "aws_instance" "runtime"'),
    );
    expect(runtimeSecurityGroup).not.toMatch(/\bingress\s*\{/);
  });

  it("protects Terraform state with encryption, versioning, TLS and deletion guards", () => {
    const bootstrap = readFileSync(join(ROOT, "infra/terraform/foundation-bootstrap/main.tf"), "utf8");

    expect(bootstrap).toContain('enable_key_rotation     = true');
    expect(bootstrap).toContain('versioning_configuration { status = "Enabled" }');
    expect(bootstrap).toContain('variable = "aws:SecureTransport"');
    expect(bootstrap.match(/prevent_destroy = true/g)).toHaveLength(2);

    for (const backend of [
      "infra/terraform/foundation/backend.tf",
      "infra/terraform/envs/staging/backend.tf",
      "infra/terraform/envs/prod/backend.tf",
    ]) {
      const config = readFileSync(join(ROOT, backend), "utf8");
      expect(config).toContain('encrypt      = true');
      expect(config).toContain('kms_key_id   = "REPLACE-state-kms-key-arn"');
      expect(config).toContain('use_lockfile = true');
    }
  });

  it("defines a validated single-Region management trail and cost anomaly alerts", () => {
    const foundation = readFileSync(join(ROOT, "infra/terraform/foundation/main.tf"), "utf8");

    expect(foundation).toContain('condition     = var.region == "us-east-2"');
    expect(foundation).toContain('is_multi_region_trail         = false');
    expect(foundation).toContain('include_global_service_events = true');
    expect(foundation).toContain('enable_log_file_validation    = true');
    expect(foundation).toContain('include_management_events = true');
    expect(foundation).toContain('monitor_dimension = "SERVICE"');
    expect(foundation).toContain('key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"');
    expect(foundation).toContain('pattern        = "{ $.userIdentity.type = \\"Root\\" }"');
    expect(foundation.match(/prevent_destroy = true/g)).toHaveLength(4);
  });

  it("ships a review-only Region guardrail for Ohio with a narrow global-service exception", () => {
    const policy = JSON.parse(
      readFileSync(join(ROOT, "infra/aws-policies/region-guardrail-us-east-2.json"), "utf8"),
    ) as {
      Statement: Array<{
        Sid: string;
        Effect: string;
        NotAction: string[];
        Condition: Record<string, Record<string, string | string[]>>;
      }>;
    };

    expect(policy.Statement).toHaveLength(2);
    expect(policy.Statement.every((statement) => statement.Effect === "Deny")).toBe(true);
    expect(policy.Statement[0]?.Condition.StringNotEquals?.["aws:RequestedRegion"]).toEqual([
      "us-east-2",
      "us-east-1",
    ]);
    expect(policy.Statement[1]?.Condition.StringEquals?.["aws:RequestedRegion"]).toBe("us-east-1");
    expect(policy.Statement[1]?.NotAction).toContain("wafv2:*");
    expect(policy.Statement[1]?.NotAction).toContain("logs:*");
  });
});
