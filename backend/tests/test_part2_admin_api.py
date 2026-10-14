import io
import os
import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import text
from backend.core.security import create_access_token, hash_password
from backend.database import SessionLocal, engine
from backend.main import app
from backend.models import (
    AuditLog,
    Category,
    Enquiry,
    EnquiryStatus,
    EnquiryType,
    Inventory,
    LoginEvent,
    Order,
    OrderItem,
    OrderInternalNote,
    OrderStatus,
    PriceChange,
    Product,
    User,
    UserRole,
    UserSession,
)
from backend.routers.checkout_orders import generate_next_order_number


@pytest.fixture(scope="module")
def admin_test_setup():
    db = SessionLocal()
    try:
        # Create test customer
        customer = db.query(User).filter(User.email == "customer.test@example.com").first()
        if not customer:
            customer = User(
                id=uuid.uuid4(),
                email="customer.test@example.com",
                phone="9871112222",
                password_hash=hash_password("CustomerPass123!"),
                full_name="Test Customer",
                role=UserRole.customer,
                is_active=True,
            )
            db.add(customer)
        else:
            customer.is_active = True
            db.commit()

        admin_password = os.environ.get("ADMIN_PASSWORD")
        if not admin_password:
            pytest.skip("ADMIN_PASSWORD environment variable is required to run admin tests.")

        # Create single test admin
        admin = db.query(User).filter(User.role == UserRole.admin, User.is_active.is_(True)).first()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                email="admin.test@globaltolocal.in",
                phone="9879998888",
                password_hash=hash_password(admin_password),
                full_name="Head Admin",
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)
        else:
            admin.password_hash = hash_password(admin_password)
            db.commit()

        # Ensure an active category and product exist
        cat = db.query(Category).first()
        if not cat:
            cat = Category(name="Test Shelf", slug="test-shelf", blurb="Blurb")
            db.add(cat)
            db.flush()

        prod = db.query(Product).first()
        if not prod:
            prod = Product(
                id=uuid.uuid4(),
                sku="GTL-TEST-001",
                slug="test-item-heritage",
                name="Test Heritage Item",
                category_id=cat.id,
                price_paise=50000,
                unit_label="250 g",
                net_weight_grams=250,
                is_active=True,
            )
            db.add(prod)
            db.flush()
            inv = Inventory(product_id=prod.id, on_hand=100, reserved=0)
            db.add(inv)

        db.commit()

        customer_token = create_access_token(
            user_id=str(customer.id),
            role="customer",
            email=customer.email,
        )
        admin_token = create_access_token(
            user_id=str(admin.id),
            role="admin",
            email=admin.email,
        )

        return {
            "customer_id": str(customer.id),
            "customer_token": customer_token,
            "admin_id": str(admin.id),
            "admin_token": admin_token,
            "admin_email": admin.email,
            "admin_password": admin_password,
            "product_id": str(prod.id),
            "product_slug": prod.slug,
        }
    finally:
        db.close()


def test_admin_auth_guards_visitor_401_and_customer_403_on_all_endpoints(admin_test_setup):
    client = TestClient(app)
    endpoints = [
        ("GET", "/api/v1/admin/me"),
        ("GET", "/api/v1/admin/dashboard"),
        ("GET", "/api/v1/admin/products"),
        ("GET", "/api/v1/admin/orders"),
        ("GET", "/api/v1/admin/customers"),
        ("GET", "/api/v1/admin/enquiries"),
    ]

    for method, path in endpoints:
        # 1. Visitor without token -> 401
        res_visitor = client.request(method, path)
        assert res_visitor.status_code == 401, f"Expected 401 for visitor on {path}, got {res_visitor.status_code}"

        # 2. Customer token -> 403
        res_customer = client.request(method, path, headers={"Authorization": f"Bearer {admin_test_setup['customer_token']}"})
        assert res_customer.status_code == 403, f"Expected 403 for customer on {path}, got {res_customer.status_code}"

        # 3. Admin token -> 200
        res_admin = client.request(method, path, headers={"Authorization": f"Bearer {admin_test_setup['admin_token']}"})
        assert res_admin.status_code == 200, f"Expected 200 for admin on {path}, got {res_admin.status_code}"


