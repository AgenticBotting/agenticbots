import { describe, expect, it } from "vitest";
import { ALL_SERVICES } from "@/lib/catalog";
import { SERVICE_POSITIONING, getServicePositioning } from "@/lib/service-positioning";
import { getServicePlatforms, SERVICE_PLATFORM_IDS } from "@/config/service-platforms";

describe("enterprise service positioning", () => {
  it("covers every public service exactly once", () => {
    const serviceSlugs = ALL_SERVICES.map((service) => service.slug).sort();
    const positioningSlugs = Object.keys(SERVICE_POSITIONING).sort();

    expect(positioningSlugs).toEqual(serviceSlugs);
  });

  it("provides complete positioning for every service", () => {
    for (const service of ALL_SERVICES) {
      const positioning = getServicePositioning(service.slug);
      expect(positioning.headline.length).toBeGreaterThan(20);
      expect(positioning.subhead.length).toBeGreaterThan(20);
      expect(positioning.lead).toContain("managed");
      expect(positioning.summary.length).toBeGreaterThan(20);
      expect(positioning.execution.length).toBeGreaterThan(20);
    }
  });

  it("provides a distinct six-system scoping reference for every service", () => {
    for (const service of ALL_SERVICES) {
      const systems = getServicePlatforms(service.slug);
      expect(SERVICE_PLATFORM_IDS[service.slug]).toBeDefined();
      expect(systems).toHaveLength(6);
      expect(new Set(systems.map((system) => system.id)).size).toBe(6);
      expect(systems.every((system) => system.name.length > 1)).toBe(true);
    }
  });
});
