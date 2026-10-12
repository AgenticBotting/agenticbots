import { describe, expect, it } from "vitest";
import { parseManifestDigest, validateTagName, verifyCandidateRecord } from "../../scripts/hermes-release-candidate.mjs";

describe("Hermes release candidate parser", () => {
  it("accepts a stable semantic release tag and exact manifest digest", () => {
    expect(validateTagName("v0.21.7")).toBe("v0.21.7");
    expect(parseManifestDigest('{"dockerManifestDigest":"sha256:444b42594e7f467425872fc35e077a227d377f0fe0726bc818706d62175fad8b"}'))
      .toBe("sha256:444b42594e7f467425872fc35e077a227d377f0fe0726bc818706d62175fad8b");
  });

  it("supports the older human-readable annotated tag format", () => {
    expect(parseManifestDigest("Docker manifest digest: `sha256:444b42594e7f467425872fc35e077a227d377f0fe0726bc818706d62175fad8b`"))
      .toBe("sha256:444b42594e7f467425872fc35e077a227d377f0fe0726bc818706d62175fad8b");
  });

  it("rejects floating tags and tag messages without an immutable digest", () => {
    expect(() => validateTagName("latest")).toThrow(/Unexpected Hermes release tag/);
    expect(() => parseManifestDigest("Docker image: nousresearch/hermes-agent:latest")).toThrow(/manifest digest/);
  });

  it("fails when a recorded candidate drifts or is marked promotable", () => {
    const live = { repository: "NousResearch/hermes-agent", tag: "v0.21.7" };
    expect(() => verifyCandidateRecord(live, { ...live, promotionAllowed: false })).not.toThrow();
    expect(() => verifyCandidateRecord(live, { ...live, tag: "v0.21.6", promotionAllowed: false })).toThrow(/differs/);
    expect(() => verifyCandidateRecord(live, { ...live, promotionAllowed: true })).toThrow(/must not allow promotion/);
  });
});
