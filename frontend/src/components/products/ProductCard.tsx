import type { Product } from "../../types/api";
import { ProductImagePreview } from "./ProductImagePreview";
import { QuantitySelector } from "./QuantitySelector";
export function ProductCard({ product, quantity, onQuantity }: { product: Product; quantity: number; onQuantity: (value: number) => void }) { return <article className="card productCard" data-testid="product-card"><ProductImagePreview imageUrl={product.image_url} alt={product.name} /><h2>{product.name}</h2><p>{product.description}</p><strong>{Number(product.price).toFixed(2)} EUR</strong><QuantitySelector value={quantity} onChange={onQuantity} /></article>; }
