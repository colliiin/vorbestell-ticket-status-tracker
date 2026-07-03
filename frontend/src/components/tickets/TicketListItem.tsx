import type { TicketListItem as Ticket, TicketStatus } from "../../types/api";
import { formatTime } from "../../types/api";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketStatusControl } from "./TicketStatusControl";

export function TicketListItem({ ticket, onStatusChange, saving = false }: { ticket: Ticket; onStatusChange?: (ticket: Ticket, status: TicketStatus) => void | Promise<void>; saving?: boolean }) {
  const last = ticket.last_customer_message_at || ticket.last_staff_message_at || ticket.updated_at || ticket.created_at;
  return <article className="item ticketRow" data-testid="ticket-row">
    <a className="ticketLink" href={`/dashboard/tickets/${ticket.id}`}>
      <span>
        <b>{ticket.customer_name}</b>
        <small>Letzte Aktivitaet: {formatTime(last)}</small>
        {ticket.has_unread_customer_message && <em>Neue Nachricht</em>}
      </span>
      <TicketStatusBadge status={ticket.status} />
    </a>
    {onStatusChange && <TicketStatusControl compact value={ticket.status} disabled={saving} onChange={(status) => onStatusChange(ticket, status)} />}
  </article>;
}
