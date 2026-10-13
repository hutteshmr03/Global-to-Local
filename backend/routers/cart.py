import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from backend.config import settings
from backend.core.errors import ProblemException
from backend.core.security import CART_SESSION_COOKIE_NAME
from backend.database import get_db
from backend.deps import get_current_user, get_current_user_optional
from backend.models import AvailabilityState, Cart, CartItem, Product, User

router = APIRouter(prefix="/api/v1/cart", tags=["Cart & Bag"])

MAX_LINE_QUANTITY = 20


def resolve_product(
    db: Session,
    product_ref: Union[str, int],
) -> Product:
    prod: Optional[Product] = None
    ref_str = str(product_ref).strip()

    # Try integer legacy_id first if numeric
    if ref_str.isdigit():
        prod = (
            db.query(Product)
            .options(joinedload(Product.inventory), joinedload(Product.images), joinedload(Product.category))
            .filter(Product.legacy_id == int(ref_str), Product.is_active == True, Product.deleted_at.is_(None))  # noqa: E712
            .first()
        )
    if not prod:
        try:
            u = uuid.UUID(ref_str)
            prod = (
                db.query(Product)
                .options(joinedload(Product.inventory), joinedload(Product.images), joinedload(Product.category))
                .filter(Product.id == u, Product.is_active == True, Product.deleted_at.is_(None))  # noqa: E712
                .first()
            )
        except ValueError:
            pass
    if not prod:
        prod = (
            db.query(Product)
            .options(joinedload(Product.inventory), joinedload(Product.images), joinedload(Product.category))
            .filter(
                (Product.slug == ref_str) | (Product.sku == ref_str),
                Product.is_active == True,  # noqa: E712
                Product.deleted_at.is_(None),
            )
            .first()
        )
    if not prod:
        raise ProblemException(
            status_code=404,
            title="Product Not Found",
            detail=f"Product '{product_ref}' was not found or is unavailable.",
            problem_type="https://globaltolocal.in/problems/product-not-found",
        )
    return prod


def get_available_stock(prod: Product) -> int:
    if not prod.is_active or prod.availability == AvailabilityState.out_of_stock:
        return 0
    if prod.inventory is None:
        return 50
    return max(0, prod.inventory.on_hand - prod.inventory.reserved)


def get_or_create_cart(
    db: Session,
    user: Optional[User],
    request: Request,
    response: Optional[Response] = None,
) -> Cart:
    now = datetime.now(timezone.utc)
    if user:
        cart = (
            db.query(Cart)
            .options(
                joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
                joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.inventory),
                joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.category),
            )
            .filter(Cart.user_id == user.id)
            .first()
        )
        if not cart:
            cart = Cart(
                user_id=user.id,
                expires_at=now + timedelta(days=30),
            )
            db.add(cart)
            db.flush()
        return cart

    session_token = (
        request.cookies.get(CART_SESSION_COOKIE_NAME)
        or request.headers.get("X-Cart-Session")
    )
    cart = None
    if session_token:
        cart = (
            db.query(Cart)
            .options(
                joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
                joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.inventory),
                joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.category),
            )
            .filter(Cart.session_token == session_token, Cart.user_id.is_(None))
            .first()
        )
    if not cart:
        new_token = session_token or secrets.token_urlsafe(32)
        cart = Cart(
            user_id=None,
            session_token=new_token,
            expires_at=now + timedelta(days=30),
        )
        db.add(cart)
        db.flush()
        if response is not None:
            response.set_cookie(
                key=CART_SESSION_COOKIE_NAME,
                value=new_token,
                httponly=True,
                secure=settings.COOKIE_SECURE,
                samesite="lax",
                max_age=30 * 86400,
                path="/",
            )
    return cart


def serialize_cart(cart: Cart) -> dict[str, Any]:
    items_out: list[dict[str, Any]] = []
    subtotal_paise = 0
    total_qty = 0
    total_weight_grams = 0

    for ci in cart.items:
        prod = ci.product
        if not prod or not prod.is_active or prod.deleted_at is not None:
            continue
        # Server always takes current price from database
        unit_price = prod.price_paise
        if ci.unit_price_paise != unit_price:
            ci.unit_price_paise = unit_price

        line_total = unit_price * ci.quantity
        subtotal_paise += line_total
        total_qty += ci.quantity
        total_weight_grams += (prod.net_weight_grams or 250) * ci.quantity

        primary_img = next((img for img in prod.images if img.is_primary), prod.images[0] if prod.images else None)
        img_url = primary_img.url if primary_img else "/images/catalog/goan-themed-blue-mug.jpg"
        img_alt = primary_img.alt_text if primary_img else prod.name
        avail = get_available_stock(prod)

        items_out.append(
            {
                "item_id": str(ci.id),
                "product_id": str(prod.id),
                "id": prod.legacy_id if prod.legacy_id is not None else str(prod.id),
                "legacy_id": prod.legacy_id,
                "sku": prod.sku,
                "slug": prod.slug,
                "name": prod.name,
                "quantity": ci.quantity,
                "qty": ci.quantity,
                "unit_price_paise": unit_price,
                "line_total_paise": line_total,
                "unit_label": prod.unit_label,
                "net_weight_grams": prod.net_weight_grams,
                "available_quantity": avail,
                "image_url": img_url,
                # Frontend compatibility keys
                "price": unit_price,
                "weight": prod.unit_label,
                "imageSrc": img_url,
                "imageAlt": img_alt,
                "categorySlug": prod.category.slug if prod.category else "",
                "inStock": avail > 0,
            }
        )

    return {
        "id": str(cart.id),
        "user_id": str(cart.user_id) if cart.user_id else None,
        "items": items_out,
        "item_count": total_qty,
        "subtotal_paise": subtotal_paise,
        "total_weight_grams": total_weight_grams,
    }


