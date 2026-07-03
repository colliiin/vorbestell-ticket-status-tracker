from datetime import date, datetime, time
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models import Ticket, TicketItem, TicketStat, TicketStatus

STAT_KEYS = ["total", *[status.value for status in TicketStatus]]
TOTAL_REVENUE_CENTS_KEY = "total_revenue_cents"
CENT = Decimal("0.01")

class StatsService:
    def __init__(self, db: Session):
        self.db = db

    def _row(self, key: str) -> TicketStat:
        row = self.db.get(TicketStat, key)
        if row:
            return row
        row = TicketStat(key=key, value=0)
        self.db.add(row)
        self.db.flush()
        return row

    def increment(self, key: str, amount: int = 1) -> None:
        row = self._row(key)
        row.value = max(0, row.value + amount)

    @staticmethod
    def money_to_cents(value: Decimal | int | float | str | None) -> int:
        if value is None:
            return 0
        amount = Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)
        return int((amount * 100).to_integral_value(rounding=ROUND_HALF_UP))

    @staticmethod
    def cents_to_money(cents: int) -> str:
        return f"{Decimal(cents) / Decimal(100):.2f}"

    def add_revenue(self, amount: Decimal | int | float | str | None) -> None:
        cents = self.money_to_cents(amount)
        if cents <= 0:
            return
        row = self.db.get(TicketStat, TOTAL_REVENUE_CENTS_KEY)
        if row:
            row.value = max(0, row.value + cents)
            return
        self.db.add(TicketStat(key=TOTAL_REVENUE_CENTS_KEY, value=self._ticket_revenue_cents_for_range(None, None)))
        self.db.flush()

    def ticket_created(self, status: TicketStatus = TicketStatus.open, revenue: Decimal | int | float | str | None = None) -> None:
        self.increment("total", 1)
        self.increment(status.value, 1)
        self.add_revenue(revenue)

    def ticket_status_changed(self, old_status: TicketStatus, new_status: TicketStatus) -> None:
        if old_status == new_status:
            return
        self.increment(old_status.value, -1)
        self.increment(new_status.value, 1)

    def stats(self, from_date: date | None = None, to_date: date | None = None) -> dict[str, int]:
        if from_date or to_date:
            return self._ticket_stats_for_range(from_date, to_date)
        rows = {row.key: row.value for row in self.db.query(TicketStat).all()}
        result = {key: rows.get(key, 0) for key in STAT_KEYS}
        result["total_revenue"] = self.cents_to_money(rows.get(TOTAL_REVENUE_CENTS_KEY, self._ticket_revenue_cents_for_range(None, None)))
        return result

    def _ticket_stats_for_range(self, from_date: date | None, to_date: date | None) -> dict[str, int]:
        conditions = []
        if from_date:
            conditions.append(Ticket.created_at >= datetime.combine(from_date, time.min))
        if to_date:
            conditions.append(Ticket.created_at <= datetime.combine(to_date, time.max))
        stmt = select(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status)
        total_stmt = select(func.count(Ticket.id))
        for condition in conditions:
            stmt = stmt.where(condition)
            total_stmt = total_stmt.where(condition)
        rows = {status.value if isinstance(status, TicketStatus) else status: count for status, count in self.db.execute(stmt).all()}
        result = {key: 0 for key in STAT_KEYS}
        result["total"] = self.db.scalar(total_stmt) or 0
        for status in TicketStatus:
            result[status.value] = rows.get(status.value, 0)
        result["total_revenue"] = self.cents_to_money(self._ticket_revenue_cents_for_range(from_date, to_date))
        return result

    def _ticket_revenue_cents_for_range(self, from_date: date | None, to_date: date | None) -> int:
        stmt = (
            select(func.coalesce(func.sum(TicketItem.quantity * TicketItem.unit_price_snapshot), 0))
            .select_from(TicketItem)
            .join(Ticket, Ticket.id == TicketItem.ticket_id)
        )
        if from_date:
            stmt = stmt.where(Ticket.created_at >= datetime.combine(from_date, time.min))
        if to_date:
            stmt = stmt.where(Ticket.created_at <= datetime.combine(to_date, time.max))
        return self.money_to_cents(self.db.scalar(stmt))
