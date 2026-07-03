import { useEffect, useState } from "react";
import { createProduct, getStaffProduct, updateProduct } from "../api/products";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProductForm } from "../components/products/ProductForm";
import type { ProductCreateInput, StaffProduct } from "../types/api";

export function ProductEditorPage({ id }: { id?: string }) {
  const isNew = !id;
  const [product, setProduct] = useState<StaffProduct | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isNew || !id) return;
    setLoading(true);
    getStaffProduct(id).then(setProduct).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id, isNew]);

  async function save(values: ProductCreateInput) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (isNew) {
        const created = await createProduct(values);
        location.href = `/dashboard/products/${created.id}`;
        return;
      }
      if (!id) return;
      const updated = await updateProduct(id, values);
      setProduct(updated);
      setSuccess("Produkt wurde gespeichert.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Produkt konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
    }
  }

  return <DashboardLayout>
    <main className="editorPage">
      <div className="sectionHead"><div><h1>{isNew ? "Neues Produkt" : "Produkt bearbeiten"}</h1><p className="hint">Alle Felder koennen spaeter erneut angepasst werden.</p></div></div>
      {loading ? <LoadingState text="Produkt wird geladen" /> : error && !isNew && !product ? <ErrorState title="Produkt konnte nicht geladen werden" text={error} action={<a className="buttonLink" href="/dashboard/products">Zurueck</a>} /> : <ProductForm product={product} busy={busy} error={error} success={success} submitLabel={isNew ? "Produkt erstellen" : "Aenderungen speichern"} onSubmit={save} />}
    </main>
  </DashboardLayout>;
}
