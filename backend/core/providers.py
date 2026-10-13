import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import httpx
from backend.config import settings
from backend.core.errors import ProblemException


@dataclass
class OutboxMessage:
    recipient: str
    subject: str
    body: str
    meta: dict = field(default_factory=dict)
    sent_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __getitem__(self, key: str):
        if key in ("recipient", "subject", "body", "meta", "sent_at"):
            return getattr(self, key)
        if key == "code" and "otp" in self.meta:
            return self.meta["otp"]
        if key == "token" and "reset_token" in self.meta:
            return self.meta["reset_token"]
        return self.meta.get(key)


# In-memory outboxes used strictly in development/test for automated verification
DEV_SMS_OUTBOX: list[OutboxMessage] = []
DEV_EMAIL_OUTBOX: list[OutboxMessage] = []


def _is_production() -> bool:
    import os
    return (
        settings.APP_ENV.lower() == "production"
        or getattr(settings, "ENV", "").lower() == "production"
        or os.environ.get("ENV", "").lower() == "production"
        or os.environ.get("APP_ENV", "").lower() == "production"
    )


class SMSProvider:
    def send_otp(self, phone: str, otp_code: str) -> None:
        raise NotImplementedError


class ConsoleSMSProvider(SMSProvider):
    def send_otp(self, phone: str, otp_code: str) -> None:
        if _is_production():
            raise RuntimeError("Dev SMS provider is refused when ENV=production.")
        # Rule 4 & Item 5: Never log one-time codes or tokens
        DEV_SMS_OUTBOX.append(
            OutboxMessage(
                recipient=phone,
                subject="OTP Verification",
                body="Your Global to Local verification code has been dispatched. Valid for 5 minutes.",
                meta={"otp": otp_code},
            )
        )


class GatewaySMSProvider(SMSProvider):
    def send_otp(self, phone: str, otp_code: str) -> None:
        if not settings.SMS_API_KEY:
            raise RuntimeError("SMS_API_KEY is not configured for production SMS gateway.")
        return None


def get_sms_provider() -> SMSProvider:
    provider = settings.SMS_PROVIDER.lower()
    if provider in ("console", "dev"):
        if _is_production():
            raise RuntimeError("Dev SMS provider cannot be used when ENV=production.")
        return ConsoleSMSProvider()
    return GatewaySMSProvider()


class EmailProvider:
    def send_email(self, to_email: str, subject: str, body_text: str, meta: Optional[dict] = None) -> None:
        raise NotImplementedError


class ConsoleEmailProvider(EmailProvider):
    def send_email(self, to_email: str, subject: str, body_text: str, meta: Optional[dict] = None) -> None:
        if _is_production():
            raise RuntimeError("Dev Email provider is refused when ENV=production.")
        # Rule 4: Never log tokens or sensitive credentials to stdout
        DEV_EMAIL_OUTBOX.append(
            OutboxMessage(
                recipient=to_email,
                subject=subject,
                body=body_text,
                meta=meta or {},
            )
        )


class ResendEmailProvider(EmailProvider):
    def send_email(self, to_email: str, subject: str, body_text: str, meta: Optional[dict] = None) -> None:
        if not settings.RESEND_API_KEY:
            raise RuntimeError("RESEND_API_KEY is not configured for production email provider.")
        httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            json={
                "from": settings.EMAIL_FROM,
                "to": [to_email],
                "subject": subject,
                "text": body_text,
            },
            timeout=10.0,
        )


def get_email_provider() -> EmailProvider:
    provider = settings.EMAIL_PROVIDER.lower()
    if provider in ("console", "dev"):
        if _is_production():
            raise RuntimeError("Dev Email provider cannot be used when ENV=production.")
        return ConsoleEmailProvider()
    return ResendEmailProvider()


def send_order_confirmation_email(order_number: str, to_email: Optional[str], total_paise: int, items_count: int) -> None:
    if not to_email:
        return
    rupees = total_paise // 100
    provider = get_email_provider()
    provider.send_email(
        to_email=to_email,
        subject=f"Order Confirmed: {order_number} — Global to Local Goa",
        body_text=(
            f"Mog asun! Thank you for your order {order_number}.\n"
            f"Items: {items_count}\n"
            f"Total: Rs. {rupees}\n"
            f"We are preparing your Goan heritage parcel in Fontainhas, Panjim."
        ),
        meta={"order_number": order_number, "type": "order_confirmation"},
    )


def send_order_status_email(
    order_number: str,
    to_email: Optional[str],
    new_status: str,
    note: Optional[str] = None,
    tracking_number: Optional[str] = None,
) -> None:
    if not to_email:
        return
    provider = get_email_provider()
    tracking_line = f"\nTracking Number: {tracking_number}" if tracking_number else ""
    note_line = f"\nNote: {note}" if note else ""
    provider.send_email(
        to_email=to_email,
        subject=f"Order Update ({order_number}): {new_status.replace('_', ' ').title()}",
        body_text=(
            f"Your Global to Local order {order_number} status is now: {new_status}.{tracking_line}{note_line}\n"
            f"Thank you for supporting Goan artisans and Self-Help Groups."
        ),
        meta={"order_number": order_number, "status": new_status, "type": "order_status"},
    )


def verify_captcha_token(token: Optional[str], remote_ip: Optional[str] = None) -> bool:
    if not token or token.strip() == "" or token.strip().upper() in ("FAIL", "INVALID", "BOT"):
        raise ProblemException(
            status_code=400,
            title="CAPTCHA Verification Failed",
            detail="Please complete the CAPTCHA verification to submit your enquiry.",
            problem_type="https://globaltolocal.in/problems/captcha-failed",
        )
    if settings.APP_ENV.lower() in ("development", "test"):
        return True
    try:
        resp = httpx.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": settings.CAPTCHA_SECRET_KEY,
                "response": token,
                "remoteip": remote_ip or "",
            },
            timeout=5.0,
        )
        data = resp.json()
        if not data.get("success"):
            raise ProblemException(
                status_code=400,
                title="CAPTCHA Verification Failed",
                detail="CAPTCHA validation did not pass.",
                problem_type="https://globaltolocal.in/problems/captcha-failed",
            )
        return True
    except ProblemException:
        raise
    except Exception:
        raise ProblemException(
            status_code=400,
            title="CAPTCHA Verification Failed",
            detail="Unable to verify CAPTCHA token.",
            problem_type="https://globaltolocal.in/problems/captcha-failed",
        )
