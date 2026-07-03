import enum
from datetime import datetime
from sqlalchemy import DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    ready_for_pickup = "ready_for_pickup"
    completed = "completed"
    not_completed = "not_completed"

class Ticket(Base):
    __tablename__ = "tickets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    public_token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus), default=TicketStatus.open, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_customer_message_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_staff_message_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    items = relationship("TicketItem", cascade="all, delete-orphan", lazy="selectin")