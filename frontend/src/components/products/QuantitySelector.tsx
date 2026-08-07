export function QuantitySelector({ value, onChange, productName }: { value: number; onChange: (value: number) => void; productName?: string }) {
  const suffix = productName ? ` für ${productName}` : "";
  return <div className="qty" role="group" aria-label={`Menge${suffix}`}>
    <button type="button" aria-label={`Menge${suffix} verringern`} disabled={value === 0} onClick={() => onChange(Math.max(0, value - 1))}>−</button>
    <output aria-live="polite" aria-label={`Aktuelle Menge${suffix}`}>{value}</output>
    <button type="button" aria-label={`Menge${suffix} erhöhen`} onClick={() => onChange(value + 1)}>+</button>
  </div>;
}
