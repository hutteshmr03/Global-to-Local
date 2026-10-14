import os
import pytest
from fastapi.testclient import TestClient

TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/gtl_test_db",
)
os.environ["DATABASE_URL"] = TEST_DB_URL
os.environ["APP_ENV"] = "test"
os.environ["ENV"] = "test"

from backend.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_add_wine_biscuits_6_items_regression():
    """
    REGRESSION TEST:
    Verify adding 6 units of Wine Biscuits returns 200 OK (never 500)
    and produces an RFC 7807 formatted cart response with the item present.
    """
    payload = {"product_id": "wine-biscuits-200-grams", "quantity": 6}
    res = client.post("/api/v1/cart/items", json=payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"

    data = res.json()
    assert "items" in data
    assert data["item_count"] >= 6
    items = [it for it in data["items"] if it.get("slug") == "wine-biscuits-200-grams"]
    assert len(items) == 1
    assert items[0]["quantity"] == 6
    assert items[0]["unit_price_paise"] > 0
    assert items[0]["line_total_paise"] == items[0]["unit_price_paise"] * 6


def test_cart_quantity_limits_and_errors():
    """
    Verify cart respects 1-20 quantity limits and returns RFC 7807 problem detail on error.
    """
    # 1. Reject adding > 20 items in a single request
    res = client.post("/api/v1/cart/items", json={"product_id": "wine-biscuits-200-grams", "quantity": 25})
    assert res.status_code == 422
    err = res.json()
    assert err.get("type") == "https://globaltolocal.in/problems/max-line-quantity"
    assert "trace_id" in err

    # 2. Update quantity within range 1-20
    res = client.patch("/api/v1/cart/items/wine-biscuits-200-grams", json={"quantity": 10})
    assert res.status_code == 200
    assert res.json()["item_count"] == 10

    # 3. Update quantity > 20 rejected
    res = client.patch("/api/v1/cart/items/wine-biscuits-200-grams", json={"quantity": 21})
    assert res.status_code == 422
    assert "trace_id" in res.json()

    # 4. Remove item from cart
    res = client.delete("/api/v1/cart/items/wine-biscuits-200-grams")
    assert res.status_code == 200
    items = [it for it in res.json()["items"] if it.get("slug") == "wine-biscuits-200-grams"]
    assert len(items) == 0


def test_system_health_and_ready_endpoints():
    """
    Verify /api/v1/health and /api/v1/ready return 200 OK with checks status.
    """
    res_health = client.get("/api/v1/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "ok"

    res_ready = client.get("/api/v1/ready")
    assert res_ready.status_code == 200
    ready_data = res_ready.json()
    assert ready_data["status"] == "ready"
    assert ready_data["checks"]["postgres"] == "ok"
    assert ready_data["checks"]["redis"] == "ok"
