from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import ChatMessage, SenderType, Ticket, TicketStatus
from app.schemas.websocket import ChatMessageEvent, ChatMessageData, ErrorEvent, ErrorData

CLOSED_STATUSES = {TicketStatus.completed, TicketStatus.not_completed}

class ChatClosedError(ValueError):
    pass

class ChatService:
    def __init__(self, db: Session):
        self.db = db

    def add_message(self, ticket: Ticket, sender_type: SenderType, message: str, sender_user_id: int | None = None) -> ChatMessage:
        if ticket.status in CLOSED_STATUSES:
            raise ChatClosedError("Dieses Ticket ist abgeschlossen. Der Chat ist nur noch lesbar.")
        text = (message or "").strip()
        if not text or len(text) > 2000:
            raise ValueError("Nachricht ist leer oder zu lang.")
        row = ChatMessage(ticket_id=ticket.id, sender_type=sender_type, sender_user_id=sender_user_id, message=text)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if sender_type == SenderType.customer:
            ticket.last_customer_message_at = now
        elif sender_type in (SenderType.owner, SenderType.admin):
            ticket.last_staff_message_at = now
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    @staticmethod
    def event(message: ChatMessage) -> dict:
        return ChatMessageEvent(data=ChatMessageData.model_validate(message)).model_dump(mode="json")

    @staticmethod
    def error(message: str) -> dict:
        return ErrorEvent(data=ErrorData(message=message)).model_dump(mode="json")