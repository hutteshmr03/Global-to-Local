import uuid
import pytest
from fastapi.testclient import TestClient
from backend.core.providers import DEV_EMAIL_OUTBOX, ADMIN_ORDER_NOTIFICATION_EMAIL
from backend.core.security import create_access_token
from backend.database import SessionLocal
from backend.main import app
from backend.models import User, UserRole, Product, Address, Inventory, Order, OrderItem, OrderStatus


def test_admin_receives_email_and_customer_does_not():
    db = SessionLocal()
    try:
        rand_suffix = uuid.uuid4().hex[:6]
        test_email = f"customer.{rand_suffix}@example.com"
        test_phone = f"98{uuid.uuid4().int % 100000000:08d}"
        test_utr = f"UTR{uuid.uuid4().hex[:10].upper()}"

        # 1. Setup a test customer
        user = User(
            id=uuid.uuid4(),
            email=test_email,
            phone=test_phone,
            full_name="Maria Fernandes",
            role=UserRole.customer,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # 2. Setup a test product with inventory
        prod = db.query(Product).filter(Product.is_active == True).first()
        assert prod is not None, "Product must exist"
        inv = db.query(Inventory).filter(Inventory.product_id == prod.id).first()
        if not inv:
            inv = Inventory(product_id=prod.id, on_hand=100, reserved=0)
            db.add(inv)
        else:
            inv.on_hand = 100
            inv.reserved = 0
        db.commit()

        # 3. Clear outbox before order placement
        DEV_EMAIL_OUTBOX.clear()

        # 4. Authenticate client
        token = create_access_token(user_id=str(user.id), role="customer", email=user.email)
        client = TestClient(app)
        auth_headers = {
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": f"idem_mail_{uuid.uuid4().hex[:12]}",
        }

        order_payload = {
            "customer_note": f"Bank Transfer UTR: {test_utr}",
            "delivery_address": {
                "name": "Maria Fernandes",
                "phone": test_phone,
                "line1": "House #42, Latin Quarter",
                "city": "Panaji",
                "state": "Goa",
                "pincode": "403001",
                "country": "India",
            },
            "items": [
                {"product_id": str(prod.id), "quantity": 2}
            ],
        }

        # 5. Place the order
        res = client.post("/api/v1/orders", json=order_payload, headers=auth_headers)
        assert res.status_code == 201, f"Order placement failed: {res.text}"
        data = res.json()
        order_num = data["order_number"]
        assert order_num.startswith("GTL-")

        # 6. Verify that an email was dispatched to ADMIN (gtlenterprise02@gmail.com)
        admin_emails = [e for e in DEV_EMAIL_OUTBOX if e["recipient"] == ADMIN_ORDER_NOTIFICATION_EMAIL]
        assert len(admin_emails) >= 1, "Admin email was not received at gtlenterprise02@gmail.com"

        admin_msg = admin_emails[-1]
        assert order_num in admin_msg["subject"], f"Order number {order_num} not in subject: {admin_msg['subject']}"
        assert order_num in admin_msg["body"], f"Order number {order_num} not in body"
        assert "Maria Fernandes" in admin_msg["body"], "Customer name missing from admin email"
        assert test_phone in admin_msg["body"], "Customer phone missing from admin email"
        assert "Panaji" in admin_msg["body"], "Delivery city missing from admin email"
        assert "403001" in admin_msg["body"], "Delivery pincode missing from admin email"
        assert test_utr in admin_msg["subject"], f"UTR {test_utr} missing from email subject: {admin_msg['subject']}"
        assert test_utr in admin_msg["body"], f"UTR {test_utr} missing from email body"

        # 7. Verify that CUSTOMER (customer.email.tester@example.com) NEVER received an email
        customer_emails = [e for e in DEV_EMAIL_OUTBOX if e["recipient"] == user.email]
        assert len(customer_emails) == 0, f"Customer should NOT have received any email, but got: {customer_emails}"

    finally:
        db.close()
