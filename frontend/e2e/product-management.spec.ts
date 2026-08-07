import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

type AdminCredentials = {
  username: string;
  password: string;
};

type StaffProductListItem = {
  id: number;
  name: string;
  is_active: boolean;
};

function adminCredentials(): AdminCredentials {
  const username = process.env.E2E_ADMIN_USERNAME;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error("E2E_ADMIN_USERNAME und E2E_ADMIN_PASSWORD muessen gesetzt sein.");
  }
  return { username, password };
}

async function expectAppIsReachable(request: APIRequestContext) {
  const health = await request.get("/api/health");
  expect(health.ok(), "Die Anwendung ist unter /api/health nicht erreichbar. Starte zuerst `docker compose up -d`.").toBeTruthy();
}

async function login(page: Page) {
  const { username, password } = adminCredentials();
  await page.goto("/login");
  await page.getByLabel("Benutzer").fill(username);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: "Produkte", exact: true })).toBeVisible();
}

async function apiLogin(request: APIRequestContext): Promise<string> {
  const { username, password } = adminCredentials();
  const response = await request.post("/api/auth/login", { data: { username, password } });
  expect(response.ok(), "E2E-Admin konnte sich nicht anmelden. Pruefe Testbenutzer und Env-Variablen.").toBeTruthy();
  const body = await response.json();
  return body.csrf_token;
}

async function deactivateProductsByName(request: APIRequestContext, productNames: string[]) {
  if (!productNames.length) return;
  const csrf = await apiLogin(request);
  for (const name of productNames) {
    const list = await request.get(`/api/staff/products?search=${encodeURIComponent(name)}&page_size=100`);
    if (!list.ok()) continue;
    const body = await list.json();
    for (const product of body.items.filter((item: StaffProductListItem) => item.name === name && item.is_active)) {
      await request.patch(`/api/staff/products/${product.id}`, {
        data: { is_active: false },
        headers: { "X-CSRF-Token": csrf },
      });
    }
  }
}

function staffProductRow(page: Page, productName: string) {
  return page.getByTestId("staff-product-row").filter({ hasText: productName });
}

