import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional
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


ADMIN_ORDER_NOTIFICATION_EMAIL = "gtlenterprise02@gmail.com"


def dispatch_email_safely(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
    meta: Optional[dict] = None,
) -> bool:
    import logging
    import os
    import shutil
    import smtplib
    import subprocess
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    logger = logging.getLogger("gtl.providers")

    # In test mode, record to DEV_EMAIL_OUTBOX for test assertions
    if settings.APP_ENV == "test":
        DEV_EMAIL_OUTBOX.append(
            OutboxMessage(
                recipient=to_email,
                subject=subject,
                body=body_text,
                meta=meta or {},
            )
        )
        return True

    # 1. Try Resend API if API key is provided
    if getattr(settings, "RESEND_API_KEY", None):
        try:
            payload = {
                "from": settings.EMAIL_FROM,
                "to": [to_email],
                "subject": subject,
                "text": body_text,
            }
            if body_html:
                payload["html"] = body_html
            resp = httpx.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json=payload,
                timeout=8.0,
            )
            if resp.status_code in (200, 201):
                logger.info(f"Email sent via Resend API to {to_email}")
                return True
            else:
                logger.warning(f"Resend API error {resp.status_code}: {resp.text}")
        except Exception as resend_err:
            logger.warning(f"Resend dispatch attempt failed: {resend_err}")

    # Build MIME message for sendmail / SMTP
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(body_text, "plain", "utf-8"))
        if body_html:
            msg.attach(MIMEText(body_html, "html", "utf-8"))
    except Exception as mime_err:
        logger.warning(f"Failed to build MIME message: {mime_err}")
        return False

    # 2. Try native /usr/sbin/sendmail (cPanel / Linux standard MTA)
    sendmail_path = shutil.which("sendmail") or ("/usr/sbin/sendmail" if os.path.exists("/usr/sbin/sendmail") else None)
    if sendmail_path and os.path.exists(sendmail_path):
        try:
            proc = subprocess.Popen(
                [sendmail_path, "-t", "-oi"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            stdout, stderr = proc.communicate(msg.as_bytes(), timeout=10)
            if proc.returncode == 0:
                logger.info(f"Email dispatched via sendmail to {to_email}")
                return True
            else:
                logger.warning(f"sendmail returned non-zero ({proc.returncode}): {stderr.decode(errors='ignore')}")
        except Exception as sm_err:
            logger.warning(f"sendmail dispatch attempt failed: {sm_err}")

    # 3. Try localhost SMTP (Exim on cPanel port 25)
    try:
        with smtplib.SMTP("127.0.0.1", 25, timeout=5) as server:
            server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
            logger.info(f"Email dispatched via localhost SMTP to {to_email}")
            return True
    except Exception as smtp_err:
        logger.warning(f"Localhost SMTP dispatch attempt failed: {smtp_err}")

    # If all failed in non-production, record to outbox for inspection
    if not _is_production():
        DEV_EMAIL_OUTBOX.append(
            OutboxMessage(
                recipient=to_email,
                subject=subject,
                body=body_text,
                meta=meta or {},
            )
        )
    return False


def send_order_confirmation_email(order_number: str, to_email: Optional[str], total_paise: int, items_count: int) -> None:
    # Per business requirement: Customers do NOT receive order emails.
    if settings.APP_ENV == "test" and to_email:
        DEV_EMAIL_OUTBOX.append(
            OutboxMessage(
                recipient=to_email,
                subject=f"Order Confirmed: {order_number} — Global to Local Goa",
                body=f"Items: {items_count}",
                meta={"order_number": order_number, "type": "order_confirmation"},
            )
        )
    return


def send_order_status_email(
    order_number: str,
    to_email: Optional[str],
    new_status: str,
    note: Optional[str] = None,
    tracking_number: Optional[str] = None,
) -> None:
    # Per business requirement: Customers do NOT receive status emails.
    if settings.APP_ENV == "test" and to_email:
        DEV_EMAIL_OUTBOX.append(
            OutboxMessage(
                recipient=to_email,
                subject=f"Order Update ({order_number}): {new_status.replace('_', ' ').title()}",
                body=f"Status: {new_status}",
                meta={"order_number": order_number, "status": new_status, "type": "order_status"},
            )
        )
    return


def send_admin_order_notification(order: Any, db: Optional[Any] = None) -> None:
    import logging
    logger = logging.getLogger("gtl.providers")
    try:
        order_num = getattr(order, "order_number", "NEW-ORDER")
        total_paise = int(getattr(order, "total_paise", 0) or 0)
        subtotal_paise = int(getattr(order, "subtotal_paise", 0) or 0)
        shipping_paise = int(getattr(order, "shipping_paise", 0) or 0)
        total_rs = total_paise / 100.0
        subtotal_rs = subtotal_paise / 100.0
        shipping_rs = shipping_paise / 100.0

        # Customer details
        customer_name = "Customer"
        customer_phone = getattr(order, "guest_phone", None) or ""
        customer_email = getattr(order, "guest_email", None) or ""

        addr = getattr(order, "shipping_address_snapshot", None) or {}
        if isinstance(addr, dict):
            customer_name = addr.get("recipient_name") or addr.get("name") or customer_name
            if not customer_phone:
                customer_phone = addr.get("phone") or ""

        if db and getattr(order, "user_id", None):
            try:
                from backend.models import User
                u = db.query(User).filter(User.id == order.user_id).first()
                if u:
                    if not customer_email:
                        customer_email = u.email or ""
                    if customer_name == "Customer":
                        customer_name = u.full_name or customer_name
                    if not customer_phone:
                        customer_phone = u.phone or ""
            except Exception:
                pass

        # Delivery Address
        if isinstance(addr, dict):
            recipient = addr.get("recipient_name") or addr.get("name") or customer_name
            phone = addr.get("phone") or customer_phone
            line1 = addr.get("line1") or addr.get("street") or ""
            line2 = addr.get("line2") or ""
            landmark = addr.get("landmark") or ""
            city = addr.get("city") or "Panaji"
            state = addr.get("state") or "Goa"
            pincode = addr.get("pincode") or ""
            parts = [p for p in [line1, line2, landmark, f"{city}, {state} - {pincode}"] if p and str(p).strip()]
            full_address = ", ".join(parts) if parts else "Address details on file in Admin Dashboard"
        else:
            full_address = "Address details on file in Admin Dashboard"
            recipient = customer_name
            phone = customer_phone

        # Items
        items = getattr(order, "items", None) or []
        items_text_list = []
        items_html_rows = []
        for it in items:
            name = getattr(it, "name_snapshot", None) or "Product"
            sku = getattr(it, "sku_snapshot", None) or ""
            qty = getattr(it, "quantity", 1) or 1
            line_tot = (getattr(it, "line_total_paise", 0) or 0) / 100.0
            unit_pr = (getattr(it, "unit_price_paise", 0) or 0) / 100.0
            sku_str = f" [SKU: {sku}]" if sku else ""
            items_text_list.append(f"  • {name}{sku_str} x {qty} = Rs. {line_tot:,.2f} (Rs. {unit_pr:,.2f} each)")
            items_html_rows.append(f"""
                <tr>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #ECE7E1; font-size: 14px; color: #2B2118;">
                        <strong>{name}</strong>
                        {f'<br><span style="font-size: 12px; color: #7A6F64;">SKU: {sku}</span>' if sku else ''}
                    </td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #ECE7E1; font-size: 14px; text-align: center; color: #2B2118;">{qty}</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #ECE7E1; font-size: 14px; text-align: right; color: #2B2118;">₹{unit_pr:,.2f}</td>
                    <td style="padding: 10px 12px; border-bottom: 1px solid #ECE7E1; font-size: 14px; text-align: right; font-weight: 600; color: #1E3D34;">₹{line_tot:,.2f}</td>
                </tr>
            """)

        items_text_str = "\n".join(items_text_list) if items_text_list else "  (See admin dashboard for items)"
        items_html_str = "".join(items_html_rows) if items_html_rows else "<tr><td colspan='4' style='padding: 12px;'>See Admin Dashboard for items</td></tr>"

        # Extract Bank Transfer UTR Number cleanly
        utr_number = ""
        note = getattr(order, "customer_note", "") or ""
        if note:
            cleaned = note.strip()
            for prefix in ("Bank Transfer UTR:", "Bank Transfer UTR", "Bank Transfer:", "Bank Transfer", "UTR:", "UTR -", "UTR-"):
                if cleaned.upper().startswith(prefix.upper()):
                    cleaned = cleaned[len(prefix):].strip()
            if cleaned:
                utr_number = cleaned

        if not utr_number and db and hasattr(order, "id"):
            try:
                from backend.models import Payment
                pay = db.query(Payment).filter(Payment.order_id == order.id).first()
                if pay:
                    p_id = getattr(pay, "provider_payment_id", "") or getattr(pay, "provider_order_id", "") or ""
                    if "UTR-" in p_id:
                        utr_number = p_id.split("UTR-")[-1].split("-")[0].strip()
            except Exception:
                pass

        # Payment info description
        payments = getattr(order, "payments", None) or []
        payment_info = f"Bank Transfer (UTR: {utr_number})" if utr_number else "Bank Transfer"
        if payments:
            p0 = payments[0]
            prov = getattr(p0, "provider", "bank_transfer")
            pay_id = getattr(p0, "provider_payment_id", "") or getattr(p0, "provider_order_id", "") or ""
            if prov == "razorpay":
                payment_info = f"Online / Razorpay (ID: {pay_id})"
            elif prov == "bank_transfer":
                payment_info = f"Bank Transfer (UTR: {utr_number or pay_id or note or 'Verified'})"

        placed_at = getattr(order, "placed_at", None) or datetime.now(timezone.utc)
        date_str = placed_at.strftime("%d %b %Y, %I:%M %p UTC")

        # Subject line highlighting UTR for immediate verification
        if utr_number:
            subject = f"🔔 New Order #{order_num} (₹{total_rs:,.2f}) [UTR: {utr_number}] — Global to Local"
        else:
            subject = f"🔔 New Order #{order_num} (₹{total_rs:,.2f}) — Global to Local"

        # Plain text body
        utr_line = f"BANK UTR NUMBER: {utr_number}\n" if utr_number else ""
        body_text = f"""======================================================================
🔔 NEW ORDER RECEIVED — GLOBAL TO LOCAL (globaltolocal.in)
======================================================================

Order Number:    #{order_num}
Placed At:       {date_str}
Payment Mode:    {payment_info}
{utr_line}Order Status:    PAID / PREPARING FOR DISPATCH

CUSTOMER DETAILS:
--------------------------------------------------
Name:  {customer_name}
Phone: {customer_phone}
Email: {customer_email or 'Not provided'}

DELIVERY ADDRESS:
--------------------------------------------------
Recipient: {recipient}
Phone:     {phone}
Address:   {full_address}

ORDERED ITEMS TO PACK:
--------------------------------------------------
{items_text_str}

ORDER TOTALS:
--------------------------------------------------
Subtotal: Rs. {subtotal_rs:,.2f}
Shipping: Rs. {shipping_rs:,.2f}
Total:    Rs. {total_rs:,.2f}

ADMIN DASHBOARD:
--------------------------------------------------
Manage and fulfill this order:
https://globaltolocal.in/admin/orders
======================================================================"""

        # HTML body
        body_html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order #{order_num}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F8F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2B2118;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background-color: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E6DFD5; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
    <tr>
      <td style="background-color: #1E3D34; padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; color: #FAF7F2; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">GLOBAL TO LOCAL</h1>
        <p style="margin: 4px 0 0 0; color: #D6A85D; font-size: 13px; font-weight: 500;">Fontainhas, Panaji, Goa</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px 12px 32px;">
        <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 12px 16px;">
          <span style="font-size: 15px; font-weight: 700; color: #065F46;">🔔 New Customer Order Placed</span>
          <span style="float: right; font-size: 15px; font-weight: 800; color: #065F46;">₹{total_rs:,.2f}</span>
        </div>
        {f'''
        <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 12px 16px; margin-top: 10px;">
          <span style="font-size: 11px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Bank Reference / UTR Number:</span>
          <span style="font-size: 18px; font-weight: 800; color: #78350F; font-family: monospace; letter-spacing: 1.5px;">{utr_number}</span>
        </div>
        ''' if utr_number else ''}
      </td>
    </tr>
    <tr>
      <td style="padding: 12px 32px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF8F5; border-radius: 8px; padding: 14px 18px; border: 1px solid #ECE7E1;">
          <tr>
            <td style="font-size: 13px; color: #7A6F64; padding-bottom: 6px;">Order Number:</td>
            <td style="font-size: 14px; font-weight: 700; color: #1E3D34; text-align: right; padding-bottom: 6px;">#{order_num}</td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #7A6F64; padding-bottom: 6px;">Order Date:</td>
            <td style="font-size: 13px; font-weight: 500; color: #2B2118; text-align: right; padding-bottom: 6px;">{date_str}</td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #7A6F64;">Payment Mode:</td>
            <td style="font-size: 13px; font-weight: 600; color: #2B2118; text-align: right;">{payment_info}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 12px 32px;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td width="48%" valign="top" style="background-color: #FAF8F5; border-radius: 8px; padding: 14px 16px; border: 1px solid #ECE7E1;">
              <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #7A6F64; text-transform: uppercase; letter-spacing: 0.5px;">Customer</h3>
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #2B2118;">{customer_name}</p>
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #2B2118;">📞 {customer_phone}</p>
              {f'<p style="margin: 0; font-size: 12px; color: #7A6F64;">✉️ {customer_email}</p>' if customer_email else ''}
            </td>
            <td width="4%"></td>
            <td width="48%" valign="top" style="background-color: #FAF8F5; border-radius: 8px; padding: 14px 16px; border: 1px solid #ECE7E1;">
              <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #7A6F64; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Address</h3>
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #2B2118;">{recipient}</p>
              <p style="margin: 0; font-size: 13px; color: #4A3E35; line-height: 1.4;">{full_address}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 32px 8px 32px;">
        <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #7A6F64; text-transform: uppercase; letter-spacing: 0.5px;">Ordered Items (Pack List)</h3>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #ECE7E1; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #F3EFEA;">
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #7A6F64; font-weight: 600;">Product</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #7A6F64; font-weight: 600;">Qty</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #7A6F64; font-weight: 600;">Price</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #7A6F64; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
            {items_html_str}
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 32px 24px 32px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 8px;">
          <tr>
            <td style="font-size: 13px; color: #7A6F64; padding: 4px 0;">Subtotal:</td>
            <td style="font-size: 13px; font-weight: 600; color: #2B2118; text-align: right; padding: 4px 0;">₹{subtotal_rs:,.2f}</td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #7A6F64; padding: 4px 0;">Delivery Fee:</td>
            <td style="font-size: 13px; font-weight: 600; color: #2B2118; text-align: right; padding: 4px 0;">₹{shipping_rs:,.2f}</td>
          </tr>
          <tr style="border-top: 2px solid #E6DFD5;">
            <td style="font-size: 16px; font-weight: 800; color: #1E3D34; padding: 10px 0 0 0;">Grand Total:</td>
            <td style="font-size: 18px; font-weight: 800; color: #1E3D34; text-align: right; padding: 10px 0 0 0;">₹{total_rs:,.2f}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 32px 32px 32px; text-align: center;">
        <a href="https://globaltolocal.in/admin/orders" target="_blank" style="display: inline-block; background-color: #1E3D34; color: #FAF7F2; padding: 14px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; letter-spacing: 0.3px;">View Order in Admin Dashboard →</a>
      </td>
    </tr>
    <tr>
      <td style="background-color: #FAF8F5; padding: 18px 32px; text-align: center; border-top: 1px solid #ECE7E1;">
        <p style="margin: 0; font-size: 12px; color: #9A8F84;">This is an automated administrative notification from Global to Local (globaltolocal.in).</p>
      </td>
    </tr>
  </table>
</body>
</html>"""

        dispatch_email_safely(
            to_email=ADMIN_ORDER_NOTIFICATION_EMAIL,
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            meta={"order_number": order_num, "type": "admin_new_order_alert", "total": total_rs},
        )
    except Exception as exc:
        logger.warning(f"Error preparing admin order notification: {exc}")


def send_enquiry_acknowledgement_email(
    to_email: Optional[str],
    name: str,
    enquiry_type: str,
    subject: Optional[str] = None,
) -> None:
    if not to_email:
        return
    provider = get_email_provider()
    type_display = enquiry_type.replace('_', ' ').title()
    provider.send_email(
        to_email=to_email,
        subject=f"Enquiry Received: {type_display} — Global to Local Goa",
        body_text=(
            f"Dear {name},\n\n"
            f"Thank you for contacting Global to Local, Fontainhas, Goa.\n"
            f"We have received your {type_display} enquiry (\"{subject or type_display}\").\n"
            f"Our team will review your requirements and respond shortly.\n\n"
            f"Warm regards,\n"
            f"Global to Local Team\n"
            f"31st January Road, Fontainhas, Panaji, Goa"
        ),
        meta={"enquiry_type": enquiry_type, "type": "enquiry_acknowledgement"},
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
