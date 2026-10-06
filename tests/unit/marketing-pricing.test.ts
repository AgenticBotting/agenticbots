import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PricingCards } from "@/components/marketing/PricingCards";

describe("public pricing offer", () => {
  it("shows setup and monthly costs together, with scoped Growth expansion", () => {
    const html = renderToStaticMarkup(createElement(PricingCards));
    expect(html).toContain("$7,500");
    expect(html).toContain("$2,500");
    expect(html).toContain("From $15,000");
    expect(html).toContain("From $3,500");
    expect(html).toContain("initial system of 3–5 specialized BOTS");
    expect(html).toContain("ten BOTS are not included at the starting retainer");
    expect(html).toContain("third-party usage charges are separate");
    expect(html).toContain("Custom architecture, BOT count and operating capacity.");
  });

  it("routes all plan enquiries to the audit on the page displaying the offer", () => {
    const html = renderToStaticMarkup(createElement(PricingCards, { auditHref: "/pricing#audit" }));
    expect(html.match(/href="\/pricing#audit"/g)).toHaveLength(3);
    expect(html).not.toContain("checkout");
    expect(html).not.toMatch(/most popular|guaranteed|unlimited/i);
  });
});
