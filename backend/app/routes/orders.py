from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.order import OrderCreated, OrderIn
from app.security.rate_limit import check_rest_rate
from app.services.order_service import OrderService

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("", response_model=OrderCreated)
def create_order(request: Request, payload: OrderIn, idempotency_key: str | None = Header(default=None), db: Session = Depends(get_db)):
    check_rest_rate(request, "orders", 10, 600)
    ticket = OrderService(db).create_order(payload, idempotency_key)
    return {"ticket_token": ticket.public_token, "redirect_url": f"/ticket/{ticket.public_token}/chat"}