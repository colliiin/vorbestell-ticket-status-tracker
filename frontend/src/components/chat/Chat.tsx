import type { ChatMessage } from "../../types/api";
import { ChatConnectionStatus } from "./ChatConnectionStatus";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";
export function Chat({ messages, status, onSend, error, readOnly }: { messages: ChatMessage[]; status: string; onSend: (message: string) => void; error?: string; readOnly?: boolean }) { const disabled = readOnly || status !== "Verbunden"; return <section className="chat" data-testid="ticket-chat"><ChatConnectionStatus status={status} />{readOnly && <p className="chatNotice">Dieses Ticket ist abgeschlossen. Der Chat ist nur noch lesbar.</p>}{error && <p className="error">{error}</p>}<ChatMessageList messages={messages} /><ChatInput onSend={onSend} disabled={disabled} /></section>; }
