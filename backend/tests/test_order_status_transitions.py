import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
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
def transition_test_setup():
    db = SessionLocal()
    try:
        # Create test customer
        customer = db.query(User).filter(User.email == "trans.customer@example.com").first()
        if not customer:
            customer = User(
                id=uuid.uuid4(),
                email="trans.customer@example.com",
                phone="9871113333",
                password_hash="test-hash",
                full_name="Transition Customer",
                role=UserRole.customer,
                is_active=True,
            )
            db.add(customer)

        # Create another customer to test isolation
        other_customer = db.query(User).filter(User.email == "other.customer@example.com").first()
        if not other_customer:
            other_customer = User(
                id=uuid.uuid4(),
                email="other.customer@example.com",
                phone="9871114444",
                password_hash="test-hash",
                full_name="Other Customer",
                role=UserRole.customer,
                is_active=True,
            )
            db.add(other_customer)

        # Use existing active admin (respects single active admin constraint)
        admin = db.query(User).filter(User.role == UserRole.admin, User.is_active.is_(True)).first()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                email="admin.test@globaltolocal.in",
                phone="9879998888",
                password_hash="test-hash",
                full_name="Head Admin",
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)

        db.commit()

        customer_token = create_access_token(str(customer.id), "customer")
        other_token = create_access_token(str(other_customer.id), "customer")
        admin_token = create_access_token(str(admin.id), "admin")

        return {
            "customer_id": customer.id,
            "customer_token": customer_token,
            "other_id": other_customer.id,
            "other_token": other_token,
            "admin_id": admin.id,
            "admin_token": admin_token,
        }
    finally:
        db.close()


def test_order_status_progression_and_guards(transition_test_setup):
    client = TestClient(app)
    admin_headers = {"Authorization": f"Bearer {transition_test_setup['admin_token']}"}
    customer_headers = {"Authorization": f"Bearer {transition_test_setup['customer_token']}"}
    other_headers = {"Authorization": f"Bearer {transition_test_setup['other_token']}"}

    db = SessionLocal()
    order_num = f"GTL-2026-{uuid.uuid4().hex[:4].upper()}"
    raw_order_id = uuid.uuid4()
    order_id = str(raw_order_id)
    test_order = Order(
        id=raw_order_id,
        order_number=order_num,
        user_id=transition_test_setup["customer_id"],
        guest_email="trans.customer@example.com",
        guest_phone="9871113333",
        status=OrderStatus.paid,
        currency="INR",
        subtotal_paise=150000,
        shipping_paise=12000,
        discount_paise=0,
        total_paise=162000,
        shipping_address_snapshot={"name": "Transition Customer", "city": "Panaji"},
        billing_address_snapshot={"name": "Transition Customer", "city": "Panaji"},
        placed_at=datetime.now(timezone.utc),
        paid_at=datetime.now(timezone.utc),
    )
    db.add(test_order)
    db.commit()
    db.close()

    # 1. Invalid jump: paid -> delivered directly (must fail with 400)
    res_jump = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=admin_headers,
        json={"new_status": "delivered"},
    )
    assert res_jump.status_code == 400
    assert "Cannot transition order from 'paid' to 'delivered'" in res_jump.text

    # 2. Valid transition: paid -> packed
    res_packed = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=admin_headers,
        json={"new_status": "packed"},
    )
    assert res_packed.status_code == 200
    assert res_packed.json()["new_status"] == "packed"

    # 3. Idempotent call: packed -> packed (must succeed immediately)
    res_packed_idempotent = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=admin_headers,
        json={"new_status": "packed"},
    )
    assert res_packed_idempotent.status_code == 200
    assert res_packed_idempotent.json()["new_status"] == "packed"

    # 4. Valid transition: packed -> shipped
    res_shipped = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=admin_headers,
        json={
            "new_status": "shipped",
            "carrier": "Delhivery Express",
            "tracking_number": "DEL-TEST-999",
        },
    )
    assert res_shipped.status_code == 200
    assert res_shipped.json()["new_status"] == "shipped"

    # 5. Backward transition: shipped -> packed (must fail with 400)
    res_back = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=admin_headers,
        json={"new_status": "packed"},
    )
    assert res_back.status_code == 400
    assert "Cannot transition order from 'shipped' to 'packed'" in res_back.text

    # 6. Valid transition: shipped -> delivered
    res_delivered = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=admin_headers,
        json={"new_status": "delivered"},
    )
    assert res_delivered.status_code == 200
    assert res_delivered.json()["new_status"] == "delivered"

    # 7. Transition from terminal state 'delivered' (must fail with 400)
    res_post_delivered = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=admin_headers,
        json={"new_status": "cancelled"},
    )
    assert res_post_delivered.status_code == 400
    assert "Cannot transition order from 'delivered' to 'cancelled'" in res_post_delivered.text

    # 8. User isolation check: Customer sees their order, but other customer does NOT
    res_cust_orders = client.get("/api/v1/orders", headers=customer_headers)
    assert res_cust_orders.status_code == 200
    cust_order_nums = [o["order_number"] for o in res_cust_orders.json()["items"]]
    assert order_num in cust_order_nums

    res_other_orders = client.get("/api/v1/orders", headers=other_headers)
    assert res_other_orders.status_code == 200
    other_order_nums = [o["order_number"] for o in res_other_orders.json()["items"]]
    assert order_num not in other_order_nums
