import type { StaffTicket, TicketStatus } from "../../types/api";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketStatusControl } from "./TicketStatusControl";

export function TicketDetail({ ticket, onStatus, saving = false }: { ticket: StaffTicket; onStatus: (status: TicketStatus) => void | Promise<void>; saving?: boolean }) {
  return <aside className="ticketPanel">
    <div className="ticketPanelHead">
      <h1>{ticket.customer_name}</h1>
      <TicketStatusBadge status={ticket.status} />
    </div>
    <TicketStatusControl value={ticket.status} onChange={onStatus} disabled={saving} />
    <div className="ticketItems" data-testid="ticket-items">
      {ticket.items.map((item) => <p key={item.product_id}>{item.quantity}x {item.product_name_snapshot} · {Number(item.unit_price_snapshot).toFixed(2)} EUR</p>)}
    </div>
  </aside>;
}
