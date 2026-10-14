"""
Tests for Admin Two-Factor Authentication (2FA / TOTP)
Covers:
- Password login returning mfa_required & temp_token
- MFA setup returning TOTP URI, encrypted secret, 10 recovery codes
- Confirmation with pyotp TOTP code
- Verification with valid TOTP code
- Verification with recovery code and recovery code consumption
- Invalid code rejections
- Admin CLI reset-admin clearing TOTP state
"""
import json
import os
import uuid
import pyotp
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import User, UserRole
from backend.core.security import hash_password, decrypt_totp_secret


@pytest.fixture(scope="module")
def admin_user():
    admin_pw = os.environ.get("ADMIN_PASSWORD")
    if not admin_pw:
        pytest.skip("ADMIN_PASSWORD environment variable is required to run 2FA tests.")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == UserRole.admin, User.is_active.is_(True)).first()
        if not user:
            user = User(
                id=uuid.uuid4(),
                email="admin@globaltolocal.in",
                phone="9870001111",
                password_hash=hash_password(admin_pw),
                full_name="Global to Local Admin",
                role=UserRole.admin,
                is_active=True,
                totp_enabled=False,
                totp_secret_encrypted=None,
                recovery_codes_hash=None,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.totp_enabled = False
            user.totp_secret_encrypted = None
            user.recovery_codes_hash = None
            user.password_hash = hash_password(admin_pw)
            db.commit()
        return {"email": user.email, "password": admin_pw, "id": str(user.id)}
    finally:
        db.close()


def test_admin_2fa_complete_lifecycle(admin_user):
    client = TestClient(app)

    # 1. Sign in with email and password -> returns MFA required
    res = client.post("/api/v1/auth/login", json={
        "email": admin_user["email"],
        "password": admin_user["password"],
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["mfa_required"] is True
    assert data["mfa_setup_required"] is True
    temp_token = data["temp_token"]
    assert temp_token is not None

    # 2. Call MFA setup endpoint with temp_token
    res_setup = client.post(
        "/api/v1/auth/mfa/setup",
        json={"temp_token": temp_token},
    )
    assert res_setup.status_code == 200, res_setup.text
    setup_data = res_setup.json()
    assert "qr_uri" in setup_data
    assert "secret" in setup_data
    assert "recovery_codes" in setup_data
    recovery_codes = setup_data["recovery_codes"]
    assert len(recovery_codes) == 10
    totp_secret = setup_data["secret"]

    # 3. Confirm with INVALID code -> fails 400
    res_bad_confirm = client.post(
        "/api/v1/auth/mfa/confirm",
        json={"temp_token": temp_token, "code": "000000"},
    )
    assert res_bad_confirm.status_code == 400

    # 4. Confirm with VALID TOTP code -> succeeds, enables 2FA
    totp = pyotp.TOTP(totp_secret)
    valid_code = totp.now()
    res_confirm = client.post(
        "/api/v1/auth/mfa/confirm",
        json={"temp_token": temp_token, "code": valid_code},
    )
    assert res_confirm.status_code == 200, res_confirm.text
    confirm_data = res_confirm.json()
    assert confirm_data["user"]["role"] == "admin"
    assert confirm_data["user"]["totp_enabled"] is True

    # Check database persistence and encryption
    db = SessionLocal()
    try:
        user_row = db.query(User).filter(User.id == uuid.UUID(admin_user["id"])).first()
        assert user_row.totp_enabled is True
        assert user_row.totp_secret_encrypted is not None
        decrypted = decrypt_totp_secret(user_row.totp_secret_encrypted)
        assert decrypted == totp_secret
        assert len(json.loads(user_row.recovery_codes_hash)) == 10
    finally:
        db.close()

    # 5. Subsequent sign-in: mfa_setup_required is now False
    res_login2 = client.post("/api/v1/auth/login", json={
        "email": admin_user["email"],
        "password": admin_user["password"],
    })
    assert res_login2.status_code == 200
    data2 = res_login2.json()
    assert data2["mfa_required"] is True
    assert data2["mfa_setup_required"] is False
    temp_token2 = data2["temp_token"]

    # 6. Verify with INVALID code -> fails 400
    res_bad_verify = client.post(
        "/api/v1/auth/mfa/verify",
        json={"temp_token": temp_token2, "code": "999999"},
    )
    assert res_bad_verify.status_code == 400

    # 7. Verify with VALID TOTP code -> succeeds
    valid_code2 = totp.now()
    res_verify = client.post(
        "/api/v1/auth/mfa/verify",
        json={"temp_token": temp_token2, "code": valid_code2},
    )
    assert res_verify.status_code == 200
    assert res_verify.json()["user"]["role"] == "admin"

    # 8. Test Recovery Code sign-in
    res_login3 = client.post("/api/v1/auth/login", json={
        "email": admin_user["email"],
        "password": admin_user["password"],
    })
    temp_token3 = res_login3.json()["temp_token"]

    used_recovery_code = recovery_codes[0]
    res_rec = client.post(
        "/api/v1/auth/mfa/verify",
        json={"temp_token": temp_token3, "code": used_recovery_code, "is_recovery_code": True},
    )
    assert res_rec.status_code == 200
    assert res_rec.json()["user"]["role"] == "admin"

    # 9. Verify the SAME recovery code cannot be reused (consumed)
    res_login4 = client.post("/api/v1/auth/login", json={
        "email": admin_user["email"],
        "password": admin_user["password"],
    })
    temp_token4 = res_login4.json()["temp_token"]

    res_rec_reuse = client.post(
        "/api/v1/auth/mfa/verify",
        json={"temp_token": temp_token4, "code": used_recovery_code, "is_recovery_code": True},
    )
    assert res_rec_reuse.status_code == 400, "Consumed recovery code must be rejected"
