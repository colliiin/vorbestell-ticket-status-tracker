from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict
from app.models.chat_message import SenderType
from app.models.ticket import TicketStatus

class ChatMessageData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_id: int
    sender_type: SenderType
    message: str
    created_at: datetime

class StatusChangedData(BaseModel):
    ticket_id: int
    old_status: TicketStatus
    new_status: TicketStatus
    message: str
    created_at: datetime

class ErrorData(BaseModel):
    message: str

class ChatMessageEvent(BaseModel):
    type: Literal["chat_message"] = "chat_message"
    data: ChatMessageData

class StatusChangedEvent(BaseModel):
    type: Literal["status_changed"] = "status_changed"
    data: StatusChangedData

class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    data: ErrorData