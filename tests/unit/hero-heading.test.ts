import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroHeading } from "@/components/ui/HeroHeading";
import { balanceHeroHeading, heroTextWidth } from "@/lib/hero-heading";
import { PUBLIC_NICHES } from "@/lib/public-niches";
import { ALL_SERVICES } from "@/lib/catalog";
import { ALL_CITIES } from "@/lib/geo/dataset";
import { agenticServiceLabel, getSearchPositioning } from "@/lib/search-positioning";
import { nicheAudience } from "@/lib/niche-directory";

describe("complete two-line hero headings", () => {
  it("retains short editorial lines and a single row for short plain titles", () => {
    const home = balanceHeroHeading("More opportunities.", "Less manual work.");
    expect(home.lines.map(line => line.map(word => word.text).join(" "))).toEqual(["More opportunities.", "Less manual work."]);
    expect(balanceHeroHeading("Privacy Policy").lines).toHaveLength(1);
  });

  it("rebalances the reported plumbing heading without losing its location or accent", () => {
    const heading = balanceHeroHeading("Agentic marketing", "for plumbing companies in New Mexico.");
    expect(heading.lines).toHaveLength(2);
    expect(heading.lines[0].length).toBeGreaterThan(2);
    expect(heading.lines.flat().filter(word => word.accent).map(word => word.text).join(" ")).toBe("for plumbing companies in New Mexico.");
    const html = renderToStaticMarkup(createElement(HeroHeading, { text: "Agentic marketing", accent: "for plumbing companies in New Mexico." }));
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html.replace(/<[^>]+>/g, "")).toBe("Agentic marketing for plumbing companies in New Mexico.");
    expect(html).not.toMatch(/aria-hidden|line-clamp|<script|ellipsis/);
  });

  it("preserves every niche/service sentence in two rows, including the longest city name", () => {
    const city = ALL_CITIES.reduce((longest, item) => heroTextWidth(item.city) > heroTextWidth(longest.city) ? item : longest).city;
    for (const niche of PUBLIC_NICHES) for (const service of ALL_SERVICES) {
      const title = agenticServiceLabel(getSearchPositioning(service.slug).label);
      const accent = `for ${nicheAudience(niche.name)} in ${city}.`;
      const result = balanceHeroHeading(title, accent);
      expect(result.lines).toHaveLength(2);
      expect(result.lines.every(line => line.length > 0)).toBe(true);
      expect(result.lines.flat().map(word => word.text).join(" ")).toBe(`${title} ${accent}`);
      expect(Number.isFinite(result.width) && result.width > 0).toBe(true);
    }
  });

  it("handles punctuation, accents, excess spaces and a single long word without truncation", () => {
    for (const title of ["São José — HVAC & BMS", "  One   connected\nBOT system.  ", "Supercalifragilisticexpialidocious", ""]) {
      const result = balanceHeroHeading(title);
      expect(result.lines.length).toBeLessThanOrEqual(2);
      expect(result.lines.flat().map(word => word.text).join(" ")).toBe(title.trim().replace(/\s+/g, " "));
      expect(result.width).toBeGreaterThan(0);
    }
    expect(heroTextWidth("José")).toBe(heroTextWidth("Jose"));
  });

  it("offers a readable compact heading with the full buyer/location context above the single H1", () => {
    const compact = { text: "Agentic marketing", accent: "for your business.", context: "Plumbing · New Mexico" };
    const html = renderToStaticMarkup(createElement(HeroHeading, { text: "Agentic marketing", accent: "for plumbing companies in New Mexico.", compact }));
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html.indexOf(compact.context)).toBeLessThan(html.indexOf("<h1"));
    expect(html).toContain('class="hero-heading-compact"');
    const mobile = balanceHeroHeading(compact.text, compact.accent, true);
    // At the narrowest supported phone (320px minus 40px gutters), type remains
    // larger than body copy instead of shrinking the entire local SEO sentence.
    expect(280 * 0.98 / mobile.width).toBeGreaterThan(27);
  });
});
