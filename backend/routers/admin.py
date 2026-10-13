import io
import os
import uuid
from pathlib import Path
from datetime import datetime, timezone, time
from typing import Any, Optional
from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status
from PIL import Image
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session
from backend.core.errors import ProblemException
from backend.core.providers import send_order_status_email
from backend.database import get_db
from backend.deps import get_current_admin_user, serialize_product
from backend.models import (
    Address,
    AuditLog,
    AvailabilityState,
    Category,
    Enquiry,
    EnquiryStatus,
    EnquiryType,
    Inventory,
    Order,
    OrderItem,
    OrderInternalNote,
    OrderStatus,
    OrderStatusEvent,
    Payment,
    PriceChange,
    Product,
    ProductImage,
    Shipment,
    ShipmentStatus,
    User,
    UserRole,
    UserSession,
)

router = APIRouter(prefix="/api/v1/admin", tags=["Admin Back Office"])


# =====================================================================
# PRIORITY 1: ADMIN IDENTITY & GUARD
# =====================================================================

@router.get("/me")
def get_admin_me(
    admin: User = Depends(get_current_admin_user),
) -> dict[str, Any]:
    return {
        "id": str(admin.id),
        "email": admin.email,
        "full_name": admin.full_name,
        "role": admin.role.value,
        "is_active": admin.is_active,
    }


# =====================================================================
# PRIORITY 2: ADMIN DASHBOARD METRICS
# =====================================================================

@router.get("/dashboard")
def get_admin_dashboard(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)

    # 1. Today's orders count
    today_orders_count = (
        db.query(func.count(Order.id))
        .filter(Order.placed_at >= today_start)
        .scalar()
        or 0
    )

    # 2. Pending orders count (awaiting fulfillment or payment: pending_payment, paid, packed)
    pending_orders_count = (
        db.query(func.count(Order.id))
        .filter(Order.status.in_([OrderStatus.pending_payment, OrderStatus.paid, OrderStatus.packed]))
        .scalar()
        or 0
    )

    # 3. Total revenue paise (paid, packed, shipped, delivered)
    revenue_paise = (
        db.query(func.sum(Order.total_paise))
        .filter(Order.status.in_([OrderStatus.paid, OrderStatus.packed, OrderStatus.shipped, OrderStatus.delivered]))
        .scalar()
        or 0
    )

    # 4. Active products count
    products_count = (
        db.query(func.count(Product.id))
        .filter(Product.is_active.is_(True), Product.deleted_at.is_(None))
        .scalar()
        or 0
    )

    # 5. New enquiries count
    new_enquiries_count = (
        db.query(func.count(Enquiry.id))
        .filter(Enquiry.status == EnquiryStatus.new)
        .scalar()
        or 0
    )

    # Recent 5 orders for dashboard feed
    recent_orders = (
        db.query(Order)
        .order_by(Order.placed_at.desc())
        .limit(5)
        .all()
    )

    formatted_recent = []
    for o in recent_orders:
        formatted_recent.append({
            "id": str(o.id),
            "order_number": o.order_number,
            "placed_at": o.placed_at.isoformat() if o.placed_at else None,
            "status": o.status.value,
            "total_paise": o.total_paise,
            "total_formatted": f"₹{o.total_paise / 100:.2f}".rstrip("0").rstrip("."),
            "customer_name": o.shipping_address_snapshot.get("recipient_name") or o.shipping_address_snapshot.get("name") or "Customer",
        })

    return {
        "today_orders_count": today_orders_count,
        "pending_orders_count": pending_orders_count,
        "revenue_paise": revenue_paise,
        "revenue_formatted": f"₹{revenue_paise / 100:.2f}".rstrip("0").rstrip("."),
        "products_count": products_count,
        "new_enquiries_count": new_enquiries_count,
        "recent_orders": formatted_recent,
    }


# =====================================================================
# PRIORITY 3: ADMIN PRODUCTS, PRICE EDITING & AUDIT LOGS
# =====================================================================

class AdminPriceChangePayload(BaseModel):
    new_price_paise: int = Field(..., gt=0, description="New price in paise (must be strictly positive)")
    reason: str = Field(..., min_length=3, description="Mandatory reason for audit trail")


class AdminStockChangePayload(BaseModel):
    stock_qty: int = Field(..., ge=0, description="On-hand stock quantity")
    reason: Optional[str] = Field("Manual adjustment", description="Stock adjustment reason")


class AdminStatusChangePayload(BaseModel):
    is_active: bool


class AdminProductImageIn(BaseModel):
    url: Optional[str] = None
    image_url: Optional[str] = None
    alt_text: str = Field(default="", max_length=200)
    is_primary: bool = False
    sort_order: int = 0


