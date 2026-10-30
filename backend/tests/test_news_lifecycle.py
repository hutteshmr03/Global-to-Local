import os
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.core.security import create_access_token, hash_password
from backend.database import SessionLocal
from backend.main import app
from backend.models import User, UserRole, PressMention, PressKind


@pytest.fixture(scope="module")
def admin_client_and_token():
    db = SessionLocal()
    try:
        # Get or create admin user
        admin = db.query(User).filter(User.role == UserRole.admin, User.is_active.is_(True)).first()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                email="admin.news.test@globaltolocal.in",
                phone="9870001122",
                password_hash=hash_password("AdminSecurePass123!"),
                full_name="News Admin",
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


def test_news_full_lifecycle(admin_client_and_token):
    client, token = admin_client_and_token
    auth_headers = {"Authorization": f"Bearer {token}"}

    unique_title = f"Test Goan Heritage Feature {uuid.uuid4().hex[:8]}"
    payload = {
        "publication": "Goa Times Today",
        "title": unique_title,
        "date": "March 2026",
        "url": "https://example.com/goa-times-feature",
    }

    # Step 1: Admin creates a news article
    create_res = client.post("/api/v1/admin/news", json=payload, headers=auth_headers)
    assert create_res.status_code == 201, f"Create failed: {create_res.text}"
    created_data = create_res.json()
    assert "id" in created_data
    created_id = created_data["id"]
    assert created_data["title"] == unique_title
    assert created_data["publication"] == "Goa Times Today"

    # Step 2: Admin list includes the new article
    admin_list_res = client.get("/api/v1/admin/news", headers=auth_headers)
    assert admin_list_res.status_code == 200
    admin_items = admin_list_res.json().get("items", [])
    found_in_admin = any(item["id"] == created_id for item in admin_items)
    assert found_in_admin, "Created article not found in admin news list"

    # Step 3: Public press endpoint returns the article
    public_res = client.get("/api/v1/press")
    assert public_res.status_code == 200
    public_data = public_res.json()
    public_articles = public_data.get("articles", [])
    found_in_public = any(art["id"] == created_id for art in public_articles)
    assert found_in_public, "Created article not found on public press endpoint"

    # Step 4: Admin deletes the article
    delete_res = client.delete(f"/api/v1/admin/news/{created_id}", headers=auth_headers)
    assert delete_res.status_code == 200, f"Delete failed: {delete_res.text}"

    # Step 5: Public press endpoint no longer returns the deleted article
    public_res_after = client.get("/api/v1/press")
    assert public_res_after.status_code == 200
    public_articles_after = public_res_after.json().get("articles", [])
    still_present = any(art["id"] == created_id for art in public_articles_after)
    assert not still_present, "Deleted article should no longer appear on public press endpoint"
