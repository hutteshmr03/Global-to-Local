import uuid
from fastapi.testclient import TestClient
from backend.core.security import create_access_token
from backend.database import SessionLocal
from backend.main import app
from backend.models import Inventory, Product, User, UserRole
from backend.routers.checkout_orders import (
    compute_delivery_charge_paise,
    get_product_chargeable_weight_grams,
)


def test_weight_unit_parsing_ignores_pieces_and_liquids():
    assert get_product_chargeable_weight_grams("500 g") == 500
    assert get_product_chargeable_weight_grams("250 gm") == 250
    assert get_product_chargeable_weight_grams("200 grams") == 200
    assert get_product_chargeable_weight_grams("1 Kg") == 1000
    assert get_product_chargeable_weight_grams("1.5 kg") == 1500
    # Piece and liquid units must not count toward weight slabs
    assert get_product_chargeable_weight_grams("One piece") == 0
    assert get_product_chargeable_weight_grams("per piece") == 0
    assert get_product_chargeable_weight_grams("1 unit") == 0
    assert get_product_chargeable_weight_grams("500 ml") == 0
    assert get_product_chargeable_weight_grams("100ml") == 0
    assert get_product_chargeable_weight_grams("1 l") == 0
    assert get_product_chargeable_weight_grams("") == 0


def test_delivery_charge_slabs_base_200_and_100_per_kg_over_3kg():
    # Up to and including 3 kg (3000 g) -> Rs 200 (20000 paise)
    assert compute_delivery_charge_paise(0) == 20000
    assert compute_delivery_charge_paise(500) == 20000
    assert compute_delivery_charge_paise(2500) == 20000
    assert compute_delivery_charge_paise(3000) == 20000

    # Above 3 kg -> +Rs 100 per additional kg (or part thereof)
    assert compute_delivery_charge_paise(3001) == 30000
    assert compute_delivery_charge_paise(3500) == 30000
    assert compute_delivery_charge_paise(4000) == 30000
    assert compute_delivery_charge_paise(4001) == 40000
    assert compute_delivery_charge_paise(5000) == 40000


def test_checkout_quote_and_order_weight_rules_piece_vs_weight():
    db = SessionLocal()
    try:
        weight_prod = db.query(Product).filter(Product.unit_label == "500 g", Product.is_active == True).first()  # noqa: E712
        piece_prod = db.query(Product).filter(Product.unit_label == "One piece", Product.is_active == True).first()  # noqa: E712
        assert weight_prod is not None and piece_prod is not None

        for p in (weight_prod, piece_prod):
            inv = db.query(Inventory).filter(Inventory.product_id == p.id).first()
            if inv:
                inv.on_hand = max(inv.on_hand, 100)
                inv.reserved = 0
            else:
                db.add(Inventory(product_id=p.id, on_hand=100, reserved=0))

        user = User(
            id=uuid.uuid4(),
            email=f"wt.{uuid.uuid4().hex[:6]}@example.com",
            phone=f"97{uuid.uuid4().int % 100000000:08d}",
            full_name="Weight Tester",
            role=UserRole.customer,
            is_active=True,
        )
        db.add(user)
        db.commit()

        client = TestClient(app)

        # 1. Piece-only order (15 x One piece) -> stays Rs 200
        q_piece = client.post(
            "/api/v1/checkout/quote",
            json={"pincode": "403001", "items": [{"product_id": str(piece_prod.id), "quantity": 15}]},
        )
        assert q_piece.status_code == 200
        assert q_piece.json()["shipping_paise"] == 20000

        # 2. Mixed: 6 x 500 g (3.0 kg) + 10 x One piece (0 g) -> 3.0 kg exact -> Rs 200
        q_exact_3kg = client.post(
            "/api/v1/checkout/quote",
            json={
                "pincode": "400001",
                "items": [
                    {"product_id": str(weight_prod.id), "quantity": 6},
                    {"product_id": str(piece_prod.id), "quantity": 10},
                ],
            },
        )
        assert q_exact_3kg.status_code == 200
        assert q_exact_3kg.json()["shipping_paise"] == 20000

        # 3. Over 3 kg: 7 x 500 g (3.5 kg) -> Rs 300
        q_over_3kg = client.post(
            "/api/v1/checkout/quote",
            json={"pincode": "403001", "items": [{"product_id": str(weight_prod.id), "quantity": 7}]},
        )
        assert q_over_3kg.status_code == 200
        assert q_over_3kg.json()["shipping_paise"] == 30000

        # 4. Real order placement with 7 x 500 g (3.5 kg) persists shipping_paise=30000
        token = create_access_token(user_id=str(user.id), role="customer", email=user.email)
        ord_res = client.post(
            "/api/v1/orders",
            headers={
                "Authorization": f"Bearer {token}",
                "Idempotency-Key": f"idem_wt_{uuid.uuid4().hex[:12]}",
            },
            json={
                "customer_note": f"Bank Transfer UTR: WT{uuid.uuid4().hex[:10].upper()}",
                "address": {
                    "label": "Home",
                    "recipient_name": "Weight Tester",
                    "phone": user.phone,
                    "line1": "Fontainhas",
                    "city": "Panaji",
                    "state": "Goa",
                    "pincode": "403001",
                },
                "items": [{"product_id": str(weight_prod.id), "quantity": 7}],
            },
        )
        assert ord_res.status_code == 201, ord_res.text
        assert ord_res.json()["shipping_paise"] == 30000
    finally:
        db.close()
