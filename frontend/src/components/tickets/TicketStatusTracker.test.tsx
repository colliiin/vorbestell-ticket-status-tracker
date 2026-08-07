import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TicketOrderSummary } from "./TicketOrderSummary";
import { TicketStatusTracker } from "./TicketStatusTracker";

afterEach(cleanup);

const baseProps = {
  ticketNumber: "VBT-000123",
  createdAt: "2026-07-11T10:00:00Z",
  statusChangedAt: "2026-07-11T10:30:00Z",
};

describe("TicketStatusTracker", () => {
  it("shows the current status and marks previous, current and future steps", () => {
    render(<TicketStatusTracker {...baseProps} status="in_progress" />);
    expect(screen.getByTestId("current-ticket-status").textContent).toContain("In Bearbeitung");
    const steps = screen.getAllByRole("listitem");
    expect(steps[0].getAttribute("data-state")).toBe("completed");
    expect(steps[1].getAttribute("data-state")).toBe("current");
    expect(steps[1].getAttribute("aria-current")).toBe("step");
    expect(steps[2].getAttribute("data-state")).toBe("upcoming");
    expect(steps[3].getAttribute("data-state")).toBe("upcoming");
  });

  it("renders an unknown status without crashing", () => {
    render(<TicketStatusTracker {...baseProps} status="legacy_status" />);
    expect(screen.getByTestId("current-ticket-status").textContent).toContain("Status wird geprüft");
    expect(screen.getAllByRole("listitem").every((step) => step.getAttribute("data-state") === "upcoming")).toBe(true);
  });
});

describe("TicketOrderSummary", () => {
  it("shows products, quantities, snapshot prices and total price", () => {
    render(<TicketOrderSummary customerName="Max" items={[{ product_id: 1, quantity: 2, product_name_snapshot: "Brot", unit_price_snapshot: "3.50" }]} totalPrice="7.00" />);
    const summary = screen.getByTestId("ticket-order-summary");
    expect(summary.textContent).toContain("Brot");
    expect(summary.textContent).toContain("2×");
    expect(summary.textContent).toContain("3,50 €");
    expect(summary.textContent).toContain("7,00 €");
  });
});
