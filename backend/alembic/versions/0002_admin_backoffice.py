"""Admin Back Office Schema (one_active_admin, login_events, price_changes, order_internal_notes)

Revision ID: 0002_admin_backoffice
Revises: 0001_initial_schema
Create Date: 2026-10-13 12:55:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0002_admin_backoffice"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Partial unique index ensuring exactly one active admin
    op.create_index(
        "one_active_admin",
        "users",
        ["role"],
        unique=True,
        postgresql_where=sa.text("role = 'admin' AND is_active = true"),
    )

    # 2. Login events table
    op.create_table(
        "login_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("ip", sa.String(64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("success", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_login_events_created_at", "login_events", ["created_at"])
    op.create_index("ix_login_events_user_id", "login_events", ["user_id"])

    # 3. Price changes history table
    op.create_table(
        "price_changes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("admin_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("old_paise", sa.Integer(), nullable=False),
        sa.Column("new_paise", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("ip", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_price_changes_product_id", "price_changes", ["product_id"])
    op.create_index("ix_price_changes_created_at", "price_changes", ["created_at"])

    # 4. Order internal notes table
    op.create_table(
        "order_internal_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("admin_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_order_internal_notes_order_id", "order_internal_notes", ["order_id"])


def downgrade() -> None:
    op.drop_table("order_internal_notes")
    op.drop_table("price_changes")
    op.drop_table("login_events")
    op.drop_index("one_active_admin", table_name="users")
