from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ChatMessage, Ticket
from app.schemas.chat import ChatOut
from app.schemas.ticket import PublicTicketOut
from app.services.ticket_service import TicketService

router = APIRouter(prefix="/api/public/tickets", tags=["public-tickets"])

@router.get("/{token}", response_model=PublicTicketOut)
def get_ticket(token: str, db: Session = Depends(get_db)):
    ticket = TicketService(db).public_by_token(token)
    if not ticket:
        raise HTTPException(404, "Ticket wurde nicht gefunden")
    return ticket

@router.get("/{token}/messages", response_model=list[ChatOut])
def messages(token: str, db: Session = Depends(get_db)):
    ticket = db.scalar(select(Ticket).where(Ticket.public_token == token))
    if not ticket:
        raise HTTPException(404, "Ticket wurde nicht gefunden")
    return db.scalars(select(ChatMessage).where(ChatMessage.ticket_id == ticket.id).order_by(ChatMessage.created_at)).all()