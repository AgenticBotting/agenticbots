import { describe, expect, it } from "vitest";
import { validatePatch } from "../../convex/platformIntegrity";

describe("platform storage integrity", () => {
  it("rejects identity and tenant fields using an ES2020-compatible own-property check", () => {
    expect(() => validatePatch("bots", { orgId: "another-org" })).toThrow(
      "Record identity and ownership cannot be changed.",
    );
    expect(() => validatePatch("sessions", { userId: "another-user" })).toThrow(
      "Security binding cannot be changed.",
    );
  });

  it("does not reject inherited properties as submitted patch fields", () => {
    const patch = Object.create({ orgId: "inherited" }) as Record<string, unknown>;
    patch.updatedAt = "2026-10-16T00:00:00.000Z";

    expect(() => validatePatch("bots", patch)).not.toThrow();
  });
});
