import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
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

