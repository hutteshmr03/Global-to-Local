"""Admin 2FA and Product Status Schema

Revision ID: 0003_admin_2fa
Revises: 0002_admin_backoffice
Create Date: 2026-10-14 14:00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0003_admin_2fa"
down_revision: Union[str, None] = "0002_admin_backoffice"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    user_cols = {c["name"] for c in insp.get_columns("users")}
    prod_cols = {c["name"] for c in insp.get_columns("products")}

    # 1. 2FA Columns on users table
    if "totp_secret_encrypted" not in user_cols:
        op.add_column("users", sa.Column("totp_secret_encrypted", sa.Text(), nullable=True))
    if "totp_enabled" not in user_cols:
        op.add_column("users", sa.Column("totp_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    if "recovery_codes_hash" not in user_cols:
        op.add_column("users", sa.Column("recovery_codes_hash", sa.Text(), nullable=True))

    # 2. Status column on products table (draft, published, hidden, archived)
    if "status" not in prod_cols:
        op.add_column("products", sa.Column("status", sa.String(32), nullable=False, server_default=sa.text("'published'")))
        # Update existing records to reflect their active/deleted status
        op.execute("UPDATE products SET status = 'archived' WHERE deleted_at IS NOT NULL;")
        op.execute("UPDATE products SET status = 'hidden' WHERE is_active = false AND deleted_at IS NULL;")
        op.execute("UPDATE products SET status = 'published' WHERE is_active = true AND deleted_at IS NULL;")


def downgrade() -> None:
    op.drop_column("products", "status")
    op.drop_column("users", "recovery_codes_hash")
    op.drop_column("users", "totp_enabled")
    op.drop_column("users", "totp_secret_encrypted")
