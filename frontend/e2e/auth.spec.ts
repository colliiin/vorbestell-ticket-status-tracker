import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.ok(), "Die Anwendung ist unter /api/health nicht erreichbar. Starte zuerst `docker compose up -d`.").toBeTruthy();
});

test("wrong login shows an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Benutzer").fill("e2e-wrong-user");
  await page.getByLabel("Passwort").fill("definitely-wrong");
  await page.getByRole("button", { name: "Anmelden" }).click();

  await expect(page.getByText("Ungueltige Zugangsdaten")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("dashboard redirects anonymous users to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();
});
