import { Edit3, Power } from "lucide-react";
import type { StaffProduct } from "../../types/api";
import { formatTime } from "../../types/api";
import { ProductImagePreview } from "./ProductImagePreview";
import { ProductStatusBadge } from "./ProductStatusBadge";

export function ProductAdminListItem({ product, busy, onToggle }: { product: StaffProduct; busy: boolean; onToggle: (product: StaffProduct) => void }) {
  return <article className="productAdminItem" data-testid="staff-product-row">
    <ProductImagePreview imageUrl={product.image_url} alt={product.name} />
    <div className="productAdminMain">
      <div className="productTitleRow"><h2>{product.name}</h2><ProductStatusBadge isActive={product.is_active} /></div>
      <p>{product.description || "Keine Beschreibung hinterlegt."}</p>
      <dl className="productMeta">
        <div><dt>Preis</dt><dd>{Number(product.price).toFixed(2)} EUR</dd></div>
        <div><dt>Sortierung</dt><dd>{product.sort_order}</dd></div>
        <div><dt>Aktualisiert</dt><dd>{formatTime(product.updated_at || product.created_at)}</dd></div>
      </dl>
    </div>
    <div className="productActions">
      <a className="linkButton" href={`/dashboard/products/${product.id}`}><Edit3 size={16} /> Bearbeiten</a>
      <button className={product.is_active ? "neutralButton" : "button"} disabled={busy} onClick={() => onToggle(product)}><Power size={16} /> {product.is_active ? "Deaktivieren" : "Aktivieren"}</button>
    </div>
  </article>;
}
