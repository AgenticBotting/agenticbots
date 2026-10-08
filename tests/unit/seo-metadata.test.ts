import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { metadataText } from "../../scripts/lib/metadata-text.mjs";

it("measures rendered metadata text rather than React escape syntax", () => {
  const values = [
    "Agentic PPC management for contractors in O'Fallon, MO | AgenticBots",
    "Agentic marketing for contractors in Coeur d'Alene, ID | AgenticBots",
    'SEO & PPC: "scope" < review > approval',
    "Literal &amp; and &#x27; stay literal, not recursively decoded",
  ];
  for (const value of values) {
    const title = renderToStaticMarkup(createElement("title", null, value)).match(/<title>([^<]*)<\/title>/)![1];
    const description = renderToStaticMarkup(createElement("meta", { name: "description", content: value })).match(/content="([^"]*)"/)![1];
    expect(metadataText(title)).toBe(value);
    expect(metadataText(description)).toBe(value);
    expect(metadataText(title).length).toBe(value.length);
  }
});
