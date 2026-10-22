import uuid
from typing import Any, Optional
from fastapi import Depends, Request
from sqlalchemy.orm import Session
from backend.core.errors import ProblemException
from backend.core.security import (
    ACCESS_COOKIE_NAME,
    decode_access_token,
    enforce_csrf_if_cookie_auth,
)
from backend.database import get_db
from backend.models import Product, User, UserRole


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    token: Optional[str] = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif ACCESS_COOKIE_NAME in request.cookies:
        token = request.cookies.get(ACCESS_COOKIE_NAME)
        enforce_csrf_if_cookie_auth(request)

    if not token:
        return None

    payload = decode_access_token(token)
    sub = payload.get("sub")
    if not sub:
        return None
    try:
        user_uuid = uuid.UUID(str(sub))
    except ValueError:
        return None

    user = (
        db.query(User)
        .filter(User.id == user_uuid, User.deleted_at.is_(None))
        .first()
    )
    if not user or not user.is_active:
        raise ProblemException(
            status_code=401,
            title="Account Inactive",
            detail="This account has been deactivated or does not exist.",
            problem_type="https://globaltolocal.in/problems/account-inactive",
        )
    return user


def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    if not user:
        raise ProblemException(
            status_code=401,
            title="Authentication Required",
            detail="Please sign in to continue.",
            problem_type="https://globaltolocal.in/problems/unauthorized",
        )
    return user


def get_current_admin_user(
    user: User = Depends(get_current_user),
) -> User:
    if user.role != UserRole.admin or not user.is_active:
        raise ProblemException(
            status_code=403,
            title="Forbidden",
            detail="Admin privileges required to access this resource.",
            problem_type="https://globaltolocal.in/problems/forbidden",
        )
    return user


def serialize_product(prod: Product) -> dict[str, Any]:
    primary_img = None
    gallery_urls: list[str] = []
    images_list: list[dict[str, Any]] = []

    for img in prod.images:
        gallery_urls.append(img.url)
        img_dict = {
            "id": str(img.id),
            "url": img.url,
            "avif_url": img.avif_url,
            "webp_url": img.webp_url,
            "alt_text": img.alt_text,
            "width": img.width,
            "height": img.height,
            "is_primary": img.is_primary,
            "sort_order": img.sort_order,
        }
        images_list.append(img_dict)
        if img.is_primary or primary_img is None:
            primary_img = img_dict

    image_src = primary_img["url"] if primary_img else f"/images/catalog/{prod.slug}.jpg"
    if "goan-themed-blue-mug.jpg" in image_src and prod.slug != "goan-themed-blue-mug":
        image_src = f"/images/catalog/{prod.slug}.jpg"
    image_alt = primary_img["alt_text"] if primary_img else prod.name
    if not gallery_urls:
        gallery_urls = [image_src]
    else:
        gallery_urls = [
            f"/images/catalog/{prod.slug}.jpg" if ("goan-themed-blue-mug.jpg" in u and prod.slug != "goan-themed-blue-mug") else u
            for u in gallery_urls
        ]

    avail_str = prod.availability.value if hasattr(prod.availability, "value") else str(prod.availability or "in_stock")
    available_qty = 100
    if prod.inventory:
        try:
            available_qty = max(0, int(prod.inventory.on_hand) - int(prod.inventory.reserved))
        except Exception:
            available_qty = 100
    in_stock = available_qty > 0

    return {
        # Backend canonical fields
        "id": prod.legacy_id if prod.legacy_id is not None else str(prod.id),
        "uuid": str(prod.id),
        "legacy_id": prod.legacy_id,
        "sku": prod.sku,
        "slug": prod.slug,
        "name": prod.name,
        "price_paise": prod.price_paise,
        "compare_at_paise": prod.compare_at_paise,
        "tax_rate_bps": prod.tax_rate_bps,
        "unit_label": prod.unit_label,
        "net_weight_grams": prod.net_weight_grams,
        "short_description": prod.short_description or "",
        "description": prod.description or "",
        "origin_text": prod.origin_text or "Made in Goa",
        "availability": (prod.availability.value if hasattr(prod.availability, "value") else str(prod.availability or "in_stock")) if in_stock else "out_of_stock",
        "available_quantity": available_qty,
        "is_featured": prod.is_featured,
        "is_new": prod.is_new,
        "category": {
            "id": str(prod.category.id),
            "slug": prod.category.slug,
            "name": prod.category.name,
        }
        if prod.category
        else None,
        "maker": {
            "id": str(prod.maker.id),
            "slug": prod.maker.slug,
            "name": prod.maker.name,
            "village_or_ward": prod.maker.village_or_ward,
            "taluka": prod.maker.taluka,
        }
        if prod.maker
        else None,
        "primary_image": primary_img,
        "images": images_list,
        # Frontend compatibility fields so existing UI components render identically
        "price": prod.price_paise,
        "categorySlug": prod.category.slug if prod.category else "",
        "categoryName": prod.category.name if prod.category else "",
        "shortDescription": prod.short_description or "",
        "weight": prod.unit_label,
        "weightGrams": prod.net_weight_grams,
        "imageAlt": image_alt,
        "imageSrc": image_src,
        "gallery": gallery_urls,
        "inStock": in_stock,
        "featured": prod.is_featured,
        "origin": prod.origin_text or "Made in Goa",
        "made_by": prod.made_by or (prod.maker.name if prod.maker else None),
        "madeBy": prod.made_by or (prod.maker.name if prod.maker else None),
    }
