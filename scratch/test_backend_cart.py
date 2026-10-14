import os
import sys
import traceback
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/gtl_db"
os.environ["APP_ENV"] = "development"

from backend.main import app

client = TestClient(app, raise_server_exceptions=True)

print("--- Test 1: GET /api/v1/health ---")
res = client.get("/api/v1/health")
print("Health:", res.status_code, res.json())

print("--- Test 2: GET /api/v1/health/ready ---")
res = client.get("/api/v1/health/ready")
print("Ready:", res.status_code, res.json())

print("--- Test 3: Guest Add 6 Wine Biscuits ---")
res = client.post("/api/v1/cart/items", json={"product_id": "wine-biscuits-200-grams", "quantity": 6})
print("Cart add 6:", res.status_code)
cart = res.json()
print("Items count:", len(cart.get("items", [])), "Total count:", cart.get("item_count"))

print("--- Test 4: Update quantity to 8 ---")
res = client.patch(f"/api/v1/cart/items/wine-biscuits-200-grams", json={"quantity": 8})
print("Cart patch 8:", res.status_code)

print("--- Test 5: Delete item ---")
res = client.delete(f"/api/v1/cart/items/wine-biscuits-200-grams")
print("Cart delete:", res.status_code)

print("--- Test 6: Clear cart ---")
res = client.delete("/api/v1/cart")
print("Cart clear:", res.status_code)

print("ALL BACKEND CART TESTS COMPLETED!")
