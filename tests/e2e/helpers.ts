import { expect, type Page } from "@playwright/test";

export const PASSWORD = "agenticbots-demo";

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/login/);
}

/** Submit a ConfirmAction dialog. */
export async function confirmDialog(page: Page, button: string) {
  const dialog = page.locator("dialog[open]");
  await dialog.getByRole("button", { name: button }).click();
}
