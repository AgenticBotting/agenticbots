import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CoverageSystemVisual,
  HeroSystemVisual,
} from "@/components/marketing/WorkforceSystemVisuals";

describe("marketing system visuals", () => {
  it("renders interface visuals without image payloads", () => {
    const html = renderToStaticMarkup(
      createElement("main", null, createElement(HeroSystemVisual), createElement(CoverageSystemVisual)),
    );

    expect(html).not.toContain("<img");
    expect(html).toContain("Illustrative BOT workflow");
    expect(html).toContain("External actions wait for approval");
    expect(html).toContain("BOT ACTIVITY");
    expect(html).toContain("Illustrative interface");
  });
});
