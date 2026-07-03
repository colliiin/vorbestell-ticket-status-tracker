import { useEffect, useState } from "react";
import type { CartItem, Product } from "../types/api";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(sessionStorage.getItem("cart") || "[]"));
  useEffect(() => sessionStorage.setItem("cart", JSON.stringify(cart)), [cart]);
  function setQuantity(product: Product, quantity: number) {
    const next = cart.filter((item) => item.product.id !== product.id);
    if (quantity > 0) next.push({ product, quantity });
    setCart(next);
  }
  return { cart, setCart, setQuantity, count: cart.reduce((sum, item) => sum + item.quantity, 0) };
}