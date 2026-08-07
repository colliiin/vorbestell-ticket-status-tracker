import { useEffect, useState } from "react";
import { getPublicMessages, getPublicTicket } from "../api/tickets";
import { Chat } from "../components/chat/Chat";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { PublicLayout } from "../components/layout/PublicLayout";
import { TicketOrderSummary } from "../components/tickets/TicketOrderSummary";
import { TicketStatusTracker } from "../components/tickets/TicketStatusTracker";
import { useChat } from "../hooks/useChat";
import { closedStatuses, type ChatMessage, type PublicTicket, type StatusChangedData } from "../types/api";

export function applyTicketStatusUpdate(ticket: PublicTicket, update: StatusChangedData): PublicTicket {
  return { ...ticket, status: update.new_status, status_changed_at: update.created_at };
}

export function CustomerTicketPage({ token }: { token: string }) {
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [error, setError] = useState("");
  const chat = useChat(`/ws/tickets/${token}`, true, (update) => {
    setTicket((current) => current ? applyTicketStatusUpdate(current, update) : current);
  });

  useEffect(() => {
    setError("");
    getPublicTicket(token).then(setTicket).catch((requestError) => setError(requestError.message));
    getPublicMessages(token).then((messages: ChatMessage[]) => chat.setMessages(messages)).catch(() => undefined);
  }, [token]);

  if (error) return <PublicLayout><ErrorState title="Ticket nicht gefunden" text={error} action={<a className="buttonLink" href="/">Zur Startseite</a>} /></PublicLayout>;
  if (!ticket) return <PublicLayout><LoadingState text="Ticket und Bestellstatus werden geladen" /></PublicLayout>;

  return <PublicLayout>
    <main className="customerTicketPage">
      <section className="customerTicketOverview" aria-label="Bestellübersicht">
        <div className="customerTicketOverviewInner">
          <TicketStatusTracker
            ticketNumber={ticket.ticket_number}
            status={ticket.status}
            createdAt={ticket.created_at}
            statusChangedAt={ticket.status_changed_at}
          />
          <TicketOrderSummary customerName={ticket.customer_name} items={ticket.items} totalPrice={ticket.total_price} />
        </div>
      </section>
      <section className="customerChatArea" aria-labelledby="customer-chat-heading">
        <header><h2 id="customer-chat-heading">Nachrichten</h2><p>Fragen zu deiner Vorbestellung? Schreib uns direkt hier.</p></header>
        <Chat messages={chat.messages} status={chat.status} error={chat.error} onSend={chat.send} readOnly={closedStatuses.includes(ticket.status)} />
      </section>
    </main>
  </PublicLayout>;
}
