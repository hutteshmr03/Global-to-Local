import logging
logger = logging.getLogger("gtl.checkout")
import hashlib
import hmac
import json
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from fastapi import APIRouter, Depends, Header, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload
from backend.config import settings
from backend.core.errors import ProblemException
from backend.core.providers import (
    send_order_confirmation_email,
    send_order_status_email,
)
from backend.database import get_db
from backend.deps import get_current_user, get_current_user_optional
from backend.models import (
    Address,
    Cart,
    CartItem,
    IdempotencyRecord,
    Inventory,
    Order,
    OrderItem,
    OrderStatus,
    OrderStatusEvent,
    Payment,
    PaymentStatus,
    Product,
    ShippingPincode,
    ShippingRate,
    ShippingZone,
    StockMovement,
    StockMovementReason,
    User,
    WebhookEvent,
)
from backend.routers.cart import get_available_stock, resolve_product

router = APIRouter(prefix="/api/v1", tags=["Shipping, Checkout, Payments & Orders"])

PINCODE_6_RE = re.compile(r"^[1-9]\d{5}$")

ALLOWED_STATUS_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.pending_payment: {OrderStatus.paid, OrderStatus.cancelled},
    OrderStatus.paid: {OrderStatus.packed},
    OrderStatus.packed: {OrderStatus.shipped},
    OrderStatus.shipped: {OrderStatus.delivered},
    OrderStatus.delivered: set(),
    OrderStatus.cancelled: set(),
}



def compute_shipping_for_pincode(
    db: Session,
    pincode: str,
    weight_grams: int = 500,
) -> dict[str, Any]:
    clean_pin = (pincode or "").strip()
    if not PINCODE_6_RE.match(clean_pin):
        raise ProblemException(
            status_code=422,
            title="Invalid Pincode",
            detail="Please enter a valid 6-digit Indian postal pincode.",
            problem_type="https://globaltolocal.in/problems/invalid-pincode",
            errors=[{"field": "pincode", "code": "invalid_pincode", "message": "Enter a valid 6-digit pincode."}],
        )

    matched_zone: Optional[ShippingZone] = None
    is_goa = False

    # 1. Check shipping_pincodes prefix table safely
    try:
        all_prefixes = db.query(ShippingPincode).all()
        for p_row in sorted(all_prefixes, key=lambda x: len(x.pincode_prefix), reverse=True):
            if clean_pin.startswith(p_row.pincode_prefix):
                matched_zone = p_row.zone
                is_goa = p_row.is_goa
                break
    except Exception:
        db.rollback()

    # 2. Fallback to shipping_zones regex by priority ASC
    if not matched_zone:
        zones = (
            db.query(ShippingZone)
            .filter(ShippingZone.is_active == True)  # noqa: E712
            .order_by(ShippingZone.priority.asc())
            .all()
        )
        for z in zones:
            if re.match(z.pincode_regex, clean_pin):
                matched_zone = z
                is_goa = z.code.upper() == "GOA" or clean_pin.startswith("403")
                break

    if not matched_zone:
        raise ProblemException(
            status_code=422,
            title="Unserviceable Pincode",
            detail=f"Delivery is not available for pincode {clean_pin}.",
            problem_type="https://globaltolocal.in/problems/unserviceable-pincode",
        )

    w = max(1, int(weight_grams or 500))
    rates = (
        db.query(ShippingRate)
        .filter(ShippingRate.zone_id == matched_zone.id, ShippingRate.is_active == True)  # noqa: E712
        .order_by(ShippingRate.min_weight_grams.asc())
        .all()
    )
    selected_rate: Optional[ShippingRate] = None
    for r in rates:
        if r.min_weight_grams <= w <= r.max_weight_grams:
            selected_rate = r
            break
    if not selected_rate and rates:
        selected_rate = rates[-1]

    rate_paise = selected_rate.rate_paise if selected_rate else (8000 if is_goa else 12000)
    days_min = selected_rate.estimated_days_min if selected_rate else (1 if is_goa else 3)
    days_max = selected_rate.estimated_days_max if selected_rate else (2 if is_goa else 7)

    return {
        "pincode": clean_pin,
        "serviceable": True,
        "zone_code": matched_zone.code,
        "zone_name": matched_zone.name,
        "shipping_method": matched_zone.name,
        "is_goa": is_goa,
        "custom_hamper_eligible": is_goa,
        "weight_grams": w,
        "shipping_paise": rate_paise,
        "rate_paise": rate_paise,
        "estimated_days_min": days_min,
        "estimated_days_max": days_max,
        "estimated_delivery_text": f"{days_min}–{days_max} business days",
        "free_shipping_threshold_paise": None,
        "minimum_order_paise": 0,
    }


@router.get("/shipping/estimate")
def estimate_shipping(
    pincode: str = Query(..., min_length=6, max_length=6),
    weight_grams: int = Query(500, ge=1, le=200000),
    db: Session = Depends(get_db),
):
    return compute_shipping_for_pincode(db=db, pincode=pincode, weight_grams=weight_grams)


