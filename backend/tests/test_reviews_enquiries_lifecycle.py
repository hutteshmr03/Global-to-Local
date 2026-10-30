import os
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.core.security import create_access_token, hash_password
from backend.database import SessionLocal
from backend.main import app
from backend.models import User, UserRole, StoreReview, Enquiry


@pytest.fixture(scope="module")
def admin_client_and_token():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == UserRole.admin, User.is_active.is_(True)).first()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                email="admin.rev.test@globaltolocal.in",
                phone="9870001133",
                password_hash=hash_password("AdminSecurePass123!"),
                full_name="Rev Admin",
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        token = create_access_token(user_id=str(admin.id), role="admin", email=admin.email)
        client = TestClient(app)
        return client, token
    finally:
        db.close()


def test_contact_enquiry_submission(admin_client_and_token):
    client, _ = admin_client_and_token
    payload = {
        "type": "general",
        "name": "Maxxy Huttesh",
        "email": "maxxyhuttesh2003@gmail.com",
        "message": "Testing contact form submission from pytest.",
        "captcha_token": "1x00000000000000000000AA",
    }
    res = client.post("/api/v1/enquiries", json=payload)
    assert res.status_code == 201, f"Enquiry failed: {res.text}"
    data = res.json()
    assert "id" in data
    assert data["type"] == "general"


def test_reviews_full_lifecycle(admin_client_and_token):
    client, token = admin_client_and_token
    auth_headers = {"Authorization": f"Bearer {token}"}

    unique_author = f"Test Guest {uuid.uuid4().hex[:6]}"
    unique_quote = f"Wonderful artisanal products from Fontainhas {uuid.uuid4().hex[:6]}"
    payload = {
        "name": unique_author,
        "stars": 5,
        "description": unique_quote,
        "location": "Panaji, Goa",
    }

    # Step 1: Admin creates review
    create_res = client.post("/api/v1/admin/reviews", json=payload, headers=auth_headers)
    assert create_res.status_code == 201, f"Review create failed: {create_res.text}"
    created = create_res.json()
    assert "id" in created
    review_id = created["id"]
    assert created["author_name"] == unique_author

    # Step 2: Admin list includes review
    admin_list = client.get("/api/v1/admin/reviews", headers=auth_headers)
    assert admin_list.status_code == 200
    items = admin_list.json().get("items", [])
    assert any(r["id"] == review_id for r in items), "Review not found in admin list"

    # Step 3: Public reviews endpoint includes review
    public_res = client.get("/api/v1/reviews?source=Visitors%27%20Book")
    assert public_res.status_code == 200
    public_items = public_res.json().get("items", [])
    assert any(r["id"] == review_id for r in public_items), "Review not found in public list"

    # Step 4: Admin deletes review
    del_res = client.delete(f"/api/v1/admin/reviews/{review_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Step 5: Public reviews endpoint confirms deletion
    public_res_after = client.get("/api/v1/reviews?source=Visitors%27%20Book")
    assert public_res_after.status_code == 200
    public_items_after = public_res_after.json().get("items", [])
    assert not any(r["id"] == review_id for r in public_items_after), "Deleted review still present"