def test_admin_login_records_login_events_and_stricter_rate_limit(admin_test_setup):
    client = TestClient(app)
    db = SessionLocal()
    try:
        # Successful admin login triggers MFA verification step
        res = client.post("/api/v1/auth/login", json={"email": admin_test_setup["admin_email"], "password": admin_test_setup["admin_password"]})
        assert res.status_code == 200
        assert res.json().get("mfa_required") is True
        assert "temp_token" in res.json()

        # Verify login_event was logged
        evt = (
            db.query(LoginEvent)
            .filter(LoginEvent.user_id == uuid.UUID(admin_test_setup["admin_id"]))
            .order_by(LoginEvent.created_at.desc())
            .first()
        )
        assert evt is not None
        assert evt.success is True

        # Failed attempt
        res_fail = client.post("/api/v1/auth/login", json={"email": admin_test_setup["admin_email"], "password": "WrongPassword!"})
        assert res_fail.status_code == 401

        evt_fail = (
            db.query(LoginEvent)
            .filter(LoginEvent.user_id == uuid.UUID(admin_test_setup["admin_id"]))
            .order_by(LoginEvent.created_at.desc())
            .first()
        )
        assert evt_fail.success is False
    finally:
        db.close()


def test_admin_dashboard_metrics(admin_test_setup):
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {admin_test_setup['admin_token']}"}
    res = client.get("/api/v1/admin/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "today_orders_count" in data
    assert "pending_orders_count" in data
    assert "revenue_paise" in data
    assert "products_count" in data
    assert "new_enquiries_count" in data
    assert isinstance(data["products_count"], int)
    assert data["products_count"] > 0


def test_admin_product_price_edit_validation_and_audit_logs(admin_test_setup):
    client = TestClient(app)
    headers = {"Authorization": f"Bearer {admin_test_setup['admin_token']}"}
    pid = admin_test_setup["product_id"]

    # 1. Reject zero or negative price
    res_zero = client.patch(f"/api/v1/admin/products/{pid}/price", headers=headers, json={"new_price_paise": 0, "reason": "Testing"})
    assert res_zero.status_code in (422, 400)

    res_neg = client.patch(f"/api/v1/admin/products/{pid}/price", headers=headers, json={"new_price_paise": -500, "reason": "Testing"})
    assert res_neg.status_code in (422, 400)

    # 2. Reject missing reason
    res_no_reason = client.patch(f"/api/v1/admin/products/{pid}/price", headers=headers, json={"new_price_paise": 60000, "reason": ""})
    assert res_no_reason.status_code == 422

    # 3. Valid price change (warns above 25%)
    db_init = SessionLocal()
    try:
        p_row = db_init.query(Product).filter(Product.id == uuid.UUID(pid)).first()
        p_row.price_paise = 50000
        db_init.commit()
    finally:
        db_init.close()

    res_ok = client.patch(f"/api/v1/admin/products/{pid}/price", headers=headers, json={"new_price_paise": 85000, "reason": "Raw material cost update"})
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert data["new_price_paise"] == 85000
    assert data["warning"] == "Price change exceeds 25%"

    # 4. Verify audit_logs and price_changes tables
    db = SessionLocal()
    try:
        pc = db.query(PriceChange).filter(PriceChange.product_id == uuid.UUID(pid)).order_by(PriceChange.created_at.desc()).first()
        assert pc is not None
        assert pc.new_paise == 85000
        assert pc.reason == "Raw material cost update"

        audit = (
            db.query(AuditLog)
            .filter(AuditLog.entity_type == "product_price", AuditLog.entity_id == pid)
            .order_by(AuditLog.created_at.desc())
            .first()
        )
        assert audit is not None
        assert audit.action == "update_price"
        assert audit.after_state["price_paise"] == 85000

        # Check price history endpoint
        hist_res = client.get(f"/api/v1/admin/products/{pid}/price-history", headers=headers)
        assert hist_res.status_code == 200
        assert len(hist_res.json()) >= 1
    finally:
        db.close()


def test_price_change_reflected_on_public_shop_and_old_orders_keep_snapshot(admin_test_setup):
    client = TestClient(app)
    admin_headers = {"Authorization": f"Bearer {admin_test_setup['admin_token']}"}
    pid = admin_test_setup["product_id"]
    slug = admin_test_setup["product_slug"]

    # 1. Create an order with original price
    db = SessionLocal()
    order_num = generate_next_order_number(db)
    try:
        prod = db.query(Product).filter(Product.id == uuid.UUID(pid)).first()
        original_price = prod.price_paise
        order = Order(
            id=uuid.uuid4(),
            order_number=order_num,
            status=OrderStatus.paid,
            subtotal_paise=original_price,
            shipping_paise=8000,
            total_paise=original_price + 8000,
            shipping_address_snapshot={"name": "Asha", "city": "Panaji", "pincode": "403001"},
        )
        db.add(order)
        db.flush()

        order_item = OrderItem(
            order_id=order.id,
            product_id=prod.id,
            sku_snapshot=prod.sku,
            name_snapshot=prod.name,
            slug_snapshot=prod.slug,
            unit_label_snapshot=prod.unit_label,
            unit_price_paise=original_price,
            quantity=1,
            line_total_paise=original_price,
        )
        db.add(order_item)
        db.commit()
    finally:
        db.close()

    # 2. Admin updates the price to a new value (e.g. 95000 paise)
    new_price = 95000
    res_update = client.patch(
        f"/api/v1/admin/products/{pid}/price",
        headers=admin_headers,
        json={"new_price_paise": new_price, "reason": "Seasonal price adjustment"},
    )
    assert res_update.status_code == 200

    # 3. Public product endpoint immediately reflects the new price
    res_pub = client.get(f"/api/v1/products/{slug}")
    assert res_pub.status_code == 200
    assert res_pub.json()["price_paise"] == new_price
    assert res_pub.json()["price"] == new_price

    # 4. Old order item snapshot strictly maintains the original price
    db = SessionLocal()
    try:
        saved_order = db.query(Order).filter(Order.order_number == order_num).first()
        assert saved_order.items[0].unit_price_paise == original_price
        assert saved_order.total_paise == original_price + 8000
    finally:
        db.close()


def test_admin_orders_forward_only_status_and_notes(admin_test_setup):
    client = TestClient(app)
    admin_headers = {"Authorization": f"Bearer {admin_test_setup['admin_token']}"}

    db = SessionLocal()
    order_num = generate_next_order_number(db)
    try:
        order = Order(
            id=uuid.uuid4(),
            order_number=order_num,
            status=OrderStatus.paid,
            subtotal_paise=50000,
            shipping_paise=8000,
            total_paise=58000,
            guest_email="customer@example.com",
            shipping_address_snapshot={"name": "Maria", "city": "Panaji", "pincode": "403001"},
        )
        db.add(order)
        db.commit()
    finally:
        db.close()

    # 1. Forward transition: paid -> packed
    res_pack = client.patch(
        f"/api/v1/admin/orders/{order_num}/status",
        headers=admin_headers,
        json={"new_status": "packed", "note": "Packed in handmade Goan box"},
    )
    assert res_pack.status_code == 200
    assert res_pack.json()["new_status"] == "packed"

    # 2. Reject backwards or invalid jump: packed -> delivered (must go through shipped)
    res_invalid = client.patch(
        f"/api/v1/admin/orders/{order_num}/status",
        headers=admin_headers,
        json={"new_status": "delivered"},
    )
    assert res_invalid.status_code == 400

    # 3. Forward transition: packed -> shipped with tracking
    res_ship = client.patch(
        f"/api/v1/admin/orders/{order_num}/status",
        headers=admin_headers,
        json={
            "new_status": "shipped",
            "carrier": "Delhivery Express",
            "tracking_number": "DEL123456789",
            "tracking_url": "https://delhivery.com/track/DEL123456789",
        },
    )
    assert res_ship.status_code == 200
    assert res_ship.json()["new_status"] == "shipped"

    # 4. Add internal note
    res_note = client.post(
        f"/api/v1/admin/orders/{order_num}/notes",
        headers=admin_headers,
        json={"note": "Fragile ceramics verified by store manager."},
    )
    assert res_note.status_code == 200
    assert res_note.json()["note"] == "Fragile ceramics verified by store manager."


def test_admin_customers_deactivate_immediately_revokes_sessions(admin_test_setup):
    client = TestClient(app)
    admin_headers = {"Authorization": f"Bearer {admin_test_setup['admin_token']}"}
    cid = admin_test_setup["customer_id"]

    # Deactivate customer
    res_deact = client.patch(
        f"/api/v1/admin/customers/{cid}/status",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert res_deact.status_code == 200
    assert res_deact.json()["is_active"] is False

    # Blocked immediately with 401/403
    res_blocked = client.get(
        "/api/v1/me",
        headers={"Authorization": f"Bearer {admin_test_setup['customer_token']}"},
    )
    assert res_blocked.status_code in (401, 403)

    # Reactivate customer
    res_react = client.patch(
        f"/api/v1/admin/customers/{cid}/status",
        headers=admin_headers,
        json={"is_active": True},
    )
    assert res_react.status_code == 200
    assert res_react.json()["is_active"] is True


def test_admin_enquiries_status_management(admin_test_setup):
    client = TestClient(app)
    admin_headers = {"Authorization": f"Bearer {admin_test_setup['admin_token']}"}

    db = SessionLocal()
    try:
        enq = Enquiry(
            id=uuid.uuid4(),
            type=EnquiryType.bulk_corporate,
            status=EnquiryStatus.new,
            name="Resort Corporate",
            email="resort@goa.example.com",
            message="100 jars of mango jam",
        )
        db.add(enq)
        db.commit()
        enq_id = str(enq.id)
    finally:
        db.close()

    # List enquiries
    res_list = client.get("/api/v1/admin/enquiries", headers=admin_headers)
    assert res_list.status_code == 200
    assert res_list.json()["total"] >= 1

    # Update status to in_progress
    res_upd = client.patch(
        f"/api/v1/admin/enquiries/{enq_id}/status",
        headers=admin_headers,
        json={"status": "in_progress"},
    )
    assert res_upd.status_code == 200
    assert res_upd.json()["new_status"] == "in_progress"


def test_admin_create_product_auth_and_validation(admin_test_setup):
    client = TestClient(app)
    admin_headers = {"Authorization": f"Bearer {admin_test_setup['admin_token']}"}
    customer_headers = {"Authorization": f"Bearer {admin_test_setup['customer_token']}"}

    payload = {
        "name": "Artisanal Cashew Feni Jelly",
        "slug": f"artisanal-cashew-feni-jelly-{uuid.uuid4().hex[:6]}",
        "sku": f"GTL-{uuid.uuid4().hex[:6].upper()}",
        "shelf": "chutneys-and-spreads",
        "price_rupees": 450,
        "unit_label": "200 g",
        "net_weight_grams": 200,
        "description": "Authentic cashew preserve made in Fontainhas.",
        "origin_text": "Made in Panaji, Goa",
        "stock_qty": 40,
        "low_stock_threshold": 5,
        "is_featured": True,
        "status": "published",
        "images": [
            {
                "url": "/images/catalog/pineapple-jam-250-grams.jpg",
                "alt_text": "Cashew Feni Jelly Jar",
                "is_primary": True,
                "sort_order": 0,
            }
        ],
    }

    # 1. Visitor gets 401
    res_vis = client.post("/api/v1/admin/products", json=payload)
    assert res_vis.status_code == 401

    # 2. Customer gets 403
    res_cust = client.post("/api/v1/admin/products", headers=customer_headers, json=payload)
    assert res_cust.status_code == 403

    # 3. Admin successfully creates product -> 201
    res_create = client.post("/api/v1/admin/products", headers=admin_headers, json=payload)
    assert res_create.status_code == 201
    created_data = res_create.json()["product"]
    assert created_data["name"] == payload["name"]
    assert created_data["price_paise"] == 45000
    assert created_data["is_active"] is True
    prod_id = created_data["id"]

    # 4. Duplicate slug rejected -> 409
    dup_slug_payload = dict(payload)
    dup_slug_payload["sku"] = f"GTL-{uuid.uuid4().hex[:6].upper()}"
    res_dup_slug = client.post("/api/v1/admin/products", headers=admin_headers, json=dup_slug_payload)
    assert res_dup_slug.status_code == 409

    # 5. Duplicate SKU rejected -> 409
    dup_sku_payload = dict(payload)
    dup_sku_payload["slug"] = f"unique-slug-{uuid.uuid4().hex[:6]}"
    res_dup_sku = client.post("/api/v1/admin/products", headers=admin_headers, json=dup_sku_payload)
    assert res_dup_sku.status_code == 409

    # 6. Price 0 or negative rejected -> 422
    invalid_price_payload = dict(payload)
    invalid_price_payload["slug"] = f"slug-neg-{uuid.uuid4().hex[:6]}"
    invalid_price_payload["sku"] = f"GTL-NEG-{uuid.uuid4().hex[:4].upper()}"
    invalid_price_payload["price_rupees"] = 0
    invalid_price_payload["price_paise"] = 0
    res_zero = client.post("/api/v1/admin/products", headers=admin_headers, json=invalid_price_payload)
    assert res_zero.status_code == 422

    # 7. Check audit row exists in audit_logs
    db = SessionLocal()
    try:
        audit = db.query(AuditLog).filter(AuditLog.entity_id == prod_id, AuditLog.action == "product.create").first()
        assert audit is not None
        assert audit.after_state["sku"] == payload["sku"]

        # Check price_changes row exists
        pc = db.query(PriceChange).filter(PriceChange.product_id == uuid.UUID(prod_id)).first()
        assert pc is not None
        assert pc.new_paise == 45000
        assert pc.old_paise == 0
    finally:
        db.close()


def test_admin_product_images_upload_validation(admin_test_setup):
    client = TestClient(app)
    admin_headers = {"Authorization": f"Bearer {admin_test_setup['admin_token']}"}

    # 1. Bad image type rejected (e.g. text file or gif)
    fake_txt = io.BytesIO(b"this is plain text not an image")
    res_bad_type = client.post(
        "/api/v1/admin/products/images",
        headers=admin_headers,
        files={"file": ("malicious.txt", fake_txt, "text/plain")},
    )
    assert res_bad_type.status_code == 422

    # 2. File too large rejected (> 5 MB)
    large_bytes = io.BytesIO(b"0" * (5 * 1024 * 1024 + 1024))
    res_large = client.post(
        "/api/v1/admin/products/images",
        headers=admin_headers,
        files={"file": ("too_large.jpg", large_bytes, "image/jpeg")},
    )
    assert res_large.status_code == 422

    # 3. Valid image accepted (generate small valid PNG)
    from PIL import Image as PILImage
    img_buf = io.BytesIO()
    test_img = PILImage.new("RGB", (100, 100), color="blue")
    test_img.save(img_buf, format="PNG")
    img_buf.seek(0)

    res_valid = client.post(
        "/api/v1/admin/products/images",
        headers=admin_headers,
        files={"file": ("blue_box.png", img_buf, "image/png")},
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["status"] == "success"
    assert "/images/uploads/" in res_valid.json()["url"]


def test_published_product_visible_and_purchasable_vs_draft(admin_test_setup):
    client = TestClient(app)
    admin_headers = {"Authorization": f"Bearer {admin_test_setup['admin_token']}"}

    # 1. Create Published Product
    pub_slug = f"published-mango-chutney-{uuid.uuid4().hex[:6]}"
    pub_sku = f"GTL-PUB-{uuid.uuid4().hex[:4].upper()}"
    pub_res = client.post(
        "/api/v1/admin/products",
        headers=admin_headers,
        json={
            "name": "Published Sweet Mango Chutney",
            "slug": pub_slug,
            "sku": pub_sku,
            "shelf": "chutneys-and-spreads",
            "price_rupees": 320,
            "stock_qty": 25,
            "status": "published",
        },
    )
    assert pub_res.status_code == 201

    # 2. Create Draft Product
    draft_slug = f"draft-secret-spice-{uuid.uuid4().hex[:6]}"
    draft_sku = f"GTL-DFT-{uuid.uuid4().hex[:4].upper()}"
    draft_res = client.post(
        "/api/v1/admin/products",
        headers=admin_headers,
        json={
            "name": "Draft Secret Spice Blend",
            "slug": draft_slug,
            "sku": draft_sku,
            "shelf": "spices",
            "price_rupees": 190,
            "stock_qty": 10,
            "status": "draft",
        },
    )
    assert draft_res.status_code == 201

    # 3. Check /shop (catalogue list): Published shows on its shelf and in newest, Draft does NOT
    shelf_list = client.get("/api/v1/products?category=chutneys-and-spreads")
    assert shelf_list.status_code == 200
    shelf_slugs = [p["slug"] for p in shelf_list.json()["items"]]
    assert pub_slug in shelf_slugs

    newest_list = client.get("/api/v1/products?sort=newest")
    assert newest_list.status_code == 200
    newest_slugs = [p["slug"] for p in newest_list.json()["items"]]
    assert pub_slug in newest_slugs
    assert draft_slug not in newest_slugs

    # 4. Search: Published shows
    search_res = client.get(f"/api/v1/products?q=Sweet+Mango+Chutney")
    assert search_res.status_code == 200
    search_slugs = [p["slug"] for p in search_res.json()["items"]]
    assert pub_slug in search_slugs

    # 5. /product/{slug}: Published returns 200, Draft returns 404
    detail_pub = client.get(f"/api/v1/products/{pub_slug}")
    assert detail_pub.status_code == 200
    assert detail_pub.json()["name"] == "Published Sweet Mango Chutney"

    detail_draft = client.get(f"/api/v1/products/{draft_slug}")
    assert detail_draft.status_code == 404

    # 6. Bag & Cart: Published product can be added to bag and bought at database price
    cart_res = client.post(
        "/api/v1/cart/items",
        json={"product_id": pub_slug, "quantity": 2},
    )
    assert cart_res.status_code == 200
    cart_data = cart_res.json()
    matching_item = next((it for it in cart_data["items"] if it["slug"] == pub_slug), None)
    assert matching_item is not None
    assert matching_item["unit_price_paise"] == 32000
    assert matching_item["line_total_paise"] == 64000
