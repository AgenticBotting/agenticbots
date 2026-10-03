import { test, expect } from "@playwright/test";
import { login, logout, confirmDialog } from "./helpers";

test("operator runs the business from the console", async ({ page }) => {
  await login(page, "operator@agenticbots.demo");
  await expect(page.getByRole("heading", { name: "What needs attention" })).toBeVisible();

  // Open client → Bots → a Bot
  await page.getByRole("link", { name: "Clients", exact: true }).click();
  await page.getByRole("link", { name: "Acme Roofing" }).first().click();
  await expect(page.getByRole("heading", { name: "Acme Roofing" })).toBeVisible();
  await page.getByRole("link", { name: /^Bots/ }).last().click();
  await page.getByRole("link", { name: "SEO Bot" }).first().click();

  // Start a Bot Run and watch activity
  await page.getByLabel("Task").fill("Find local-search content opportunities for metal roofing");
  await page.getByRole("button", { name: "Start Bot Run" }).click();
  await expect(page).toHaveURL(/\/ops\/runs\//);
  await expect(page.getByText("Technical timeline")).toBeVisible();
  await expect(page.getByText(/Run completed|Run started/).first()).toBeVisible({ timeout: 30_000 });

  // Approvals
  await page.getByRole("link", { name: /^Approvals/ }).click();
  await page.getByRole("button", { name: "Approve for client" }).first().click();
  await expect(page.getByText("Approved.").first()).toBeVisible();

  // Request: assign + view incident
  await page.getByRole("link", { name: /^Requests/ }).click();
  await page.getByRole("link", { name: /property managers/ }).click();
  await page.getByLabel("Assigned operator").selectOption({ label: "Jordan Ellis" });
  await page.getByRole("button", { name: "Save routing" }).click();
  await expect(page.getByText("Request updated.")).toBeVisible();
  await page.getByRole("link", { name: "Monitoring" }).click();
  await expect(page.getByText("ServiceTitan needs attention")).toBeVisible();

  // Billing: create invoice, record ACH payment
  await page.goto("/ops/billing");
  await page.getByRole("link", { name: "Invoice" }).first().click();
  await page.locator('input[name="line0Desc"]').fill("Custom development — Q4 landing pages");
  await page.locator('input[name="line0Amount"]').fill("1,500");
  await page.getByRole("checkbox", { name: /Monthly fee/ }).uncheck();
  await page.getByRole("button", { name: "Create draft invoice" }).click();
  await expect(page.getByRole("heading", { name: /Invoice AB-/ })).toBeVisible();
  await page.getByRole("button", { name: "Mark as sent" }).click();
  await expect(page.getByLabel("Amount received ($)")).toBeVisible();
  await page.getByLabel("Payment method").selectOption("ach");
  await page.getByLabel(/Reference/).fill("ACH-E2E-001");
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText(/recorded\. Balance \$0/)).toBeVisible();

  // Past due, then manual suspension, verify blocked, reactivate, healthy
  await page.goto("/ops/clients");
  await page.getByRole("link", { name: "Acme Roofing" }).first().click();
  await page.getByRole("button", { name: "Suspend client" }).click();
  await page.locator("dialog[open]").getByLabel("Reason").selectOption("manual");
  await confirmDialog(page, "Suspend client");
  await expect(page.getByText(/Suspended \(manual\)/)).toBeVisible();
  await page.getByRole("link", { name: /^Bots/ }).last().click();
  await page.getByRole("link", { name: "SEO Bot" }).first().click();
  await expect(page.getByRole("button", { name: "Start Bot Run" })).toBeDisabled();
  await page.goto("/ops/clients");
  await page.getByRole("link", { name: "Acme Roofing" }).first().click();
  await page.getByRole("button", { name: "Reactivate client" }).click();
  await confirmDialog(page, "Reactivate");
  await expect(page.getByText("Healthy").first()).toBeVisible({ timeout: 30_000 });

  await logout(page);
});

test("Bayside invoice can be marked past due", async ({ page }) => {
  await login(page, "operator@agenticbots.demo");
  await page.goto("/ops/billing?f=past_due");
  await expect(page.getByRole("link", { name: "Bayside Plumbing Co." })).toBeVisible();
  await expect(page.getByText(/eligible/).first()).toBeVisible();
});
