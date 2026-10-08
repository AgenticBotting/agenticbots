import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PricingCards } from "@/components/marketing/PricingCards";
import { PROPOSAL_OFFER } from "@/config/marketing-offer";

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

  it("routes all plan enquiries into the proposal intake", () => {
    const html = renderToStaticMarkup(createElement(PricingCards));
    expect(html.match(/href="\/plan"/g)).toHaveLength(3);
    expect(html).not.toContain("checkout");
    expect(html).not.toMatch(/most popular|guaranteed|unlimited/i);
  });

  it("positions the proposal as an unpaid qualification step", () => {
    expect(PROPOSAL_OFFER.note).toContain("No payment required");
    expect(PROPOSAL_OFFER.cta).toBe("Begin Step-1");
    expect(PROPOSAL_OFFER.name).toBe("BOT implementation proposal");
  });
});
