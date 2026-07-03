import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, TicketStatus, WsEvent } from "../types/api";

type Status = "Verbinde..." | "Verbunden" | "Getrennt";

export function useChat(url: string, enabled = true, onStatusChanged?: (status: TicketStatus) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("Verbinde...");
  const [error, setError] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const statusChangedRef = useRef(onStatusChanged);

  useEffect(() => {
    statusChangedRef.current = onStatusChanged;
  }, [onStatusChanged]);

  useEffect(() => {
    if (!enabled) {
      setStatus("Getrennt");
      return;
    }
    let stopped = false;
    let attempts = 0;
    let reconnectTimer: number | undefined;

    function connect() {
      setStatus("Verbinde...");
      const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}${url}`);
      wsRef.current = ws;
      ws.onopen = () => { attempts = 0; setStatus("Verbunden"); };
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as WsEvent;
          if (payload.type === "chat_message") setMessages((current) => current.some((m) => m.id === payload.data.id) ? current : [...current, payload.data]);
          else if (payload.type === "status_changed") statusChangedRef.current?.(payload.data.new_status);
          else if (payload.type === "error") setError(payload.data.message);
        } catch { setError("Eine Chatnachricht konnte nicht gelesen werden."); }
      };
      ws.onclose = (event) => {
        if (wsRef.current === ws) wsRef.current = null;
        setStatus("Getrennt");
        if ([4401, 4403, 4404].includes(event.code)) { stopped = true; return; }
        if (!stopped && attempts < 6) {
          attempts += 1;
          reconnectTimer = window.setTimeout(connect, Math.min(1000 * attempts, 5000));
        }
      };
    }

    connect();
    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [url, enabled]);

  const send = useCallback((message: string) => {
    setError("");
    if (message.trim() && wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ message }));
  }, []);

  return { messages, setMessages, status, send, error };
}