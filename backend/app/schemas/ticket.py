from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.ticket import TicketStatus

class TicketItemOut(BaseModel):
    product_id: int
    quantity: int
    product_name_snapshot: str
    unit_price_snapshot: Decimal
    model_config = ConfigDict(from_attributes=True)

class PublicTicketOut(BaseModel):
    customer_name: str
    status: TicketStatus
    created_at: datetime
    closed_at: datetime | None = None
    items: list[TicketItemOut]
    model_config = ConfigDict(from_attributes=True)

class StaffTicketOut(BaseModel):
    id: int
    customer_name: str
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None
    last_customer_message_at: datetime | None = None
    last_staff_message_at: datetime | None = None
    items: list[TicketItemOut]
    model_config = ConfigDict(from_attributes=True)

class TicketListItemOut(BaseModel):
    id: int
    customer_name: str
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    last_customer_message_at: datetime | None = None
    last_staff_message_at: datetime | None = None
    has_unread_customer_message: bool = False
    model_config = ConfigDict(from_attributes=True)

class TicketListOut(BaseModel):
    items: list[TicketListItemOut]
    page: int
    page_size: int
    total: int

class StatusIn(BaseModel):
    status: TicketStatus

class BulkDeleteOut(BaseModel):
    deleted: int
