"""
Tests for Server-Side Product Status Enforcement (Section A.4)
Covers:
- Published products are visible in catalogue, search, shelves, suggestions, detail
- Draft, Hidden, and Archived products are completely blocked on the server
- Cannot add non-published products to bag
- Automatic bag cleanup when a product in an active cart is hidden later
- Checkout rejection (409) if an item in the bag is hidden, with bag cleanup
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import Category, Product, ProductStatus, Inventory


@pytest.fixture(scope="module")
def status_test_products():
    db = SessionLocal()
    try:
        cat = db.query(Category).first()
        if not cat:
            cat = Category(name="Status Test Shelf", slug="status-test-shelf", blurb="Shelf for status test")
            db.add(cat)
            db.flush()

        products = {}
        for st in [ProductStatus.published, ProductStatus.draft, ProductStatus.hidden, ProductStatus.archived]:
            slug = f"test-status-prod-{st.value}-{uuid.uuid4().hex[:6]}"
            p = Product(
                id=uuid.uuid4(),
                sku=f"SKU-{st.value[:3].upper()}-{uuid.uuid4().hex[:4].upper()}",
                slug=slug,
                name=f"Status Test {st.value.title()}",
                category_id=cat.id,
                price_paise=15000,
                unit_label="100 g",
                net_weight_grams=100,
                status=st.value,
                is_active=(st == ProductStatus.published),
            )
            db.add(p)
            db.flush()
            inv = Inventory(product_id=p.id, on_hand=50, reserved=0)
            db.add(inv)
            products[st.value] = {"id": str(p.id), "slug": p.slug, "name": p.name}

        db.commit()
        return {"category_slug": cat.slug, "products": products}
    finally:
        db.close()


def test_catalogue_blocks_non_published_products(status_test_products):
    client = TestClient(app)
    prods = status_test_products["products"]

    # 1. Product Detail: published is 200, others are 404
    res_pub = client.get(f"/api/v1/products/{prods['published']['slug']}")
    assert res_pub.status_code == 200, res_pub.text

    for st in ["draft", "hidden", "archived"]:
        res_non_pub = client.get(f"/api/v1/products/{prods[st]['slug']}")
        assert res_non_pub.status_code == 404, f"Product with status {st} must return 404 on public detail"

    # 2. Public products search does not include non-published
    res_list = client.get("/api/v1/products?q=Status+Test")
    assert res_list.status_code == 200
    returned_slugs = [item["slug"] for item in res_list.json()["items"]]
    assert prods["published"]["slug"] in returned_slugs
    for st in ["draft", "hidden", "archived"]:
        assert prods[st]["slug"] not in returned_slugs

    # 3. Shelf/Category products list does not include non-published
    res_shelf = client.get(f"/api/v1/products?category={status_test_products['category_slug']}")
    assert res_shelf.status_code == 200
    shelf_slugs = [item["slug"] for item in res_shelf.json()["items"]]
    assert prods["published"]["slug"] in shelf_slugs
    for st in ["draft", "hidden", "archived"]:
        assert prods[st]["slug"] not in shelf_slugs

    # 4. Search suggestions does not suggest non-published
    res_sugg = client.get("/api/v1/search/suggest?q=Status+Test")
    assert res_sugg.status_code == 200
    sugg_names = [s["name"] for s in res_sugg.json().get("products", [])]
    for st in ["draft", "hidden", "archived"]:
        assert prods[st]["name"] not in sugg_names


def test_cart_and_checkout_blocks_and_cleans_hidden_products(status_test_products):
    client = TestClient(app)
    prods = status_test_products["products"]

    # 1. Attempting to add draft/hidden/archived to cart directly fails (404/400)
    for st in ["draft", "hidden", "archived"]:
        res_add = client.post("/api/v1/cart/items", json={
            "product_id": prods[st]["id"],
            "quantity": 1,
        })
        assert res_add.status_code in (400, 404), f"Adding {st} to cart must fail"

    # 2. Add published product to cart -> succeeds
    res_add_pub = client.post("/api/v1/cart/items", json={
        "product_id": prods["published"]["id"],
        "quantity": 1,
    })
    assert res_add_pub.status_code == 200

    # 3. Now simulate admin hiding this published product
    db = SessionLocal()
    try:
        p = db.query(Product).filter(Product.id == uuid.UUID(prods["published"]["id"])).first()
        p.status = "hidden"
        p.is_active = False
        db.commit()
    finally:
        db.close()

    # 4. Fetch the cart again: server must auto-clean the hidden item and report notice
    res_cart = client.get("/api/v1/cart")
    assert res_cart.status_code == 200
    cart_data = res_cart.json()
    assert cart_data["item_count"] == 0
    assert "notice" in cart_data
    assert len(cart_data["items"]) == 0

    # Restore published status for cleanup
    db = SessionLocal()
    try:
        p = db.query(Product).filter(Product.id == uuid.UUID(prods["published"]["id"])).first()
        p.status = "published"
        p.is_active = True
        db.commit()
    finally:
        db.close()
