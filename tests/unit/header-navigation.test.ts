import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Header } from "@/components/layout/Header";

const route = vi.hoisted(() => ({ pathname: "/industries/niches/commercial-roofing" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

describe("public header navigation", () => {
  it("offers distinct call, text, contact and paid-audit paths without precomposing a message", () => {
    const html = renderToStaticMarkup(createElement(Header));
    expect(html).toContain('href="tel:+15617172777"');
    expect(html).toContain('aria-label="Call 561-717-2777"');
    expect(html).toContain('href="sms:+15617172777"');
    expect(html).toContain('aria-label="Text us at 561-717-2777"');
    expect(html).not.toContain("sms:+15617172777?");
    expect(html).toContain('href="mailto:hello@agenticbots.dev"');
    expect(html).toContain('href="/contact"');
    expect(html).toContain('href="/#audit"');
    expect(html).toContain("BOT audit · $499");
  });

  it("retains outcome/location menus and exposes industries and the blog once in primary navigation", () => {
    const html = renderToStaticMarkup(createElement(Header));
    const nav = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/)![0];
    expect(nav).toContain('aria-label="Main navigation"');
    expect(nav).toContain("Services");
    expect(nav).toContain("Service areas");
    for (const href of ["/industries", "/how-it-works", "/pricing", "/blog"]) expect(nav.split(`href="${href}"`)).toHaveLength(2);
    expect(nav).toContain("Industries we serve");
    expect(nav).toContain('data-active="true"');
    expect(nav).not.toContain('aria-current="page"');
  });

  it("marks only an exact destination as the current page", () => {
    route.pathname = "/industries";
    const html = renderToStaticMarkup(createElement(Header));
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    const currentLink = html.match(/<a\b[^>]*aria-current="page"[^>]*>/)![0];
    expect(currentLink).toContain('href="/industries"');
    route.pathname = "/industries/niches/commercial-roofing";
  });
});
