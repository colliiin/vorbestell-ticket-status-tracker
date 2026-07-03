import type { TicketListItem as Ticket, TicketStatus } from "../../types/api";
import { TicketListItem } from "./TicketListItem";

export function TicketList({ tickets, onStatusChange, savingId }: { tickets: Ticket[]; onStatusChange?: (ticket: Ticket, status: TicketStatus) => void | Promise<void>; savingId?: number | null }) {
  return <>{tickets.map((ticket) => <TicketListItem key={ticket.id} ticket={ticket} saving={savingId === ticket.id} onStatusChange={onStatusChange} />)}</>;
}