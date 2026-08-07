import type { TicketItem } from "../../types/api";

type Props = {
  customerName: string;
  items: TicketItem[];
  totalPrice: string;
};

const currency = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function formatCurrency(value: string | number) {
  const amount = Number(value);
  return currency.format(Number.isFinite(amount) ? amount : 0);
}

export function TicketOrderSummary({ customerName, items, totalPrice }: Props) {
  return <article className="ticketOrderSummary" data-testid="ticket-order-summary" aria-labelledby="ticket-order-heading">
    <div className="ticketOrderHead">
      <div>
        <p className="ticketEyebrow">Vorbestellung für {customerName}</p>
        <h2 id="ticket-order-heading">Deine Bestellung</h2>
      </div>
      <span>{items.reduce((sum, item) => sum + item.quantity, 0)} Artikel</span>
    </div>
    <ul className="ticketOrderItems">
      {items.map((item, index) => {
        const lineTotal = Number(item.unit_price_snapshot) * item.quantity;
        return <li key={`${item.product_id}-${index}`}>
          <span className="ticketOrderQuantity">{item.quantity}×</span>
          <span className="ticketOrderProduct"><strong>{item.product_name_snapshot}</strong><small>{formatCurrency(item.unit_price_snapshot)} pro Stück</small></span>
          <strong>{formatCurrency(lineTotal)}</strong>
        </li>;
      })}
    </ul>
    <div className="ticketOrderTotal"><span>Gesamtpreis</span><strong>{formatCurrency(totalPrice)}</strong></div>
  </article>;
}
