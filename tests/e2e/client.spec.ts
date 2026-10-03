import { test, expect } from "@playwright/test";
import { login, logout } from "./helpers";

test("client sees results, asks for work, approves, checks integrations and reports", async ({ page, isMobile }) => {
  await login(page, "owner@acmeroofing.demo");
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByRole("heading", { name: "Acme Roofing" })).toBeVisible();
  await expect(page.getByText("Results, last 30 days")).toBeVisible();
  await expect(page.getByText("Prospects researched")).toBeVisible();
  await expect(page.getByText("Your Bots")).toBeVisible();

  // No runtime branding anywhere on the page
  expect((await page.content()).toLowerCase()).not.toContain("hermes");

  const nav = (name: string) => (isMobile ? page.locator(".pf-mobile-tabs").getByRole("link", { name }) : page.locator(".pf-portal-nav").getByRole("link", { name }));

  await nav("Activity").click();
  await expect(page.getByText(/Prospecting Bot qualified 31/)).toBeVisible();

  await nav("Requests").click();
  await page.getByLabel("What do you need?").fill("Build a list of HOAs in Boca Raton");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("heading", { name: "Build a list of HOAs in Boca Raton" })).toBeVisible();
  await expect(page.getByText(/Submitted/).first()).toBeVisible();

  await nav("Approvals").click();
  await page.getByRole("button", { name: "Approve" }).first().click();
  await expect(page.getByText(/Approved\. The Bot will carry it out\./).first()).toBeVisible();

  await nav("Integrations").click();
  await expect(page.getByText("ServiceTitan")).toBeVisible();
  await expect(page.getByText("Needs Attention").first()).toBeVisible();
  expect(await page.content()).not.toMatch(/invalid_grant|secretRef|agenticbots\/demo\/tenants/);

  await nav("Reports").click();
  await expect(page.getByText("Work by Bot")).toBeVisible();

  // Operator console is off limits
  await page.goto("/ops");
  await expect(page).toHaveURL(/\/portal/);
  const api = await page.request.get("/api/ops/clients");
  expect(api.status()).toBe(403);

  if (!isMobile) await logout(page);
});
