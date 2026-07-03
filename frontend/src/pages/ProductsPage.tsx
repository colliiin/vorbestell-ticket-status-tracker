import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { getProducts } from "../api/products";
import { PublicLayout } from "../components/layout/PublicLayout";
import { ErrorState } from "../components/common/ErrorState";
import { ProductGrid } from "../components/products/ProductGrid";
import type { Product } from "../types/api";
import { useCart } from "../hooks/useCart";
export function ProductsPage({ cartState }: { cartState: ReturnType<typeof useCart> }) { const [products, setProducts] = useState<Product[]>([]); const [error, setError] = useState(""); useEffect(() => { getProducts().then(setProducts).catch((e) => setError(e.message)); }, []); return <PublicLayout action={<a className="icon" href="/order"><ShoppingCart size={18} /> Warenkorb {cartState.count > 0 && <b>{cartState.count}</b>}</a>}><section className="heroPanel"><h1>Produkte vorbestellen</h1><p>Wähle Produkte aus, gib deinen Namen an und lande direkt im Ticket-Chat zur Abholung.</p></section>{error && <ErrorState title="Produkte konnten nicht geladen werden" text={error} />}<ProductGrid products={products} cart={cartState.cart} onQuantity={cartState.setQuantity} /></PublicLayout>; }