def merge_guest_cart_into_user_cart(
    db: Session,
    user: User,
    session_token: Optional[str] = None,
    guest_items: Optional[list[dict[str, Any]]] = None,
) -> Cart:
    now = datetime.now(timezone.utc)
    user_cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    if not user_cart:
        user_cart = Cart(user_id=user.id, expires_at=now + timedelta(days=30))
        db.add(user_cart)
        db.flush()

    existing_by_product: dict[uuid.UUID, CartItem] = {
        ci.product_id: ci for ci in user_cart.items
    }

    # 1. Merge guest session cart in DB if present
    if session_token:
        guest_cart = (
            db.query(Cart)
            .filter(Cart.session_token == session_token, Cart.user_id.is_(None))
            .first()
        )
        if guest_cart:
            for g_item in list(guest_cart.items):
                prod = g_item.product
                if not prod or not prod.is_active:
                    continue
                avail = get_available_stock(prod)
                if avail <= 0:
                    continue
                if prod.id in existing_by_product:
                    target = existing_by_product[prod.id]
                    target.quantity = min(MAX_LINE_QUANTITY, avail, target.quantity + g_item.quantity)
                    target.unit_price_paise = prod.price_paise
                else:
                    capped_qty = min(MAX_LINE_QUANTITY, avail, g_item.quantity)
                    if capped_qty >= 1:
                        new_ci = CartItem(
                            cart_id=user_cart.id,
                            product_id=prod.id,
                            quantity=capped_qty,
                            unit_price_paise=prod.price_paise,
                        )
                        db.add(new_ci)
                        existing_by_product[prod.id] = new_ci
            db.delete(guest_cart)
            db.flush()

    # 2. Merge guest localStorage items array if provided
    if guest_items:
        for entry in guest_items:
            prod_ref = entry.get("product_id") or entry.get("id") or entry.get("slug")
            raw_qty = int(entry.get("quantity") or 0)
            if not prod_ref or raw_qty <= 0:
                continue
            try:
                prod = resolve_product(db, prod_ref)
            except ProblemException:
                continue
            avail = get_available_stock(prod)
            if avail <= 0:
                continue
            if prod.id in existing_by_product:
                target = existing_by_product[prod.id]
                target.quantity = min(MAX_LINE_QUANTITY, avail, max(target.quantity, raw_qty))
                target.unit_price_paise = prod.price_paise
            else:
                capped_qty = min(MAX_LINE_QUANTITY, avail, raw_qty)
                if capped_qty >= 1:
                    new_ci = CartItem(
                        cart_id=user_cart.id,
                        product_id=prod.id,
                        quantity=capped_qty,
                        unit_price_paise=prod.price_paise,
                    )
                    db.add(new_ci)
                    existing_by_product[prod.id] = new_ci

    db.flush()
    db.refresh(user_cart)
    return user_cart


class CartItemAddRequest(BaseModel):
    product_id: Union[str, int]
    quantity: int = Field(1, ge=1)


class CartItemUpdateRequest(BaseModel):
    quantity: int = Field(..., ge=0)


class CartMergeRequest(BaseModel):
    items: list[dict[str, Any]] = Field(default_factory=list)