function publicProductCard(page: Page, productName: string) {
  return page.getByTestId("product-card").filter({ hasText: productName });
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test.beforeEach(async ({ request }) => {
  await expectAppIsReachable(request);
});

test("product management and order smoke flow", async ({ page, request }) => {
  const stamp = Date.now();
  const productName = `E2E Produkt ${stamp}`;
  const customerName = `E2E Kunde ${stamp}`;
  const blockedCustomerName = `E2E Blockiert ${stamp}`;
  const createdProducts = [productName];

  try {
    await login(page);

    await page.goto("/dashboard/products");
    await page.getByRole("link", { name: /Neues Produkt/ }).click();
    await expect(page).toHaveURL(/\/dashboard\/products\/new$/);

    await page.getByRole("button", { name: "Produkt erstellen" }).click();
    await expect(page.getByText("Name ist ein Pflichtfeld.")).toBeVisible();

    await page.getByLabel("Name *").fill(productName);
    await page.getByLabel("Preis *").fill("-1");
    await page.getByRole("button", { name: "Produkt erstellen" }).click();
    await expect(page.getByText(/Preis muss/)).toBeVisible();

    await page.getByLabel("Beschreibung").fill("Automatisch durch Playwright erstellt");
    await page.getByLabel("Preis *").fill("9.99");
    await page.getByLabel("Bild-URL").fill("");
    await page.getByLabel("Sortierreihenfolge").fill("999");
    await page.getByLabel("Aktiv").check();
    await page.getByRole("button", { name: "Produkt erstellen" }).click();

    await expect(page).toHaveURL(/\/dashboard\/products\/\d+$/);
    await expect(page.getByRole("heading", { name: productName })).toBeVisible();

    await page.goto(`/dashboard/products?search=${encodeURIComponent(productName)}`);
    const productRow = staffProductRow(page, productName);
    await expect(productRow).toBeVisible();
    await expect(productRow).toContainText("Aktiv");

    await page.goto("/");
    const card = publicProductCard(page, productName);
    await expect(card).toBeVisible();
    await expect(card).toContainText(productName);
    await expect(card).toContainText("Automatisch durch Playwright erstellt");
    await expect(card).toContainText("9.99 EUR");
    await expect(card.locator("img")).toHaveCount(0);

    await card.getByText("+").click();
    await page.getByRole("link", { name: /Warenkorb/ }).click();
    await expect(page).toHaveURL(/\/order$/);
    await expect(page.getByTestId("cart-item").filter({ hasText: productName })).toContainText("1x");

    await page.goto(`/dashboard/products?search=${encodeURIComponent(productName)}`);
    const rowBeforeDeactivate = staffProductRow(page, productName);
    page.once("dialog", (dialog) => dialog.accept());
    await rowBeforeDeactivate.getByRole("button", { name: "Deaktivieren" }).click();
    await expect(rowBeforeDeactivate).toContainText("Inaktiv");

    await page.goto("/");
    await expect(publicProductCard(page, productName)).toHaveCount(0);

    await page.goto("/order");
    await expect(page.getByTestId("cart-item").filter({ hasText: productName })).toBeVisible();
    await page.getByPlaceholder("Dein Name").fill(blockedCustomerName);
    await page.getByRole("button", { name: "Bestellung absenden" }).click();
    await expect(page).toHaveURL(/\/order$/);
    await expect(page.getByText("Ein Produkt ist nicht verfuegbar")).toBeVisible();

    await page.goto(`/dashboard/products?search=${encodeURIComponent(productName)}`);
    const rowBeforeActivate = staffProductRow(page, productName);
    await rowBeforeActivate.getByRole("button", { name: "Aktivieren" }).click();
    await expect(rowBeforeActivate).toContainText("Aktiv");

    await page.goto("/");
    await expect(publicProductCard(page, productName)).toBeVisible();

    await page.goto("/order");
    await expect(page.getByTestId("cart-item").filter({ hasText: productName })).toBeVisible();
    await page.getByPlaceholder("Dein Name").fill(customerName);
    await page.getByRole("button", { name: "Bestellung absenden" }).click();
    await page.waitForURL(/\/ticket\/[^/]+\/chat$/);
    await expect(page.getByRole("heading", { name: "Dein Bestellstatus" })).toBeVisible();
    await expect(page.getByTestId("ticket-order-summary")).toContainText(customerName);
    await expect(page.getByTestId("ticket-order-summary")).toContainText(productName);
    await expect(page.getByTestId("current-ticket-status")).toContainText("Eingegangen");
    await expect(page.getByTestId("ticket-chat")).toBeVisible();

    await page.goto(`/dashboard/tickets?search=${encodeURIComponent(customerName)}`);
    const ticketRow = page.getByTestId("ticket-row").filter({ hasText: customerName });
    await expect(ticketRow).toBeVisible();
    await ticketRow.getByRole("link").click();
    await expect(page.getByTestId("ticket-items")).toContainText(productName);
    await expect(page.getByTestId("ticket-items")).toContainText("9.99 EUR");

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    const mobileCard = publicProductCard(page, productName);
    await expect(mobileCard).toBeVisible();
    await expect(mobileCard.getByText("+")).toBeVisible();
    await expect(page.getByRole("link", { name: /Warenkorb/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto(`/dashboard/products?search=${encodeURIComponent(productName)}`);
    await expect(staffProductRow(page, productName)).toBeVisible();
    await expect(page.getByRole("link", { name: /Neues Produkt/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: /Neues Produkt/ }).click();
    await expect(page.getByLabel("Name *")).toBeVisible();
    await expect(page.getByRole("button", { name: "Produkt erstellen" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  } finally {
    await deactivateProductsByName(request, createdProducts);
  }
});

test("mobile customers can scan products, change quantity and reach the cart", async ({ page, request }) => {
  const stamp = Date.now();
  const productName = `E2E Sehr langes mobiles Produkt ${stamp} mit extra langem Namen`;
  let csrf = "";

  try {
    csrf = await apiLogin(request);
    const response = await request.post("/api/staff/products", {
      data: { name: productName, description: "Eine absichtlich lange Beschreibung für die kompakte mobile Darstellung ohne unnötig hohe Produktkarte.", price: "12345.67", image_url: null, is_active: true, sort_order: 999 },
      headers: { "X-CSRF-Token": csrf },
    });
    expect(response.ok()).toBeTruthy();

    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
      await page.goto("/");
      const card = publicProductCard(page, productName);
      await expect(card).toBeVisible();
      await expect(card.getByRole("img", { name: new RegExp(`Kein Bild für ${productName}`) })).toBeVisible();
      await expect(card.getByText("12345.67 EUR")).toBeVisible();
      await expect(card.getByRole("button", { name: `Menge für ${productName} verringern` })).toBeDisabled();
      await expect(page.getByRole("link", { name: /Warenkorb öffnen/ })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }

    const card = publicProductCard(page, productName);
    await card.getByRole("button", { name: `Menge für ${productName} erhöhen` }).click();
    await expect(card.getByLabel("Aktuelle Menge für " + productName)).toHaveText("1");
    await page.getByRole("link", { name: /Warenkorb öffnen, 1 Artikel/ }).click();
    await expect(page).toHaveURL(/\/order$/);
    await expect(page.getByTestId("cart-item").filter({ hasText: productName })).toContainText("1x");
    await expectNoHorizontalOverflow(page);
  } finally {
    await deactivateProductsByName(request, [productName]);
  }
});
