"""Initial Part 1 schema for Global to Local

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-10-13 10:55:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from backend.database import Base
import backend.models  # noqa: F401

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ENUM_DEFINITIONS = [
    ("user_role", ("customer", "staff", "admin")),
    ("maker_kind", ("shg", "artisan", "cluster", "farm")),
    ("availability_state", ("in_stock", "low_stock", "out_of_stock", "seasonal", "discontinued")),
    (
        "stock_movement_reason",
        (
            "initial_seed",
            "purchase_order_received",
            "order_reserved",
            "order_released",
            "order_committed",
            "manual_adjustment",
            "damage_or_spoilage",
            "return_restock",
        ),
    ),
    (
        "order_status",
        (
            "pending_payment",
            "paid",
            "packed",
            "shipped",
            "delivered",
            "cancelled",
        ),
    ),
    ("payment_status", ("created", "authorized", "captured", "failed", "refunded", "partially_refunded")),
    (
        "shipment_status",
        (
            "label_created",
            "picked_up",
            "in_transit",
            "out_for_delivery",
            "delivered",
            "rto_initiated",
            "rto_delivered",
        ),
    ),
    ("coupon_kind", ("percentage", "fixed_paise", "free_shipping")),
    ("enquiry_type", ("general", "bulk_corporate", "custom_hamper", "press", "artisan_onboarding")),
    ("enquiry_status", ("new", "in_progress", "quoted", "closed_won", "closed_lost", "spam")),
    ("press_kind", ("article", "video", "award")),
]

UPDATED_AT_TABLES = [
    "users",
    "addresses",
    "makers",
    "categories",
    "products",
    "collections",
    "inventory",
    "carts",
    "cart_items",
    "coupons",
    "orders",
    "payments",
    "shipments",
    "faqs",
    "enquiries",
    "cms_pages",
    "site_settings",
]


def upgrade() -> None:
    bind = op.get_bind()

    # 1. PostgreSQL Extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    op.execute("CREATE EXTENSION IF NOT EXISTS citext;")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

    # 2. PostgreSQL Enum Types
    for enum_name, values in ENUM_DEFINITIONS:
        vals_sql = ", ".join(f"'{v}'" for v in values)
        op.execute(
            f"""
            DO $$ BEGIN
                CREATE TYPE {enum_name} AS ENUM ({vals_sql});
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
            """
        )

    # 3. Create all tables defined in SQLAlchemy metadata
    Base.metadata.create_all(bind=bind)

    # 4. Create sequence for human-readable order numbers
    op.execute("CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;")

    # 5. Specialized Indexes (Full-Text Search, Trigram, Partial Unique Indexes)
    op.execute("CREATE INDEX IF NOT EXISTS idx_products_search_tsv ON products USING GIN (search_tsv);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);")
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_one_default_per_user "
        "ON addresses (user_id) WHERE is_default = TRUE AND deleted_at IS NULL;"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_one_primary "
        "ON product_images (product_id) WHERE is_primary = TRUE;"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_active_user "
        "ON carts (user_id) WHERE user_id IS NOT NULL;"
    )

    # 6. Trigger function for automatic updated_at timestamps
    op.execute(
        """
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    for tbl in UPDATED_AT_TABLES:
        op.execute(f"DROP TRIGGER IF EXISTS trg_{tbl}_updated_at ON {tbl};")
        op.execute(
            f"""
            CREATE TRIGGER trg_{tbl}_updated_at
            BEFORE UPDATE ON {tbl}
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            """
        )


def downgrade() -> None:
    bind = op.get_bind()

    for tbl in UPDATED_AT_TABLES:
        op.execute(f"DROP TRIGGER IF EXISTS trg_{tbl}_updated_at ON {tbl};")
    op.execute("DROP FUNCTION IF EXISTS set_updated_at();")
    op.execute("DROP SEQUENCE IF EXISTS order_number_seq;")

    Base.metadata.drop_all(bind=bind)

    for enum_name, _ in reversed(ENUM_DEFINITIONS):
        op.execute(f"DROP TYPE IF EXISTS {enum_name} CASCADE;")
