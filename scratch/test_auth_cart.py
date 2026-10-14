import os
import sys
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/gtl_db"
os.environ["APP_ENV"] = "development"

from backend.main import app

client = TestClient(app, raise_server_exceptions=True)

# 1. Add item as guest
res = client.post("/api/v1/cart/items", json={"product_id": "wine-biscuits-200-grams", "quantity": 6})
print("Guest add 6:", res.status_code)
guest_cart = res.json()
print("Guest cart items:", len(guest_cart["items"]))

# 2. Register/login a user
res = client.post("/api/v1/auth/register", json={
    "email": "test_user_cart@example.com",
    "password": "Password123!",
    "full_name": "Test User",
    "phone": "+919876543210"
})
print("Register status:", res.status_code)

if res.status_code != 201:
    res = client.post("/api/v1/auth/login", json={
        "email": "test_user_cart@example.com",
        "password": "Password123!"
    })
    print("Login status:", res.status_code)

cookies = res.cookies
csrf_token = res.json().get("csrf_token")
headers = {"X-CSRF-Token": csrf_token} if csrf_token else {}

# 3. Add item as logged-in user
res = client.post("/api/v1/cart/items", json={"product_id": "wine-biscuits-200-grams", "quantity": 2}, cookies=cookies, headers=headers)
print("Logged in add 2:", res.status_code)
if res.status_code == 200:
    print("Logged-in cart items count:", len(res.json()["items"]), "Total qty:", res.json()["item_count"])
else:
    print("Error:", res.text)