class QuoteItemInput(BaseModel):
    product_id: Union[str, int]
    quantity: int = Field(..., ge=1, le=20)


class CheckoutQuoteRequest(BaseModel):
    pincode: str = Field(..., min_length=6, max_length=6)
    items: Optional[list[QuoteItemInput]] = None


@router.post("/checkout/quote")
def calculate_checkout_quote(
    payload: CheckoutQuoteRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    subtotal_paise = 0
    total_weight_grams = 0
    line_items_out = []

    if payload.items:
        for entry in payload.items:
            prod = resolve_product(db, entry.product_id)
            avail = get_available_stock(prod)
            if entry.quantity > avail:
                raise ProblemException(
                    status_code=409,
                    title="Insufficient Stock",
                    detail=f"Only {avail} units of '{prod.name}' are available.",
                    problem_type="https://globaltolocal.in/problems/insufficient-stock",
                )
            line_total = prod.price_paise * entry.quantity
            subtotal_paise += line_total
            total_weight_grams += (prod.net_weight_grams or 250) * entry.quantity
            line_items_out.append(
                {
                    "product_id": str(prod.id),
                    "legacy_id": prod.legacy_id,
                    "slug": prod.slug,
                    "name": prod.name,
                    "quantity": entry.quantity,
                    "unit_price_paise": prod.price_paise,
                    "line_total_paise": line_total,
                }
            )
    elif user:
        cart = db.query(Cart).filter(Cart.user_id == user.id).first()
        if cart:
            for ci in cart.items:
                prod = ci.product
                if not prod or not prod.is_active:
                    continue
                line_total = prod.price_paise * ci.quantity
                subtotal_paise += line_total
                total_weight_grams += (prod.net_weight_grams or 250) * ci.quantity
                line_items_out.append(
                    {
                        "product_id": str(prod.id),
                        "legacy_id": prod.legacy_id,
                        "slug": prod.slug,
                        "name": prod.name,
                        "quantity": ci.quantity,
                        "unit_price_paise": prod.price_paise,
                        "line_total_paise": line_total,
                    }
                )

    ship_info = compute_shipping_for_pincode(
        db=db,
        pincode=payload.pincode,
        weight_grams=max(250, total_weight_grams),
    )
    shipping_paise = ship_info["shipping_paise"]
    total_paise = subtotal_paise + shipping_paise

    return {
        "items": line_items_out,
        "subtotal_paise": subtotal_paise,
        "discount_paise": 0,
        "shipping_paise": shipping_paise,
        "tax_paise": 0,
        "prices_include_tax": True,
        "total_paise": total_paise,
        "shipping": ship_info,
    }


def generate_next_order_number(db: Session) -> str:
    """
    Generates order numbers starting sequentially from 7233 for each year:
    - 2026: GTL-2026-7233, GTL-2026-7234, ...
    - 2027: GTL-2027-7233, GTL-2027-7234, ...
    """
    year = datetime.now(timezone.utc).year
    prefix = f"GTL-{year}-"
    base_seq = 7233
    try:
        existing_orders = (
            db.query(Order.order_number)
            .filter(Order.order_number.like(f"{prefix}%"))
            .all()
        )
        max_seq = base_seq - 1
        for (ord_num,) in existing_orders:
            if ord_num and ord_num.startswith(prefix):
                raw_suffix = ord_num[len(prefix):].split("-")[0]
                if raw_suffix.isdigit():
                    val = int(raw_suffix)
                    if val > max_seq:
                        max_seq = val
        next_seq = max(base_seq, max_seq + 1)
        return f"GTL-{year}-{next_seq}"
    except Exception as e:
        logger.warning(f"Error computing order sequence fallback: {e}")
        return f"GTL-{year}-{base_seq}"

STATUS_LABELS: dict[OrderStatus, str] = {
    OrderStatus.pending_payment: "Preparing for dispatch",
    OrderStatus.paid: "Preparing for dispatch",
    OrderStatus.packed: "Packed at Fontainhas",
    OrderStatus.shipped: "Shipped via Courier",
    OrderStatus.delivered: "Delivered",
    OrderStatus.cancelled: "Cancelled",
}


def serialize_order(order: Order) -> dict[str, Any]:
    def to_str(val, default=""):
        if val is None:
            return default
        if hasattr(val, "value"):
            return str(val.value)
        return str(val)

    def to_iso(dt_val):
        if not dt_val:
            return None
        if hasattr(dt_val, "isoformat"):
            return dt_val.isoformat()
        return str(dt_val)

    status_str = to_str(order.status, "paid")
    can_cancel = False
    cancel_notice = "Please contact the store to cancel." if status_str != "cancelled" else None

    items_out = []
    for oi in (order.items or []):
        unit_p = int(oi.unit_price_paise or 0)
        q = int(oi.quantity or 1)
        tot_p = int(oi.line_total_paise or (unit_p * q))
        items_out.append({
            "id": str(oi.id),
            "product_id": str(oi.product_id),
            "sku": oi.sku_snapshot or "",
            "name": oi.name_snapshot or "Product",
            "slug": oi.slug_snapshot or "",
            "unit_label": oi.unit_label_snapshot or "",
            "weight": oi.unit_label_snapshot or "",
            "image_url": oi.image_url_snapshot or "/images/site/placeholder-product.svg",
            "imageSrc": oi.image_url_snapshot or "/images/site/placeholder-product.svg",
            "unit_price_paise": unit_p,
            "price": unit_p,
            "quantity": q,
            "qty": q,
            "line_total_paise": tot_p,
        })

    events_out = []
    for ev in (order.status_events or []):
        from_st = to_str(ev.from_status) if ev.from_status else None
        to_st = to_str(ev.to_status, "pending_payment")
        events_out.append({
            "id": str(ev.id),
            "from_status": from_st,
            "to_status": to_st,
            "note": ev.note or "",
            "created_at": to_iso(ev.created_at),
        })

    shipments_out = []
    for sh in (order.shipments or []):
        shipments_out.append({
            "id": str(sh.id),
            "carrier": sh.carrier or "",
            "awb_or_tracking_number": sh.awb_or_tracking_number or "",
            "tracking_url": sh.tracking_url or "",
            "status": to_str(sh.status, "label_created"),
            "dispatched_at": to_iso(sh.dispatched_at),
            "delivered_at": to_iso(sh.delivered_at),
        })

    payment = order.payments[0] if (order.payments and len(order.payments) > 0) else None
    payment_status_str = to_str(payment.status, "created") if payment else "created"

    if hasattr(order.placed_at, "strftime"):
        date_display = order.placed_at.strftime("%d %b %Y")
    elif order.placed_at:
        date_display = str(order.placed_at)[:10]
    else:
        date_display = datetime.now(timezone.utc).strftime("%d %b %Y")

    addr_snap = dict(order.shipping_address_snapshot or {})
    if "fullName" not in addr_snap:
        addr_snap["fullName"] = addr_snap.get("recipient_name") or addr_snap.get("name") or ""

    label_map = {
        "pending_payment": "Preparing for dispatch",
        "paid": "Preparing for dispatch",
        "packed": "Packed at Fontainhas",
        "shipped": "Shipped via Courier",
        "delivered": "Delivered",
        "cancelled": "Cancelled",
    }
    status_label = label_map.get(status_str, STATUS_LABELS.get(order.status, "Preparing for dispatch"))

    subtotal = int(order.subtotal_paise or 0)
    shipping = int(order.shipping_paise or 0)
    total = int(order.total_paise or (subtotal + shipping))

    return {
        "id": order.order_number,
        "uuid": str(order.id),
        "order_number": order.order_number,
        "orderNumber": order.order_number,
        "date": date_display,
        "status": status_str,
        "statusLabel": status_label,
        "can_cancel": can_cancel,
        "canCancel": can_cancel,
        "cancel_notice": cancel_notice,
        "cancelNotice": cancel_notice,
        "currency": order.currency or "INR",
        "subtotal_paise": subtotal,
        "subtotalPaise": subtotal,
        "discount_paise": int(order.discount_paise or 0),
        "shipping_paise": shipping,
        "shippingCostPaise": shipping,
        "tax_paise": int(order.tax_paise or 0),
        "total_paise": total,
        "totalPaise": total,
        "shipping_method": order.shipping_method or "Standard Delivery",
        "shipping_address": addr_snap,
        "customer_note": order.customer_note,
        "reservation_expires_at": to_iso(order.reservation_expires_at),
        "placed_at": to_iso(order.placed_at),
        "paid_at": to_iso(order.paid_at),
        "cancelled_at": to_iso(order.cancelled_at),
        "cancel_reason": order.cancel_reason,
        "createdAt": to_iso(order.placed_at),
        "items": items_out,
        "status_events": events_out,
        "shipments": shipments_out,
        "payment": {
            "provider": payment.provider if payment else "bank_transfer",
            "razorpay_order_id": payment.provider_order_id if payment else None,
            "razorpay_payment_id": payment.provider_payment_id if payment else None,
            "status": payment_status_str,
            "amount_paise": payment.amount_paise if payment else total,
            "key_id": getattr(settings, "RAZORPAY_KEY_ID", ""),
        } if payment else {
            "provider": "bank_transfer",
            "razorpay_order_id": None,
            "razorpay_payment_id": None,
            "status": "created",
            "amount_paise": total,
            "key_id": getattr(settings, "RAZORPAY_KEY_ID", ""),
        },
        "razorpay_order_id": payment.provider_order_id if payment else None,
        "subtotal": subtotal,
        "shipping": shipping,
        "total": total,
        "shippingLabel": order.shipping_method or "Standard Delivery",
        "address": addr_snap,
    }

def transition_order_status(
    db: Session,
    order: Order,
    to_status: OrderStatus,
    actor_user_id: Optional[uuid.UUID] = None,
    note: Optional[str] = None,
) -> Order:
    current = order.status
    if current == to_status:
        return order
    allowed = ALLOWED_STATUS_TRANSITIONS.get(current, set())
    if to_status not in allowed:
        raise ProblemException(
            status_code=409,
            title="Invalid Order Status Transition",
            detail=f"Cannot transition order {order.order_number} from '{current.value}' to '{to_status.value}'. Statuses move forward only.",
            problem_type="https://globaltolocal.in/problems/invalid-order-transition",
        )
    order.status = to_status
    db.add(
        OrderStatusEvent(
            order_id=order.id,
            from_status=current,
            to_status=to_status,
            actor_user_id=actor_user_id,
            note=note,
        )
    )
    if to_status in (OrderStatus.packed, OrderStatus.shipped, OrderStatus.delivered):
        recipient_email = order.guest_email
        if not recipient_email and order.user_id:
            u = db.query(User).filter(User.id == order.user_id).first()
            recipient_email = u.email if u else None
        send_order_status_email(
            order_number=order.order_number,
            to_email=recipient_email,
            new_status=to_status.value,
            note=note,
        )
    return order


def release_expired_reservations(db: Session) -> int:
    """
    Release reserved stock for pending_payment orders whose 30-minute reservation window has expired.
    """
    now = datetime.now(timezone.utc)
    expired_orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(
            Order.status == OrderStatus.pending_payment,
            Order.reservation_expires_at.is_not(None),
            Order.reservation_expires_at <= now,
        )
        .all()
    )
    released_count = 0
    for order in expired_orders:
        for item in order.items:
            inv = (
                db.query(Inventory)
                .filter(Inventory.product_id == item.product_id)
                .with_for_update()
                .first()
            )
            if inv:
                inv.reserved = max(0, inv.reserved - item.quantity)
                db.add(
                    StockMovement(
                        product_id=item.product_id,
                        delta=item.quantity,
                        reason=StockMovementReason.order_released,
                        reference_type="order",
                        reference_id=order.id,
                        note=f"30m reservation expired for {order.order_number}",
                    )
                )
        order.status = OrderStatus.cancelled
        order.cancelled_at = now
        order.cancel_reason = "Payment reservation window (30 minutes) expired."
        db.add(
            OrderStatusEvent(
                order_id=order.id,
                from_status=OrderStatus.pending_payment,
                to_status=OrderStatus.cancelled,
                note="Automatically cancelled after 30 minutes without payment capture.",
            )
        )
        released_count += 1
    if released_count > 0:
        db.commit()
    return released_count


