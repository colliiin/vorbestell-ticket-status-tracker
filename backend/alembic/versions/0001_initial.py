"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-02
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    userrole = sa.Enum("owner", "admin", name="userrole")
    ticketstatus = sa.Enum("open", "in_progress", "ready_for_pickup", "completed", "not_completed", name="ticketstatus")
    sendertype = sa.Enum("customer", "owner", "admin", "system", name="sendertype")
    userrole.create(op.get_bind(), checkfirst=True)
    ticketstatus.create(op.get_bind(), checkfirst=True)
    sendertype.create(op.get_bind(), checkfirst=True)
    op.create_table("users", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("username", sa.String(80), nullable=False), sa.Column("password_hash", sa.String(255), nullable=False), sa.Column("role", userrole, nullable=False), sa.Column("is_active", sa.Boolean(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False), sa.Column("last_login_at", sa.DateTime()))
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_table("products", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(120), nullable=False), sa.Column("description", sa.Text(), nullable=False), sa.Column("price", sa.Numeric(10, 2), nullable=False), sa.Column("image_url", sa.String(500)), sa.Column("is_active", sa.Boolean(), nullable=False), sa.Column("sort_order", sa.Integer(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False))
    op.create_index("ix_products_is_active", "products", ["is_active"])
    op.create_table("tickets", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("public_token", sa.String(128), nullable=False), sa.Column("customer_name", sa.String(120), nullable=False), sa.Column("status", ticketstatus, nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False), sa.Column("closed_at", sa.DateTime()), sa.Column("last_customer_message_at", sa.DateTime()), sa.Column("last_staff_message_at", sa.DateTime()))
    op.create_index("ix_tickets_public_token", "tickets", ["public_token"], unique=True)
    op.create_index("ix_tickets_status", "tickets", ["status"])
    op.create_table("ticket_items", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("ticket_id", sa.Integer(), sa.ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False), sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False), sa.Column("quantity", sa.Integer(), nullable=False), sa.Column("product_name_snapshot", sa.String(120), nullable=False), sa.Column("unit_price_snapshot", sa.Numeric(10, 2), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_ticket_items_ticket_id", "ticket_items", ["ticket_id"])
    op.create_table("chat_messages", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("ticket_id", sa.Integer(), sa.ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False), sa.Column("sender_type", sendertype, nullable=False), sa.Column("sender_user_id", sa.Integer(), sa.ForeignKey("users.id")), sa.Column("message", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_chat_messages_ticket_id", "chat_messages", ["ticket_id"])
    op.create_table("ticket_status_history", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("ticket_id", sa.Integer(), sa.ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False), sa.Column("old_status", sa.String(40), nullable=False), sa.Column("new_status", sa.String(40), nullable=False), sa.Column("changed_by_user_id", sa.Integer(), sa.ForeignKey("users.id")), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_ticket_status_history_ticket_id", "ticket_status_history", ["ticket_id"])
    op.create_table("idempotency_keys", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("key", sa.String(120), nullable=False), sa.Column("request_hash", sa.String(64), nullable=False), sa.Column("ticket_id", sa.Integer(), sa.ForeignKey("tickets.id"), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("expires_at", sa.DateTime(), nullable=False))
    op.create_index("ix_idempotency_keys_key", "idempotency_keys", ["key"], unique=True)

def downgrade():
    op.drop_table("idempotency_keys")
    op.drop_table("ticket_status_history")
    op.drop_table("chat_messages")
    op.drop_table("ticket_items")
    op.drop_table("tickets")
    op.drop_table("products")
    op.drop_table("users")
    sa.Enum(name="sendertype").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="ticketstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=True)