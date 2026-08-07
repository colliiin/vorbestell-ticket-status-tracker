import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicTicket, StatusChangedData } from "../types/api";
import { CustomerTicketPage } from "./CustomerTicketPage";

const mocks = vi.hoisted(() => ({
  getPublicTicket: vi.fn(),
  getPublicMessages: vi.fn(),
  setMessages: vi.fn(),
  statusCallback: undefined as ((update: StatusChangedData) => void) | undefined,
}));

vi.mock("../api/tickets", () => ({
  getPublicTicket: mocks.getPublicTicket,
  getPublicMessages: mocks.getPublicMessages,
}));

vi.mock("../hooks/useChat", () => ({
  useChat: (_url: string, _enabled: boolean, onStatusChanged?: (update: StatusChangedData) => void) => {
    mocks.statusCallback = onStatusChanged;
    return { messages: [], setMessages: mocks.setMessages, status: "Verbunden", send: vi.fn(), error: "" };
  },
}));

const ticket: PublicTicket = {
  ticket_number: "VBT-000123",
  customer_name: "Max",
  status: "open",
  created_at: "2026-07-11T10:00:00Z",
  status_changed_at: "2026-07-11T10:00:00Z",
  closed_at: null,
  items: [{ product_id: 1, quantity: 2, product_name_snapshot: "Brot", unit_price_snapshot: "3.50" }],
  total_price: "7.00",
};

beforeEach(() => {
  Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  mocks.getPublicTicket.mockResolvedValue(ticket);
  mocks.getPublicMessages.mockResolvedValue([]);
  mocks.setMessages.mockClear();
  mocks.statusCallback = undefined;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CustomerTicketPage", () => {
  it("updates tracker data from a websocket status event and keeps chat rendered", async () => {
    render(<CustomerTicketPage token="private-token" />);
    expect(await screen.findByTestId("ticket-status-tracker")).toBeTruthy();
    expect(screen.getByTestId("ticket-chat")).toBeTruthy();
    expect(screen.getByTestId("current-ticket-status").textContent).toContain("Eingegangen");

    act(() => {
      mocks.statusCallback?.({
        ticket_id: 123,
        old_status: "open",
        new_status: "in_progress",
        message: "Status geändert",
        created_at: "2026-07-11T10:30:00Z",
      });
    });

    expect(screen.getByTestId("current-ticket-status").textContent).toContain("In Bearbeitung");
    expect(screen.getByText("Wird bearbeitet").closest("li")?.getAttribute("data-state")).toBe("current");
    expect(screen.getByTestId("status-changed-at").textContent).not.toBe("-");
    expect(screen.getByTestId("ticket-chat")).toBeTruthy();
  });
});