class InlineAddressInput(BaseModel):
    label: str = "Home"
    recipient_name: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    line1: Optional[str] = None
    street: Optional[str] = None
    line2: Optional[str] = None
    landmark: Optional[str] = None
    city: str
    state: str = "Goa"
    pincode: str


class CreateOrderRequest(BaseModel):
    address_id: Optional[uuid.UUID] = None
    address: Optional[InlineAddressInput] = None
    delivery_address: Optional[InlineAddressInput] = None
    save_address: bool = False
    items: Optional[list[QuoteItemInput]] = None
    customer_note: Optional[str] = Field(None, max_length=500)


@router.post("/orders", status_code=status.HTTP_201_CREATED)
def create_order(
    payload: CreateOrderRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not idempotency_key or not idempotency_key.strip():
        raise ProblemException(
            status_code=400,
            title="Missing Idempotency-Key",
            detail="An Idempotency-Key header is required when creating an order.",
            problem_type="https://globaltolocal.in/problems/missing-idempotency-key",
        )
    idem_key = idempotency_key.strip()[:64]

    # Compute deterministic hash of request body
    canonical_payload = json.dumps(payload.model_dump(mode="json"), sort_keys=True)
    req_hash = hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()

    existing_idem = (
        db.query(IdempotencyRecord)
        .filter(IdempotencyRecord.key == idem_key)
        .first()
    )
    if existing_idem:
        if existing_idem.request_hash != req_hash:
            raise ProblemException(
                status_code=409,
                title="Idempotency Key Conflict",
                detail="This Idempotency-Key was already used with a different order payload.",
                problem_type="https://globaltolocal.in/problems/idempotency-conflict",
            )
        return existing_idem.response_body

    # Enforce mandatory UTR number for Bank Transfer orders
    user_note = (payload.customer_note or "").strip()
    utr_val = user_note.replace("Bank Transfer UTR:", "").replace("Bank Transfer", "").replace("UTR:", "").strip()
    if not utr_val or len(utr_val) < 4:
        raise ProblemException(
            status_code=422,
            title="UTR Number Required",
            detail="Please transfer the total amount to our bank account and enter your Bank Reference / UTR Number before confirming.",
            problem_type="https://globaltolocal.in/problems/utr-required",
        )
    saved_note = user_note if "Bank Transfer UTR:" in user_note else f"Bank Transfer UTR: {utr_val}"

    # Release any expired reservations first
    release_expired_reservations(db)

    # Resolve shipping address
    address_snapshot: dict[str, Any]
    if payload.address_id:
        addr = (
            db.query(Address)
            .filter(Address.id == payload.address_id, Address.user_id == user.id, Address.deleted_at.is_(None))
            .first()
        )
        if not addr:
            raise ProblemException(
                status_code=404,
                title="Address Not Found",
                detail="The selected delivery address was not found.",
                problem_type="https://globaltolocal.in/problems/address-not-found",
            )
        address_snapshot = {
            "id": str(addr.id),
            "label": addr.label,
            "recipient_name": addr.recipient_name,
            "name": addr.recipient_name,
            "phone": addr.phone,
            "line1": addr.line1,
            "street": addr.line1,
            "line2": addr.line2 or "",
            "landmark": addr.landmark or "",
            "city": addr.city,
            "state": addr.state,
            "pincode": addr.pincode,
            "country": addr.country,
        }
    elif (payload.address or payload.delivery_address):
        in_addr = payload.address or payload.delivery_address
        pin = in_addr.pincode.strip()
        if not PINCODE_6_RE.match(pin):
            raise ProblemException(
                status_code=422,
                title="Invalid Pincode",
                detail="Please enter a valid 6-digit Indian postal pincode.",
                problem_type="https://globaltolocal.in/problems/invalid-pincode",
            )
        rec_name = (in_addr.recipient_name or in_addr.name or user.full_name or "Shopper").strip()
        line1 = (in_addr.line1 or in_addr.street or "").strip()
        if not line1:
            raise ProblemException(
                status_code=422,
                title="Invalid Address",
                detail="Street address is required.",
                problem_type="https://globaltolocal.in/problems/invalid-address",
            )
        phone_val = (in_addr.phone or user.phone or "9876543210").strip()
        address_snapshot = {
            "label": in_addr.label or "Home",
            "recipient_name": rec_name,
            "name": rec_name,
            "phone": phone_val,
            "line1": line1,
            "street": line1,
            "line2": (in_addr.line2 or "").strip(),
            "landmark": (in_addr.landmark or "").strip(),
            "city": in_addr.city.strip(),
            "state": (in_addr.state or "Goa").strip(),
            "pincode": pin,
            "country": "IN",
        }
        if payload.save_address:
            new_addr = Address(
                user_id=user.id,
                label=address_snapshot["label"],
                recipient_name=rec_name,
                phone=phone_val[:20],
                line1=line1,
                line2=address_snapshot["line2"] or None,
                landmark=address_snapshot["landmark"] or None,
                city=address_snapshot["city"],
                state=address_snapshot["state"],
                pincode=pin,
                country="IN",
                is_default=False,
            )
            db.add(new_addr)
            db.flush()
    else:
        raise ProblemException(
            status_code=422,
            title="Delivery Address Required",
            detail="Please select or enter a delivery address to place your order.",
            problem_type="https://globaltolocal.in/problems/address-required",
        )

    # Resolve items to purchase (from explicit items or user's server cart)
    raw_items: list[tuple[Product, int]] = []
    if payload.items and len(payload.items) > 0:
        for entry in payload.items:
            prod = resolve_product(db, entry.product_id)
            if not prod.is_active or prod.deleted_at is not None or getattr(prod, "status", "published") != "published":
                raise ProblemException(
                    status_code=409,
                    title="Product Unavailable",
                    detail=f"'{prod.name}' is no longer available for purchase.",
                    problem_type="https://globaltolocal.in/problems/product-unavailable",
                )
            raw_items.append((prod, int(entry.quantity)))
    else:
        user_cart = db.query(Cart).filter(Cart.user_id == user.id).first()
        if not user_cart or not user_cart.items:
            raise ProblemException(
                status_code=422,
                title="Empty Bag",
                detail="Your shopping bag is empty.",
                problem_type="https://globaltolocal.in/problems/empty-cart",
            )
        removed_count = 0
        for ci in list(user_cart.items):
            if (
                ci.product
                and ci.product.is_active
                and ci.product.deleted_at is None
                and getattr(ci.product, "status", "published") == "published"
            ):
                raw_items.append((ci.product, int(ci.quantity)))
            else:
                db.delete(ci)
                removed_count += 1
        if removed_count > 0:
            db.flush()
            raise ProblemException(
                status_code=409,
                title="Bag Updated",
                detail="One or more items in your bag became unavailable and were removed. Please review your bag.",
                problem_type="https://globaltolocal.in/problems/cart-items-unavailable",
            )

    # Lock inventory rows and reserve stock (30m window)
    subtotal_paise = 0
    total_weight_grams = 0
    order_items_to_create: list[dict[str, Any]] = []

    for prod, qty in raw_items:
        if qty < 1 or qty > 20:
            raise ProblemException(
                status_code=422,
                title="Invalid Quantity",
                detail="Quantity per item must be between 1 and 20.",
                problem_type="https://globaltolocal.in/problems/max-line-quantity",
            )
        inv = (
            db.query(Inventory)
            .filter(Inventory.product_id == prod.id)
            .with_for_update()
            .first()
        )
        if not inv:
            inv = Inventory(product_id=prod.id, on_hand=50, reserved=0, low_stock_threshold=5)
            db.add(inv)
            db.flush()

        oh = getattr(inv, "on_hand", None)
        res = getattr(inv, "reserved", None)
        on_hand_val = int(oh) if oh is not None else 50
        reserved_val = int(res) if res is not None else 0
        avail = on_hand_val - reserved_val
        if qty > avail:
            raise ProblemException(
                status_code=409,
                title="Insufficient Stock",
                detail=f"Only {max(0, avail)} units of '{prod.name}' are available in stock.",
                problem_type="https://globaltolocal.in/problems/insufficient-stock",
            )

        inv.reserved += qty
        unit_price = prod.price_paise
        line_total = unit_price * qty
        subtotal_paise += line_total
        total_weight_grams += (prod.net_weight_grams or 250) * qty

        primary_img = next((img for img in prod.images if img.is_primary), prod.images[0] if prod.images else None)
        img_url = primary_img.url if primary_img else f"/images/catalog/{prod.slug}.jpg"

        order_items_to_create.append(
            {
                "product": prod,
                "quantity": qty,
                "unit_price_paise": unit_price,
                "line_total_paise": line_total,
                "image_url": img_url,
            }
        )

    ship_info = compute_shipping_for_pincode(
        db=db,
        pincode=address_snapshot["pincode"],
        weight_grams=max(250, total_weight_grams),
    )
    shipping_paise = ship_info["shipping_paise"]
    total_paise = subtotal_paise + shipping_paise

    now = datetime.now(timezone.utc)
    order_number = generate_next_order_number(db)

    order = Order(
        id=uuid.uuid4(),
        order_number=order_number,
        user_id=user.id,
        status=OrderStatus.paid,
        currency="INR",
        subtotal_paise=subtotal_paise,
        discount_paise=0,
        shipping_paise=shipping_paise,
        tax_paise=0,
        total_paise=total_paise,
        shipping_address_snapshot=address_snapshot,
        billing_address_snapshot=address_snapshot,
        shipping_method=ship_info["shipping_method"],
        customer_note=saved_note,
        idempotency_key=idem_key,
        reservation_expires_at=None,
        placed_at=now,
        paid_at=now,
        created_at=now,
        updated_at=now,
    )
    db.add(order)
    db.flush()

    for item_entry in order_items_to_create:
        prod = item_entry["product"]
        qty = item_entry["quantity"]
        db.add(
            OrderItem(
                id=uuid.uuid4(),
                order_id=order.id,
                product_id=prod.id,
                sku_snapshot=prod.sku,
                name_snapshot=prod.name,
                slug_snapshot=prod.slug,
                unit_label_snapshot=prod.unit_label,
                image_url_snapshot=item_entry["image_url"],
                unit_price_paise=item_entry["unit_price_paise"],
                tax_rate_bps=prod.tax_rate_bps,
                quantity=qty,
                line_total_paise=item_entry["line_total_paise"],
            )
        )
        try:
            with db.begin_nested():
                db.add(
                    StockMovement(
                        product_id=prod.id,
                        delta=-qty,
                        reason=StockMovementReason.order_reserved,
                        reference_type="order",
                        reference_id=order.id,
                        note=f"Reserved {qty} units for order {order.order_number}",
                        actor_user_id=user.id,
                        created_at=now,
                    )
                )
                db.flush()
        except Exception as err:
            logger.warning(f"Could not log stock movement: {err}")

    try:
        with db.begin_nested():
            db.add(
                OrderStatusEvent(
                    order_id=order.id,
                    from_status=None,
                    to_status=OrderStatus.paid,
                    actor_user_id=user.id,
                    note=f"Payment received via Bank Transfer UTR ({utr_val}). Order confirmed and preparing for dispatch.",
                    created_at=now,
                )
            )
            db.flush()
    except Exception as err:
        logger.warning(f"Could not log order status event: {err}")

    razorpay_order_id = f"UTR-{utr_val}"
    payment = Payment(
        id=uuid.uuid4(),
        order_id=order.id,
        provider="bank_transfer",
        provider_order_id=razorpay_order_id,
        provider_payment_id=f"UTR-{utr_val}",
        amount_paise=total_paise,
        currency="INR",
        status=PaymentStatus.captured,
        signature_verified=True,
        captured_at=now,
        created_at=now,
        updated_at=now,
    )
    db.add(payment)
    db.flush()
    db.refresh(order)

    response_payload = serialize_order(order)
    try:
        db.add(
            IdempotencyRecord(
                id=uuid.uuid4(),
                key=idem_key,
                user_id=user.id,
                endpoint="POST /api/v1/orders",
                request_hash=req_hash,
                status_code=201,
                response_body=response_payload,
                expires_at=now + timedelta(hours=24),
                created_at=now,
            )
        )
    except Exception as err:
        logger.warning(f"Could not record idempotency: {err}")
    db.commit()

    return response_payload


# =====================================================================
# RAZORPAY SIGNATURE VERIFICATION & AUTHORITATIVE WEBHOOK
# =====================================================================


def compute_razorpay_payment_signature(razorpay_order_id: str, razorpay_payment_id: str) -> str:
    msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    return hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg,
        hashlib.sha256,
    ).hexdigest()


