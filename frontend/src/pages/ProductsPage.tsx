import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { getProducts } from "../api/products";
import { ErrorState } from "../components/common/ErrorState";
import { PublicLayout } from "../components/layout/PublicLayout";
import { ProductGrid } from "../components/products/ProductGrid";
import { useCart } from "../hooks/useCart";
import type { Product } from "../types/api";

export function ProductsPage({ cartState }: { cartState: ReturnType<typeof useCart> }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { getProducts().then(setProducts).catch((e) => setError(e.message)); }, []);

  return <PublicLayout headerClassName="productTop" action={
    <a className="icon cartLink" href="/order" aria-label={`Warenkorb öffnen, ${cartState.count} Artikel`}>
      <ShoppingCart size={18} /><span>Warenkorb</span>{cartState.count > 0 && <b aria-hidden="true">{cartState.count}</b>}
    </a>
  }>
    <main className="productsPage">
      <section className="heroPanel"><h1>Produkte vorbestellen</h1><p>Wähle Produkte aus, gib deinen Namen an und lande direkt im Ticket-Chat zur Abholung.</p></section>
      {error && <ErrorState title="Produkte konnten nicht geladen werden" text={error} />}
      <ProductGrid products={products} cart={cartState.cart} onQuantity={cartState.setQuantity} />
    </main>
  </PublicLayout>;
}
