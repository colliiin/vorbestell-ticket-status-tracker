export function productStatusText(isActive: boolean) {
  return isActive ? "Aktiv" : "Inaktiv";
}

export function ProductStatusBadge({ isActive }: { isActive: boolean }) {
  return <span className={`productStatus ${isActive ? "active" : "inactive"}`}>{productStatusText(isActive)}</span>;
}