class AdminCreateProductPayload(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=160)
    sku: str = Field(..., min_length=1, max_length=64)
    shelf: Optional[str] = None
    shelf_slug: Optional[str] = None
    category_id: Optional[str] = None
    category_slug: Optional[str] = None
    price_rupees: Optional[float] = None
    price_paise: Optional[int] = None
    compare_at_paise: Optional[int] = None
    unit_label: str = Field(default="1 unit", max_length=60)
    net_weight_grams: Optional[int] = None
    weight_grams: Optional[int] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    origin_text: Optional[str] = None
    origin: Optional[str] = None
    stock_qty: int = Field(default=50, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    is_featured: bool = False
    status: str = Field(default="published")
    images: list[AdminProductImageIn] = Field(default_factory=list)


class AdminUpdateProductPayload(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=160)
    sku: Optional[str] = Field(None, min_length=1, max_length=64)
    shelf: Optional[str] = None
    shelf_slug: Optional[str] = None
    category_id: Optional[str] = None
    category_slug: Optional[str] = None
    price_rupees: Optional[float] = None
    price_paise: Optional[int] = None
    unit_label: Optional[str] = Field(None, max_length=60)
    net_weight_grams: Optional[int] = None
    weight_grams: Optional[int] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    origin_text: Optional[str] = None
    origin: Optional[str] = None
    stock_qty: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    is_featured: Optional[bool] = None
    status: Optional[str] = None
    images: Optional[list[AdminProductImageIn]] = None


@router.get("/products")
def list_admin_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=300),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    query = db.query(Product).filter(Product.deleted_at.is_(None))

    if category and category != "all":
        query = query.join(Category).filter(Category.slug == category)

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Product.name).ilike(term),
                func.lower(Product.sku).ilike(term),
                func.lower(Product.slug).ilike(term),
            )
        )

    total = query.count()
    items = query.order_by(Product.created_at.desc(), Product.name.asc()).offset((page - 1) * page_size).limit(page_size).all()

    serialized = []
    for p in items:
        inv = p.inventory
        serialized.append({
            "id": str(p.id),
            "sku": p.sku,
            "slug": p.slug,
            "name": p.name,
            "price_paise": p.price_paise,
            "price_formatted": f"₹{p.price_paise / 100:.2f}".rstrip("0").rstrip("."),
            "stock_qty": inv.on_hand if inv else 50,
            "reserved_qty": inv.reserved if inv else 0,
            "is_active": p.is_active,
            "status": "published" if p.is_active else "draft",
            "category_name": p.category.name if p.category else "Uncategorized",
            "category_slug": p.category.slug if p.category else "",
            "unit_label": p.unit_label,
            "net_weight_grams": p.net_weight_grams,
            "description": p.description or "",
            "origin_text": p.origin_text or "Made in Goa",
            "is_featured": p.is_featured,
            "image_url": p.images[0].url if p.images else "/images/catalog/goan-themed-blue-mug.jpg",
            "images": [
                {
                    "id": str(img.id),
                    "url": img.url,
                    "alt_text": img.alt_text,
                    "is_primary": img.is_primary,
                    "sort_order": img.sort_order,
                }
                for img in p.images
            ],
        })

    return {
        "items": serialized,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/products/next-sku")
def get_next_suggested_sku(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    skus = db.query(Product.sku).filter(Product.deleted_at.is_(None)).all()
    gtl_nums = []
    for (s,) in skus:
        if s and s.upper().startswith("GTL-"):
            parts = s.split("-")
            if len(parts) >= 2 and parts[1].isdigit():
                gtl_nums.append(int(parts[1]))
    next_num = (max(gtl_nums) + 1) if gtl_nums else 1001
    return {"suggested_sku": f"GTL-{next_num:04d}"}


@router.post("/products/images")
async def upload_product_image(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user),
) -> dict[str, Any]:
    content = await file.read()
    if len(content) == 0:
        raise ProblemException(
            status_code=422,
            title="Empty File",
            detail="The uploaded file is empty.",
            problem_type="https://globaltolocal.in/problems/invalid-image",
        )
    if len(content) > 5 * 1024 * 1024:
        raise ProblemException(
            status_code=422,
            title="File Too Large",
            detail="Image size exceeds maximum allowed 5 MB.",
            problem_type="https://globaltolocal.in/problems/file-too-large",
        )
    try:
        img = Image.open(io.BytesIO(content))
        fmt = (img.format or "").upper()
        if fmt not in ["JPEG", "JPG", "PNG", "WEBP"]:
            raise ProblemException(
                status_code=422,
                title="Unsupported Image Format",
                detail=f"Only JPG, PNG, and WebP images are allowed. Received '{fmt or 'unknown'}'.",
                problem_type="https://globaltolocal.in/problems/unsupported-image-type",
            )
        img.verify()
        img = Image.open(io.BytesIO(content))
    except ProblemException:
        raise
    except Exception:
        raise ProblemException(
            status_code=422,
            title="Invalid Image",
            detail="The uploaded file could not be decoded as a valid image.",
            problem_type="https://globaltolocal.in/problems/invalid-image",
        )

    # Convert mode for safe web output
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.mode else "RGB")

    # Resize to web-friendly dimensions if huge
    orig_w, orig_h = img.size
    if orig_w > 1200 or orig_h > 1200:
        img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)

    token = uuid.uuid4().hex[:16]
    out_filename = f"prod_{token}.webp"
    uploads_dir = Path("public/images/uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    out_path = uploads_dir / out_filename
    img.save(out_path, format="WEBP", quality=85, method=6)

    return {
        "status": "success",
        "url": f"/images/uploads/{out_filename}",
        "width": img.width,
        "height": img.height,
        "format": "webp",
    }


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_admin_product(
    payload: AdminCreateProductPayload,
    request: Request,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    # 1. Price validation
    final_price_paise = payload.price_paise
    if final_price_paise is None and payload.price_rupees is not None:
        final_price_paise = int(round(payload.price_rupees * 100))
    if not final_price_paise or final_price_paise <= 0:
        raise ProblemException(
            status_code=422,
            title="Invalid Price",
            detail="Price must be strictly positive (greater than 0 paise).",
            problem_type="https://globaltolocal.in/problems/invalid-price",
        )

    # 2. Unique Slug validation
    clean_slug = payload.slug.strip().lower()
    if not clean_slug:
        raise ProblemException(
            status_code=422,
            title="Invalid Slug",
            detail="Slug cannot be empty.",
            problem_type="https://globaltolocal.in/problems/invalid-slug",
        )
    existing_slug = (
        db.query(Product)
        .filter(func.lower(Product.slug) == clean_slug, Product.deleted_at.is_(None))
        .first()
    )
    if existing_slug:
        raise ProblemException(
            status_code=409,
            title="Duplicate Slug",
            detail=f"Product slug '{clean_slug}' is already taken.",
            problem_type="https://globaltolocal.in/problems/duplicate-slug",
        )

    # 3. Unique SKU validation
    clean_sku = payload.sku.strip().upper()
    if not clean_sku:
        raise ProblemException(
            status_code=422,
            title="Invalid SKU",
            detail="SKU cannot be empty.",
            problem_type="https://globaltolocal.in/problems/invalid-sku",
        )
    existing_sku = (
        db.query(Product)
        .filter(func.upper(Product.sku) == clean_sku, Product.deleted_at.is_(None))
        .first()
    )
    if existing_sku:
        raise ProblemException(
            status_code=409,
            title="Duplicate SKU",
            detail=f"Product SKU '{clean_sku}' already exists.",
            problem_type="https://globaltolocal.in/problems/duplicate-sku",
        )

    # 4. Shelf / Category resolution
    category = None
    target_shelf = (payload.category_slug or payload.shelf or payload.shelf_slug or "").strip().lower()
    if payload.category_id:
        try:
            category = db.query(Category).filter(Category.id == uuid.UUID(payload.category_id)).first()
        except ValueError:
            pass
    if not category and target_shelf:
        category = (
            db.query(Category)
            .filter(
                or_(
                    func.lower(Category.slug) == target_shelf,
                    func.lower(Category.name) == target_shelf,
                )
            )
            .first()
        )
    if not category:
        raise ProblemException(
            status_code=422,
            title="Shelf Not Found",
            detail=f"Shelf '{payload.shelf or payload.category_slug or payload.shelf_slug}' is not one of the 13 shelves.",
            problem_type="https://globaltolocal.in/problems/invalid-category",
        )

    # 5. Status mapping
    status_str = payload.status.strip().lower()
    if status_str == "published":
        is_active = True
        published_at = datetime.now(timezone.utc)
        avail = AvailabilityState.in_stock if payload.stock_qty > 0 else AvailabilityState.out_of_stock
    elif status_str == "hidden":
        is_active = False
        published_at = None
        avail = AvailabilityState.archived
    else:  # draft
        is_active = False
        published_at = None
        avail = AvailabilityState.in_stock

    client_ip = request.client.host if request.client else "127.0.0.1"
    final_weight = payload.net_weight_grams or payload.weight_grams or 250
    final_origin = (payload.origin_text or payload.origin or "Made in Goa").strip()

    # 6. Create Product
    product = Product(
        name=payload.name.strip(),
        slug=clean_slug,
        sku=clean_sku,
        category_id=category.id,
        price_paise=final_price_paise,
        compare_at_paise=payload.compare_at_paise,
        unit_label=payload.unit_label.strip() or "1 unit",
        net_weight_grams=final_weight,
        description=payload.description.strip() if payload.description else None,
        short_description=payload.short_description.strip() if payload.short_description else (payload.description[:300].strip() if payload.description else None),
        origin_text=final_origin,
        is_featured=payload.is_featured,
        is_active=is_active,
        published_at=published_at,
        availability=avail,
    )
    db.add(product)
    db.flush()

    # 7. Create Inventory
    inv = Inventory(
        product_id=product.id,
        on_hand=payload.stock_qty,
        reserved=0,
        low_stock_threshold=payload.low_stock_threshold,
    )
    db.add(inv)

    # 8. Create Product Images
    if payload.images:
        has_primary = any(img.is_primary for img in payload.images)
        for idx, img_in in enumerate(payload.images):
            img_url = (img_in.url or img_in.image_url or "").strip()
            if img_url:
                db.add(
                    ProductImage(
                        product_id=product.id,
                        url=img_url,
                        alt_text=img_in.alt_text.strip() or product.name,
                        sort_order=img_in.sort_order if img_in.sort_order is not None else idx,
                        is_primary=img_in.is_primary if has_primary else (idx == 0),
                    )
                )
    else:
        db.add(
            ProductImage(
                product_id=product.id,
                url="/images/catalog/goan-themed-blue-mug.jpg",
                alt_text=product.name,
                sort_order=0,
                is_primary=True,
            )
        )

    # 9. Create Starting PriceChange row
    price_change = PriceChange(
        product_id=product.id,
        admin_user_id=admin.id,
        old_paise=0,
        new_paise=final_price_paise,
        reason="Initial product creation",
        ip=client_ip,
    )
    db.add(price_change)

    # 10. Create AuditLog row
    audit = AuditLog(
        actor_user_id=admin.id,
        action="product.create",
        entity_type="product",
        entity_id=str(product.id),
        before_state=None,
        after_state={
            "id": str(product.id),
            "sku": product.sku,
            "slug": product.slug,
            "name": product.name,
            "category_slug": category.slug,
            "price_paise": product.price_paise,
            "stock_qty": payload.stock_qty,
            "status": status_str,
            "is_active": product.is_active,
            "net_weight_grams": product.net_weight_grams,
        },
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()
    db.refresh(product)

    prod_dict = {
        "id": str(product.id),
        "sku": product.sku,
        "slug": product.slug,
        "name": product.name,
        "price_paise": product.price_paise,
        "price_formatted": f"₹{product.price_paise / 100:.2f}".rstrip("0").rstrip("."),
        "stock_qty": payload.stock_qty,
        "reserved_qty": 0,
        "is_active": product.is_active,
        "status": status_str,
        "category_name": category.name,
        "category_slug": category.slug,
        "unit_label": product.unit_label,
        "net_weight_grams": product.net_weight_grams,
        "description": product.description,
        "origin_text": product.origin_text,
        "is_featured": product.is_featured,
        "image_url": product.images[0].url if product.images else "/images/catalog/goan-themed-blue-mug.jpg",
        "images": [
            {
                "id": str(img.id),
                "url": img.url,
                "alt_text": img.alt_text,
                "is_primary": img.is_primary,
                "sort_order": img.sort_order,
            }
            for img in product.images
        ],
    }

    return {
        **prod_dict,
        "status": "success",
        "product": prod_dict,
    }


@router.put("/products/{product_id}")
def update_admin_product_details(
    product_id: str,
    payload: AdminUpdateProductPayload,
    request: Request,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        p_uuid = uuid.UUID(product_id)
        product = db.query(Product).filter(Product.id == p_uuid).first()
    except ValueError:
        product = db.query(Product).filter(Product.slug == product_id).first()

    if not product:
        raise ProblemException(status_code=404, title="Product Not Found", detail="Product does not exist.")

    before_state = {
        "name": product.name,
        "sku": product.sku,
        "slug": product.slug,
        "price_paise": product.price_paise,
        "is_active": product.is_active,
    }

    if payload.name:
        product.name = payload.name.strip()
    if payload.slug:
        clean_slug = payload.slug.strip().lower()
        if clean_slug != product.slug:
            existing = db.query(Product).filter(func.lower(Product.slug) == clean_slug, Product.id != product.id, Product.deleted_at.is_(None)).first()
            if existing:
                raise ProblemException(status_code=409, title="Duplicate Slug", detail=f"Slug '{clean_slug}' already in use.")
            product.slug = clean_slug
    if payload.sku:
        clean_sku = payload.sku.strip().upper()
        if clean_sku != product.sku:
            existing = db.query(Product).filter(func.upper(Product.sku) == clean_sku, Product.id != product.id, Product.deleted_at.is_(None)).first()
            if existing:
                raise ProblemException(status_code=409, title="Duplicate SKU", detail=f"SKU '{clean_sku}' already in use.")
            product.sku = clean_sku
    if payload.shelf or payload.category_slug or payload.shelf_slug or payload.category_id:
        target_shelf = (payload.category_slug or payload.shelf or payload.shelf_slug or "").strip().lower()
        cat = None
        if payload.category_id:
            try:
                cat = db.query(Category).filter(Category.id == uuid.UUID(payload.category_id)).first()
            except ValueError:
                pass
        if not cat and target_shelf:
            cat = db.query(Category).filter(or_(func.lower(Category.slug) == target_shelf, func.lower(Category.name) == target_shelf)).first()
        if cat:
            product.category_id = cat.id

    if payload.unit_label:
        product.unit_label = payload.unit_label.strip()
    if payload.net_weight_grams or payload.weight_grams:
        product.net_weight_grams = payload.net_weight_grams or payload.weight_grams
    if payload.description is not None:
        product.description = payload.description.strip()
    if payload.origin_text is not None or payload.origin is not None:
        product.origin_text = (payload.origin_text or payload.origin).strip()
    if payload.is_featured is not None:
        product.is_featured = payload.is_featured
    if payload.status:
        st = payload.status.strip().lower()
        if st == "published":
            product.is_active = True
            if not product.published_at:
                product.published_at = datetime.now(timezone.utc)
            product.availability = AvailabilityState.in_stock
        elif st == "hidden":
            product.is_active = False
            product.availability = AvailabilityState.archived
        else: # draft
            product.is_active = False
            product.availability = AvailabilityState.in_stock

    client_ip = request.client.host if request.client else "127.0.0.1"

    if payload.images is not None:
        db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()
        has_primary = any(img.is_primary for img in payload.images)
        for idx, img_in in enumerate(payload.images):
            img_url = (img_in.url or img_in.image_url or "").strip()
            if img_url:
                db.add(
                    ProductImage(
                        product_id=product.id,
                        url=img_url,
                        alt_text=img_in.alt_text.strip() or product.name,
                        sort_order=img_in.sort_order if img_in.sort_order is not None else idx,
                        is_primary=img_in.is_primary if has_primary else (idx == 0),
                    )
                )

    product.updated_at = datetime.now(timezone.utc)
    audit = AuditLog(
        actor_user_id=admin.id,
        action="product.update",
        entity_type="product",
        entity_id=str(product.id),
        before_state=before_state,
        after_state={
            "name": product.name,
            "sku": product.sku,
            "slug": product.slug,
            "is_active": product.is_active,
        },
        ip_address=client_ip,
    )
    db.add(audit)
    db.commit()
    db.refresh(product)

    inv = product.inventory
    prod_dict = {
        "id": str(product.id),
        "sku": product.sku,
        "slug": product.slug,
        "name": product.name,
        "price_paise": product.price_paise,
        "price_formatted": f"₹{product.price_paise / 100:.2f}".rstrip("0").rstrip("."),
        "stock_qty": inv.on_hand if inv else 50,
        "reserved_qty": inv.reserved if inv else 0,
        "is_active": product.is_active,
        "status": "published" if product.is_active else "draft",
        "category_name": product.category.name if product.category else "Uncategorized",
        "category_slug": product.category.slug if product.category else "",
        "unit_label": product.unit_label,
        "net_weight_grams": product.net_weight_grams,
        "description": product.description or "",
        "origin_text": product.origin_text or "Made in Goa",
        "is_featured": product.is_featured,
        "image_url": product.images[0].url if product.images else "/images/catalog/goan-themed-blue-mug.jpg",
        "images": [
            {
                "id": str(img.id),
                "url": img.url,
                "alt_text": img.alt_text,
                "is_primary": img.is_primary,
                "sort_order": img.sort_order,
            }
            for img in product.images
        ],
    }

    return {
        **prod_dict,
        "status": "success",
        "product_id": str(product.id),
        "product": prod_dict,
    }


@router.patch("/products/{product_id}/price")
def update_product_price(
    product_id: str,
    payload: AdminPriceChangePayload,
    request: Request,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    # Resolve product by UUID or legacy ID or slug
    product = None
    try:
        p_uuid = uuid.UUID(product_id)
        product = db.query(Product).filter(Product.id == p_uuid).first()
    except ValueError:
        pass

    if not product:
        product = db.query(Product).filter(Product.slug == product_id).first()

    if not product:
        raise ProblemException(status_code=404, title="Product Not Found", detail="Product does not exist.")

    if payload.new_price_paise <= 0:
        raise ProblemException(
            status_code=422,
            title="Invalid Price",
            detail="Price must be strictly positive (greater than 0 paise).",
            problem_type="https://globaltolocal.in/problems/invalid-price",
        )

    old_price = product.price_paise
    new_price = payload.new_price_paise
    client_ip = request.client.host if request.client else "127.0.0.1"

    # 1. Record in dedicated price_changes table
    price_change = PriceChange(
        product_id=product.id,
        admin_user_id=admin.id,
        old_paise=old_price,
        new_paise=new_price,
        reason=payload.reason.strip(),
        ip=client_ip,
    )
    db.add(price_change)

    # 2. Record in operations audit_logs table
    audit_entry = AuditLog(
        actor_user_id=admin.id,
        action="update_price",
        entity_type="product_price",
        entity_id=str(product.id),
        before_state={"price_paise": old_price},
        after_state={"price_paise": new_price, "reason": payload.reason.strip()},
        ip_address=client_ip,
    )
    db.add(audit_entry)

    # 3. Apply price change to product
    product.price_paise = new_price
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)

    pct_diff = abs(new_price - old_price) / old_price * 100

    return {
        "status": "success",
        "product_id": str(product.id),
        "sku": product.sku,
        "name": product.name,
        "old_price_paise": old_price,
        "new_price_paise": new_price,
        "old_price_formatted": f"₹{old_price / 100:.2f}".rstrip("0").rstrip("."),
        "new_price_formatted": f"₹{new_price / 100:.2f}".rstrip("0").rstrip("."),
        "percentage_change": round(pct_diff, 1),
        "warning": "Price change exceeds 25%" if pct_diff > 25 else None,
    }


@router.patch("/products/{product_id}/status")
def toggle_product_status(
    product_id: str,
    payload: AdminStatusChangePayload,
    request: Request,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        p_uuid = uuid.UUID(product_id)
        product = db.query(Product).filter(Product.id == p_uuid).first()
    except ValueError:
        product = db.query(Product).filter(Product.slug == product_id).first()

    if not product:
        raise ProblemException(status_code=404, title="Product Not Found", detail="Product does not exist.")

    old_status = product.is_active
    new_status = payload.is_active
    client_ip = request.client.host if request.client else "127.0.0.1"

    audit_entry = AuditLog(
        actor_user_id=admin.id,
        action="toggle_status",
        entity_type="product_status",
        entity_id=str(product.id),
        before_state={"is_active": old_status},
        after_state={"is_active": new_status},
        ip_address=client_ip,
    )
    db.add(audit_entry)

    product.is_active = new_status
    product.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "success",
        "product_id": str(product.id),
        "is_active": product.is_active,
    }


@router.patch("/products/{product_id}/stock")
def update_product_stock(
    product_id: str,
    payload: AdminStockChangePayload,
    request: Request,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        p_uuid = uuid.UUID(product_id)
        product = db.query(Product).filter(Product.id == p_uuid).first()
    except ValueError:
        product = db.query(Product).filter(Product.slug == product_id).first()

    if not product:
        raise ProblemException(status_code=404, title="Product Not Found", detail="Product does not exist.")

    inv = product.inventory
    if not inv:
        inv = Inventory(product_id=product.id, on_hand=payload.stock_qty, reserved=0)
        db.add(inv)
        db.flush()

    old_stock = inv.on_hand
    new_stock = payload.stock_qty
    client_ip = request.client.host if request.client else "127.0.0.1"

    audit_entry = AuditLog(
        actor_user_id=admin.id,
        action="update_stock",
        entity_type="product_stock",
        entity_id=str(product.id),
        before_state={"on_hand": old_stock},
        after_state={"on_hand": new_stock, "reason": payload.reason},
        ip_address=client_ip,
    )
    db.add(audit_entry)

    inv.on_hand = new_stock
    inv.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "success",
        "product_id": str(product.id),
        "on_hand": inv.on_hand,
        "reserved": inv.reserved,
        "available": inv.available,
    }


@router.get("/products/{product_id}/price-history")
def get_product_price_history(
    product_id: str,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    try:
        p_uuid = uuid.UUID(product_id)
        product = db.query(Product).filter(Product.id == p_uuid).first()
    except ValueError:
        product = db.query(Product).filter(Product.slug == product_id).first()

    if not product:
        raise ProblemException(status_code=404, title="Product Not Found", detail="Product does not exist.")

    history = (
        db.query(PriceChange)
        .filter(PriceChange.product_id == product.id)
        .order_by(PriceChange.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(h.id),
            "old_paise": h.old_paise,
            "new_paise": h.new_paise,
            "old_price_formatted": f"₹{h.old_paise / 100:.2f}".rstrip("0").rstrip("."),
            "new_price_formatted": f"₹{h.new_paise / 100:.2f}".rstrip("0").rstrip("."),
            "reason": h.reason,
            "ip": h.ip,
            "created_at": h.created_at.isoformat() if h.created_at else None,
        }
        for h in history
    ]


# =====================================================================
# PRIORITY 4: ADMIN ORDERS & FORWARD-ONLY STATUS TRANSITIONS
# =====================================================================

FORWARD_STATUS_FLOW = {
    OrderStatus.paid: [OrderStatus.packed],
    OrderStatus.packed: [OrderStatus.shipped],
    OrderStatus.shipped: [OrderStatus.delivered],
}

class AdminOrderStatusPayload(BaseModel):
    new_status: str = Field(..., pattern="^(packed|shipped|delivered)$")
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    note: Optional[str] = None


class AdminOrderNotePayload(BaseModel):
    note: str = Field(..., min_length=2)


@router.get("/orders")
def list_admin_orders(
    q: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    query = db.query(Order)

    if status_filter and status_filter != "all":
        try:
            enum_status = OrderStatus(status_filter)
            query = query.filter(Order.status == enum_status)
        except ValueError:
            pass

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Order.order_number).ilike(term),
                func.lower(Order.guest_email).ilike(term),
                func.lower(Order.guest_phone).ilike(term),
            )
        )

    total = query.count()
    orders = query.order_by(Order.placed_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for o in orders:
        items.append({
            "id": str(o.id),
            "order_number": o.order_number,
            "placed_at": o.placed_at.isoformat() if o.placed_at else None,
            "status": o.status.value,
            "total_paise": o.total_paise,
            "total_formatted": f"₹{o.total_paise / 100:.2f}".rstrip("0").rstrip("."),
            "item_count": sum(i.quantity for i in o.items),
            "recipient_name": o.shipping_address_snapshot.get("recipient_name") or o.shipping_address_snapshot.get("name") or "—",
            "city": o.shipping_address_snapshot.get("city") or "—",
            "state": o.shipping_address_snapshot.get("state") or "—",
            "pincode": o.shipping_address_snapshot.get("pincode") or "—",
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/orders/{order_id}")
def get_admin_order_detail(
    order_id: str,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        o_uuid = uuid.UUID(order_id)
        order = db.query(Order).filter(Order.id == o_uuid).first()
    except ValueError:
        order = db.query(Order).filter(Order.order_number == order_id).first()

    if not order:
        raise ProblemException(status_code=404, title="Order Not Found", detail="Order does not exist.")

    items_list = []
    for item in order.items:
        items_list.append({
            "id": str(item.id),
            "sku": item.sku_snapshot,
            "name": item.name_snapshot,
            "slug": item.slug_snapshot,
            "unit_label": item.unit_label_snapshot,
            "unit_price_paise": item.unit_price_paise,
            "quantity": item.quantity,
            "line_total_paise": item.line_total_paise,
            "image_url": item.image_url_snapshot,
        })

    notes = (
        db.query(OrderInternalNote)
        .filter(OrderInternalNote.order_id == order.id)
        .order_by(OrderInternalNote.created_at.desc())
        .all()
    )

    shipments_list = []
    for s in order.shipments:
        shipments_list.append({
            "id": str(s.id),
            "carrier": s.carrier,
            "awb_or_tracking_number": s.awb_or_tracking_number,
            "tracking_url": s.tracking_url,
            "status": s.status.value,
        })

    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "placed_at": order.placed_at.isoformat() if order.placed_at else None,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "status": order.status.value,
        "subtotal_paise": order.subtotal_paise,
        "shipping_paise": order.shipping_paise,
        "discount_paise": order.discount_paise,
        "total_paise": order.total_paise,
        "shipping_method": order.shipping_method,
        "shipping_address": order.shipping_address_snapshot,
        "items": items_list,
        "shipments": shipments_list,
        "notes": [
            {
                "id": str(n.id),
                "note": n.note,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notes
        ],
    }


@router.patch("/orders/{order_id}/status")
def update_admin_order_status(
    order_id: str,
    payload: AdminOrderStatusPayload,
    request: Request,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        o_uuid = uuid.UUID(order_id)
        order = db.query(Order).filter(Order.id == o_uuid).first()
    except ValueError:
        order = db.query(Order).filter(Order.order_number == order_id).first()

    if not order:
        raise ProblemException(status_code=404, title="Order Not Found", detail="Order does not exist.")

    target_status = OrderStatus(payload.new_status)
    allowed_next = FORWARD_STATUS_FLOW.get(order.status, [])

    if target_status not in allowed_next:
        raise ProblemException(
            status_code=400,
            title="Invalid Status Transition",
            detail=f"Cannot transition order from '{order.status.value}' to '{target_status.value}'. Forward progression only: paid -> packed -> shipped -> delivered.",
            problem_type="https://globaltolocal.in/problems/invalid-transition",
        )

    old_status = order.status
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Audit log
    audit_entry = AuditLog(
        actor_user_id=admin.id,
        action="order_status_transition",
        entity_type="order_status",
        entity_id=str(order.id),
        before_state={"status": old_status.value},
        after_state={"status": target_status.value, "note": payload.note},
        ip_address=client_ip,
    )
    db.add(audit_entry)

    # Order status event
    event = OrderStatusEvent(
        order_id=order.id,
        from_status=old_status,
        to_status=target_status,
        actor_user_id=admin.id,
        note=payload.note,
    )
    db.add(event)

    order.status = target_status
    order.updated_at = datetime.now(timezone.utc)

    # If carrier or tracking provided, add/update shipment
    if payload.carrier or payload.tracking_number:
        shipment = order.shipments[0] if order.shipments else None
        if not shipment:
            shipment = Shipment(
                order_id=order.id,
                carrier=payload.carrier or "Delhivery Express",
                awb_or_tracking_number=payload.tracking_number,
                tracking_url=payload.tracking_url,
                status=ShipmentStatus.in_transit if target_status == OrderStatus.shipped else ShipmentStatus.label_created,
            )
            db.add(shipment)
        else:
            if payload.carrier:
                shipment.carrier = payload.carrier
            if payload.tracking_number:
                shipment.awb_or_tracking_number = payload.tracking_number
            if payload.tracking_url:
                shipment.tracking_url = payload.tracking_url
            if target_status == OrderStatus.shipped:
                shipment.status = ShipmentStatus.in_transit
                shipment.dispatched_at = datetime.now(timezone.utc)
            elif target_status == OrderStatus.delivered:
                shipment.status = ShipmentStatus.delivered
                shipment.delivered_at = datetime.now(timezone.utc)

    db.commit()

    # Dispatch status email to customer
    email_dest = order.guest_email or (order.user.email if order.user else None)
    if email_dest:
        send_order_status_email(
            order_number=order.order_number,
            to_email=str(email_dest),
            new_status=target_status.value,
            note=payload.note,
            tracking_number=payload.tracking_number,
        )

    return {
        "status": "success",
        "order_id": str(order.id),
        "order_number": order.order_number,
        "new_status": target_status.value,
    }


@router.post("/orders/{order_id}/notes")
def add_admin_order_note(
    order_id: str,
    payload: AdminOrderNotePayload,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        o_uuid = uuid.UUID(order_id)
        order = db.query(Order).filter(Order.id == o_uuid).first()
    except ValueError:
        order = db.query(Order).filter(Order.order_number == order_id).first()

    if not order:
        raise ProblemException(status_code=404, title="Order Not Found", detail="Order does not exist.")

    note = OrderInternalNote(
        order_id=order.id,
        admin_user_id=admin.id,
        note=payload.note.strip(),
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "id": str(note.id),
        "note": note.note,
        "created_at": note.created_at.isoformat() if note.created_at else None,
    }


# =====================================================================
# PRIORITY 5: CUSTOMERS & ENQUIRIES
# =====================================================================

class AdminCustomerStatusPayload(BaseModel):
    is_active: bool


class AdminEnquiryStatusPayload(BaseModel):
    status: str = Field(..., pattern="^(new|in_progress|quoted|closed_won|closed_lost|spam)$")


@router.get("/customers")
def list_admin_customers(
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    query = db.query(User).filter(User.role == UserRole.customer, User.deleted_at.is_(None))

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(User.full_name).ilike(term),
                func.lower(User.email).ilike(term),
                func.lower(User.phone).ilike(term),
            )
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for u in users:
        order_count = db.query(func.count(Order.id)).filter(Order.user_id == u.id).scalar() or 0
        items.append({
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "is_active": u.is_active,
            "order_count": order_count,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/customers/{customer_id}")
def get_admin_customer_detail(
    customer_id: str,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        u_uuid = uuid.UUID(customer_id)
        user = db.query(User).filter(User.id == u_uuid, User.role == UserRole.customer).first()
    except ValueError:
        user = None

    if not user:
        raise ProblemException(status_code=404, title="Customer Not Found", detail="Customer does not exist.")

    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.placed_at.desc()).all()
    addresses = db.query(Address).filter(Address.user_id == user.id).all()

    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "addresses": [
            {
                "id": str(a.id),
                "name": a.recipient_name,
                "street": a.line1,
                "city": a.city,
                "state": a.state,
                "pincode": a.pincode,
                "is_default": a.is_default,
            }
            for a in addresses
        ],
        "orders": [
            {
                "id": str(o.id),
                "order_number": o.order_number,
                "placed_at": o.placed_at.isoformat() if o.placed_at else None,
                "status": o.status.value,
                "total_paise": o.total_paise,
            }
            for o in orders
        ],
    }


@router.patch("/customers/{customer_id}/status")
def toggle_admin_customer_status(
    customer_id: str,
    payload: AdminCustomerStatusPayload,
    request: Request,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        u_uuid = uuid.UUID(customer_id)
        user = db.query(User).filter(User.id == u_uuid, User.role == UserRole.customer).first()
    except ValueError:
        user = None

    if not user:
        raise ProblemException(status_code=404, title="Customer Not Found", detail="Customer does not exist.")

    old_status = user.is_active
    new_status = payload.is_active
    client_ip = request.client.host if request.client else "127.0.0.1"

    audit_entry = AuditLog(
        actor_user_id=admin.id,
        action="customer_status_change",
        entity_type="customer",
        entity_id=str(user.id),
        before_state={"is_active": old_status},
        after_state={"is_active": new_status},
        ip_address=client_ip,
    )
    db.add(audit_entry)

    user.is_active = new_status
    user.updated_at = datetime.now(timezone.utc)

    # If deactivated, revoke all active sessions immediately so caller is blocked at once
    if not new_status:
        db.query(UserSession).filter(UserSession.user_id == user.id).update(
            {UserSession.revoked_at: datetime.now(timezone.utc)}
        )

    db.commit()

    return {
        "status": "success",
        "customer_id": str(user.id),
        "is_active": user.is_active,
    }


@router.get("/enquiries")
def list_admin_enquiries(
    status_filter: Optional[str] = Query(None, alias="status"),
    type_filter: Optional[str] = Query(None, alias="type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    query = db.query(Enquiry)

    if status_filter and status_filter != "all":
        try:
            enum_status = EnquiryStatus(status_filter)
            query = query.filter(Enquiry.status == enum_status)
        except ValueError:
            pass

    if type_filter and type_filter != "all":
        try:
            enum_type = EnquiryType(type_filter)
            query = query.filter(Enquiry.type == enum_type)
        except ValueError:
            pass

    total = query.count()
    enquiries = query.order_by(Enquiry.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for e in enquiries:
        items.append({
            "id": str(e.id),
            "type": e.type.value,
            "status": e.status.value,
            "name": e.name,
            "email": e.email,
            "phone": e.phone,
            "pincode": e.pincode,
            "message": e.message,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/enquiries/{enquiry_id}/status")
def update_admin_enquiry_status(
    enquiry_id: str,
    payload: AdminEnquiryStatusPayload,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    try:
        e_uuid = uuid.UUID(enquiry_id)
        enquiry = db.query(Enquiry).filter(Enquiry.id == e_uuid).first()
    except ValueError:
        enquiry = None

    if not enquiry:
        raise ProblemException(status_code=404, title="Enquiry Not Found", detail="Enquiry does not exist.")

    enquiry.status = EnquiryStatus(payload.status)
    enquiry.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "success",
        "enquiry_id": str(enquiry.id),
        "new_status": enquiry.status.value,
    }
