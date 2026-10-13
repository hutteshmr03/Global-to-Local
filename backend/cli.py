import os
import sys
import uuid
from datetime import datetime, timezone
from sqlalchemy import text
from backend.config import settings
from backend.core.security import hash_password
from backend.database import SessionLocal
from backend.models import User, UserRole


def create_admin() -> None:
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "").strip()

    if not admin_email or not admin_password:
        print("ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.", file=sys.stderr)
        print("Example usage:", file=sys.stderr)
        print("  ADMIN_EMAIL=admin@globaltolocal.in ADMIN_PASSWORD=GoaHeritageAdmin123! python -m backend.cli create-admin", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        # Check if an active admin already exists (rule: exactly one active admin allowed)
        existing_admin = (
            db.query(User)
            .filter(User.role == UserRole.admin, User.is_active.is_(True), User.deleted_at.is_(None))
            .first()
        )
        if existing_admin:
            print(f"ERROR: An active admin already exists ({existing_admin.email}). Cannot create another admin.", file=sys.stderr)
            sys.exit(1)

        # Check if user with this email already exists
        existing_user = (
            db.query(User)
            .filter(User.email == admin_email, User.deleted_at.is_(None))
            .first()
        )
        if existing_user:
            print(f"ERROR: A user with email '{admin_email}' already exists. Cannot create admin.", file=sys.stderr)
            sys.exit(1)

        # Create single admin
        now = datetime.now(timezone.utc)
        admin_user = User(
            id=uuid.uuid4(),
            email=admin_email,
            password_hash=hash_password(admin_password),
            full_name="Global to Local Admin",
            role=UserRole.admin,
            is_active=True,
            email_verified_at=now,
        )
        db.add(admin_user)
        db.commit()
        print(f"SUCCESS: Admin account created successfully for '{admin_email}'.")
    finally:
        db.close()


def reset_admin() -> None:
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "").strip()

    if not admin_email or not admin_password:
        print("ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required for reset-admin.", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        admin_user = (
            db.query(User)
            .filter(User.role == UserRole.admin, User.deleted_at.is_(None))
            .first()
        )
        if not admin_user:
            print("ERROR: No admin account found to reset.", file=sys.stderr)
            sys.exit(1)

        admin_user.email = admin_email
        admin_user.password_hash = hash_password(admin_password)
        admin_user.is_active = True
        admin_user.updated_at = datetime.now(timezone.utc)
        db.commit()
        print(f"SUCCESS: Admin account for '{admin_email}' has been reset and reactivated.")
    finally:
        db.close()


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m backend.cli [create-admin | reset-admin]", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1].lower()
    if command == "create-admin":
        create_admin()
    elif command == "reset-admin":
        reset_admin()
    else:
        print(f"Unknown command '{command}'. Available: create-admin, reset-admin", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
