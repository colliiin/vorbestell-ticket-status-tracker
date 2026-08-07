import { expect, test, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

type AdminCredentials = {
  username: string;
  password: string;
};

type CreatedProduct = {
  id: number;
};

type CreatedOrder = {
  ticket_token: string;
};

type StaffTicketList = {
  items: Array<{ id: number; customer_name: string }>;
};

function adminCredentials(): AdminCredentials {
  const username = process.env.E2E_ADMIN_USERNAME;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!username || !password) throw new Error("E2E_ADMIN_USERNAME und E2E_ADMIN_PASSWORD muessen gesetzt sein.");
  return { username, password };
}

async function login(page: Page) {
  const credentials = adminCredentials();
  await page.goto("/login");
  await page.getByLabel("Benutzer").fill(credentials.username);
  await page.getByLabel("Passwort").fill(credentials.password);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function apiLogin(request: APIRequestContext): Promise<string> {
  const credentials = adminCredentials();
  const response = await request.post("/api/auth/login", { data: credentials });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).csrf_token;
}

test.beforeEach(async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.ok(), "Die Anwendung ist unter /api/health nicht erreichbar. Starte zuerst `docker compose up -d`.").toBeTruthy();
});

test("customer status tracker updates live after a staff status change", async ({ page, request, browser }) => {
  const stamp = Date.now();
  const productName = `E2E Tracker Produkt ${stamp}`;
  const customerName = `E2E Tracker Kunde ${stamp}`;
  let csrf = "";
  let productId: number | null = null;
  let staffContext: BrowserContext | null = null;

  try {
    csrf = await apiLogin(request);
    const productResponse = await request.post("/api/staff/products", {
      data: { name: productName, description: "Status-Tracker E2E", price: "4.50", image_url: null, is_active: true, sort_order: 999 },
      headers: { "X-CSRF-Token": csrf },
    });
    expect(productResponse.ok()).toBeTruthy();
    productId = ((await productResponse.json()) as CreatedProduct).id;

    const orderResponse = await request.post("/api/orders", {
      data: { customer_name: customerName, items: [{ product_id: productId, quantity: 2 }] },
      headers: { "Idempotency-Key": `e2e-tracker-${stamp}` },
    });
    expect(orderResponse.ok()).toBeTruthy();
    const order = (await orderResponse.json()) as CreatedOrder;

    const ticketsResponse = await request.get(`/api/staff/tickets?search=${encodeURIComponent(customerName)}&page_size=25`);
    expect(ticketsResponse.ok()).toBeTruthy();
    const tickets = (await ticketsResponse.json()) as StaffTicketList;
    const staffTicket = tickets.items.find((ticket) => ticket.customer_name === customerName);
    expect(staffTicket).toBeTruthy();

    await page.goto(`/ticket/${order.ticket_token}/chat`);
    await expect(page.getByTestId("ticket-status-tracker")).toBeVisible();
    await expect(page.getByTestId("current-ticket-status")).toContainText("Eingegangen");
    await expect(page.getByTestId("ticket-order-summary")).toContainText(productName);
    await expect(page.getByTestId("ticket-order-summary")).toContainText("9,00");
    await expect(page.getByTestId("ticket-chat")).toBeVisible();
    await expect(page.getByText("Chat: Verbunden", { exact: true })).toBeVisible();

    staffContext = await browser.newContext({ baseURL: process.env.E2E_BASE_URL || "http://localhost" });
    const staffPage = await staffContext.newPage();
    await login(staffPage);
    await staffPage.goto(`/dashboard/tickets/${staffTicket!.id}`);
    await expect(staffPage.getByRole("heading", { name: customerName })).toBeVisible();
    await staffPage.getByRole("button", { name: "In Bearbeitung" }).click();
    await expect(staffPage.locator(".badge.in_progress")).toContainText("In Bearbeitung");

    await expect(page.getByTestId("current-ticket-status")).toContainText("In Bearbeitung");
    await expect(page.locator('.ticketStatusStep[data-state="current"]')).toContainText("Wird bearbeitet");
    await expect(page.getByTestId("ticket-chat")).toBeVisible();
  } finally {
    await staffContext?.close();
    if (productId && csrf) {
      await request.patch(`/api/staff/products/${productId}`, {
        data: { is_active: false },
        headers: { "X-CSRF-Token": csrf },
      });
    }
  }
});
