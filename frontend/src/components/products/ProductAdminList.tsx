import { EmptyState } from "../common/EmptyState";
import type { StaffProduct } from "../../types/api";
import { ProductAdminListItem } from "./ProductAdminListItem";

export function ProductAdminList({ products, savingId, onToggle }: { products: StaffProduct[]; savingId: number | null; onToggle: (product: StaffProduct) => void }) {
  if (!products.length) return <EmptyState title="Keine Produkte" text="Passe Suche oder Filter an oder lege ein neues Produkt an." />;
  return <section className="productAdminList">{products.map((product) => <ProductAdminListItem key={product.id} product={product} busy={savingId === product.id} onToggle={onToggle} />)}</section>;
}
