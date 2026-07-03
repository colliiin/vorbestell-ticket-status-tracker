from collections import defaultdict
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, room: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.rooms[room].add(websocket)

    def disconnect(self, room: str, websocket: WebSocket) -> None:
        self.rooms.get(room, set()).discard(websocket)
        if room in self.rooms and not self.rooms[room]:
            self.rooms.pop(room, None)

    async def broadcast(self, room: str, payload: dict) -> None:
        for websocket in list(self.rooms.get(room, set())):
            try:
                await websocket.send_json(payload)
            except (WebSocketDisconnect, RuntimeError):
                self.disconnect(room, websocket)

manager = ConnectionManager()

def ticket_room(ticket_id: int) -> str:
    return f"ticket:{ticket_id}"