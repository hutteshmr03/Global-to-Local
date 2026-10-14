"""
Optional Demo Data Seeder for Global to Local.
Creates sample customers, sample enquiries, and sample orders strictly for local interactive testing.
Run with: python scripts/seed_demo_data.py (or python -m backend.cli seed-demo)
"""
import os
import sys
import uuid
from datetime import datetime, timezone
from backend.database import SessionLocal
from backend.core.security import hash_password
from backend.models import (
    Address,
    Category,
    Enquiry,
    EnquiryStatus,
    EnquiryType,
    Order,
    OrderItem,
    OrderStatus,
    Product,
    User,
    UserRole,
)


def seed_demo_data():
    db = SessionLocal()
    try:
        print("[*] Seeding optional demo data...")

        # 1. Demo Customer
        customer_email = os.environ.get("DEMO_CUSTOMER_EMAIL", "shopper.demo@globaltolocal.in")
        customer_pw = os.environ.get("DEMO_CUSTOMER_PASSWORD", "DemoCustomer123!")
        
        customer = db.query(User).filter(User.email == customer_email).first()
        if not customer:
            customer = User(
                id=uuid.uuid4(),
                email=customer_email,
                phone="9876543210",
                password_hash=hash_password(customer_pw),
                full_name="Goan Heritage Shopper",
                role=UserRole.customer,
                is_active=True,
            )
            db.add(customer)
            db.flush()
            print(f"[+] Created demo customer: {customer_email}")

            addr = Address(
                id=uuid.uuid4(),
                user_id=customer.id,
                recipient_name="Goan Heritage Shopper",
                phone="9876543210",
                line1="House No. 42, Rua 31 de Janeiro, Fontainhas",
                city="Panaji",
                state="Goa",
                pincode="403001",
                is_default=True,
            )
            db.add(addr)

        # 2. Demo Enquiries
        existing_enq = db.query(Enquiry).filter(Enquiry.email == "event.planner@example.com").first()
        if not existing_enq:
            demo_enquiry = Enquiry(
                id=uuid.uuid4(),
                type=EnquiryType.custom_hampers,
                status=EnquiryStatus.new,
                name="Sita Deshmukh",
                email="event.planner@example.com",
                phone="9822114455",
                organisation="Goa Wedding Planners",
                pincode="403001",
                subject="Destination Wedding Hampers - 50 sets",
                message="We are looking for authentic Goan sweet and spice hampers for guests arriving in December.",
                budget_paise=15000000,
                quantity_estimate=50,
            )
            db.add(demo_enquiry)
            print("[+] Created demo enquiry")

        db.commit()
        print("[✓] Optional demo data seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
