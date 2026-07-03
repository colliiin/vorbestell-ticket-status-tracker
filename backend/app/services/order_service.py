from datetime import datetime, timedelta
from decimal import Decimal
import hashlib
import json
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import IdempotencyKey, Product, Ticket, TicketItem
from app.schemas.order import OrderIn
from app.security.tokens import public_token
from app.services.stats_service import StatsService

class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def create_order(self, payload: OrderIn, idempotency_key: str | None) -> Ticket:
        body_hash = hashlib.sha256(json.dumps(payload.model_dump(mode="json"), sort_keys=True).encode()).hexdigest()
        if idempotency_key:
            existing = self.db.scalar(select(IdempotencyKey).where(IdempotencyKey.key == idempotency_key))
            if existing:
                if existing.request_hash != body_hash:
                    raise HTTPException(status.HTTP_409_CONFLICT, "Idempotency-Key wurde anders verwendet")
                ticket = self.db.get(Ticket, existing.ticket_id)
                if ticket:
                    return ticket
        product_ids = [item.product_id for item in payload.items]
        products = self.db.scalars(select(Product).where(Product.id.in_(product_ids), Product.is_active == True)).all()
        by_id = {product.id: product for product in products}
        if len(by_id) != len(set(product_ids)):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ein Produkt ist nicht verfuegbar")
        token = public_token()
        while self.db.scalar(select(Ticket).where(Ticket.public_token == token)):
            token = public_token()
        ticket = Ticket(public_token=token, customer_name=payload.customer_name.strip())
        self.db.add(ticket)
        self.db.flush()
        order_total = Decimal("0.00")
        for item in payload.items:
            product = by_id[item.product_id]
            order_total += product.price * item.quantity
            self.db.add(TicketItem(ticket_id=ticket.id, product_id=product.id, quantity=item.quantity, product_name_snapshot=product.name, unit_price_snapshot=product.price))
        if idempotency_key:
            self.db.add(IdempotencyKey(key=idempotency_key, request_hash=body_hash, ticket_id=ticket.id, expires_at=datetime.utcnow() + timedelta(hours=24)))
        StatsService(self.db).ticket_created(ticket.status, order_total)
        self.db.commit()
        self.db.refresh(ticket)
        return ticket