@router.get("")
def get_cart(
    request: Request,
    response: Response,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    cart = get_or_create_cart(db, user, request, response)
    db.commit()
    return serialize_cart(cart)


@router.post("/items")
def add_item_to_cart(
    payload: CartItemAddRequest,
    request: Request,
    response: Response,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    if payload.quantity > MAX_LINE_QUANTITY:
        raise ProblemException(
            status_code=422,
            title="Maximum Quantity Exceeded",
            detail=f"You can add at most {MAX_LINE_QUANTITY} units of a single product.",
            problem_type="https://globaltolocal.in/problems/max-line-quantity",
        )

    prod = resolve_product(db, payload.product_id)
    avail = get_available_stock(prod)
    if avail <= 0:
        raise ProblemException(
            status_code=409,
            title="Out of Stock",
            detail=f"'{prod.name}' is currently out of stock.",
            problem_type="https://globaltolocal.in/problems/out-of-stock",
        )

    cart = get_or_create_cart(db, user, request, response)
    existing = (
        db.query(CartItem)
        .filter(CartItem.cart_id == cart.id, CartItem.product_id == prod.id)
        .first()
    )
    new_qty = (existing.quantity if existing else 0) + payload.quantity
    if new_qty > MAX_LINE_QUANTITY:
        raise ProblemException(
            status_code=422,
            title="Maximum Quantity Exceeded",
            detail=f"Maximum {MAX_LINE_QUANTITY} pieces per item allowed in your bag.",
            problem_type="https://globaltolocal.in/problems/max-line-quantity",
        )
    if new_qty > avail:
        raise ProblemException(
            status_code=409,
            title="Insufficient Stock",
            detail=f"Only {avail} units of '{prod.name}' are available in stock.",
            problem_type="https://globaltolocal.in/problems/insufficient-stock",
        )

    if existing:
        existing.quantity = new_qty
        existing.unit_price_paise = prod.price_paise
    else:
        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=prod.id,
                quantity=new_qty,
                unit_price_paise=prod.price_paise,
            )
        )

    db.commit()
    db.refresh(cart)
    return serialize_cart(cart)


@router.patch("/items/{item_ref}")
def update_cart_item(
    item_ref: str,
    payload: CartItemUpdateRequest,
    request: Request,
    response: Response,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    if payload.quantity > MAX_LINE_QUANTITY:
        raise ProblemException(
            status_code=422,
            title="Maximum Quantity Exceeded",
            detail=f"Maximum {MAX_LINE_QUANTITY} pieces per item allowed in your bag.",
            problem_type="https://globaltolocal.in/problems/max-line-quantity",
        )

    cart = get_or_create_cart(db, user, request, response)
    ci: Optional[CartItem] = None

    # Allow lookup by cart_item UUID OR by product legacy_id/UUID/slug
    try:
        item_uuid = uuid.UUID(item_ref)
        ci = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.id == item_uuid).first()
    except ValueError:
        pass

    if not ci:
        prod = resolve_product(db, item_ref)
        ci = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.product_id == prod.id).first()
        if not ci and payload.quantity > 0:
            avail = get_available_stock(prod)
            if payload.quantity > avail:
                raise ProblemException(
                    status_code=409,
                    title="Insufficient Stock",
                    detail=f"Only {avail} units of '{prod.name}' are available in stock.",
                    problem_type="https://globaltolocal.in/problems/insufficient-stock",
                )
            ci = CartItem(
                cart_id=cart.id,
                product_id=prod.id,
                quantity=payload.quantity,
                unit_price_paise=prod.price_paise,
            )
            db.add(ci)
            db.commit()
            db.refresh(cart)
            return serialize_cart(cart)

    if not ci:
        raise ProblemException(
            status_code=404,
            title="Bag Item Not Found",
            detail="The requested item is not in your bag.",
            problem_type="https://globaltolocal.in/problems/cart-item-not-found",
        )

    if payload.quantity <= 0:
        db.delete(ci)
    else:
        avail = get_available_stock(ci.product)
        if payload.quantity > avail:
            raise ProblemException(
                status_code=409,
                title="Insufficient Stock",
                detail=f"Only {avail} units of '{ci.product.name}' are available in stock.",
                problem_type="https://globaltolocal.in/problems/insufficient-stock",
            )
        ci.quantity = payload.quantity
        ci.unit_price_paise = ci.product.price_paise

    db.commit()
    db.refresh(cart)
    return serialize_cart(cart)


@router.delete("/items/{item_ref}")
def remove_cart_item(
    item_ref: str,
    request: Request,
    response: Response,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    cart = get_or_create_cart(db, user, request, response)
    ci: Optional[CartItem] = None
    try:
        item_uuid = uuid.UUID(item_ref)
        ci = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.id == item_uuid).first()
    except ValueError:
        pass
    if not ci:
        try:
            prod = resolve_product(db, item_ref)
            ci = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.product_id == prod.id).first()
        except ProblemException:
            ci = None
    if ci:
        db.delete(ci)
        db.commit()
        db.refresh(cart)
    return serialize_cart(cart)


@router.delete("")
def clear_cart(
    request: Request,
    response: Response,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    cart = get_or_create_cart(db, user, request, response)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(cart)
    return serialize_cart(cart)


@router.post("/merge")
def merge_cart_endpoint(
    payload: CartMergeRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session_token = request.cookies.get(CART_SESSION_COOKIE_NAME) or request.headers.get("X-Cart-Session")
    cart = merge_guest_cart_into_user_cart(
        db=db,
        user=user,
        session_token=session_token,
        guest_items=payload.items,
    )
    db.commit()
    return serialize_cart(cart)
