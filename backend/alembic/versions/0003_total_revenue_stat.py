"""track total order revenue

Revision ID: 0003_total_revenue_stat
Revises: 0002_ticket_stats
Create Date: 2026-07-03
"""
from decimal import Decimal, ROUND_HALF_UP
from alembic import op
import sqlalchemy as sa

revision = "0003_total_revenue_stat"
down_revision = "0002_ticket_stats"
branch_labels = None
depends_on = None

TOTAL_REVENUE_CENTS_KEY = "total_revenue_cents"


def _money_to_cents(value) -> int:
    amount = Decimal(str(value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return int((amount * 100).to_integral_value(rounding=ROUND_HALF_UP))


def upgrade():
    bind = op.get_bind()
    revenue = bind.execute(sa.text("SELECT COALESCE(SUM(quantity * unit_price_snapshot), 0) FROM ticket_items")).scalar()
    bind.execute(sa.text("DELETE FROM ticket_stats WHERE key = :key"), {"key": TOTAL_REVENUE_CENTS_KEY})
    bind.execute(
        sa.text("INSERT INTO ticket_stats (key, value) VALUES (:key, :value)"),
        {"key": TOTAL_REVENUE_CENTS_KEY, "value": _money_to_cents(revenue)},
    )


def downgrade():
    bind = op.get_bind()
    bind.execute(sa.text("DELETE FROM ticket_stats WHERE key = :key"), {"key": TOTAL_REVENUE_CENTS_KEY})
