import type { ChatMessage } from "../../types/api";
import { formatTime } from "../../types/api";
const senderLabels: Record<ChatMessage["sender_type"], string> = { customer: "Kunde", owner: "Eigentümer", admin: "Admin", system: "System" };
export function ChatMessageBubble({ message }: { message: ChatMessage }) { return <div className={`bubble ${message.sender_type}`}><small>{senderLabels[message.sender_type]} · {formatTime(message.created_at)}</small><div>{message.message}</div></div>; }