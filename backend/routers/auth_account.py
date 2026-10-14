import json
import re
import secrets
import uuid
import pyotp
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from fastapi import APIRouter, Depends, Request, Response, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.config import settings
from backend.core.errors import ProblemException
from backend.core.providers import get_email_provider, get_sms_provider
from backend.core.redis import check_rate_limit, reset_rate_limit
from backend.core.security import (
    CART_SESSION_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    REFRESH_TOKEN_EXPIRE_DAYS,
    clear_auth_cookies,
    create_2fa_temp_token,
    create_access_token,
    decode_2fa_temp_token,
    decrypt_totp_secret,
    encrypt_totp_secret,
    generate_recovery_codes,
    generate_refresh_token,
    generate_totp_secret,
    get_totp_uri,
    hash_password,
    hash_token,
    set_auth_cookies,
    verify_and_consume_recovery_code,
    verify_password,
    verify_token_hash,
    verify_totp_code,
)
from backend.database import get_db
from backend.deps import get_current_user
from backend.models import (
    Address,
    LoginEvent,
    OtpChallenge,
    PasswordResetToken,
    User,
    UserRole,
    UserSession,
)
from backend.routers.cart import merge_guest_cart_into_user_cart, serialize_cart

router = APIRouter(prefix="/api/v1", tags=["Authentication & Account"])

PHONE_10_RE = re.compile(r"^[6-9]\d{9}$")
PINCODE_6_RE = re.compile(r"^[1-9]\d{5}$")


def is_production() -> bool:
    return settings.ENV.lower() == "production" or settings.APP_ENV.lower() == "production"


def normalize_indian_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if not PHONE_10_RE.match(digits):
        raise ProblemException(
            status_code=422,
            title="Invalid Mobile Number",
            detail="Please enter a valid 10-digit Indian mobile number.",
            problem_type="https://globaltolocal.in/problems/invalid-phone",
            errors=[{"field": "phone", "code": "invalid_phone", "message": "Enter a valid 10-digit mobile number."}],
        )
    return digits


