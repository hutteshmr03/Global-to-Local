import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Point test suite at gtl_test_db before importing app
TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/gtl_test_db",
)
os.environ["DATABASE_URL"] = TEST_DB_URL
os.environ["APP_ENV"] = "test"
os.environ["ENV"] = "test"

from backend.config import Settings, settings
from backend.core.errors import ProblemException
from backend.core.providers import (
    DEV_EMAIL_OUTBOX,
    DEV_SMS_OUTBOX,
    ConsoleEmailProvider,
    ConsoleSMSProvider,
    get_email_provider,
    get_sms_provider,
)
from backend.core.redis import get_redis
from backend.database import Base, get_db
from backend.main import app
from backend.models import (
    Inventory,
    Maker,
    Order,
    OrderStatus,
    OtpChallenge,
    PasswordResetToken,
    Product,
    StoreReview,
    User,
)
from backend.routers.checkout_orders import (
    compute_razorpay_payment_signature,
    release_expired_reservations,
    transition_order_status,
)
from backend.seed import seed_database as run_seed


engine = create_engine(TEST_DB_URL, future=True)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create schema and run idempotent seed on gtl_test_db."""
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS citext"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        conn.execute(text("CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001 INCREMENT BY 1"))

    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield


@pytest.fixture()
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    r = get_redis()
    r.flushall()
    DEV_SMS_OUTBOX.clear()
    DEV_EMAIL_OUTBOX.clear()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# =====================================================================
# STEP B1 TESTS: HEALTH, CATALOGUE, SEED IDEMPOTENCY, CONTENT, SEARCH
# =====================================================================


def test_health_endpoints(client: TestClient):
    r_live = client.get("/api/v1/health/live")
    assert r_live.status_code == 200
    assert r_live.json()["status"] == "ok"

    r_ready = client.get("/api/v1/health/ready")
    assert r_ready.status_code == 200
    data = r_ready.json()
    assert data["status"] == "ready"
    assert data["checks"]["postgres"] == "ok"
    assert data["checks"]["redis"] == "ok"


def test_seed_idempotency_and_13_shelves_counts(client: TestClient, db_session):
    result = run_seed(db_session)
    assert result["total_products"] == 230
    assert len(result["shelves"]) == 13

    resp = client.get("/api/v1/categories")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 13

    expected_counts = {
        "chutneys-and-spreads": 4,
        "farsaan": 16,
        "grains": 8,
        "hand-crafted": 42,
        "kunbi": 8,
        "masala": 31,
        "oils-vinegars": 14,
        "papads-pickles": 27,
        "seafood": 5,
        "spices": 12,
        "sustainable-products": 15,
        "sweet": 28,
        "wellness": 20,
    }
    actual_counts = {c["slug"]: c["count"] for c in items}
    assert actual_counts == expected_counts
    assert sum(actual_counts.values()) == 230


def test_products_pagination_filters_and_no_invented_makers(client: TestClient, db_session):
    # Verify no invented makers exist in DB
    assert db_session.query(Maker).count() == 0

    r = client.get("/api/v1/products?page=1&page_size=60")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 230
    assert len(body["items"]) == 60
    assert body["total_pages"] == 4
    assert body["items"][0]["maker"] is None

    r_cat = client.get("/api/v1/products?category=seafood")
    assert r_cat.status_code == 200
    assert r_cat.json()["total"] == 5

    r_sort = client.get("/api/v1/products?category=chutneys-and-spreads&sort=price_asc")
    prices = [p["price_paise"] for p in r_sort.json()["items"]]
    assert prices == sorted(prices)

    sample_slug = body["items"][0]["slug"]
    r_detail = client.get(f"/api/v1/products/{sample_slug}")
    assert r_detail.status_code == 200
    detail = r_detail.json()
    assert detail["slug"] == sample_slug
    assert detail["maker"] is None
    assert "related_products" in detail
    assert isinstance(detail["price_paise"], int)


def test_shell_shelf_collection_and_search_suggest(client: TestClient):
    r_col = client.get("/api/v1/collections/shell-shelf")
    assert r_col.status_code == 200
    col_data = r_col.json()
    assert col_data["slug"] == "shell-shelf"
    assert len(col_data["items"]) == 10

    r_sug = client.get("/api/v1/search/suggest?q=xacuti")
    assert r_sug.status_code == 200
    sug = r_sug.json()
    assert len(sug["products"]) >= 1


def test_content_endpoints_exact_frontend_data(client: TestClient, db_session):
    # 1. Exactly 19 FAQs from ContactPage.jsx
    r_faq = client.get("/api/v1/faqs")
    assert r_faq.status_code == 200
    faqs = r_faq.json()["items"]
    assert len(faqs) == 19
    assert faqs[0]["q"] == "Are there any charges for registration?"
    assert faqs[-1]["q"] == "How do I share feedback?"

    # 2. Only the 3 visitor reviews (Gifty Abraham, Stedwick Fernandes, Swapna Pujari)
    assert db_session.query(StoreReview).count() == 3
    r_rev = client.get("/api/v1/reviews")
    assert r_rev.status_code == 200
    rev_items = r_rev.json()["items"]
    assert len(rev_items) == 3
    assert [r["author"] for r in rev_items] == [
        "Gifty Abraham",
        "Stedwick Fernandes",
        "Swapna Pujari",
    ]

    # 3. Zero invented makers
    r_makers = client.get("/api/v1/makers")
    assert r_makers.status_code == 200
    assert r_makers.json()["items"] == []

    # 4. Press articles (5) & awards (2) from InTheNewsPage.jsx
    r_press = client.get("/api/v1/press")
    assert r_press.status_code == 200
    assert len(r_press.json()["articles"]) == 5
    assert len(r_press.json()["awards"]) == 2


# =====================================================================
# STEP B2 TESTS: SECURITY, OTP LIMITS, NEUTRAL MESSAGES, RESET, CSRF
# =====================================================================


def test_production_refuses_dev_providers_and_in_memory_redis(monkeypatch):
    # 1. Settings validator refuses console SMS/Email when ENV=production
    with pytest.raises(ValueError, match="Console SMS provider is strictly forbidden"):
        Settings(ENV="production", SMS_PROVIDER="console", EMAIL_PROVIDER="console")

    with pytest.raises(ValueError, match="Console Email provider is strictly forbidden"):
        Settings(ENV="production", SMS_PROVIDER="msg91", EMAIL_PROVIDER="console")

    # 2. Runtime guardrails refuse dev SMS, dev Email, and in-memory Redis when ENV=production
    monkeypatch.setenv("ENV", "production")
    with pytest.raises(RuntimeError, match="refused when ENV=production|cannot be used when ENV=production"):
        get_sms_provider()
    with pytest.raises(RuntimeError, match="refused when ENV=production|cannot be used when ENV=production"):
        ConsoleSMSProvider().send_otp("9876543210", "123456")
    with pytest.raises(RuntimeError, match="refused when ENV=production|cannot be used when ENV=production"):
        get_email_provider()
    with pytest.raises(RuntimeError, match="refused when ENV=production|cannot be used when ENV=production"):
        ConsoleEmailProvider().send_email("a@b.com", "Sub", "Body")
    with pytest.raises(RuntimeError, match="In-memory Redis fallback is refused when ENV=production"):
        get_redis(force_reconnect=True)
    monkeypatch.setenv("ENV", "test")


def test_otp_limits_6_digits_5min_expiry_max_5_attempts_3_per_hour_hashed_never_logged(
    client: TestClient, db_session, capsys
):
    phone = "9876500001"
    r_send = client.post("/api/v1/auth/otp/send", json={"phone": phone, "mode": "register", "name": "Goa Tester"})
    assert r_send.status_code == 200
    assert r_send.json()["expires_in_seconds"] == 300
    assert len(DEV_SMS_OUTBOX) == 1
    otp_code = DEV_SMS_OUTBOX[-1]["code"]
    assert len(otp_code) == 6 and otp_code.isdigit()

    # Never logged to stdout/stderr
    captured = capsys.readouterr()
    assert otp_code not in captured.out
    assert otp_code not in captured.err

    # Stored hashed in DB (HMAC-SHA256, 64 hex chars), never plaintext
    challenge = (
        db_session.query(OtpChallenge)
        .filter(OtpChallenge.phone == phone)
        .order_by(OtpChallenge.created_at.desc())
        .first()
    )
    assert challenge is not None
    assert challenge.code_hash != otp_code
    assert len(challenge.code_hash) == 64
    assert challenge.max_attempts == 5

    # Max 5 attempts per OTP: 4 wrong attempts return 401, 5th wrong attempt triggers 429 lockout
    for attempt in range(1, 5):
        r_bad = client.post(
            "/api/v1/auth/otp/verify",
            json={"phone": phone, "code": "000000", "mode": "register", "name": "Goa Tester"},
        )
        assert r_bad.status_code == 401

    r_fifth = client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": phone, "code": "000000", "mode": "register", "name": "Goa Tester"},
    )
    assert r_fifth.status_code == 429

    # Even the right code is now rejected with 429 because max 5 attempts were exhausted
    r_locked = client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": phone, "code": otp_code, "mode": "register", "name": "Goa Tester"},
    )
    assert r_locked.status_code == 429

    # Send 2nd OTP and verify 5-minute expiry enforcement
    r_send2 = client.post("/api/v1/auth/otp/send", json={"phone": phone, "mode": "register", "name": "Goa Tester"})
    assert r_send2.status_code == 200
    otp_code2 = DEV_SMS_OUTBOX[-1]["code"]
    ch2 = (
        db_session.query(OtpChallenge)
        .filter(OtpChallenge.phone == phone)
        .order_by(OtpChallenge.created_at.desc())
        .first()
    )
    ch2.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    db_session.commit()

    r_expired = client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": phone, "code": otp_code2, "mode": "register", "name": "Goa Tester"},
    )
    assert r_expired.status_code == 401
    assert "expired" in r_expired.json()["detail"].lower()

    # Send 3rd OTP and complete registration
    r_send3 = client.post("/api/v1/auth/otp/send", json={"phone": phone, "mode": "register", "name": "Goa Tester"})
    assert r_send3.status_code == 200
    otp_code3 = DEV_SMS_OUTBOX[-1]["code"]

    r_ok = client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": phone, "code": otp_code3, "mode": "register", "name": "Goa Tester"},
    )
    assert r_ok.status_code == 200
    assert r_ok.json()["user"]["name"] == "Goa Tester"
    assert "gtl_access_token" in r_ok.cookies
    assert "gtl_refresh_token" in r_ok.cookies
    assert "gtl_csrf_token" in r_ok.cookies

    # 4th OTP send within the same hour must be rejected with 429 (max 3 sends/hour/number)
    r_send4 = client.post("/api/v1/auth/otp/send", json={"phone": phone, "mode": "login"})
    assert r_send4.status_code == 429


def test_neutral_login_and_password_reset_messages(client: TestClient, db_session):
    # Register a known user with email and phone
    reg_email = "maria.fontainhas@example.com"
    reg_phone = "9876500022"
    r_reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Maria Fernandes",
            "email": reg_email,
            "password": "StrongPassword123!",
            "phone": reg_phone,
        },
    )
    assert r_reg.status_code == 201

    # 1. Phone Sign-In OTP request: registered vs unregistered phone return identical neutral message
    unreg_phone = "9876599988"
    r_otp_reg = client.post("/api/v1/auth/otp/send", json={"phone": reg_phone, "mode": "login"})
    r_otp_unreg = client.post("/api/v1/auth/otp/send", json={"phone": unreg_phone, "mode": "login"})
    assert r_otp_reg.status_code == 200
    assert r_otp_unreg.status_code == 200
    assert r_otp_reg.json()["message"] == r_otp_unreg.json()["message"]
    assert "If this mobile number is registered" in r_otp_reg.json()["message"]

    # 2. Phone Sign-In OTP verify: unregistered phone vs wrong code on registered phone return identical 401 message
    r_ver_reg_wrong = client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": reg_phone, "code": "000000", "mode": "login"},
    )
    r_ver_unreg = client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": unreg_phone, "code": "000000", "mode": "login"},
    )
    assert r_ver_reg_wrong.status_code == 401
    assert r_ver_unreg.status_code == 401
    assert r_ver_reg_wrong.json()["detail"] == r_ver_unreg.json()["detail"]

    # 3. Email Sign-In: wrong password vs unregistered email return identical 401 message
    r_wrong_pw = client.post(
        "/api/v1/auth/login",
        json={"email": reg_email, "password": "WrongPassword999"},
    )
    r_wrong_user = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody.unregistered@example.com", "password": "WrongPassword999"},
    )
    assert r_wrong_pw.status_code == 401
    assert r_wrong_user.status_code == 401
    assert r_wrong_pw.json()["detail"] == r_wrong_user.json()["detail"]

    # 4. Password Reset Forgot: registered vs unregistered email return identical neutral 200 message
    r_forgot_reg = client.post("/api/v1/auth/password/forgot", json={"email": reg_email})
    r_forgot_unreg = client.post(
        "/api/v1/auth/password/forgot", json={"email": "nobody.unregistered@example.com"}
    )
    assert r_forgot_reg.status_code == 200
    assert r_forgot_unreg.status_code == 200
    assert r_forgot_reg.json()["message"] == r_forgot_unreg.json()["message"]


def test_password_reset_single_use_hashed_and_expiry(client: TestClient, db_session, capsys):
    email = "reset.user@example.com"
    client.post(
        "/api/v1/auth/register",
        json={"name": "Reset User", "email": email, "password": "InitialPassword123!"},
    )
    DEV_EMAIL_OUTBOX.clear()

    r_forgot = client.post("/api/v1/auth/password/forgot", json={"email": email})
    assert r_forgot.status_code == 200
    assert len(DEV_EMAIL_OUTBOX) == 1
    reset_token = DEV_EMAIL_OUTBOX[-1]["token"]

    # Never logged to stdout/stderr
    captured = capsys.readouterr()
    assert reset_token not in captured.out
    assert reset_token not in captured.err

    # Stored hashed in DB
    u = db_session.query(User).filter(User.email == email).first()
    tok_row = (
        db_session.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == u.id)
        .order_by(PasswordResetToken.created_at.desc())
        .first()
    )
    assert tok_row is not None
    assert tok_row.token_hash != reset_token
    assert len(tok_row.token_hash) == 64

    # Single-use reset succeeds
    r_reset = client.post(
        "/api/v1/auth/password/reset",
        json={"token": reset_token, "new_password": "NewStrongPassword456!"},
    )
    assert r_reset.status_code == 200

    # Re-using the same token fails with 400
    r_reuse = client.post(
        "/api/v1/auth/password/reset",
        json={"token": reset_token, "new_password": "AnotherPassword789!"},
    )
    assert r_reuse.status_code == 400

    # Request a second token, expire it, and verify expired token is rejected
    client.post("/api/v1/auth/password/forgot", json={"email": email})
    token2 = DEV_EMAIL_OUTBOX[-1]["token"]
    tok_row2 = (
        db_session.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == u.id)
        .order_by(PasswordResetToken.created_at.desc())
        .first()
    )
    tok_row2.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    r_exp = client.post(
        "/api/v1/auth/password/reset",
        json={"token": token2, "new_password": "ExpiredPassword789!"},
    )
    assert r_exp.status_code == 400


def test_csrf_protection_on_cookie_authenticated_writes(client: TestClient):
    r_reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "CSRF Tester",
            "email": "csrf.tester@example.com",
            "password": "CsrfPassword123!",
        },
    )
    assert r_reg.status_code == 201
    valid_csrf = r_reg.cookies.get("gtl_csrf_token")
    assert valid_csrf

    # 1. Cookie-authenticated write WITHOUT X-CSRF-Token must fail with 403
    r_no_csrf = client.patch("/api/v1/me", json={"full_name": "Attacker Name"})
    assert r_no_csrf.status_code == 403

    # 2. Cookie-authenticated write WITH forged X-CSRF-Token must fail with 403
    r_bad_csrf = client.patch(
        "/api/v1/me",
        headers={"X-CSRF-Token": "forged_token.deadbeef12345678"},
        json={"full_name": "Attacker Name"},
    )
    assert r_bad_csrf.status_code == 403

    # 3. Cookie-authenticated write WITH valid X-CSRF-Token succeeds
    r_ok = client.patch(
        "/api/v1/me",
        headers={"X-CSRF-Token": valid_csrf},
        json={"full_name": "Verified Owner"},
    )
    assert r_ok.status_code == 200
    assert r_ok.json()["full_name"] == "Verified Owner"


def test_addresses_and_bag_merge_rules(client: TestClient, db_session):
    prod = db_session.query(Product).filter(Product.is_active == True).first()
    guest_session = f"guest_{uuid.uuid4().hex}"

    # Reject quantity > 20
    r_over = client.post(
        "/api/v1/cart/items",
        headers={"X-Cart-Session": guest_session},
        json={"product_id": str(prod.id), "quantity": 21},
    )
    assert r_over.status_code == 422

    # Add valid quantity = 3 to guest cart
    r_guest_add = client.post(
        "/api/v1/cart/items",
        headers={"X-Cart-Session": guest_session},
        json={"product_id": str(prod.id), "quantity": 3},
    )
    assert r_guest_add.status_code == 200
    assert r_guest_add.json()["subtotal_paise"] == prod.price_paise * 3

    # Register user and merge guest cart
    r_reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Carlos Dsouza",
            "email": "carlos.merge@example.com",
            "password": "CarlosPassword123!",
        },
    )
    assert r_reg.status_code == 201
    csrf = r_reg.cookies.get("gtl_csrf_token")
    headers = {"X-CSRF-Token": csrf}

    r_merge = client.post(
        "/api/v1/cart/merge",
        headers=headers,
        json={"guest_session_token": guest_session, "items": [{"product_id": str(prod.id), "quantity": 3}]},
    )
    assert r_merge.status_code == 200
    merged_items = r_merge.json()["items"]
    assert len(merged_items) == 1
    assert merged_items[0]["qty"] == 3

    # Address CRUD: reject invalid pincode, accept valid Goa pincode, single default
    r_bad_pin = client.post(
        "/api/v1/me/addresses",
        headers=headers,
        json={
            "recipient_name": "Carlos",
            "phone": "9876543210",
            "line1": "18th June Road",
            "city": "Panaji",
            "state": "Goa",
            "pincode": "00123",
        },
    )
    assert r_bad_pin.status_code == 422

    r_addr1 = client.post(
        "/api/v1/me/addresses",
        headers=headers,
        json={
            "recipient_name": "Carlos",
            "phone": "9876543210",
            "line1": "Rue de Ourem, Fontainhas",
            "city": "Panaji",
            "state": "Goa",
            "pincode": "403001",
            "is_default": True,
        },
    )
    assert r_addr1.status_code == 201
    addr1_id = r_addr1.json()["id"]
    assert r_addr1.json()["isDefault"] is True

    r_addr2 = client.post(
        "/api/v1/me/addresses",
        headers=headers,
        json={
            "recipient_name": "Carlos Office",
            "phone": "9876543210",
            "line1": "Margao Market",
            "city": "Margao",
            "state": "Goa",
            "pincode": "403601",
            "is_default": True,
        },
    )
    assert r_addr2.status_code == 201
    addr2_id = r_addr2.json()["id"]

    r_list = client.get("/api/v1/me/addresses")
    addrs = r_list.json()["items"]
    defaults = [a["id"] for a in addrs if a["isDefault"]]
    assert defaults == [addr2_id]

    r_del = client.delete(f"/api/v1/me/addresses/{addr2_id}", headers=headers)
    assert r_del.status_code == 200
    remaining = r_del.json()["items"]
    assert len(remaining) == 1
    assert remaining[0]["id"] == addr1_id
    assert remaining[0]["isDefault"] is True


# =====================================================================
# STEP B3 TESTS: SHIPPING 8000/12000, RESERVATIONS, WEBHOOKS, STATUS ORDER, CANCELLATION, ENQUIRIES
# =====================================================================


def test_shipping_8000_goa_and_12000_pan_india_no_free_threshold_no_minimum(client: TestClient, db_session):
    prod = db_session.query(Product).filter(Product.is_active == True).first()

    # 1. Goa Express (403xxx) = Rs 80 (8000 paise), no free-shipping threshold, no minimum order
    r_goa = client.get("/api/v1/shipping/estimate?pincode=403001")
    assert r_goa.status_code == 200
    goa = r_goa.json()
    assert goa["shipping_paise"] == 8000
    assert goa["zone_name"] == "Goa Express"
    assert goa["is_goa"] is True
    assert goa["free_shipping_threshold_paise"] is None
    assert goa["minimum_order_paise"] == 0

    # Even with a high-value cart, Goa shipping stays 8000 paise (no free shipping above threshold)
    r_quote_goa = client.post(
        "/api/v1/checkout/quote",
        json={"pincode": "403001", "items": [{"product_id": str(prod.id), "quantity": 10}]},
    )
    assert r_quote_goa.status_code == 200
    assert r_quote_goa.json()["shipping_paise"] == 8000

    # 2. Pan-India Standard = Rs 120 (12000 paise), no free-shipping threshold, no minimum order
    r_roi = client.get("/api/v1/shipping/estimate?pincode=400001")
    assert r_roi.status_code == 200
    roi = r_roi.json()
    assert roi["shipping_paise"] == 12000
    assert roi["zone_name"] == "Pan-India Standard"
    assert roi["is_goa"] is False
    assert roi["free_shipping_threshold_paise"] is None
    assert roi["minimum_order_paise"] == 0

    r_quote_roi = client.post(
        "/api/v1/checkout/quote",
        json={"pincode": "400001", "items": [{"product_id": str(prod.id), "quantity": 10}]},
    )
    assert r_quote_roi.status_code == 200
    assert r_quote_roi.json()["shipping_paise"] == 12000


def test_order_creation_idempotency_webhook_signature_and_duplicate_event(client: TestClient, db_session):
    r_reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Huttesh Shopper",
            "email": "huttesh.orders@example.com",
            "password": "OrderPassword123!",
        },
    )
    assert r_reg.status_code == 201
    csrf = r_reg.cookies.get("gtl_csrf_token")
    headers = {"X-CSRF-Token": csrf}

    prod = db_session.query(Product).filter(Product.is_active == True).first()
    inv_before = db_session.query(Inventory).filter(Inventory.product_id == prod.id).first()
    initial_on_hand = inv_before.on_hand
    initial_reserved = inv_before.reserved

    idem_key = f"idem_test_{uuid.uuid4().hex[:16]}"
    order_body = {
        "address": {
            "label": "Home",
            "recipient_name": "Huttesh",
            "phone": "9876543210",
            "line1": "Fontainhas Mala",
            "city": "Panaji",
            "state": "Goa",
            "pincode": "403001",
        },
        "save_address": True,
        "items": [{"product_id": str(prod.id), "quantity": 2}],
    }

    # 1. Create order -> pending_payment, stock reserved
    r_ord1 = client.post(
        "/api/v1/orders",
        headers={**headers, "Idempotency-Key": idem_key},
        json=order_body,
    )
    assert r_ord1.status_code == 201
    ord_data = r_ord1.json()
    order_number = ord_data["order_number"]
    assert ord_data["status"] == "pending_payment"
    assert ord_data["shipping_paise"] == 8000
    assert ord_data["total_paise"] == prod.price_paise * 2 + 8000

    db_session.expire_all()
    inv_mid = db_session.query(Inventory).filter(Inventory.product_id == prod.id).first()
    assert inv_mid.reserved == initial_reserved + 2
    assert inv_mid.on_hand == initial_on_hand

    # 2. Idempotent replay with same key & body -> same order, no double reservation
    r_ord_repeat = client.post(
        "/api/v1/orders",
        headers={**headers, "Idempotency-Key": idem_key},
        json=order_body,
    )
    assert r_ord_repeat.status_code == 201
    assert r_ord_repeat.json()["order_number"] == order_number

    # 3. Webhook signature verification & duplicate event deduplication
    rzp_order_id = ord_data["payment"]["razorpay_order_id"]
    rzp_payment_id = "pay_test_99887766"
    webhook_payload = {
        "event_id": "evt_unique_1001",
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": rzp_payment_id,
                    "order_id": rzp_order_id,
                }
            }
        },
    }
    raw_bytes = json.dumps(webhook_payload).encode("utf-8")

    # Invalid webhook signature -> 400
    r_wh_bad = client.post(
        "/api/v1/webhooks/razorpay",
        content=raw_bytes,
        headers={"X-Razorpay-Signature": "bad_webhook_signature", "Content-Type": "application/json"},
    )
    assert r_wh_bad.status_code == 400

    # Valid webhook signature -> 200 processed, order transitions to paid, stock committed
    wh_sig = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        raw_bytes,
        hashlib.sha256,
    ).hexdigest()

    r_wh1 = client.post(
        "/api/v1/webhooks/razorpay",
        content=raw_bytes,
        headers={"X-Razorpay-Signature": wh_sig, "Content-Type": "application/json"},
    )
    assert r_wh1.status_code == 200
    assert r_wh1.json()["status"] == "processed"

    db_session.expire_all()
    inv_after = db_session.query(Inventory).filter(Inventory.product_id == prod.id).first()
    assert inv_after.on_hand == initial_on_hand - 2
    assert inv_after.reserved == initial_reserved

    # Duplicate webhook event -> 200 duplicate_ignored, no double stock deduction
    r_wh2 = client.post(
        "/api/v1/webhooks/razorpay",
        content=raw_bytes,
        headers={"X-Razorpay-Signature": wh_sig, "Content-Type": "application/json"},
    )
    assert r_wh2.status_code == 200
    assert r_wh2.json()["status"] == "duplicate_ignored"
    db_session.expire_all()
    assert db_session.query(Inventory).filter(Inventory.product_id == prod.id).first().on_hand == initial_on_hand - 2


def test_order_status_forward_only_and_status_emails(client: TestClient, db_session):
    r_reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Status Tester",
            "email": "status.tester@example.com",
            "password": "StatusPassword123!",
        },
    )
    csrf = r_reg.cookies.get("gtl_csrf_token")
    headers = {"X-CSRF-Token": csrf}
    prod = db_session.query(Product).filter(Product.is_active == True).first()

    r_ord = client.post(
        "/api/v1/orders",
        headers={**headers, "Idempotency-Key": f"idem_stat_{uuid.uuid4().hex[:12]}"},
        json={
            "address": {
                "recipient_name": "Status Tester",
                "phone": "9876543210",
                "line1": "Fontainhas",
                "city": "Panaji",
                "state": "Goa",
                "pincode": "403001",
            },
            "items": [{"product_id": str(prod.id), "quantity": 1}],
        },
    )
    order_number = r_ord.json()["order_number"]
    order = db_session.query(Order).filter(Order.order_number == order_number).first()
    assert order.status == OrderStatus.pending_payment

    # Cannot skip from pending_payment directly to packed or shipped
    with pytest.raises(ProblemException) as exc_skip:
        transition_order_status(db_session, order, OrderStatus.packed)
    assert exc_skip.value.status_code == 409

    # Forward transitions: pending_payment -> paid -> packed -> shipped -> delivered
    DEV_EMAIL_OUTBOX.clear()
    transition_order_status(db_session, order, OrderStatus.paid, note="Payment verified")
    assert order.status == OrderStatus.paid

    # Cannot go backward from paid to pending_payment or cancelled
    with pytest.raises(ProblemException):
        transition_order_status(db_session, order, OrderStatus.pending_payment)
    with pytest.raises(ProblemException):
        transition_order_status(db_session, order, OrderStatus.cancelled)

    transition_order_status(db_session, order, OrderStatus.packed, note="Packed in Fontainhas")
    assert order.status == OrderStatus.packed
    assert any("packed" in e["subject"].lower() for e in DEV_EMAIL_OUTBOX)

    # Cannot go backward from packed to paid
    with pytest.raises(ProblemException):
        transition_order_status(db_session, order, OrderStatus.paid)

    transition_order_status(db_session, order, OrderStatus.shipped, note="Dispatched via courier")
    assert order.status == OrderStatus.shipped
    assert any("shipped" in e["subject"].lower() for e in DEV_EMAIL_OUTBOX)

    transition_order_status(db_session, order, OrderStatus.delivered, note="Delivered to customer")
    assert order.status == OrderStatus.delivered
    assert any("delivered" in e["subject"].lower() for e in DEV_EMAIL_OUTBOX)

    # Terminal state: delivered cannot transition anywhere
    with pytest.raises(ProblemException):
        transition_order_status(db_session, order, OrderStatus.shipped)
    with pytest.raises(ProblemException):
        transition_order_status(db_session, order, OrderStatus.cancelled)

    db_session.commit()


def test_cancellation_rules_and_stock_reservation_release(client: TestClient, db_session):
    r_reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Cancel Tester",
            "email": "cancel.tester@example.com",
            "password": "CancelPassword123!",
        },
    )
    csrf = r_reg.cookies.get("gtl_csrf_token")
    headers = {"X-CSRF-Token": csrf}

    prod = db_session.query(Product).filter(Product.is_active == True).first()
    inv0 = db_session.query(Inventory).filter(Inventory.product_id == prod.id).first()
    base_reserved = inv0.reserved

    # 1. Create order A -> customer cancels while pending_payment -> allowed, releases reserved stock
    r_ord_a = client.post(
        "/api/v1/orders",
        headers={**headers, "Idempotency-Key": f"idem_a_{uuid.uuid4().hex[:12]}"},
        json={
            "address": {
                "recipient_name": "Cancel Tester",
                "phone": "9876543210",
                "line1": "Panjim Church Square",
                "city": "Panaji",
                "state": "Goa",
                "pincode": "403001",
            },
            "items": [{"product_id": str(prod.id), "quantity": 2}],
        },
    )
    assert r_ord_a.status_code == 201
    ord_a_num = r_ord_a.json()["order_number"]
    assert r_ord_a.json()["can_cancel"] is True

    r_cancel = client.post(f"/api/v1/orders/{ord_a_num}/cancel", headers=headers)
    assert r_cancel.status_code == 200
    assert r_cancel.json()["status"] == "cancelled"
    db_session.expire_all()
    assert db_session.query(Inventory).filter(Inventory.product_id == prod.id).first().reserved == base_reserved

    # 2. Create order B, pay it -> customer cancel rejected with 409 "Please contact the store to cancel."
    r_ord_b = client.post(
        "/api/v1/orders",
        headers={**headers, "Idempotency-Key": f"idem_b_{uuid.uuid4().hex[:12]}"},
        json={
            "address": {
                "recipient_name": "Cancel Tester",
                "phone": "9876543210",
                "line1": "Panjim Church Square",
                "city": "Panaji",
                "state": "Goa",
                "pincode": "403001",
            },
            "items": [{"product_id": str(prod.id), "quantity": 1}],
        },
    )
    ord_b_data = r_ord_b.json()
    ord_b_num = ord_b_data["order_number"]
    rzp_order_id = ord_b_data["payment"]["razorpay_order_id"]
    rzp_pay_id = "pay_test_cancel_check"
    sig = compute_razorpay_payment_signature(rzp_order_id, rzp_pay_id)

    r_pay_b = client.post(
        "/api/v1/payments/razorpay/verify",
        headers=headers,
        json={
            "order_number": ord_b_num,
            "razorpay_order_id": rzp_order_id,
            "razorpay_payment_id": rzp_pay_id,
            "razorpay_signature": sig,
        },
    )
    assert r_pay_b.status_code == 200
    assert r_pay_b.json()["can_cancel"] is False
    assert r_pay_b.json()["cancel_notice"] == "Please contact the store to cancel."

    r_cancel_paid = client.post(f"/api/v1/orders/{ord_b_num}/cancel", headers=headers)
    assert r_cancel_paid.status_code == 409
    assert r_cancel_paid.json()["detail"] == "Please contact the store to cancel."

    # 3. Create order C, expire 30m reservation window -> background job releases stock and cancels order
    r_ord_c = client.post(
        "/api/v1/orders",
        headers={**headers, "Idempotency-Key": f"idem_c_{uuid.uuid4().hex[:12]}"},
        json={
            "address": {
                "recipient_name": "Cancel Tester",
                "phone": "9876543210",
                "line1": "Panjim Church Square",
                "city": "Panaji",
                "state": "Goa",
                "pincode": "403001",
            },
            "items": [{"product_id": str(prod.id), "quantity": 3}],
        },
    )
    ord_c_num = r_ord_c.json()["order_number"]
    ord_c = db_session.query(Order).filter(Order.order_number == ord_c_num).first()
    ord_c.reservation_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    released = release_expired_reservations(db_session)
    assert released >= 1
    db_session.expire_all()
    ord_c_after = db_session.query(Order).filter(Order.order_number == ord_c_num).first()
    assert ord_c_after.status == OrderStatus.cancelled
    assert db_session.query(Inventory).filter(Inventory.product_id == prod.id).first().reserved == base_reserved


def test_enquiries_captcha_rate_limit_bulk_and_goa_only_hamper(client: TestClient):
    # 1. Invalid CAPTCHA rejected with 400
    r_bad_cap = client.post(
        "/api/v1/enquiries",
        json={
            "name": "Bot User",
            "email": "bot@example.com",
            "message": "Automated spam message",
            "captcha_token": "INVALID",
        },
    )
    assert r_bad_cap.status_code == 400

    # 2. General contact enquiry succeeds
    r_gen = client.post(
        "/api/v1/enquiries",
        json={
            "name": "Rohan Naik",
            "email": "rohan@example.com",
            "phone": "9876543210",
            "subject": "Store hours",
            "message": "Are you open on Sunday evenings in Fontainhas?",
            "captcha_token": "test-pass",
        },
    )
    assert r_gen.status_code == 201
    assert r_gen.json()["type"] == "general"

    # 3. Bulk / corporate enquiry succeeds
    r_bulk = client.post(
        "/api/v1/enquiries/bulk",
        json={
            "name": "Taj Resort Goa",
            "email": "procurement@tajgoa.example.com",
            "phone": "9876543210",
            "organisation": "IHCL Goa",
            "quantity_estimate": 150,
            "message": "We need 150 Kunbi & spice welcome gifts for a conference.",
            "captcha_token": "test-pass",
        },
    )
    assert r_bulk.status_code == 201
    assert r_bulk.json()["type"] == "bulk_corporate"

    # 4. Goa-only hamper enquiry: missing pincode or non-Goa pincode rejected with 422
    r_hamper_no_pin = client.post(
        "/api/v1/enquiries/hamper",
        json={
            "name": "Priya",
            "email": "priya@example.com",
            "message": "Festive hamper without pincode",
            "captcha_token": "test-pass",
        },
    )
    assert r_hamper_no_pin.status_code == 422

    r_hamper_mumbai = client.post(
        "/api/v1/enquiries/hamper",
        json={
            "name": "Priya",
            "email": "priya@example.com",
            "pincode": "400001",
            "message": "Festive hamper request for Mumbai",
            "captcha_token": "test-pass",
        },
    )
    assert r_hamper_mumbai.status_code == 422
    assert "403xxx" in r_hamper_mumbai.json()["detail"]

    # 5. Goa-only hamper enquiry with valid Goa pincode (403001) succeeds with 201
    r_hamper_goa = client.post(
        "/api/v1/enquiries/hamper",
        json={
            "name": "Priya Goa",
            "email": "priya@example.com",
            "pincode": "403001",
            "budget_paise": 250000,
            "quantity_estimate": 10,
            "message": "Need 10 Goan heritage hampers in Panjim",
            "captcha_token": "test-pass",
        },
    )
    assert r_hamper_goa.status_code == 201
    assert r_hamper_goa.json()["type"] == "custom_hamper"
    assert r_hamper_goa.json()["is_goa_zone"] is True