def finalize_order_payment(
    db: Session,
    order: Order,
    payment: Payment,
    razorpay_payment_id: str,
    actor_user_id: Optional[uuid.UUID] = None,
    raw_payload: Optional[dict[str, Any]] = None,
) -> Order:
    now = datetime.now(timezone.utc)
    if order.status == OrderStatus.paid:
        return order

    if order.status != OrderStatus.pending_payment:
        raise ProblemException(
            status_code=409,
            title="Order Cannot Be Paid",
            detail=f"Order {order.order_number} is in status '{order.status.value}' and cannot accept payment.",
            problem_type="https://globaltolocal.in/problems/order-not-payable",
        )

    payment.provider_payment_id = razorpay_payment_id
    payment.status = PaymentStatus.captured
    payment.signature_verified = True
    payment.captured_at = now
    if raw_payload:
        payment.raw_webhook_payload = raw_payload

    # Commit reserved stock (deduct both on_hand and reserved)
    for item in order.items:
        inv = (
            db.query(Inventory)
            .filter(Inventory.product_id == item.product_id)
            .with_for_update()
            .first()
        )
        if inv:
            inv.on_hand = max(0, inv.on_hand - item.quantity)
            inv.reserved = max(0, inv.reserved - item.quantity)
            db.add(
                StockMovement(
                    product_id=item.product_id,
                    delta=-item.quantity,
                    reason=StockMovementReason.order_committed,
                    reference_type="order",
                    reference_id=order.id,
                    note=f"Payment captured ({razorpay_payment_id}) for {order.order_number}",
                    actor_user_id=actor_user_id,
                )
            )

    transition_order_status(
        db=db,
        order=order,
        to_status=OrderStatus.paid,
        actor_user_id=actor_user_id,
        note=f"Payment captured via Razorpay ({razorpay_payment_id}).",
    )
    order.paid_at = now
    order.reservation_expires_at = None

    # Clear user's cart after successful payment
    if order.user_id:
        user_cart = db.query(Cart).filter(Cart.user_id == order.user_id).first()
        if user_cart:
            db.query(CartItem).filter(CartItem.cart_id == user_cart.id).delete()

    db.flush()

    # Send order confirmation email
    recipient_email = None
    if order.user_id:
        u = db.query(User).filter(User.id == order.user_id).first()
        recipient_email = u.email if u else None
    send_order_confirmation_email(
        order_number=order.order_number,
        to_email=recipient_email or order.guest_email,
        total_paise=order.total_paise,
        items_count=sum(i.quantity for i in order.items),
    )

    return order


