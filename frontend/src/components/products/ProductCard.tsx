import type { Product } from "../../types/api";
import { ProductImagePreview } from "./ProductImagePreview";
import { QuantitySelector } from "./QuantitySelector";

export function ProductCard({ product, quantity, onQuantity }: { product: Product; quantity: number; onQuantity: (value: number) => void }) {
  return <article className="card productCard" data-testid="product-card">
    <div className="productCardMedia"><ProductImagePreview imageUrl={product.image_url} alt={product.name} className="productImage" showFallback /></div>
    <div className="productCardInfo">
      <h2>{product.name}</h2>
      {product.description && <p>{product.description}</p>}
      <strong className="productPrice">{Number(product.price).toFixed(2)} EUR</strong>
    </div>
    <QuantitySelector value={quantity} onChange={onQuantity} productName={product.name} />
  </article>;
}
