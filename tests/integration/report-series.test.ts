import { describe, it, expect } from "vitest";
import { world } from "../support/fixtures";
import { clientReport } from "@/server/services/reports";

describe("client report series (dashboard charts)", () => {
  it("daily series add up to the headline results and line up with the dates", async () => {
    const w = await world();
    for (const days of [7, 30, 90]) {
      const rep = await clientReport(w.r, w.acme.id, days);
      expect(rep.dates).toHaveLength(days);
      for (const s of rep.series) {
        expect(s.points).toHaveLength(days);
        expect(s.previousPoints).toHaveLength(days);
        expect(s.points.reduce((a, b) => a + b, 0)).toBe(s.total);
        const headline = rep.results.find((r) => r.key === s.key);
        expect(headline?.value ?? 0).toBe(s.total);
      }
      for (const c of rep.bots) expect(c.points).toHaveLength(days);
    }
  });

  it("never mixes organizations", async () => {
    const w = await world();
    const acme = await clientReport(w.r, w.acme.id, 30);
    const bay = await clientReport(w.r, w.bayside.id, 30);
    const acmeBots = new Set((await w.r.list("bots", { orgId: w.acme.id })).map((b) => b.id));
    expect(bay.bots.every((b) => !acmeBots.has(b.botId))).toBe(true);
    expect(acme.series.length).toBeGreaterThan(0);
  });
});