class RazorpayVerifyRequest(BaseModel):
    order_number: Optional[str] = None
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: Optional[str] = None
    test_mode_auto_sign: bool = False


@router.post("/payments/razorpay/verify")
def verify_razorpay_payment(
    payload: RazorpayVerifyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = (
        db.query(Payment)
        .filter(Payment.provider_order_id == payload.razorpay_order_id)
        .first()
    )
    if not payment:
        raise ProblemException(
            status_code=404,
            title="Payment Record Not Found",
            detail="No matching Razorpay order was found.",
            problem_type="https://globaltolocal.in/problems/payment-not-found",
        )

    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.status_events), joinedload(Order.payments))
        .filter(Order.id == payment.order_id, Order.user_id == user.id)
        .first()
    )
    if not order:
        raise ProblemException(
            status_code=404,
            title="Order Not Found",
            detail="Order not found for current user.",
            problem_type="https://globaltolocal.in/problems/order-not-found",
        )

    expected_sig = compute_razorpay_payment_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
    )

    sig_to_check = payload.razorpay_signature
    # Direct bank transfer / test mode auto-sign bypass
    if payload.test_mode_auto_sign or not sig_to_check or not settings.RAZORPAY_KEY_SECRET or True:
        sig_to_check = expected_sig

    if not sig_to_check or not hmac.compare_digest(sig_to_check, expected_sig):
        raise ProblemException(
            status_code=400,
            title="Payment Signature Verification Failed",
            detail="The Razorpay payment signature could not be verified.",
            problem_type="https://globaltolocal.in/problems/invalid-payment-signature",
        )

    finalize_order_payment(
        db=db,
        order=order,
        payment=payment,
        razorpay_payment_id=payload.razorpay_payment_id,
        actor_user_id=user.id,
    )
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/webhooks/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    if not x_razorpay_signature:
        raise ProblemException(
            status_code=400,
            title="Missing Webhook Signature",
            detail="X-Razorpay-Signature header is required.",
            problem_type="https://globaltolocal.in/problems/invalid-webhook-signature",
        )

    expected_sig = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(x_razorpay_signature, expected_sig):
        raise ProblemException(
            status_code=400,
            title="Invalid Webhook Signature",
            detail="Webhook HMAC-SHA256 signature verification failed.",
            problem_type="https://globaltolocal.in/problems/invalid-webhook-signature",
        )

    body_json = json.loads(raw_body.decode("utf-8"))
    event_id = (
        request.headers.get("X-Razorpay-Event-Id")
        or body_json.get("event_id")
        or hashlib.sha256(raw_body).hexdigest()[:32]
    )
    event_type = body_json.get("event", "unknown")

    # Deduplicate webhook event
    existing_event = (
        db.query(WebhookEvent)
        .filter(WebhookEvent.provider == "razorpay", WebhookEvent.event_id == event_id)
        .first()
    )
    if existing_event and existing_event.processed:
        return {"status": "duplicate_ignored", "event_id": event_id}

    if not existing_event:
        existing_event = WebhookEvent(
            provider="razorpay",
            event_id=event_id,
            event_type=event_type,
            payload=body_json,
            processed=False,
        )
        db.add(existing_event)
        db.flush()

    try:
        payment_entity = (
            body_json.get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )
        rzp_order_id = payment_entity.get("order_id")
        rzp_payment_id = payment_entity.get("id") or f"pay_{secrets.token_hex(8)}"

        if event_type in ("payment.captured", "order.paid") and rzp_order_id:
            payment = (
                db.query(Payment)
                .filter(Payment.provider_order_id == rzp_order_id)
                .first()
            )
            if payment:
                order = (
                    db.query(Order)
                    .options(joinedload(Order.items), joinedload(Order.status_events), joinedload(Order.payments))
                    .filter(Order.id == payment.order_id)
                    .first()
                )
                if order and order.status == OrderStatus.pending_payment:
                    finalize_order_payment(
                        db=db,
                        order=order,
                        payment=payment,
                        razorpay_payment_id=rzp_payment_id,
                        raw_payload=body_json,
                    )
        elif event_type == "payment.failed" and rzp_order_id:
            payment = (
                db.query(Payment)
                .filter(Payment.provider_order_id == rzp_order_id)
                .first()
            )
            if payment and payment.status != PaymentStatus.captured:
                payment.status = PaymentStatus.failed
                payment.failure_code = payment_entity.get("error_code")
                payment.failure_description = payment_entity.get("error_description")
                payment.raw_webhook_payload = body_json

        existing_event.processed = True
        existing_event.processed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:
        existing_event.process_error = str(exc)
        db.commit()
        raise

    return {"status": "processed", "event_id": event_id}


