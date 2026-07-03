import { useEffect, useState } from "react";
import { getPublicMessages, getPublicTicket } from "../api/tickets";
import { Chat } from "../components/chat/Chat";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { PublicLayout } from "../components/layout/PublicLayout";
import { TicketStatusBadge } from "../components/tickets/TicketStatusBadge";
import { useChat } from "../hooks/useChat";
import { closedStatuses, type ChatMessage, type PublicTicket, type TicketStatus } from "../types/api";
export function CustomerTicketPage({ token }: { token: string }) { const [ticket, setTicket] = useState<PublicTicket | null>(null); const [error, setError] = useState(""); const chat = useChat(`/ws/tickets/${token}`, true, (status: TicketStatus) => setTicket((t) => t ? { ...t, status } : t)); useEffect(() => { getPublicTicket(token).then(setTicket).catch((e) => setError(e.message)); getPublicMessages(token).then((messages: ChatMessage[]) => chat.setMessages(messages)).catch(() => undefined); }, [token]); if (error) return <PublicLayout><ErrorState title="Ticket nicht gefunden" text={error} action={<a className="buttonLink" href="/">Zur Startseite</a>} /></PublicLayout>; if (!ticket) return <PublicLayout><LoadingState text="Ticket wird geladen" /></PublicLayout>; return <PublicLayout><main className="chatPage"><header><h1>{ticket.customer_name}</h1><TicketStatusBadge status={ticket.status} />{ticket.items.map((item) => <p key={item.product_id}>{item.quantity}x {item.product_name_snapshot}</p>)}</header><Chat messages={chat.messages} status={chat.status} error={chat.error} onSend={chat.send} readOnly={closedStatuses.includes(ticket.status)} /></main></PublicLayout>; }