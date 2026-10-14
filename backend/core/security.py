import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from cryptography.fernet import Fernet
import pyotp
from fastapi import Request, Response
from jose import JWTError, jwt
from backend.config import settings
from backend.core.errors import ProblemException

ACCESS_COOKIE_NAME = "gtl_access_token"
REFRESH_COOKIE_NAME = "gtl_refresh_token"
CSRF_COOKIE_NAME = "gtl_csrf_token"
CART_SESSION_COOKIE_NAME = "gtl_cart_session"

ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30

ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return ph.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError, Exception):
        return False


def hash_token(raw_token: str) -> str:
    """Hash a refresh token, reset token, or OTP code with HMAC-SHA256."""
    return hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        raw_token.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_token_hash(raw_token: str, expected_hash: str) -> bool:
    computed = hash_token(raw_token)
    return hmac.compare_digest(computed, expected_hash)


def create_access_token(
    user_id: str,
    role: str,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict[str, Any]] = None,
) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode: dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    if email:
        to_encode["email"] = email
    if phone:
        to_encode["phone"] = phone
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "access":
            raise ProblemException(
                status_code=401,
                title="Unauthorized",
                detail="Invalid token type.",
                problem_type="https://globaltolocal.in/problems/invalid-token",
            )
        return payload
    except JWTError:
        raise ProblemException(
            status_code=401,
            title="Unauthorized",
            detail="Session expired or invalid token.",
            problem_type="https://globaltolocal.in/problems/invalid-token",
        )


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def generate_csrf_token() -> str:
    raw = secrets.token_urlsafe(32)
    sig = hmac.new(
        settings.CSRF_SECRET_KEY.encode("utf-8"),
        raw.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:16]
    return f"{raw}.{sig}"


def verify_csrf_token_signature(token: str) -> bool:
    if not token or "." not in token:
        return False
    raw, sig = token.split(".", 1)
    expected = hmac.new(
        settings.CSRF_SECRET_KEY.encode("utf-8"),
        raw.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:16]
    return hmac.compare_digest(sig, expected)


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    csrf_token: Optional[str] = None,
) -> str:
    csrf = csrf_token or generate_csrf_token()
    cookie_domain = settings.COOKIE_DOMAIN or None
    secure = settings.COOKIE_SECURE

    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=cookie_domain,
    )
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
        domain=cookie_domain,
    )
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf,
        httponly=False,
        secure=secure,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
        domain=cookie_domain,
    )
    return csrf


def clear_auth_cookies(response: Response) -> None:
    cookie_domain = settings.COOKIE_DOMAIN or None
    response.delete_cookie(key=ACCESS_COOKIE_NAME, path="/", domain=cookie_domain)
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/", domain=cookie_domain)
    response.delete_cookie(key=CSRF_COOKIE_NAME, path="/", domain=cookie_domain)


def enforce_csrf_if_cookie_auth(request: Request) -> None:
    """
    Enforce double-submit CSRF check on state-changing requests authenticated via httpOnly cookie.
    """
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    if ACCESS_COOKIE_NAME in request.cookies or REFRESH_COOKIE_NAME in request.cookies:
        cookie_csrf = request.cookies.get(CSRF_COOKIE_NAME, "")
        header_csrf = request.headers.get("X-CSRF-Token", "")
        if (
            not cookie_csrf
            or not header_csrf
            or not hmac.compare_digest(cookie_csrf, header_csrf)
            or not verify_csrf_token_signature(header_csrf)
        ):
            raise ProblemException(
                status_code=403,
                title="CSRF Verification Failed",
                detail="Missing or invalid CSRF token on cookie-authenticated write request.",
                problem_type="https://globaltolocal.in/problems/csrf-failed",
            )


# =====================================================================
# ADMIN 2FA (TOTP, RECOVERY CODES & SECRET ENCRYPTION)
# =====================================================================

def get_fernet_cipher() -> Fernet:
    key_bytes = hashlib.sha256(settings.JWT_SECRET_KEY.encode("utf-8")).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt_totp_secret(secret: str) -> str:
    cipher = get_fernet_cipher()
    return cipher.encrypt(secret.encode("utf-8")).decode("utf-8")


def decrypt_totp_secret(encrypted_secret: str) -> str:
    cipher = get_fernet_cipher()
    return cipher.decrypt(encrypted_secret.encode("utf-8")).decode("utf-8")


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name="Global to Local Admin")


def verify_totp_code(secret: str, code: str) -> bool:
    clean_code = str(code).strip().replace(" ", "").replace("-", "")
    totp = pyotp.TOTP(secret)
    return bool(totp.verify(clean_code, valid_window=1))


def generate_recovery_codes(n: int = 10) -> tuple[list[str], list[str]]:
    """Generate n plain recovery codes and their SHA-256 hashes."""
    plain: list[str] = []
    hashed: list[str] = []
    for _ in range(n):
        part1 = secrets.token_hex(2).upper()
        part2 = secrets.token_hex(2).upper()
        code = f"{part1}-{part2}"
        plain.append(code)
        h = hashlib.sha256(code.encode("utf-8")).hexdigest()
        hashed.append(h)
    return plain, hashed


def verify_and_consume_recovery_code(code: str, stored_json: Optional[str]) -> tuple[bool, Optional[str]]:
    """
    Verifies if a recovery code matches one of the stored hashes.
    If matched, consumes it and returns (True, updated_json_string).
    """
    if not stored_json:
        return False, stored_json
    try:
        hashes = json.loads(stored_json)
        if not isinstance(hashes, list):
            return False, stored_json
    except Exception:
        return False, stored_json

    clean_code = code.strip().upper()
    target_hash = hashlib.sha256(clean_code.encode("utf-8")).hexdigest()

    if target_hash in hashes:
        hashes.remove(target_hash)
        return True, json.dumps(hashes)

    return False, stored_json


def create_2fa_temp_token(user_id: str, email: Optional[str] = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=5)
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "2fa_temp",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")


def decode_2fa_temp_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "2fa_temp":
            raise ProblemException(
                status_code=401,
                title="Unauthorized",
                detail="Invalid 2FA challenge token.",
                problem_type="https://globaltolocal.in/problems/invalid-token",
            )
        return payload
    except JWTError:
        raise ProblemException(
            status_code=401,
            title="Unauthorized",
            detail="2FA session expired. Please log in again.",
            problem_type="https://globaltolocal.in/problems/invalid-token",
        )