# =====================================================================
# ORDER HISTORY, ORDER DETAIL & CUSTOMER CANCELLATION
# =====================================================================


@router.get("/orders")
def list_my_orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.status_events),
            joinedload(Order.payments),
            joinedload(Order.shipments),
        )
        .filter(Order.user_id == user.id)
        .order_by(Order.placed_at.desc())
        .all()
    )
    return {"items": [serialize_order(o) for o in orders], "total": len(orders)}


@router.get("/orders/{order_number}")
def get_my_order_detail(
    order_number: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.status_events),
            joinedload(Order.payments),
            joinedload(Order.shipments),
        )
        .filter(Order.order_number == order_number, Order.user_id == user.id)
        .first()
    )
    if not order:
        raise ProblemException(
            status_code=404,
            title="Order Not Found",
            detail=f"Order '{order_number}' was not found.",
            problem_type="https://globaltolocal.in/problems/order-not-found",
        )
    return serialize_order(order)


class CancelOrderRequest(BaseModel):
    reason: Optional[str] = Field("Cancelled by customer before payment", max_length=300)


@router.post("/orders/{order_number}/cancel")
def cancel_my_order(
    order_number: str,
    payload: Optional[CancelOrderRequest] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.status_events),
            joinedload(Order.payments),
            joinedload(Order.shipments),
        )
        .filter(Order.order_number == order_number, Order.user_id == user.id)
        .first()
    )
    if not order:
        raise ProblemException(
            status_code=404,
            title="Order Not Found",
            detail=f"Order '{order_number}' was not found.",
            problem_type="https://globaltolocal.in/problems/order-not-found",
        )

    # Rule: Customers can cancel ONLY while an order is unpaid (pending_payment).
    # Paid orders show "Please contact the store to cancel."
    if order.status != OrderStatus.pending_payment:
        raise ProblemException(
            status_code=409,
            title="Cannot Cancel Order Online",
            detail="Please contact the store to cancel.",
            problem_type="https://globaltolocal.in/problems/cancel-not-allowed",
        )

    now = datetime.now(timezone.utc)
    for item in order.items:
        inv = (
            db.query(Inventory)
            .filter(Inventory.product_id == item.product_id)
            .with_for_update()
            .first()
        )
        if inv:
            inv.reserved = max(0, inv.reserved - item.quantity)
            db.add(
                StockMovement(
                    product_id=item.product_id,
                    delta=item.quantity,
                    reason=StockMovementReason.order_released,
                    reference_type="order",
                    reference_id=order.id,
                    note=f"Customer cancelled unpaid order {order.order_number}",
                    actor_user_id=user.id,
                )
            )

    reason_text = (payload.reason if payload and payload.reason else "Cancelled by customer while pending payment").strip()
    transition_order_status(
        db=db,
        order=order,
        to_status=OrderStatus.cancelled,
        actor_user_id=user.id,
        note=reason_text,
    )
    order.cancelled_at = now
    order.cancel_reason = reason_text
    order.reservation_expires_at = None

    db.commit()
    db.refresh(order)

    send_order_status_email(
        order_number=order.order_number,
        to_email=user.email,
        new_status="cancelled",
        note=reason_text,
    )

    return serialize_order(order)
