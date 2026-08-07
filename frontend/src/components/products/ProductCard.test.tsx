import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductCard } from "./ProductCard";
import type { Product } from "../../types/api";

const baseProduct: Product = {
  id: 1,
  name: "Kaffee",
  description: "Frisch gerösteter Kaffee für die Abholung.",
  price: "12.90",
  image_url: "https://example.test/kaffee.jpg",
};

afterEach(cleanup);

describe("public product card", () => {
  it("renders image, long content, price and accessible quantity controls", () => {
    const product = { ...baseProduct, name: "Sehr langer Produktname mit vielen Worten für ein schmales Smartphone", description: "Eine sehr lange Beschreibung, die im mobilen Layout visuell auf wenige Zeilen begrenzt wird und trotzdem vollständig im DOM verfügbar bleibt." };
    render(<ProductCard product={product} quantity={0} onQuantity={vi.fn()} />);
    expect(screen.getByRole("img", { name: product.name }).getAttribute("src")).toBe(product.image_url);
    expect(screen.getByRole("heading", { name: product.name })).not.toBeNull();
    expect(screen.getByText("12.90 EUR")).not.toBeNull();
    expect((screen.getByRole("button", { name: `Menge für ${product.name} verringern` }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: `Menge für ${product.name} erhöhen` }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("uses a stable fallback when an image is missing or fails", () => {
    const { rerender } = render(<ProductCard product={{ ...baseProduct, image_url: null }} quantity={0} onQuantity={vi.fn()} />);
    expect(screen.getByRole("img", { name: "Kein Bild für Kaffee verfügbar" })).not.toBeNull();
    rerender(<ProductCard product={baseProduct} quantity={0} onQuantity={vi.fn()} />);
    fireEvent.error(screen.getByRole("img", { name: "Kaffee" }));
    expect(screen.getByRole("img", { name: "Kein Bild für Kaffee verfügbar" })).not.toBeNull();
  });

  it("increments and decrements without changing the existing quantity behavior", () => {
    const onQuantity = vi.fn();
    const { rerender } = render(<ProductCard product={baseProduct} quantity={0} onQuantity={onQuantity} />);
    fireEvent.click(screen.getByRole("button", { name: "Menge für Kaffee erhöhen" }));
    expect(onQuantity).toHaveBeenLastCalledWith(1);
    rerender(<ProductCard product={baseProduct} quantity={2} onQuantity={onQuantity} />);
    fireEvent.click(screen.getByRole("button", { name: "Menge für Kaffee verringern" }));
    expect(onQuantity).toHaveBeenLastCalledWith(1);
    expect(screen.getByLabelText("Aktuelle Menge für Kaffee").textContent).toBe("2");
  });
});
