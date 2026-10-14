"""Seed dummy orders and customers for Global to Local admin office."""
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import uuid

# Add root directory to python path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.database import SessionLocal
from backend.core.security import hash_password
from backend.models import (
    User,
    UserRole,
    Address,
    Order,
    OrderItem,
    OrderStatus,
    OrderStatusEvent,
    Payment,
    PaymentStatus,
    Shipment,
    ShipmentStatus,
    Product,
)

def seed_customers_and_orders():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        default_pwd_hash = hash_password(os.environ.get("DEMO_CUSTOMER_PASSWORD", "DemoCustomer123!"))

        # -------------------------------------------------------------
        # 1. Ensure / Create 2 more customers
        # -------------------------------------------------------------
        cust1 = db.query(User).filter(User.email == "maria.fernandes@example.com").first()
        if not cust1:
            cust1 = User(
                email="maria.fernandes@example.com",
                phone="9822123456",
                full_name="Maria Fernandes",
                password_hash=default_pwd_hash,
                role=UserRole.customer,
                is_active=True,
                email_verified_at=now - timedelta(days=15),
                created_at=now - timedelta(days=15),
            )
            db.add(cust1)
            db.flush()

            # Saved address for Maria
            addr1 = Address(
                user_id=cust1.id,
                label="Home",
                recipient_name="Maria Fernandes",
                line1="House No. 42, Fontainhas Latin Quarter",
                line2="Near St. Sebastian Chapel",
                city="Panaji",
                state="Goa",
                pincode="403001",
                phone="9822123456",
                is_default=True,
            )
            db.add(addr1)
            print("Created customer: Maria Fernandes (maria.fernandes@example.com)")
        else:
            print("Customer already exists: Maria Fernandes")

        cust2 = db.query(User).filter(User.email == "rahul.naik@example.com").first()
        if not cust2:
            cust2 = User(
                email="rahul.naik@example.com",
                phone="9890987654",
                full_name="Rahul Naik",
                password_hash=default_pwd_hash,
                role=UserRole.customer,
                is_active=True,
                email_verified_at=now - timedelta(days=10),
                created_at=now - timedelta(days=10),
            )
            db.add(cust2)
            db.flush()

            # Saved address for Rahul
            addr2 = Address(
                user_id=cust2.id,
                label="Home",
                recipient_name="Rahul Naik",
                line1="Flat 302, Sea Breeze Enclave",
                line2="Miramar Beach Road",
                city="Panaji",
                state="Goa",
                pincode="403002",
                phone="9890987654",
                is_default=True,
            )
            db.add(addr2)
            print("Created customer: Rahul Naik (rahul.naik@example.com)")
        else:
            print("Customer already exists: Rahul Naik")

        shopper = db.query(User).filter(User.email == "shopper@globaltolocal.in").first()

        # -------------------------------------------------------------
        # 2. Fetch active catalog products for order line items
        # -------------------------------------------------------------
        prods = {p.slug: p for p in db.query(Product).filter(Product.is_active == True).all()}
        def get_prod(slug, fallback_name="Goan Heritage Product"):
            if slug in prods:
                return prods[slug]
            first = next(iter(prods.values()), None)
            return first

        p_bebinca = get_prod("bebinca-500-grams")
        p_wine_biscuits = get_prod("wine-biscuits-200-grams")
        p_musk = get_prod("agarbatti--musk-80-grams") or get_prod("agarbatti-musk-80-grams")
        p_balchao = get_prod("balchao-masala-paste-250-grams")
        p_aataa = get_prod("aataa-rings")
        p_ambot = get_prod("ambot-tik-masala-paste-250-grams")
        p_banana = get_prod("banana-chips-in-coconut-oil-500-grams")
        p_vinegar = get_prod("cashew-vinegar-700-ml")
        p_mug = get_prod("goan-themed-blue-mug")
        p_pepper = get_prod("black-pepper-50-grams")

        # Helper to create OrderItem
        def make_item(prod, qty):
            img_url = prod.images[0].url if prod.images else "/images/catalog/goan-themed-blue-mug.jpg"
            line_tot = prod.price_paise * qty
            return OrderItem(
                product_id=prod.id,
                sku_snapshot=prod.sku,
                name_snapshot=prod.name,
                slug_snapshot=prod.slug,
                unit_label_snapshot=prod.unit_label,
                image_url_snapshot=img_url,
                unit_price_paise=prod.price_paise,
                tax_rate_bps=500,
                quantity=qty,
                line_total_paise=line_tot,
            )

        # -------------------------------------------------------------
        # 3. Create 6 Orders (one per status)
        # -------------------------------------------------------------
        orders_data = [
            {
                "order_number": "GTL-20261010-0101",
                "user": shopper,
                "status": OrderStatus.delivered,
                "items": [(p_bebinca, 2), (p_wine_biscuits, 1)],
                "placed_at": now - timedelta(days=4),
                "shipping_paise": 8000,
                "address": {
                    "recipient_name": "Goan Heritage Shopper",
                    "address_line1": "Heritage Villa 12, Fontainhas",
                    "address_line2": "31st January Road",
                    "city": "Panaji",
                    "state": "Goa",
                    "pincode": "403001",
                    "phone": "9876543210",
                },
                "tracking": {
                    "carrier": "Blue Dart",
                    "awb": "BD789123456IN",
                    "url": "https://www.bluedart.com/tracking?track=BD789123456IN",
                    "delivered": True,
                },
            },
            {
                "order_number": "GTL-20261012-0102",
                "user": cust1, # Maria
                "status": OrderStatus.shipped,
                "items": [(p_musk, 3), (p_balchao, 1)],
                "placed_at": now - timedelta(days=2),
                "shipping_paise": 8000,
                "address": {
                    "recipient_name": "Maria Fernandes",
                    "address_line1": "House No. 42, Fontainhas Latin Quarter",
                    "address_line2": "Near St. Sebastian Chapel",
                    "city": "Panaji",
                    "state": "Goa",
                    "pincode": "403001",
                    "phone": "9822123456",
                },
                "tracking": {
                    "carrier": "Delhivery",
                    "awb": "DLV998877665",
                    "url": "https://www.delhivery.com/track/package/DLV998877665",
                    "delivered": False,
                },
            },
            {
                "order_number": "GTL-20261013-0103",
                "user": cust2, # Rahul
                "status": OrderStatus.packed,
                "items": [(p_aataa, 4), (p_ambot, 2)],
                "placed_at": now - timedelta(days=1),
                "shipping_paise": 12000, # Pan-India
                "address": {
                    "recipient_name": "Rahul Naik",
                    "address_line1": "104, Sea Green Apartments, Bandra West",
                    "address_line2": "Hill Road",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "pincode": "400050",
                    "phone": "9890987654",
                },
            },
            {
                "order_number": "GTL-20261014-0104",
                "user": shopper,
                "status": OrderStatus.paid,
                "items": [(p_banana, 2), (p_vinegar, 1)],
                "placed_at": now - timedelta(hours=4),
                "shipping_paise": 8000,
                "address": {
                    "recipient_name": "Goan Heritage Shopper",
                    "address_line1": "Heritage Villa 12, Fontainhas",
                    "address_line2": "31st January Road",
                    "city": "Panaji",
                    "state": "Goa",
                    "pincode": "403001",
                    "phone": "9876543210",
                },
            },
            {
                "order_number": "GTL-20261014-0105",
                "user": cust1, # Maria
                "status": OrderStatus.pending_payment,
                "items": [(p_mug, 2)],
                "placed_at": now - timedelta(hours=1),
                "shipping_paise": 8000,
                "address": {
                    "recipient_name": "Maria Fernandes",
                    "address_line1": "House No. 42, Fontainhas Latin Quarter",
                    "address_line2": "Near St. Sebastian Chapel",
                    "city": "Panaji",
                    "state": "Goa",
                    "pincode": "403001",
                    "phone": "9822123456",
                },
            },
            {
                "order_number": "GTL-20261011-0106",
                "user": cust2, # Rahul
                "status": OrderStatus.cancelled,
                "cancel_reason": "Customer cancelled before payment",
                "items": [(p_pepper, 1)],
                "placed_at": now - timedelta(days=3),
                "shipping_paise": 8000,
                "address": {
                    "recipient_name": "Rahul Naik",
                    "address_line1": "Flat 302, Sea Breeze Enclave",
                    "address_line2": "Miramar Beach Road",
                    "city": "Panaji",
                    "state": "Goa",
                    "pincode": "403002",
                    "phone": "9890987654",
                },
            },
        ]

        for od in orders_data:
            existing = db.query(Order).filter(Order.order_number == od["order_number"]).first()
            if existing:
                print(f"Order {od['order_number']} already exists, skipping.")
                continue

            order_items = [make_item(prod, qty) for prod, qty in od["items"]]
            subtotal = sum(item.line_total_paise for item in order_items)
            total = subtotal + od["shipping_paise"]

            ord_obj = Order(
                order_number=od["order_number"],
                user_id=od["user"].id if od["user"] else None,
                guest_email=od["user"].email if od["user"] else "guest@example.com",
                guest_phone=od["user"].phone if od["user"] else "9876543210",
                status=od["status"],
                currency="INR",
                subtotal_paise=subtotal,
                discount_paise=0,
                shipping_paise=od["shipping_paise"],
                tax_paise=0,
                total_paise=total,
                shipping_address_snapshot=od["address"],
                billing_address_snapshot=od["address"],
                shipping_method="Standard Delivery",
                placed_at=od["placed_at"],
                paid_at=od["placed_at"] if od["status"] != OrderStatus.pending_payment and od["status"] != OrderStatus.cancelled else None,
                cancelled_at=od["placed_at"] + timedelta(hours=1) if od["status"] == OrderStatus.cancelled else None,
                cancel_reason=od.get("cancel_reason"),
                created_at=od["placed_at"],
            )
            ord_obj.items = order_items

            # Status events
            ev_placed = OrderStatusEvent(
                from_status=None,
                to_status=OrderStatus.pending_payment,
                note="Order placed by customer",
                created_at=od["placed_at"],
            )
            ord_obj.status_events.append(ev_placed)

            if od["status"] in (OrderStatus.paid, OrderStatus.packed, OrderStatus.shipped, OrderStatus.delivered):
                ev_paid = OrderStatusEvent(
                    from_status=OrderStatus.pending_payment,
                    to_status=OrderStatus.paid,
                    note="Payment verified via Razorpay",
                    created_at=od["placed_at"] + timedelta(minutes=2),
                )
                ord_obj.status_events.append(ev_paid)

                # Payment record
                pay = Payment(
                    provider="razorpay",
                    provider_order_id=f"order_rzp_{od['order_number'].lower().replace('-', '_')}",
                    provider_payment_id=f"pay_rzp_{uuid.uuid4().hex[:12]}",
                    method="upi",
                    amount_paise=total,
                    currency="INR",
                    status=PaymentStatus.captured,
                    signature_verified=True,
                    captured_at=od["placed_at"] + timedelta(minutes=2),
                    created_at=od["placed_at"] + timedelta(minutes=2),
                )
                ord_obj.payments.append(pay)

            if od["status"] in (OrderStatus.packed, OrderStatus.shipped, OrderStatus.delivered):
                ev_packed = OrderStatusEvent(
                    from_status=OrderStatus.paid,
                    to_status=OrderStatus.packed,
                    note="Items packed and labelled at Panaji dispatch hub",
                    created_at=od["placed_at"] + timedelta(hours=3),
                )
                ord_obj.status_events.append(ev_packed)

            if od["status"] in (OrderStatus.shipped, OrderStatus.delivered):
                trk = od.get("tracking", {})
                ev_shipped = OrderStatusEvent(
                    from_status=OrderStatus.packed,
                    to_status=OrderStatus.shipped,
                    note=f"Dispatched via {trk.get('carrier', 'Blue Dart')} (AWB: {trk.get('awb', '')})",
                    created_at=od["placed_at"] + timedelta(hours=6),
                )
                ord_obj.status_events.append(ev_shipped)

                shipment = Shipment(
                    carrier=trk.get("carrier", "Blue Dart"),
                    carrier_shipment_id=f"shp_{uuid.uuid4().hex[:10]}",
                    awb_or_tracking_number=trk.get("awb", "BD123456789"),
                    tracking_url=trk.get("url"),
                    status=ShipmentStatus.delivered if trk.get("delivered") else ShipmentStatus.in_transit,
                    weight_grams=750,
                    dispatched_at=od["placed_at"] + timedelta(hours=6),
                    delivered_at=od["placed_at"] + timedelta(days=2) if trk.get("delivered") else None,
                )
                ord_obj.shipments.append(shipment)

            if od["status"] == OrderStatus.delivered:
                ev_delivered = OrderStatusEvent(
                    from_status=OrderStatus.shipped,
                    to_status=OrderStatus.delivered,
                    note="Successfully delivered to recipient",
                    created_at=od["placed_at"] + timedelta(days=2),
                )
                ord_obj.status_events.append(ev_delivered)

            if od["status"] == OrderStatus.cancelled:
                ev_cancel = OrderStatusEvent(
                    from_status=OrderStatus.pending_payment,
                    to_status=OrderStatus.cancelled,
                    note=od.get("cancel_reason", "Cancelled"),
                    created_at=od["placed_at"] + timedelta(hours=1),
                )
                ord_obj.status_events.append(ev_cancel)

            db.add(ord_obj)
            print(f"Created order: {od['order_number']} ({od['status'].value}) - Total: Rs. {total/100:.2f}")

        db.commit()
        print("All dummy orders and customers seeded successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_customers_and_orders()
