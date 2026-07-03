import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getStats } from "./admin";
import { createProduct } from "./products";
import { ProductAdminList } from "../components/products/ProductAdminList";
import { ProductCard } from "../components/products/ProductCard";
import { validateProductForm, type ProductFormValues } from "../components/products/ProductForm";
import { shouldShowProductImage } from "../components/products/ProductImagePreview";
import { ProductStatusBadge } from "../components/products/ProductStatusBadge";
import { statusLabels, type WsEvent } from "../types/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("order flow basics", () => {
  it("keeps German status labels available", () => {
    expect(statusLabels.open).toBe("Offen");
    expect(statusLabels.completed).toContain("abgeschlossen");
  });
});

describe("websocket event typing", () => {
  it("handles status_changed events", () => {
    const event: WsEvent = { type: "status_changed", data: { ticket_id: 1, old_status: "open", new_status: "in_progress", message: "Status geändert", created_at: "2026-07-02T20:31:00Z" } };
    expect(event.data.new_status).toBe("in_progress");
  });

  it("handles websocket error events", () => {
    const event: WsEvent = { type: "error", data: { message: "Nachricht ist leer oder zu lang." } };
    expect(event.data.message).toContain("Nachricht");
  });
});

describe("admin stats frontend", () => {
  it("sends date filters as query params", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ total: 1, open: 0, in_progress: 0, ready_for_pickup: 0, completed: 1, not_completed: 0, total_revenue: "7.00" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await getStats(new URLSearchParams({ from_date: "2026-01-01", to_date: "2026-01-31" }));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/stats?from_date=2026-01-01&to_date=2026-01-31");
  });
});

describe("product admin frontend", () => {
  const validForm: ProductFormValues = { name: "Kaffee", description: "", price: "8.40", image_url: "", is_active: true, sort_order: "0" };

  it("validates empty product names", () => {
    expect(validateProductForm({ ...validForm, name: " " })).toContain("Name");
  });

  it("validates invalid prices", () => {
    expect(validateProductForm({ ...validForm, price: "-1" })).toContain("Preis");
    expect(validateProductForm({ ...validForm, price: "1.234" })).toContain("Preis");
  });

  it("renders active and inactive product status", () => {
    const active = renderToStaticMarkup(React.createElement(ProductStatusBadge, { isActive: true }));
    const inactive = renderToStaticMarkup(React.createElement(ProductStatusBadge, { isActive: false }));
    expect(active).toContain("Aktiv");
    expect(inactive).toContain("Inaktiv");
  });

  it("renders empty product lists", () => {
    const html = renderToStaticMarkup(React.createElement(ProductAdminList, { products: [], savingId: null, onToggle: vi.fn() }));
    expect(html).toContain("Keine Produkte");
  });

  it("sends csrf tokens for write product actions", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ id: 5, name: "Kaffee", description: "", price: "8.40", image_url: null, is_active: true, sort_order: 0, created_at: "2026-07-03T12:00:00", updated_at: "2026-07-03T12:00:00" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("document", { cookie: "staff_csrf=csrf-token" });
    await createProduct({ name: "Kaffee", description: "", price: "8.40", image_url: null, is_active: true, sort_order: 0 });
    const init = fetchMock.mock.calls[0][1];
    expect(init).toBeDefined();
    expect(((init as RequestInit).headers as Record<string, string>)["X-CSRF-Token"]).toBe("csrf-token");
  });

  it("renders public product cards without images", () => {
    const html = renderToStaticMarkup(React.createElement(ProductCard, { product: { id: 1, name: "Brot", description: "", price: "3.50", image_url: null }, quantity: 0, onQuantity: vi.fn() }));
    expect(html).toContain("Brot");
    expect(html).not.toContain("<img");
  });

  it("hides product images after load errors", () => {
    expect(shouldShowProductImage("https://example.test/bild.jpg", true)).toBe(false);
  });
});
