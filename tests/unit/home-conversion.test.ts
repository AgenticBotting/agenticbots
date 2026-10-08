import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AuditForm } from "@/components/marketing/AuditForm";
import { HomeWorkspace } from "@/components/marketing/HomeWorkspace";
import HomePage from "@/app/page";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("homepage conversion contract", () => {
  it("keeps the current setup, monthly and expansion terms on the new homepage", () => {
    const html = renderToStaticMarkup(createElement(HomePage));
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    for (const price of ["$499", "$7,500", "$2,500", "From $15,000", "From $3,500"]) {
      expect(html).toContain(price);
    }
    expect(html).toContain("ten BOTS are not included at the starting retainer");
    expect(html).toContain("third-party usage charges are separate");
    expect(html).toContain('id="audit"');
  });

  it("keeps core intake fields required while optional qualification stays disclosed", () => {
    const html = renderToStaticMarkup(createElement(AuditForm, { compact: true }));
    expect(html.match(/<input[^>]*required=""/g)).toHaveLength(3);
    const details = html.match(/<details>([\s\S]*?)<\/details>/)?.[1];
    expect(details).toContain("Phone");
    expect(details).toContain("New leads a month");
    expect(details).not.toContain('required=""');
    expect(html).toContain("No charge today. Scope confirmed first.");
    const full = renderToStaticMarkup(createElement(AuditForm));
    expect(full).not.toContain("<details>");
    expect(full).toContain("New leads a month");
  });

  it("identifies the workspace as fictional and exposes only local preview controls", () => {
    const html = renderToStaticMarkup(createElement(HomeWorkspace));
    expect(html).toContain('data-demo="true"');
    expect(html).toContain("fictional data");
    expect(html).toContain("Draft · not sent");
    expect(html.match(/type="button"/g)).toHaveLength(3);
    expect(html).not.toContain("<form");
  });
});
