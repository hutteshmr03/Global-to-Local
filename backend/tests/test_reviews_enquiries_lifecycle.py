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

# Step 2: Admin list includes BOTH the new review AND all existing canonical reviews
    admin_list = client.get("/api/v1/admin/reviews", headers=auth_headers)
    assert admin_list.status_code == 200
    items = admin_list.json().get("items", [])
    assert any(r["id"] == review_id for r in items), "New review not found in admin list"
    assert any(r.get("name") == "Gifty Abraham" or r.get("author_name") == "Gifty Abraham" for r in items), "Gifty Abraham missing from admin reviews"
    assert any(r.get("name") == "Stedwick Fernandes" or r.get("author_name") == "Stedwick Fernandes" for r in items), "Stedwick Fernandes missing from admin reviews"
    assert any(r.get("name") == "Swapna Pujari" or r.get("author_name") == "Swapna Pujari" for r in items), "Swapna Pujari missing from admin reviews"
    assert len(items) >= 4, f"Expected at least 4 reviews in admin list, got {len(items)}"

    # Step 3: Public reviews endpoint includes BOTH the new review AND all existing canonical reviews
    public_res = client.get("/api/v1/reviews?source=Visitors%27%20Book")
    assert public_res.status_code == 200
    public_items = public_res.json().get("items", [])
    assert any(r["id"] == review_id for r in public_items), "New review not found in public list"
    assert any(r.get("name") == "Gifty Abraham" or r.get("author_name") == "Gifty Abraham" or r.get("author") == "Gifty Abraham" for r in public_items), "Gifty Abraham missing from public reviews"
    assert any(r.get("name") == "Stedwick Fernandes" or r.get("author_name") == "Stedwick Fernandes" or r.get("author") == "Stedwick Fernandes" for r in public_items), "Stedwick Fernandes missing from public reviews"
    assert any(r.get("name") == "Swapna Pujari" or r.get("author_name") == "Swapna Pujari" or r.get("author") == "Swapna Pujari" for r in public_items), "Swapna Pujari missing from public reviews"
    assert len(public_items) >= 4, f"Expected at least 4 reviews in public list, got {len(public_items)}"

    # Step 4: Admin deletes the newly created test review
    del_res = client.delete(f"/api/v1/admin/reviews/{review_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Step 5: Public reviews endpoint confirms deletion of new review while canonical reviews remain intact
    public_res_after = client.get("/api/v1/reviews?source=Visitors%27%20Book")
    assert public_res_after.status_code == 200
    public_items_after = public_res_after.json().get("items", [])
    assert not any(r["id"] == review_id for r in public_items_after), "Deleted review still present"
    assert any(r.get("name") == "Gifty Abraham" or r.get("author_name") == "Gifty Abraham" or r.get("author") == "Gifty Abraham" for r in public_items_after), "Canonical review missing after delete"
    assert len(public_items_after) >= 3, f"Expected at least 3 canonical reviews, got {len(public_items_after)}"
