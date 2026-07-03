import { useEffect, useState } from "react";
import { getStaffMessages, getTicket, updateTicketStatus } from "../api/tickets";
import { Chat } from "../components/chat/Chat";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { TicketDetail } from "../components/tickets/TicketDetail";
import { useChat } from "../hooks/useChat";
import { closedStatuses, type ChatMessage, type StaffTicket, type TicketStatus } from "../types/api";

export function StaffTicketPage({ id }: { id: string }) {
  const [ticket, setTicket] = useState<StaffTicket | null>(null);
  const [error, setError] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const chat = useChat(`/ws/staff/tickets/${id}`, Boolean(ticket), (status: TicketStatus) => setTicket((t) => t ? { ...t, status } : t));

  useEffect(() => {
    getTicket(id).then(setTicket).catch((e) => setError(e.message));
    getStaffMessages(id).then((messages: ChatMessage[]) => chat.setMessages(messages)).catch(() => undefined);
  }, [id]);

  async function setStatus(status: TicketStatus) {
    if (ticket?.status === status) return;
    setError("");
    setSavingStatus(true);
    try {
      const updated = await updateTicketStatus(id, status);
      setTicket(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status konnte nicht geaendert werden.");
    } finally {
      setSavingStatus(false);
    }
  }

  if (error && !ticket) return <DashboardLayout><ErrorState title="Ticket nicht verfuegbar" text={error} action={<a className="buttonLink" href="/dashboard/tickets">Zur Ticketliste</a>} /></DashboardLayout>;
  if (!ticket) return <DashboardLayout><LoadingState text="Ticket wird geladen" /></DashboardLayout>;
  return <DashboardLayout>
    {error && <p className="error">{error}</p>}
    <div className="detail">
      <TicketDetail ticket={ticket} onStatus={setStatus} saving={savingStatus} />
      <Chat messages={chat.messages} status={chat.status} error={chat.error} onSend={chat.send} readOnly={closedStatuses.includes(ticket.status)} />
    </div>
  </DashboardLayout>;
}