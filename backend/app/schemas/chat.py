from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.chat_message import SenderType

class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

class ChatOut(BaseModel):
    id: int
    ticket_id: int
    sender_type: SenderType
    message: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)