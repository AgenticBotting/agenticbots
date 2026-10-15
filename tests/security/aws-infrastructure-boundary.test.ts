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
});
