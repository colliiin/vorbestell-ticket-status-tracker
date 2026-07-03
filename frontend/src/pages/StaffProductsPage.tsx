import { PackagePlus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getStaffProducts, updateProduct } from "../api/products";
import { ErrorState } from "../components/common/ErrorState";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProductAdminList } from "../components/products/ProductAdminList";
import type { StaffProduct } from "../types/api";

export function StaffProductsPage() {
  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(params.get("search") || "");
  const [active, setActive] = useState(params.get("active") || "");
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const [products, setProducts] = useState<StaffProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const pageSize = 25;

  const qs = useMemo(() => {
    const next = new URLSearchParams();
    next.set("page", String(page));
    next.set("page_size", String(pageSize));
    if (query.trim()) next.set("search", query.trim());
    if (active) next.set("active", active);
    history.replaceState(null, "", `/dashboard/products?${next.toString()}`);
    return next;
  }, [query, active, page]);

  useEffect(() => {
    setError("");
    getStaffProducts(qs).then((data) => { setProducts(data.items); setTotal(data.total); }).catch((e) => setError(e.message));
  }, [qs]);

  async function toggleProduct(product: StaffProduct) {
    if (product.is_active && !window.confirm("Dieses Produkt wird anschliessend nicht mehr oeffentlich angezeigt und kann nicht mehr neu bestellt werden.")) return;
    setError("");
    setSavingId(product.id);
    try {
      const updated = await updateProduct(product.id, { is_active: !product.is_active });
      setProducts((current) => current.map((item) => item.id === product.id ? updated : item));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Produktstatus konnte nicht geaendert werden.");
    } finally {
      setSavingId(null);
    }
  }

  return <DashboardLayout>
    <section className="sectionHead productsHead">
      <div><h1>Produkte</h1><p className="hint">Produkte ansehen, erstellen, bearbeiten und aktivieren oder deaktivieren.</p></div>
      <a className="buttonLink" href="/dashboard/products/new"><PackagePlus size={18} /> Neues Produkt</a>
    </section>
    <div className="toolbar productToolbar">
      <Search size={18} />
      <input placeholder="Nach Produktname suchen" value={query} onChange={(e) => { setPage(1); setQuery(e.target.value); }} />
      <select value={active} onChange={(e) => { setPage(1); setActive(e.target.value); }}>
        <option value="">Alle</option>
        <option value="true">Aktiv</option>
        <option value="false">Inaktiv</option>
      </select>
    </div>
    {error ? <ErrorState title="Produkte konnten nicht geladen werden" text={error} /> : <>
      <ProductAdminList products={products} savingId={savingId} onToggle={toggleProduct} />
      <p className="hint">Seite {page}, {total} Produkte gesamt</p>
      <div className="pager"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Zurueck</button><button disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>Weiter</button></div>
    </>}
  </DashboardLayout>;
}
