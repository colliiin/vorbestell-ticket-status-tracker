from datetime import datetime, timezone
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload
from app.models import ChatMessage, IdempotencyKey, SenderType, StatusHistory, Ticket, TicketItem, TicketStatus, User
from app.schemas.websocket import StatusChangedData, StatusChangedEvent
from app.services.stats_service import StatsService

STATUS_LABELS = {
    "open": "Offen",
    "in_progress": "In Bearbeitung",
    "ready_for_pickup": "Bereit zur Abholung",
    "completed": "Erfolgreich abgeschlossen",
    "not_completed": "Nicht abgeschlossen",
}

class TicketService:
    def __init__(self, db: Session):
        self.db = db

    def public_by_token(self, token: str) -> Ticket | None:
        return self.db.scalar(select(Ticket).where(Ticket.public_token == token).options(selectinload(Ticket.items)))

    def list_staff(self, status: str | None, search: str | None, page: int, page_size: int) -> tuple[list[dict], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        stmt = select(Ticket)
        count_stmt = select(func.count(Ticket.id))
        conditions = []
        if status:
            conditions.append(Ticket.status == status)
        if search:
            conditions.append(Ticket.customer_name.ilike(f"%{search}%"))
        for condition in conditions:
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)
        activity = func.coalesce(Ticket.last_customer_message_at, Ticket.last_staff_message_at, Ticket.updated_at, Ticket.created_at)
        stmt = stmt.order_by(activity.desc()).offset((page - 1) * page_size).limit(page_size)
        rows = []
        for ticket in self.db.scalars(stmt).all():
            rows.append({
                "id": ticket.id,
                "customer_name": ticket.customer_name,
                "status": ticket.status,
                "created_at": ticket.created_at,
                "updated_at": ticket.updated_at,
                "last_customer_message_at": ticket.last_customer_message_at,
                "last_staff_message_at": ticket.last_staff_message_at,
                "has_unread_customer_message": bool(ticket.last_customer_message_at and (not ticket.last_staff_message_at or ticket.last_customer_message_at > ticket.last_staff_message_at)),
            })
        return rows, self.db.scalar(count_stmt) or 0

    def delete_closed(self) -> int:
        closed_statuses = [TicketStatus.completed, TicketStatus.not_completed]
        ticket_ids = list(self.db.scalars(select(Ticket.id).where(Ticket.status.in_(closed_statuses))).all())
        if not ticket_ids:
            return 0
        self.db.execute(delete(ChatMessage).where(ChatMessage.ticket_id.in_(ticket_ids)))
        self.db.execute(delete(StatusHistory).where(StatusHistory.ticket_id.in_(ticket_ids)))
        self.db.execute(delete(TicketItem).where(TicketItem.ticket_id.in_(ticket_ids)))
        self.db.execute(delete(IdempotencyKey).where(IdempotencyKey.ticket_id.in_(ticket_ids)))
        self.db.execute(delete(Ticket).where(Ticket.id.in_(ticket_ids)))
        self.db.commit()
        return len(ticket_ids)

    def update_status(self, ticket: Ticket, new_status: TicketStatus, user: User) -> tuple[ChatMessage | None, dict | None]:
        old = ticket.status
        if old == new_status:
            return None, None
        ticket.status = new_status
        if new_status in (TicketStatus.completed, TicketStatus.not_completed):
            ticket.closed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        else:
            ticket.closed_at = None
        StatsService(self.db).ticket_status_changed(old, new_status)
        self.db.add(StatusHistory(ticket_id=ticket.id, old_status=old.value, new_status=new_status.value, changed_by_user_id=user.id))
        text = f"Der Status wurde von {STATUS_LABELS[old.value]} zu {STATUS_LABELS[new_status.value]} geaendert."
        system_message = ChatMessage(ticket_id=ticket.id, sender_type=SenderType.system, sender_user_id=None, message=text)
        self.db.add(system_message)
        self.db.commit()
        self.db.refresh(ticket)
        self.db.refresh(system_message)
        event = StatusChangedEvent(data=StatusChangedData(ticket_id=ticket.id, old_status=old, new_status=new_status, message=text, created_at=system_message.created_at)).model_dump(mode="json")
        return system_message, event