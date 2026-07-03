"""persistent ticket stats

Revision ID: 0002_ticket_stats
Revises: 0001_initial
Create Date: 2026-07-03
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_ticket_stats"
down_revision = "0001_initial"
branch_labels = None
depends_on = None

STAT_KEYS = ["total", "open", "in_progress", "ready_for_pickup", "completed", "not_completed"]

def upgrade():
    op.create_table(
        "ticket_stats",
        sa.Column("key", sa.String(40), primary_key=True),
        sa.Column("value", sa.Integer(), nullable=False, server_default="0"),
    )
    stats = sa.table("ticket_stats", sa.column("key", sa.String), sa.column("value", sa.Integer))
    op.bulk_insert(stats, [{"key": key, "value": 0} for key in STAT_KEYS])
    op.execute("UPDATE ticket_stats SET value = (SELECT COUNT(*) FROM tickets) WHERE key = 'total'")
    for status in STAT_KEYS[1:]:
        op.execute(f"UPDATE ticket_stats SET value = (SELECT COUNT(*) FROM tickets WHERE status = '{status}') WHERE key = '{status}'")


def downgrade():
    op.drop_table("ticket_stats")