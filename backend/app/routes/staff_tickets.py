from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app.dependencies import current_user
from app.models import ChatMessage, Ticket, User
from app.schemas.chat import ChatOut
from app.schemas.ticket import BulkDeleteOut, StaffTicketOut, StatusIn, TicketListOut
from app.security.csrf import validate_csrf
from app.services.chat_service import ChatService
from app.services.ticket_service import TicketService
from app.websocket.manager import manager, ticket_room

router = APIRouter(prefix="/api/staff/tickets", tags=["staff-tickets"])

@router.get("", response_model=TicketListOut)
def list_tickets(status: str | None = None, search: str | None = None, page: int = 1, page_size: int = 25, db: Session = Depends(get_db), user: User = Depends(current_user)):
    items, total = TicketService(db).list_staff(status, search, page, page_size)
    return {"items": items, "page": page, "page_size": min(max(page_size, 1), 100), "total": total}


@router.delete("/closed", response_model=BulkDeleteOut, dependencies=[Depends(validate_csrf)])
def delete_closed_tickets(db: Session = Depends(get_db), user: User = Depends(current_user)):
    deleted = TicketService(db).delete_closed()
    return {"deleted": deleted}
@router.get("/{ticket_id}", response_model=StaffTicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    ticket = db.scalar(select(Ticket).where(Ticket.id == ticket_id).options(selectinload(Ticket.items)))
    if not ticket:
        raise HTTPException(404, "Ticket wurde nicht gefunden")
    return ticket

@router.patch("/{ticket_id}/status", response_model=StaffTicketOut, dependencies=[Depends(validate_csrf)])
async def update_status(ticket_id: int, payload: StatusIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    ticket = db.scalar(select(Ticket).where(Ticket.id == ticket_id).options(selectinload(Ticket.items)))
    if not ticket:
        raise HTTPException(404, "Ticket wurde nicht gefunden")
    system_message, status_event = TicketService(db).update_status(ticket, payload.status, user)
    if system_message:
        await manager.broadcast(ticket_room(ticket.id), ChatService.event(system_message))
    if status_event:
        await manager.broadcast(ticket_room(ticket.id), status_event)
    return ticket

@router.get("/{ticket_id}/messages", response_model=list[ChatOut])
def messages(ticket_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(ChatMessage).where(ChatMessage.ticket_id == ticket_id).order_by(ChatMessage.created_at)).all()