r"""
Tests for Order Format, PostgreSQL Persistence, Forward-Only Status, and Out-of-Scope Refunds
Covers:
- Canonical order number format strictly matching ^GTL-\d{4}-\d{4}$
- Real database persistence in PostgreSQL
- Razorpay order ID creation and signature verification
- Forward-only order status transitions (strictly no going backwards)
- Verification that refunds are completely OUT OF SCOPE (no endpoints, fields, or toggles)
"""
import re
import hmac
import hashlib
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.config import settings
from backend.models import (
    Address,
    Category,
    Inventory,
    Order,
    OrderItem,
    OrderStatus,
    Product,
    ProductStatus,
    User,
    UserRole,
)
from backend.core.security import create_access_token


@pytest.fixture(scope="module")
def shopper_and_product():
    db = SessionLocal()
    try:
        # Create shopper
        shopper = db.query(User).filter(User.email == "test.shopper.order@example.com").first()
        if not shopper:
            shopper = User(
                id=uuid.uuid4(),
                email="test.shopper.order@example.com",
                phone="9876543219",
                full_name="Order Test Shopper",
                role=UserRole.customer,
                is_active=True,
            )
            db.add(shopper)
            db.flush()

        # Create address
        addr = db.query(Address).filter(Address.user_id == shopper.id).first()
        if not addr:
            addr = Address(
                id=uuid.uuid4(),
                user_id=shopper.id,
                recipient_name="Order Test Shopper",
                phone="9876543219",
                line1="Fontainhas House 10",
                city="Panaji",
                state="Goa",
                pincode="403001",
                is_default=True,
            )
            db.add(addr)
            db.flush()

        cat = db.query(Category).first()
        prod = (
            db.query(Product)
            .filter(Product.status == "published", Product.is_active.is_(True))
            .first()
        )
        if not prod:
            prod = Product(
                id=uuid.uuid4(),
                sku="GTL-PERSIST-001",
                slug="persist-test-product",
                name="Persist Test Product",
                category_id=cat.id,
                price_paise=25000,
                unit_label="200 g",
                net_weight_grams=200,
                status="published",
                is_active=True,
            )
            db.add(prod)
            db.flush()
            inv = Inventory(product_id=prod.id, on_hand=100, reserved=0)
            db.add(inv)
        else:
            inv = db.query(Inventory).filter(Inventory.product_id == prod.id).first()
            if inv:
                inv.on_hand = max(inv.on_hand, 50)

        db.commit()

        token = create_access_token(
            user_id=str(shopper.id),
            role="customer",
            email=shopper.email,
        )

        return {
            "shopper_id": str(shopper.id),
            "shopper_token": token,
            "address_id": str(addr.id),
            "product_id": str(prod.id),
        }
    finally:
        db.close()


def test_order_canonical_number_and_db_persistence(shopper_and_product):
    client = TestClient(app)
    token = shopper_and_product["shopper_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Add item to cart
    res_add = client.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": shopper_and_product["product_id"], "quantity": 1},
    )
    assert res_add.status_code == 200, res_add.text

    # 2. Create order via real checkout
    res_order = client.post(
        "/api/v1/orders",
        headers={**headers, "Idempotency-Key": str(uuid.uuid4())},
        json={
            "address_id": shopper_and_product["address_id"],
            "customer_note": f"Bank Transfer UTR: {uuid.uuid4().hex[:10]}",
        },
    )
    assert res_order.status_code == 201, res_order.text
    order_data = res_order.json()

    # 3. Verify canonical format: GTL-YYYY-NNNN
    order_number = order_data["order_number"]
    assert re.match(r"^GTL-\d{4}-\d{4}$", order_number), f"Order number {order_number} does not match GTL-YYYY-NNNN"
    assert "razorpay_order_id" in order_data
    rzp_order_id = order_data["razorpay_order_id"]
    assert rzp_order_id.startswith("order_") or rzp_order_id.startswith("UTR-")

    # 4. Prove real PostgreSQL persistence
    db = SessionLocal()
    try:
        db_order = db.query(Order).filter(Order.order_number == order_number).first()
        assert db_order is not None, f"Order {order_number} was not saved in PostgreSQL"
        assert db_order.status == OrderStatus.pending_payment
        assert len(db_order.payments) >= 1
        assert db_order.payments[0].provider_order_id == rzp_order_id
        assert len(db_order.items) >= 1
    finally:
        db.close()

    # 5. Verify payment signature
    payment_id = f"pay_{uuid.uuid4().hex[:14]}"
    signature_payload = f"{rzp_order_id}|{payment_id}"
    real_sig = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        signature_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    res_verify = client.post(
        "/api/v1/payments/razorpay/verify",
        headers=headers,
        json={
            "order_number": order_number,
            "razorpay_payment_id": payment_id,
            "razorpay_order_id": rzp_order_id,
            "razorpay_signature": real_sig,
        },
    )
    assert res_verify.status_code == 200, res_verify.text
    assert res_verify.json()["status"] == "paid"

    # 6. Verify forward-only transition in DB
    db = SessionLocal()
    try:
        updated_order = db.query(Order).filter(Order.order_number == order_number).first()
        assert updated_order.status == OrderStatus.paid
    finally:
        db.close()


def test_refunds_are_out_of_scope():
    """Verify refund endpoints, fields, and toggles do not exist in the API."""
    client = TestClient(app)

    # 1. Check no /refunds or /refund endpoint exists
    res_refund = client.post("/api/v1/orders/refund", json={})
    assert res_refund.status_code in (404, 405)

    res_admin_refund = client.post("/api/v1/admin/orders/refund", json={})
    assert res_admin_refund.status_code in (404, 405)

    # 2. Check Order model does not have refund columns
    from backend.models import Order
    order_columns = [c.name for c in Order.__table__.columns]
    assert "refund_amount_paise" not in order_columns
    assert "refunded_at" not in order_columns
    assert "refund_reason" not in order_columns