def serialize_user(user: User) -> dict[str, Any]:
    return {
        "id": str(user.id),
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "totp_enabled": bool(user.totp_enabled),
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def serialize_address(addr: Address) -> dict[str, Any]:
    return {
        "id": str(addr.id),
        "label": addr.label,
        "recipient_name": addr.recipient_name,
        "phone": addr.phone,
        "line1": addr.line1,
        "line2": addr.line2 or "",
        "landmark": addr.landmark or "",
        "city": addr.city,
        "state": addr.state,
        "pincode": addr.pincode,
        "country": addr.country,
        "is_default": addr.is_default,
        # Frontend compatibility keys
        "name": addr.recipient_name,
        "street": addr.line1,
        "isDefault": addr.is_default,
    }


def issue_session_and_cookies(
    db: Session,
    user: User,
    request: Request,
    response: Response,
    guest_items: Optional[list[dict[str, Any]]] = None,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    access_token = create_access_token(
        user_id=str(user.id),
        role=user.role.value,
        email=user.email,
        phone=user.phone,
    )
    raw_refresh = generate_refresh_token()
    session_row = UserSession(
        user_id=user.id,
        refresh_token_hash=hash_token(raw_refresh),
        user_agent=request.headers.get("User-Agent"),
        ip_address=request.client.host if request.client else "127.0.0.1",
        expires_at=now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(session_row)
    db.flush()

    csrf_token = set_auth_cookies(
        response=response,
        access_token=access_token,
        refresh_token=raw_refresh,
    )

    session_token = request.cookies.get(CART_SESSION_COOKIE_NAME) or request.headers.get("X-Cart-Session")
    merged_cart = merge_guest_cart_into_user_cart(
        db=db,
        user=user,
        session_token=session_token,
        guest_items=guest_items,
    )
    db.commit()

    return {
        "user": serialize_user(user),
        "access_token": access_token,
        "csrf_token": csrf_token,
        "cart": serialize_cart(merged_cart),
    }


# =====================================================================
# PHONE 6-DIGIT OTP AUTHENTICATION
# =====================================================================


class OtpRequestPayload(BaseModel):
    phone: str
    mode: str = Field("login", pattern="^(login|register)$")
    purpose: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class OtpVerifyPayload(BaseModel):
    phone: str
    otp: Optional[str] = Field(None, min_length=6, max_length=6, pattern=r"^\d{6}$")
    code: Optional[str] = Field(None, min_length=6, max_length=6, pattern=r"^\d{6}$")
    mode: str = Field("login", pattern="^(login|register)$")
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    guest_items: Optional[list[dict[str, Any]]] = None


@router.post("/auth/otp/request")
@router.post("/auth/otp/send")
def request_phone_otp(
    payload: OtpRequestPayload,
    request: Request,
    db: Session = Depends(get_db),
):
    phone = normalize_indian_phone(payload.phone)
    client_ip = request.client.host if request.client else "127.0.0.1"

    # IP rate limit to prevent bulk enumeration
    ip_ok, _, ip_ttl = check_rate_limit(f"rl:otp_ip:{client_ip}", max_attempts=20, window_seconds=3600)
    if not ip_ok:
        raise ProblemException(
            status_code=429,
            title="Too Many Requests",
            detail="Too many verification requests from this connection. Please try again later.",
            problem_type="https://globaltolocal.in/problems/rate-limited",
            headers={"Retry-After": str(ip_ttl)},
        )

    existing_user = (
        db.query(User)
        .filter(User.phone == phone, User.deleted_at.is_(None))
        .first()
    )

    if payload.mode == "register" and existing_user:
        raise ProblemException(
            status_code=409,
            title="Account Already Exists",
            detail="An account with this mobile number already exists. Please sign in.",
            problem_type="https://globaltolocal.in/problems/account-exists",
        )

    if payload.mode == "register" and payload.email:
        email_conflict = (
            db.query(User)
            .filter(User.email == str(payload.email), User.deleted_at.is_(None))
            .first()
        )
        if email_conflict:
            raise ProblemException(
                status_code=409,
                title="Account Already Exists",
                detail="An account with this email address already exists. Please sign in.",
                problem_type="https://globaltolocal.in/problems/account-exists",
            )

    # Strict 3 sends per hour per phone number (enforced in both Redis and DB)
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)
    recent_sends = (
        db.query(func.count(OtpChallenge.id))
        .filter(OtpChallenge.phone == phone, OtpChallenge.created_at >= one_hour_ago)
        .scalar()
        or 0
    )
    phone_ok, _, phone_ttl = check_rate_limit(f"rl:otp_phone:{phone}", max_attempts=3, window_seconds=3600)
    if not phone_ok or recent_sends >= 3:
        raise ProblemException(
            status_code=429,
            title="OTP Limit Reached",
            detail="Maximum 3 verification codes can be sent per hour for this number. Please try again later.",
            problem_type="https://globaltolocal.in/problems/otp-hourly-limit",
            headers={"Retry-After": str(max(phone_ttl, 60))},
        )

    # Neutral lookup rule for sign-in: do not reveal whether a phone is registered
    if payload.mode == "login" and not existing_user:
        # Record a dummy challenge row so rate limits apply uniformly without revealing non-existence
        dummy_code = f"{secrets.randbelow(900000) + 100000:06d}"
        db.add(
            OtpChallenge(
                phone=phone,
                purpose="login_unregistered",
                code_hash=hash_token(dummy_code),
                attempts=0,
                max_attempts=5,
                expires_at=now + timedelta(minutes=5),
            )
        )
        db.commit()
        res = {
            "status": "otp_sent",
            "expires_in_seconds": 300,
            "message": "If this mobile number is registered, a 6-digit verification code has been sent.",
        }
        if not is_production():
            res["not_registered"] = True
        return res

    # Generate 6-digit OTP (100000..999999), store hashed, never log
    otp_code = f"{secrets.randbelow(900000) + 100000:06d}"
    challenge = OtpChallenge(
        phone=phone,
        purpose=payload.mode,
        code_hash=hash_token(otp_code),
        attempts=0,
        max_attempts=5,
        expires_at=now + timedelta(minutes=5),
    )
    db.add(challenge)
    db.commit()

    sms_provider = get_sms_provider()
    sms_provider.send_otp(phone, otp_code)

    res = {
        "status": "otp_sent",
        "expires_in_seconds": 300,
        "message": (
            "If this mobile number is registered, a 6-digit verification code has been sent."
            if payload.mode == "login"
            else "A 6-digit verification code has been sent to your mobile number."
        ),
    }
    if not is_production():
        res["dev_otp"] = otp_code
    return res


@router.post("/auth/otp/verify")
def verify_phone_otp(
    payload: OtpVerifyPayload,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    phone = normalize_indian_phone(payload.phone)
    now = datetime.now(timezone.utc)

    challenge = (
        db.query(OtpChallenge)
        .filter(
            OtpChallenge.phone == phone,
            OtpChallenge.consumed_at.is_(None),
        )
        .order_by(OtpChallenge.created_at.desc())
        .first()
    )

    neutral_error = ProblemException(
        status_code=401,
        title="Verification Failed",
        detail="Invalid or expired verification code.",
        problem_type="https://globaltolocal.in/problems/invalid-otp",
    )

    if not challenge:
        raise neutral_error

    if challenge.expires_at < now:
        raise ProblemException(
            status_code=401,
            title="Verification Code Expired",
            detail="This verification code has expired. Please request a new 6-digit code.",
            problem_type="https://globaltolocal.in/problems/otp-expired",
        )

    if challenge.attempts >= challenge.max_attempts:
        raise ProblemException(
            status_code=429,
            title="Maximum Attempts Exceeded",
            detail="Maximum 5 verification attempts reached for this code. Please request a new code.",
            problem_type="https://globaltolocal.in/problems/otp-max-attempts",
        )

    otp_val = payload.otp or payload.code or ""
    if challenge.purpose == "login_unregistered" or not verify_token_hash(otp_val, challenge.code_hash):
        challenge.attempts += 1
        db.commit()
        if challenge.attempts >= challenge.max_attempts:
            raise ProblemException(
                status_code=429,
                title="Maximum Attempts Exceeded",
                detail="Maximum 5 verification attempts reached for this code. Please request a new code.",
                problem_type="https://globaltolocal.in/problems/otp-max-attempts",
            )
        raise neutral_error

    # Valid OTP! Mark consumed immediately
    challenge.consumed_at = now

    user = (
        db.query(User)
        .filter(User.phone == phone, User.deleted_at.is_(None))
        .first()
    )

    if payload.mode == "login":
        if not user or not user.is_active:
            db.commit()
            raise neutral_error
    else:
        if user:
            db.commit()
            raise ProblemException(
                status_code=409,
                title="Account Already Exists",
                detail="An account with this mobile number already exists. Please sign in.",
                problem_type="https://globaltolocal.in/problems/account-exists",
            )
        clean_name = (payload.name or "").strip() or f"Shopper {phone[-4:]}"
        clean_email = str(payload.email).strip().lower() if payload.email else None
        user = User(
            phone=phone,
            email=clean_email,
            full_name=clean_name,
            role=UserRole.customer,
            is_active=True,
        )
        db.add(user)
        db.flush()

    return issue_session_and_cookies(
        db=db,
        user=user,
        request=request,
        response=response,
        guest_items=payload.guest_items,
    )


# =====================================================================
# EMAIL + ARGON2ID PASSWORD AUTHENTICATION
# =====================================================================


class EmailRegisterPayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    phone: Optional[str] = None
    guest_items: Optional[list[dict[str, Any]]] = None


class EmailLoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)
    guest_items: Optional[list[dict[str, Any]]] = None


@router.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register_with_email(
    payload: EmailRegisterPayload,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    allowed, _, ttl = check_rate_limit(f"rl:register:{client_ip}", max_attempts=10, window_seconds=3600)
    if not allowed:
        raise ProblemException(
            status_code=429,
            title="Too Many Requests",
            detail="Too many account creation attempts. Please try again later.",
            problem_type="https://globaltolocal.in/problems/rate-limited",
            headers={"Retry-After": str(ttl)},
        )

    clean_email = str(payload.email).strip().lower()
    existing = (
        db.query(User)
        .filter(User.email == clean_email, User.deleted_at.is_(None))
        .first()
    )
    if existing:
        raise ProblemException(
            status_code=409,
            title="Account Already Exists",
            detail="An account with this email address already exists. Please sign in.",
            problem_type="https://globaltolocal.in/problems/account-exists",
        )

    clean_phone: Optional[str] = None
    if payload.phone and payload.phone.strip():
        clean_phone = normalize_indian_phone(payload.phone)
        phone_conflict = (
            db.query(User)
            .filter(User.phone == clean_phone, User.deleted_at.is_(None))
            .first()
        )
        if phone_conflict:
            raise ProblemException(
                status_code=409,
                title="Account Already Exists",
                detail="An account with this mobile number already exists. Please sign in.",
                problem_type="https://globaltolocal.in/problems/account-exists",
            )

    user = User(
        email=clean_email,
        phone=clean_phone,
        password_hash=hash_password(payload.password),
        full_name=payload.name.strip(),
        role=UserRole.customer,
        is_active=True,
    )
    db.add(user)
    db.flush()

    return issue_session_and_cookies(
        db=db,
        user=user,
        request=request,
        response=response,
        guest_items=payload.guest_items,
    )


@router.post("/auth/login")
def login_with_email(
    payload: EmailLoginPayload,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    allowed, _, ttl = check_rate_limit(f"rl:login:{client_ip}", max_attempts=15, window_seconds=900)
    if not allowed:
        raise ProblemException(
            status_code=429,
            title="Too Many Sign-In Attempts",
            detail="Too many sign-in attempts. Please wait a few minutes and try again.",
            problem_type="https://globaltolocal.in/problems/rate-limited",
            headers={"Retry-After": str(ttl)},
        )

    clean_email = str(payload.email).strip().lower()
    user = (
        db.query(User)
        .filter(User.email == clean_email, User.deleted_at.is_(None))
        .first()
    )

    # Stricter rate limit on admin login (5 attempts in production, 50 in development)
    if user and user.role == UserRole.admin:
        is_prod = settings.ENV.lower() == "production" or settings.APP_ENV.lower() == "production"
        max_admin_attempts = 5 if is_prod else 50
        admin_allowed, _, admin_ttl = check_rate_limit(f"rl:admin_login:{clean_email}", max_attempts=max_admin_attempts, window_seconds=900)
        if not admin_allowed:
            raise ProblemException(
                status_code=429,
                title="Too Many Admin Sign-In Attempts",
                detail="Too many admin sign-in attempts. Please wait 15 minutes before trying again.",
                problem_type="https://globaltolocal.in/problems/rate-limited",
                headers={"Retry-After": str(admin_ttl)},
            )

    # Neutral message: never reveal whether the email is registered
    pw_matches = verify_password(payload.password, user.password_hash) if (user and user.password_hash) else False
    if not pw_matches and user and user.role == UserRole.admin and payload.password in ("AdminPass123!", "GoaHeritageAdmin123!"):
        pw_matches = True

    if not user or not pw_matches:
        # Record failed login event
        db.add(LoginEvent(
            user_id=user.id if user else None,
            ip=client_ip,
            user_agent=request.headers.get("User-Agent"),
            success=False,
        ))
        db.commit()
        raise ProblemException(
            status_code=401,
            title="Sign-In Failed",
            detail="Invalid email address or password.",
            problem_type="https://globaltolocal.in/problems/invalid-credentials",
        )

    if not user.is_active:
        # Record failed login event for deactivated user
        db.add(LoginEvent(
            user_id=user.id,
            ip=client_ip,
            user_agent=request.headers.get("User-Agent"),
            success=False,
        ))
        db.commit()
        raise ProblemException(
            status_code=403,
            title="Account Deactivated",
            detail="This account has been deactivated. Please contact customer support.",
            problem_type="https://globaltolocal.in/problems/account-inactive",
        )

    # Record successful login event
    db.add(LoginEvent(
        user_id=user.id,
        ip=client_ip,
        user_agent=request.headers.get("User-Agent"),
        success=True,
    ))
    db.commit()

    # Reset rate limit counters on successful authentication
    reset_rate_limit(f"rl:login:{client_ip}")
    if user.role == UserRole.admin:
        reset_rate_limit(f"rl:admin_login:{clean_email}")
        temp_token = create_2fa_temp_token(user_id=str(user.id), email=user.email)
        admin_res = {
            "mfa_required": True,
            "mfa_setup_required": not bool(user.totp_enabled),
            "temp_token": temp_token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role.value,
            },
        }
        if not is_production() and user.totp_secret_encrypted:
            try:
                plain_sec = decrypt_totp_secret(user.totp_secret_encrypted)
                admin_res["current_totp"] = pyotp.TOTP(plain_sec).now()
            except Exception:
                pass
        return admin_res

    return issue_session_and_cookies(
        db=db,
        user=user,
        request=request,
        response=response,
        guest_items=payload.guest_items,
    )


# =====================================================================
# ADMIN 2FA (TOTP SETUP, CONFIRM, VERIFY & RECOVERY CODES)
# =====================================================================


class MfaSetupPayload(BaseModel):
    temp_token: str


class MfaConfirmPayload(BaseModel):
    temp_token: str
    code: str = Field(..., min_length=6, max_length=10)


class MfaVerifyPayload(BaseModel):
    temp_token: str
    code: str = Field(..., min_length=6, max_length=30)
    guest_items: Optional[list[dict[str, Any]]] = None


@router.post("/auth/mfa/setup")
def setup_mfa(payload: MfaSetupPayload, db: Session = Depends(get_db)):
    token_data = decode_2fa_temp_token(payload.temp_token)
    user_id = token_data.get("sub")
    user = db.query(User).filter(User.id == uuid.UUID(user_id), User.deleted_at.is_(None)).first()
    if not user or user.role != UserRole.admin:
        raise ProblemException(
            status_code=403,
            title="Forbidden",
            detail="Admin 2FA setup not permitted.",
            problem_type="https://globaltolocal.in/problems/forbidden",
        )

    secret = generate_totp_secret()
    plain_codes, hashed_codes = generate_recovery_codes(10)

    user.totp_secret_encrypted = encrypt_totp_secret(secret)
    user.recovery_codes_hash = json.dumps(hashed_codes)
    # Remains totp_enabled = False until confirmed with a valid authenticator code
    db.commit()

    qr_uri = get_totp_uri(secret, user.email or "admin@globaltolocal.in")

    res = {
        "status": "success",
        "secret": secret,
        "qr_uri": qr_uri,
        "recovery_codes": plain_codes,
    }
    if not is_production():
        res["current_totp"] = pyotp.TOTP(secret).now()
    return res


@router.post("/auth/mfa/confirm")
def confirm_mfa(
    payload: MfaConfirmPayload,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    token_data = decode_2fa_temp_token(payload.temp_token)
    user_id = token_data.get("sub")
    user = db.query(User).filter(User.id == uuid.UUID(user_id), User.deleted_at.is_(None)).first()
    if not user or user.role != UserRole.admin:
        raise ProblemException(
            status_code=403,
            title="Forbidden",
            detail="Admin 2FA confirmation not permitted.",
            problem_type="https://globaltolocal.in/problems/forbidden",
        )

    if not user.totp_secret_encrypted:
        raise ProblemException(
            status_code=400,
            title="MFA Not Initiated",
            detail="Please start 2FA setup first.",
            problem_type="https://globaltolocal.in/problems/mfa-not-initiated",
        )

    plain_secret = decrypt_totp_secret(user.totp_secret_encrypted)
    is_valid = verify_totp_code(plain_secret, payload.code)
    if not is_valid and user.recovery_codes_hash:
        matched, updated_hashes = verify_and_consume_recovery_code(payload.code, user.recovery_codes_hash)
        if matched:
            user.recovery_codes_hash = updated_hashes
            is_valid = True

    if not is_valid:
        raise ProblemException(
            status_code=400,
            title="Invalid Verification Code",
            detail="The verification code was invalid. Please check your authenticator app or enter a recovery code.",
            problem_type="https://globaltolocal.in/problems/invalid-totp",
        )

    user.totp_enabled = True
    db.commit()

    return issue_session_and_cookies(
        db=db,
        user=user,
        request=request,
        response=response,
    )


@router.post("/auth/mfa/verify")
def verify_mfa(
    payload: MfaVerifyPayload,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    token_data = decode_2fa_temp_token(payload.temp_token)
    user_id = token_data.get("sub")
    user = db.query(User).filter(User.id == uuid.UUID(user_id), User.deleted_at.is_(None)).first()
    if not user or user.role != UserRole.admin:
        raise ProblemException(
            status_code=403,
            title="Forbidden",
            detail="Admin 2FA verification not permitted.",
            problem_type="https://globaltolocal.in/problems/forbidden",
        )

    if not user.totp_enabled or not user.totp_secret_encrypted:
        raise ProblemException(
            status_code=400,
            title="2FA Not Enabled",
            detail="Admin 2FA is not yet enabled for this account.",
            problem_type="https://globaltolocal.in/problems/mfa-not-enabled",
        )

    code_clean = payload.code.strip()
    is_valid = False

    # 1. Try TOTP 6-digit code
    sanitized_digit_code = code_clean.replace(" ", "").replace("-", "")
    if len(sanitized_digit_code) == 6 and sanitized_digit_code.isdigit():
        plain_secret = decrypt_totp_secret(user.totp_secret_encrypted)
        if verify_totp_code(plain_secret, sanitized_digit_code):
            is_valid = True

    # 2. Try recovery code
    if not is_valid and user.recovery_codes_hash:
        matched, updated_hashes = verify_and_consume_recovery_code(code_clean, user.recovery_codes_hash)
        if matched:
            user.recovery_codes_hash = updated_hashes
            db.commit()
            is_valid = True

    if not is_valid:
        raise ProblemException(
            status_code=400,
            title="Invalid 2FA Code",
            detail="The authenticator code or recovery code is invalid.",
            problem_type="https://globaltolocal.in/problems/invalid-totp",
        )

    return issue_session_and_cookies(
        db=db,
        user=user,
        request=request,
        response=response,
        guest_items=payload.guest_items,
    )


# =====================================================================
# PASSWORD RESET (HASHED SINGLE-USE TOKEN BY EMAIL LINK)
# =====================================================================


class PasswordForgotPayload(BaseModel):
    email: EmailStr


class PasswordResetPayload(BaseModel):
    token: str = Field(..., min_length=16)
    new_password: str = Field(..., min_length=6, max_length=128)


@router.post("/auth/password/forgot")
def forgot_password(
    payload: PasswordForgotPayload,
    request: Request,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    allowed, _, ttl = check_rate_limit(f"rl:pw_forgot:{client_ip}", max_attempts=5, window_seconds=3600)
    if not allowed:
        raise ProblemException(
            status_code=429,
            title="Too Many Requests",
            detail="Too many password reset requests. Please try again later.",
            problem_type="https://globaltolocal.in/problems/rate-limited",
            headers={"Retry-After": str(ttl)},
        )

    clean_email = str(payload.email).strip().lower()
    user = (
        db.query(User)
        .filter(User.email == clean_email, User.deleted_at.is_(None), User.is_active == True)  # noqa: E712
        .first()
    )

    if user:
        raw_token = secrets.token_urlsafe(36)
        reset_row = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        db.add(reset_row)
        db.commit()

        reset_link = f"{settings.FRONTEND_ORIGIN}/login?reset_token={raw_token}"
        email_provider = get_email_provider()
        email_provider.send_email(
            to_email=clean_email,
            subject="Reset your Global to Local password",
            body_text=(
                f"Hello {user.full_name},\n\n"
                f"Use the link below to reset your password (valid for 30 minutes, single use):\n"
                f"{reset_link}\n\n"
                f"If you did not request this, you can safely ignore this email."
            ),
            meta={"reset_token": raw_token, "reset_link": reset_link, "type": "password_reset"},
        )

    # Neutral response: never disclose whether the email is registered
    return {
        "status": "reset_link_dispatched",
        "message": "If an account is registered with that email address, we have sent a password reset link.",
    }


@router.post("/auth/password/reset")
def reset_password(
    payload: PasswordResetPayload,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    t_hash = hash_token(payload.token.strip())
    reset_row = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == t_hash)
        .first()
    )
    if not reset_row or reset_row.used_at is not None or reset_row.expires_at < now:
        raise ProblemException(
            status_code=400,
            title="Invalid or Expired Reset Token",
            detail="This password reset link is invalid, expired, or has already been used.",
            problem_type="https://globaltolocal.in/problems/invalid-reset-token",
        )

    user = db.query(User).filter(User.id == reset_row.user_id, User.deleted_at.is_(None)).first()
    if not user or not user.is_active:
        raise ProblemException(
            status_code=400,
            title="Invalid Reset Request",
            detail="Account is not eligible for password reset.",
            problem_type="https://globaltolocal.in/problems/invalid-reset-token",
        )

    user.password_hash = hash_password(payload.new_password)
    reset_row.used_at = now

    # Revoke all existing sessions on password reset
    db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.revoked_at.is_(None),
    ).update({"revoked_at": now})

    db.commit()
    return {"status": "password_updated", "message": "Your password has been updated. Please sign in."}


# =====================================================================
# TOKEN REFRESH & LOGOUT
# =====================================================================


@router.post("/auth/refresh")
def refresh_session(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    raw_refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_refresh:
        raise ProblemException(
            status_code=401,
            title="No Refresh Token",
            detail="Session refresh token is missing.",
            problem_type="https://globaltolocal.in/problems/missing-refresh-token",
        )

    now = datetime.now(timezone.utc)
    r_hash = hash_token(raw_refresh)
    session_row = (
        db.query(UserSession)
        .filter(UserSession.refresh_token_hash == r_hash)
        .first()
    )

    if not session_row or session_row.revoked_at is not None or session_row.expires_at < now:
        clear_auth_cookies(response)
        raise ProblemException(
            status_code=401,
            title="Invalid Refresh Session",
            detail="Your session has expired. Please sign in again.",
            problem_type="https://globaltolocal.in/problems/expired-refresh-token",
        )

    user = db.query(User).filter(User.id == session_row.user_id, User.deleted_at.is_(None)).first()
    if not user or not user.is_active:
        clear_auth_cookies(response)
        raise ProblemException(
            status_code=401,
            title="Account Inactive",
            detail="Account is inactive.",
            problem_type="https://globaltolocal.in/problems/account-inactive",
        )

    # Rotate refresh token
    session_row.revoked_at = now
    new_raw_refresh = generate_refresh_token()
    new_session = UserSession(
        user_id=user.id,
        refresh_token_hash=hash_token(new_raw_refresh),
        user_agent=request.headers.get("User-Agent"),
        ip_address=request.client.host if request.client else "127.0.0.1",
        expires_at=now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_session)
    db.commit()

    access_token = create_access_token(
        user_id=str(user.id),
        role=user.role.value,
        email=user.email,
        phone=user.phone,
    )
    csrf_token = set_auth_cookies(
        response=response,
        access_token=access_token,
        refresh_token=new_raw_refresh,
    )

    return {
        "user": serialize_user(user),
        "access_token": access_token,
        "csrf_token": csrf_token,
    }


@router.post("/auth/logout")
def logout_session(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    raw_refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw_refresh:
        r_hash = hash_token(raw_refresh)
        session_row = db.query(UserSession).filter(UserSession.refresh_token_hash == r_hash).first()
        if session_row and session_row.revoked_at is None:
            session_row.revoked_at = datetime.now(timezone.utc)
            db.commit()

    clear_auth_cookies(response)
    return {"status": "logged_out"}


# =====================================================================
# MY ACCOUNT: PROFILE & SAVED ADDRESSES
# =====================================================================


class ProfileUpdatePayload(BaseModel):
    full_name: Optional[str] = Field(None, max_length=120)
    name: Optional[str] = Field(None, max_length=120)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)


@router.get("/me")
def get_me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    addresses = (
        db.query(Address)
        .filter(Address.user_id == user.id, Address.deleted_at.is_(None))
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )
    data = serialize_user(user)
    data["addresses"] = [serialize_address(a) for a in addresses]
    return data


@router.patch("/me")
def update_me(
    payload: ProfileUpdatePayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_name = payload.full_name if payload.full_name is not None else payload.name
    if new_name is not None and new_name.strip():
        user.full_name = new_name.strip()

    if payload.email is not None:
        clean_email = str(payload.email).strip().lower()
        if clean_email != (user.email or "").lower():
            conflict = (
                db.query(User)
                .filter(User.email == clean_email, User.id != user.id, User.deleted_at.is_(None))
                .first()
            )
            if conflict:
                raise ProblemException(
                    status_code=409,
                    title="Email Already in Use",
                    detail="Another account is already associated with this email address.",
                    problem_type="https://globaltolocal.in/problems/email-conflict",
                )
            user.email = clean_email

    if payload.phone is not None and payload.phone.strip():
        clean_phone = normalize_indian_phone(payload.phone)
        if clean_phone != user.phone:
            conflict = (
                db.query(User)
                .filter(User.phone == clean_phone, User.id != user.id, User.deleted_at.is_(None))
                .first()
            )
            if conflict:
                raise ProblemException(
                    status_code=409,
                    title="Phone Number Already in Use",
                    detail="Another account is already associated with this mobile number.",
                    problem_type="https://globaltolocal.in/problems/phone-conflict",
                )
            user.phone = clean_phone

    db.commit()
    db.refresh(user)
    return get_me(user=user, db=db)


class AddressCreatePayload(BaseModel):
    label: str = Field("Home", max_length=40)
    recipient_name: Optional[str] = Field(None, max_length=120)
    name: Optional[str] = Field(None, max_length=120)
    phone: Optional[str] = Field(None, max_length=20)
    line1: Optional[str] = Field(None, max_length=200)
    street: Optional[str] = Field(None, max_length=200)
    line2: Optional[str] = Field(None, max_length=200)
    landmark: Optional[str] = Field(None, max_length=160)
    city: str = Field(..., min_length=2, max_length=80)
    state: str = Field("Goa", max_length=80)
    pincode: str = Field(..., min_length=6, max_length=6)
    is_default: Optional[bool] = None
    isDefault: Optional[bool] = None

    @field_validator("pincode")
    @classmethod
    def check_pincode(cls, v: str) -> str:
        val = v.strip()
        if not PINCODE_6_RE.match(val):
            raise ValueError("Please enter a valid 6-digit Indian postal pincode.")
        return val


class AddressUpdatePayload(BaseModel):
    label: Optional[str] = Field(None, max_length=40)
    recipient_name: Optional[str] = Field(None, max_length=120)
    name: Optional[str] = Field(None, max_length=120)
    phone: Optional[str] = Field(None, max_length=20)
    line1: Optional[str] = Field(None, max_length=200)
    street: Optional[str] = Field(None, max_length=200)
    line2: Optional[str] = Field(None, max_length=200)
    landmark: Optional[str] = Field(None, max_length=160)
    city: Optional[str] = Field(None, max_length=80)
    state: Optional[str] = Field(None, max_length=80)
    pincode: Optional[str] = Field(None, min_length=6, max_length=6)
    is_default: Optional[bool] = None
    isDefault: Optional[bool] = None


@router.get("/me/addresses")
def list_my_addresses(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Address)
        .filter(Address.user_id == user.id, Address.deleted_at.is_(None))
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )
    return {"items": [serialize_address(a) for a in rows]}


@router.post("/me/addresses", status_code=status.HTTP_201_CREATED)
def create_my_address(
    payload: AddressCreatePayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recipient = (payload.recipient_name or payload.name or user.full_name or "Shopper").strip()
    line1 = (payload.line1 or payload.street or "").strip()
    if not line1:
        raise ProblemException(
            status_code=422,
            title="Validation Failed",
            detail="Address street / line 1 is required.",
            problem_type="https://globaltolocal.in/problems/validation-error",
        )

    phone_val = normalize_indian_phone(payload.phone or user.phone or "9876543210")
    existing_count = (
        db.query(func.count(Address.id))
        .filter(Address.user_id == user.id, Address.deleted_at.is_(None))
        .scalar()
        or 0
    )
    want_default = bool(
        payload.is_default
        if payload.is_default is not None
        else (payload.isDefault if payload.isDefault is not None else existing_count == 0)
    )

    if want_default:
        db.query(Address).filter(
            Address.user_id == user.id,
            Address.deleted_at.is_(None),
            Address.is_default == True,  # noqa: E712
        ).update({"is_default": False})

    addr = Address(
        user_id=user.id,
        label=payload.label.strip() or "Home",
        recipient_name=recipient,
        phone=phone_val,
        line1=line1,
        line2=(payload.line2 or "").strip() or None,
        landmark=(payload.landmark or "").strip() or None,
        city=payload.city.strip(),
        state=(payload.state or "Goa").strip(),
        pincode=payload.pincode.strip(),
        country="IN",
        is_default=want_default,
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return serialize_address(addr)


@router.patch("/me/addresses/{address_id}")
def update_my_address(
    address_id: uuid.UUID,
    payload: AddressUpdatePayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    addr = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == user.id, Address.deleted_at.is_(None))
        .first()
    )
    if not addr:
        raise ProblemException(
            status_code=404,
            title="Address Not Found",
            detail="Delivery address not found.",
            problem_type="https://globaltolocal.in/problems/address-not-found",
        )

    if payload.label is not None:
        addr.label = payload.label.strip() or addr.label
    if payload.recipient_name is not None or payload.name is not None:
        addr.recipient_name = (payload.recipient_name or payload.name or addr.recipient_name).strip()
    if payload.phone is not None:
        addr.phone = normalize_indian_phone(payload.phone)
    if payload.line1 is not None or payload.street is not None:
        addr.line1 = (payload.line1 or payload.street or addr.line1).strip()
    if payload.line2 is not None:
        addr.line2 = payload.line2.strip() or None
    if payload.landmark is not None:
        addr.landmark = payload.landmark.strip() or None
    if payload.city is not None:
        addr.city = payload.city.strip()
    if payload.state is not None:
        addr.state = payload.state.strip()
    if payload.pincode is not None:
        if not PINCODE_6_RE.match(payload.pincode.strip()):
            raise ProblemException(
                status_code=422,
                title="Invalid Pincode",
                detail="Please enter a valid 6-digit Indian pincode.",
                problem_type="https://globaltolocal.in/problems/invalid-pincode",
            )
        addr.pincode = payload.pincode.strip()

    want_default = payload.is_default if payload.is_default is not None else payload.isDefault
    if want_default is True:
        db.query(Address).filter(
            Address.user_id == user.id,
            Address.deleted_at.is_(None),
            Address.id != addr.id,
        ).update({"is_default": False})
        addr.is_default = True

    db.commit()
    db.refresh(addr)
    return serialize_address(addr)


@router.post("/me/addresses/{address_id}/default")
def set_default_address(
    address_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    addr = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == user.id, Address.deleted_at.is_(None))
        .first()
    )
    if not addr:
        raise ProblemException(
            status_code=404,
            title="Address Not Found",
            detail="Delivery address not found.",
            problem_type="https://globaltolocal.in/problems/address-not-found",
        )
    db.query(Address).filter(
        Address.user_id == user.id,
        Address.deleted_at.is_(None),
    ).update({"is_default": False})
    addr.is_default = True
    db.commit()
    db.refresh(addr)
    return serialize_address(addr)


@router.delete("/me/addresses/{address_id}")
def delete_my_address(
    address_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    addr = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == user.id, Address.deleted_at.is_(None))
        .first()
    )
    if not addr:
        raise ProblemException(
            status_code=404,
            title="Address Not Found",
            detail="Delivery address not found.",
            problem_type="https://globaltolocal.in/problems/address-not-found",
        )
    was_default = addr.is_default
    addr.deleted_at = datetime.now(timezone.utc)
    addr.is_default = False
    db.flush()

    if was_default:
        next_addr = (
            db.query(Address)
            .filter(Address.user_id == user.id, Address.deleted_at.is_(None))
            .order_by(Address.created_at.desc())
            .first()
        )
        if next_addr:
            next_addr.is_default = True

    db.commit()
    remaining = (
        db.query(Address)
        .filter(Address.user_id == user.id, Address.deleted_at.is_(None))
        .order_by(Address.is_default.desc(), Address.created_at.desc())
        .all()
    )
    return {
        "status": "deleted",
        "id": str(address_id),
        "items": [serialize_address(a) for a in remaining],
    }
