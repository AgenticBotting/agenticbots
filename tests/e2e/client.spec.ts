import { test, expect } from "@playwright/test";
import { login, logout } from "./helpers";

test("client records privacy and cancellation requests online", async ({ page }) => {
  await login(page, "owner@acmeroofing.demo");
  await page.getByRole("link", { name: "Account, privacy & cancellation" }).click();
  await expect(page.getByRole("heading", { name: "Account & privacy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy policy" }).first()).toHaveAttribute("href", "/privacy");
  await page.getByLabel("Request type").selectOption("opt_out");
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page.getByText(/Request received\. Reference/)).toBeVisible();
  await expect(page.getByText("opt out", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Request type").selectOption("cancel");
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page.getByText("cancel", { exact: true }).first()).toBeVisible();
});

test("client sees results, asks for work, approves, checks integrations and reports", async ({ page, isMobile }) => {
  await login(page, "owner@acmeroofing.demo");
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByRole("heading", { name: "Acme Roofing" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Results" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your Bots" })).toBeVisible();

  // No runtime branding anywhere on the page
  expect((await page.content()).toLowerCase()).not.toContain("hermes");

  const nav = (name: string) => (isMobile ? page.locator(".pf-mobile-tabs").getByRole("link", { name }) : page.locator(".pf-portal-nav").getByRole("link", { name }));

  await nav("Activity").click();
  await expect(page.getByText(/Prospecting Bot qualified 31/)).toBeVisible();

  await nav("Requests").click();
  await page.getByLabel("What do you need?").fill("Build a list of HOAs in Boca Raton");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("link", { name: "Build a list of HOAs in Boca Raton" }).first()).toBeVisible();
  await expect(page.getByText(/Submitted/).first()).toBeVisible();

  await nav("Approvals").click();
  const pendingApproval = page.getByRole("article").filter({ has: page.getByRole("button", { name: "Approve", exact: true }) }).first();
  const approvalTitle = await pendingApproval.getByRole("heading").innerText();
  await page.getByRole("button", { name: "Approve" }).first().click();
  await expect(page.getByRole("article", { name: approvalTitle }).getByText(/Approved/)).toBeVisible();

  await nav("Integrations").click();
  await expect(page.getByText("ServiceTitan", { exact: true })).toBeVisible();
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
