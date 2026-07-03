import { Save } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ProductCreateInput, StaffProduct } from "../../types/api";
import { ProductImagePreview } from "./ProductImagePreview";
import { ProductStatusBadge } from "./ProductStatusBadge";

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_active: boolean;
  sort_order: string;
};

export function productToFormValues(product?: StaffProduct | null): ProductFormValues {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? Number(product.price).toFixed(2) : "",
    image_url: product?.image_url ?? "",
    is_active: product?.is_active ?? true,
    sort_order: String(product?.sort_order ?? 0),
  };
}

export function validateProductForm(values: ProductFormValues): string | null {
  const name = values.name.trim();
  if (!name) return "Name ist ein Pflichtfeld.";
  if (name.length > 120) return "Name darf maximal 120 Zeichen lang sein.";
  if (values.description.trim().length > 2000) return "Beschreibung darf maximal 2000 Zeichen lang sein.";
  if (!/^\d+([.,]\d{1,2})?$/.test(values.price.trim())) return "Preis muss groesser oder gleich 0 sein und maximal zwei Nachkommastellen haben.";
  const price = Number(values.price.replace(",", "."));
  if (!Number.isFinite(price) || price < 0 || price > 999999.99) return "Preis muss zwischen 0 und 999999.99 liegen.";
  const imageUrl = values.image_url.trim();
  if (imageUrl) {
    try {
      const parsed = new URL(imageUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) return "Bild-URL muss mit http oder https beginnen.";
    } catch {
      return "Bild-URL muss eine gueltige URL sein.";
    }
    if (imageUrl.length > 500) return "Bild-URL darf maximal 500 Zeichen lang sein.";
  }
  if (!/^-?\d+$/.test(values.sort_order.trim())) return "Sortierreihenfolge muss eine Ganzzahl sein.";
  const sortOrder = Number(values.sort_order);
  if (sortOrder < -10000 || sortOrder > 10000) return "Sortierreihenfolge muss zwischen -10000 und 10000 liegen.";
  return null;
}

function toPayload(values: ProductFormValues): ProductCreateInput {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    price: Number(values.price.replace(",", ".")).toFixed(2),
    image_url: values.image_url.trim() || null,
    is_active: values.is_active,
    sort_order: Number(values.sort_order),
  };
}

function previewPrice(value: string): string {
  const price = Number(value.replace(",", "."));
  return Number.isFinite(price) ? `${price.toFixed(2)} EUR` : "0.00 EUR";
}

export function ProductForm({
  product,
  busy,
  error,
  success,
  submitLabel,
  onSubmit,
}: {
  product?: StaffProduct | null;
  busy: boolean;
  error?: string;
  success?: string;
  submitLabel: string;
  onSubmit: (values: ProductCreateInput) => Promise<void>;
}) {
  const initialValues = useMemo(() => productToFormValues(product), [product]);
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateProductForm(values);
    if (validation) {
      setLocalError(validation);
      return;
    }
    setLocalError("");
    await onSubmit(toPayload(values));
  }

  function setField<K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return <form className="productForm" onSubmit={submit}>
    <div className="formGrid">
      <label>Name *<input value={values.name} maxLength={120} onChange={(e) => setField("name", e.target.value)} /></label>
      <label>Preis *<input inputMode="decimal" value={values.price} onBlur={() => values.price && setField("price", Number(values.price.replace(",", ".")).toFixed(2))} onChange={(e) => setField("price", e.target.value)} /></label>
      <label className="wide">Beschreibung<textarea value={values.description} maxLength={2000} onChange={(e) => setField("description", e.target.value)} /></label>
      <label className="wide">Bild-URL<input value={values.image_url} maxLength={500} placeholder="https://example.de/bild.jpg" onChange={(e) => setField("image_url", e.target.value)} /></label>
      <label>Sortierreihenfolge<input inputMode="numeric" value={values.sort_order} onChange={(e) => setField("sort_order", e.target.value)} /></label>
      <label className="checkLabel"><input type="checkbox" checked={values.is_active} onChange={(e) => setField("is_active", e.target.checked)} /> Aktiv</label>
    </div>
    <section className="productFormPreview" aria-label="Produktvorschau">
      <ProductImagePreview imageUrl={values.image_url.trim()} alt={`Vorschau fuer ${values.name || "Produkt"}`} className="productImagePreview" />
      {!values.image_url.trim() && <div className="productImagePlaceholder">Bild</div>}
      <div className="previewPanel">
        <div className="productTitleRow"><h2>{values.name.trim() || "Neues Produkt"}</h2><ProductStatusBadge isActive={values.is_active} /></div>
        <p>{values.description.trim() || "Keine Beschreibung hinterlegt."}</p>
        <dl className="productMeta previewMeta">
          <div><dt>Preis</dt><dd>{previewPrice(values.price)}</dd></div>
          <div><dt>Sortierung</dt><dd>{values.sort_order || 0}</dd></div>
        </dl>
      </div>
    </section>
    {(localError || error) && <p className="error">{localError || error}</p>}
    {success && <p className="success">{success}</p>}
    <div className="formActions"><button disabled={busy} type="submit"><Save size={18} /> {busy ? "Wird gespeichert..." : submitLabel}</button><a className="linkButton" href="/dashboard/products">Zurueck</a></div>
  </form>;
}
