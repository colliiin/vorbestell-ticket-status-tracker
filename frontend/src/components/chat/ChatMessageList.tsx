import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types/api";
import { ChatMessageBubble } from "./ChatMessageBubble";
export function ChatMessageList({ messages }: { messages: ChatMessage[] }) { const endRef = useRef<HTMLDivElement | null>(null); useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]); return <div className="messages">{messages.length ? messages.map((message) => <ChatMessageBubble key={message.id} message={message} />) : <p className="hint">Noch keine Nachrichten.</p>}<div ref={endRef} /></div>; }