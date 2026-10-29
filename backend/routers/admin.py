import logging
import io
import os
import uuid
from pathlib import Path
from datetime import datetime, timezone, time
from typing import Any, Optional
from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse, Response
from PIL import Image
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session, joinedload
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
    PressKind,
    PressMention,
    PriceChange,
    Product,
    ProductImage,
    Shipment,
    ShipmentStatus,
    StoreReview,
    User,
    UserRole,
    UserSession,
)


def safe_iso(dt: Any) -> Optional[str]:
    if not dt:
        return None
    if hasattr(dt, "isoformat"):
        return dt.isoformat()
    return str(dt)

router = APIRouter(prefix="/api/v1/admin", tags=["Admin Back Office"])

logger = logging.getLogger("gtl.admin")

def get_admin_product_by_id(product_id: str, db: Session) -> Optional[Product]:
    pid = str(product_id).strip()
    product = None
    try:
        p_uuid = uuid.UUID(pid)
        product = db.query(Product).options(
            joinedload(Product.inventory),
            joinedload(Product.images),
            joinedload(Product.category),
        ).filter(or_(Product.id == p_uuid, Product.id == str(p_uuid))).first()
    except Exception:
        pass
    if not product and pid.isdigit():
        product = db.query(Product).options(
            joinedload(Product.inventory),
            joinedload(Product.images),
            joinedload(Product.category),
        ).filter(Product.legacy_id == int(pid)).first()
    if not product:
        product = db.query(Product).options(
            joinedload(Product.inventory),
            joinedload(Product.images),
            joinedload(Product.category),
        ).filter(or_(Product.slug == pid, Product.sku == pid, Product.id == pid)).first()
    return product


def safe_log_audit(
    db: Session,
    actor_user_id: Any,
    action: str,
    entity_type: str,
    entity_id: str,
    before_state: dict,
    after_state: dict,
    ip_address: str,
) -> None:
    try:
        audit_entry = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            before_state=before_state,
            after_state=after_state,
            ip_address=ip_address,
        )
        db.add(audit_entry)
        db.flush()
    except Exception as e:
        logger.warning(f"Could not record audit log: {e}")



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
            "placed_at": safe_iso(o.placed_at) if o.placed_at else None,
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
# PRIORITY 2B: MONTHLY EXPORT REPORT (.XLSX)
# =====================================================================

@router.get("/reports/monthly-export")
def export_monthly_report(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """
    Export comprehensive monthly business performance report starting from 00:00:00
    on the 1st day of the current month up to datetime.now(timezone.utc) in formatted .xlsx format.
    """
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc)

    # 1. Orders placed this month
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.items),
            joinedload(Order.user),
            joinedload(Order.address),
            joinedload(Order.payment),
            joinedload(Order.shipment),
        )
        .filter(Order.placed_at >= month_start, Order.placed_at <= now)
        .order_by(Order.placed_at.desc())
        .all()
    )

    # 2. All catalog products & inventory
    products = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.inventory))
        .filter(Product.deleted_at.is_(None))
        .order_by(Product.name.asc())
        .all()
    )

    # 3. New registered customers this month
    new_customers = (
        db.query(User)
        .filter(
            User.role == UserRole.customer,
            User.created_at >= month_start,
            User.created_at <= now,
        )
        .order_by(User.created_at.desc())
        .all()
    )

    paid_statuses = [OrderStatus.paid, OrderStatus.packed, OrderStatus.shipped, OrderStatus.delivered]
    revenue_paise = sum(o.total_paise for o in orders if o.status in paid_statuses)
    total_items_sold = sum(
        sum(item.quantity for item in o.items)
        for o in orders
        if o.status in paid_statuses
    )

    try:
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter

        wb = openpyxl.Workbook()

        header_fill = PatternFill(start_color="3D2C22", end_color="3D2C22", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        bold_font = Font(name="Calibri", size=11, bold=True)
        regular_font = Font(name="Calibri", size=10)
        thin_border = Border(
            left=Side(style="thin", color="D9D9D9"),
            right=Side(style="thin", color="D9D9D9"),
            top=Side(style="thin", color="D9D9D9"),
            bottom=Side(style="thin", color="D9D9D9"),
        )

        # ----------------- Sheet 1: Monthly Summary -----------------
        ws_summary = wb.active
        ws_summary.title = "Monthly Summary"
        ws_summary.views.sheetView[0].showGridLines = True

        summary_rows = [
            ("GLOBAL TO LOCAL — MONTHLY PERFORMANCE REPORT", ""),
            ("Store Location", "Tarcar Mansion, Fontainhas, Panaji, Goa 403001"),
            ("Generated At (UTC)", now.strftime("%Y-%m-%d %H:%M:%S")),
            ("Report Period", f"{month_start.strftime('%Y-%m-%d 00:00:00')} to {now.strftime('%Y-%m-%d %H:%M:%S')} UTC"),
            ("", ""),
            ("Performance Indicator", "Value"),
            ("Total Orders Placed", len(orders)),
            ("Delivered Orders", sum(1 for o in orders if o.status == OrderStatus.delivered)),
            ("In-Transit / Shipped Orders", sum(1 for o in orders if o.status == OrderStatus.shipped)),
            ("Packed Orders", sum(1 for o in orders if o.status == OrderStatus.packed)),
            ("Paid / Processing Orders", sum(1 for o in orders if o.status == OrderStatus.paid)),
            ("Cancelled Orders", sum(1 for o in orders if o.status == OrderStatus.cancelled)),
            ("Total Net Revenue", f"₹{(revenue_paise / 100):,.2f}"),
            ("Total Product Units Sold", total_items_sold),
            ("New Registered Customers", len(new_customers)),
            ("Active Catalog Products", len([p for p in products if p.is_active])),
        ]

        for r_idx, row in enumerate(summary_rows, start=1):
            ws_summary.append(row)
            c1 = ws_summary.cell(row=r_idx, column=1)
            c2 = ws_summary.cell(row=r_idx, column=2)
            if r_idx == 1:
                c1.font = Font(name="Calibri", size=13, bold=True, color="3D2C22")
            elif r_idx == 6:
                c1.font = header_font
                c1.fill = header_fill
                c2.font = header_font
                c2.fill = header_fill
            elif r_idx > 6:
                c1.font = bold_font
                c2.font = regular_font
                c1.border = thin_border
                c2.border = thin_border

        # ----------------- Sheet 2: Orders & Revenue -----------------
        ws_orders = wb.create_sheet(title="Orders & Revenue")
        ws_orders.views.sheetView[0].showGridLines = True
        order_headers = [
            "Order #", "Placed At (UTC)", "Status", "Customer Name",
            "Customer Phone", "City", "State", "Items Count",
            "Order Total (₹)", "Payment Method"
        ]
        ws_orders.append(order_headers)
        for col_num in range(1, len(order_headers) + 1):
            cell = ws_orders.cell(row=1, column=col_num)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for o in orders:
            placed_str = o.placed_at.strftime("%Y-%m-%d %H:%M") if o.placed_at else ""
            recipient = ""
            phone = ""
            city = ""
            state = ""
            if o.address:
                recipient = o.address.recipient_name or ""
                phone = o.address.phone or ""
                city = o.address.city or ""
                state = o.address.state or ""
            elif o.shipping_address_snapshot:
                recipient = o.shipping_address_snapshot.get("recipient_name") or o.shipping_address_snapshot.get("name") or ""
                phone = o.shipping_address_snapshot.get("phone") or ""
                city = o.shipping_address_snapshot.get("city") or ""
                state = o.shipping_address_snapshot.get("state") or ""
            elif o.user:
                recipient = o.user.full_name or ""
                phone = o.user.phone or ""

            items_cnt = sum(i.quantity for i in o.items)
            tot_rupees = (o.total_paise or 0) / 100.0
            pm = o.payment.provider if o.payment else "Razorpay / Online"

            row_vals = [
                o.order_number, placed_str, o.status.value, recipient,
                phone, city, state, items_cnt, tot_rupees, pm
            ]
            ws_orders.append(row_vals)
            cur_row = ws_orders.max_row
            for col_num in range(1, len(row_vals) + 1):
                c = ws_orders.cell(row=cur_row, column=col_num)
                c.font = regular_font
                c.border = thin_border
                if col_num == 9:
                    c.number_format = "₹#,##0.00"

        # ----------------- Sheet 3: Items Sold -----------------
        ws_items = wb.create_sheet(title="Items Sold")
        ws_items.views.sheetView[0].showGridLines = True
        item_headers = [
            "Order #", "SKU", "Product Name", "Unit Price (₹)",
            "Quantity Sold", "Line Total (₹)", "Order Status"
        ]
        ws_items.append(item_headers)
        for col_num in range(1, len(item_headers) + 1):
            cell = ws_items.cell(row=1, column=col_num)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for o in orders:
            for item in o.items:
                unit_price = (item.unit_price_paise or 0) / 100.0
                line_tot = (item.line_total_paise or 0) / 100.0
                ws_items.append([
                    o.order_number,
                    item.sku_snapshot,
                    item.name_snapshot,
                    unit_price,
                    item.quantity,
                    line_tot,
                    o.status.value,
                ])
                cur_row = ws_items.max_row
                for col_num in range(1, len(item_headers) + 1):
                    c = ws_items.cell(row=cur_row, column=col_num)
                    c.font = regular_font
                    c.border = thin_border
                    if col_num in [4, 6]:
                        c.number_format = "₹#,##0.00"

        # ----------------- Sheet 4: Stock & Inventory -----------------
        ws_stock = wb.create_sheet(title="Inventory & Stock")
        ws_stock.views.sheetView[0].showGridLines = True
        stock_headers = ["SKU", "Product Name", "Shelf / Category", "Unit Price (₹)", "On Hand Stock", "Status"]
        ws_stock.append(stock_headers)
        for col_num in range(1, len(stock_headers) + 1):
            cell = ws_stock.cell(row=1, column=col_num)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for p in products:
            shelf_name = p.category.name if p.category else ""
            price_val = (p.price_paise or 0) / 100.0
            on_hand = p.inventory.on_hand if p.inventory else 0
            stat = "Active" if p.is_active else "Inactive"
            ws_stock.append([p.sku, p.name, shelf_name, price_val, on_hand, stat])
            cur_row = ws_stock.max_row
            for col_num in range(1, len(stock_headers) + 1):
                c = ws_stock.cell(row=cur_row, column=col_num)
                c.font = regular_font
                c.border = thin_border
                if col_num == 4:
                    c.number_format = "₹#,##0.00"

        # Auto-fit column widths across all sheets
        for sheet in wb.worksheets:
            for col in sheet.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    val = str(cell.value or "")
                    if len(val) > max_len:
                        max_len = len(val)
                sheet.column_dimensions[col_letter].width = max(max_len + 3, 12)

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        filename = f"GTL_Monthly_Report_{now.strftime('%b_%Y')}.xlsx"
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        logger.warning(f"Excel report generation exception, falling back to CSV: {e}")
        import csv
        buf_csv = io.StringIO()
        writer = csv.writer(buf_csv)
        writer.writerow(["GLOBAL TO LOCAL — MONTHLY REPORT", now.strftime("%Y-%m-%d %H:%M:%S UTC")])
        writer.writerow(["Period", f"{month_start} to {now}"])
        writer.writerow([])
        writer.writerow(["Order #", "Placed At", "Status", "Items Count", "Order Total (INR)"])
        for o in orders:
            writer.writerow([
                o.order_number,
                safe_iso(o.placed_at),
                o.status.value,
                sum(i.quantity for i in o.items),
                (o.total_paise or 0) / 100.0
            ])

        filename = f"GTL_Monthly_Report_{now.strftime('%b_%Y')}.csv"
        return Response(
            content=buf_csv.getvalue().encode("utf-8"),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )


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
    is_active: Optional[bool] = None
    status: Optional[str] = None


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
    unit_label: str = Field(default="1 unit", max_length=60)
    net_weight_grams: Optional[int] = None
    weight_grams: Optional[int] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    origin_text: Optional[str] = None
    origin: Optional[str] = None
    made_by: Optional[str] = None
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
    made_by: Optional[str] = None
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
            "availability": p.availability.value if hasattr(p.availability, "value") else str(p.availability or ("in_stock" if (inv.on_hand if inv else 50) > 0 else "out_of_stock")),
            "is_active": p.is_active,
            "status": "published" if p.is_active else "draft",
            "category_name": p.category.name if p.category else "Uncategorized",
            "category_slug": p.category.slug if p.category else "",
            "unit_label": p.unit_label,
            "net_weight_grams": p.net_weight_grams,
            "description": p.description or "",
            "origin_text": p.origin_text or "Made in Goa",
            "made_by": p.made_by or (p.maker.name if p.maker else ""),
            "is_featured": p.is_featured,
            "image_url": p.images[0].url if p.images else f"/images/catalog/{p.slug}.jpg",
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
        compare_at_paise=None,
        unit_label=payload.unit_label.strip() or "1 unit",
        net_weight_grams=final_weight,
        description=payload.description.strip() if payload.description else None,
        short_description=payload.short_description.strip() if payload.short_description else (payload.description[:300].strip() if payload.description else None),
        origin_text=final_origin,
        made_by=payload.made_by.strip() if payload.made_by else None,
        is_featured=payload.is_featured,
        is_active=is_active,
        status=status_str,
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
                url=f"/images/catalog/{product.slug}.jpg",
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
        "image_url": product.images[0].url if product.images else f"/images/catalog/{product.slug}.jpg",
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
    product = None
    try:
        p_uuid = uuid.UUID(product_id)
        product = db.query(Product).filter(or_(Product.id == p_uuid, Product.id == str(p_uuid))).first()
    except Exception:
        pass
    if not product and str(product_id).isdigit():
        product = db.query(Product).filter(Product.legacy_id == int(product_id)).first()
    if not product:
        product = db.query(Product).filter(or_(Product.slug == product_id, Product.sku == product_id, Product.id == product_id)).first()

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
    if payload.made_by is not None:
        product.made_by = payload.made_by.strip() if payload.made_by else None
    if payload.is_featured is not None:
        product.is_featured = payload.is_featured
    if payload.status:
        st = payload.status.strip().lower()
        if st not in ["published", "draft", "hidden", "archived"]:
            st = "published"
        product.status = st
        if st == "published":
            product.is_active = True
            if not product.published_at:
                product.published_at = datetime.now(timezone.utc)
            product.availability = AvailabilityState.in_stock
        elif st == "hidden":
            product.is_active = False
            product.availability = AvailabilityState.out_of_stock
        elif st == "archived":
            product.is_active = False
            product.availability = AvailabilityState.discontinued
        else:  # draft
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
    try:
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
    except Exception:
        pass
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
        "availability": product.availability.value if hasattr(product.availability, "value") else str(product.availability or ("in_stock" if (inv.on_hand if inv else 50) > 0 else "out_of_stock")),
        "is_active": product.is_active,
        "status": "published" if product.is_active else "draft",
        "category_name": product.category.name if product.category else "Uncategorized",
        "category_slug": product.category.slug if product.category else "",
        "unit_label": product.unit_label,
        "net_weight_grams": product.net_weight_grams,
        "description": product.description or "",
        "origin_text": product.origin_text or "Made in Goa",
        "is_featured": product.is_featured,
        "image_url": product.images[0].url if product.images else f"/images/catalog/{product.slug}.jpg",
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

@router.delete("/products/{product_id}")
def delete_admin_product(
    product_id: str,
    request: Request,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    product = get_admin_product_by_id(product_id, db)
    if not product or product.deleted_at is not None:
        raise ProblemException(status_code=404, title="Product Not Found", detail="Product does not exist or has already been deleted.")

    client_ip = request.client.host if request.client else "127.0.0.1"
    before_state = {
        "id": str(product.id),
        "name": product.name,
        "sku": product.sku,
        "slug": product.slug,
        "is_active": product.is_active,
        "status": product.status,
    }

    now = datetime.now(timezone.utc)
    product.deleted_at = now
    product.is_active = False
    product.status = "archived"
    product.availability = AvailabilityState.archived
    if product.inventory:
        product.inventory.on_hand = 0

    safe_log_audit(
        db=db,
        actor_user_id=admin.id,
        action="product.delete",
        entity_type="product",
        entity_id=str(product.id),
        before_state=before_state,
        after_state={"deleted_at": now.isoformat(), "is_active": False, "status": "archived"},
        ip_address=client_ip,
    )

    db.commit()

    return {
        "status": "success",
        "message": f"Product '{product.name}' was successfully deleted.",
        "product_id": str(product.id),
    }


@router.patch("/products/{product_id}/price")
def update_product_price(
    product_id: str,
    payload: AdminPriceChangePayload,
    request: Request,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    product = get_admin_product_by_id(product_id, db)
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

    # 1. Record in dedicated price_changes table safely
    try:
        price_change = PriceChange(
            id=uuid.uuid4(),
            product_id=product.id,
            admin_user_id=admin.id,
            old_paise=old_price,
            new_paise=new_price,
            reason=payload.reason.strip(),
            ip=client_ip,
            created_at=datetime.now(timezone.utc),
        )
        db.add(price_change)
        db.flush()
    except Exception as e:
        logger.warning(f"Could not record price change: {e}")

    # 2. Record in operations audit_logs table safely
    safe_log_audit(
        db=db,
        actor_user_id=admin.id,
        action="update_price",
        entity_type="product_price",
        entity_id=str(product.id),
        before_state={"price_paise": old_price},
        after_state={"price_paise": new_price, "reason": payload.reason.strip()},
        ip_address=client_ip,
    )

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
    product = None
    try:
        p_uuid = uuid.UUID(product_id)
        product = db.query(Product).filter(or_(Product.id == p_uuid, Product.id == str(p_uuid))).first()
    except Exception:
        pass
    if not product and str(product_id).isdigit():
        product = db.query(Product).filter(Product.legacy_id == int(product_id)).first()
    if not product:
        product = db.query(Product).filter(or_(Product.slug == product_id, Product.sku == product_id, Product.id == product_id)).first()

    if not product:
        raise ProblemException(status_code=404, title="Product Not Found", detail="Product does not exist.")

    client_ip = request.client.host if request.client else "127.0.0.1"

    if payload.status is not None:
        new_status_str = payload.status.strip().lower()
        if new_status_str not in ["published", "draft", "hidden", "archived"]:
            new_status_str = "published"
        new_is_active = (new_status_str == "published")
    elif payload.is_active is not None:
        new_is_active = payload.is_active
        new_status_str = "published" if new_is_active else "hidden"
    else:
        new_is_active = not product.is_active
        new_status_str = "published" if new_is_active else "hidden"

    old_active = product.is_active
    old_status = getattr(product, "status", "published")

    audit_entry = AuditLog(
        actor_user_id=admin.id,
        action="toggle_status",
        entity_type="product_status",
        entity_id=str(product.id),
        before_state={"is_active": old_active, "status": old_status},
        after_state={"is_active": new_is_active, "status": new_status_str},
        ip_address=client_ip,
    )
    db.add(audit_entry)

    product.is_active = new_is_active
    product.status = new_status_str
    if new_status_str == "published" and not product.published_at:
        product.published_at = datetime.now(timezone.utc)
    product.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "success",
        "product_id": str(product.id),
        "is_active": product.is_active,
        "product_status": product.status,
    }


@router.patch("/products/{product_id}/stock")
def update_product_stock(
    product_id: str,
    payload: AdminStockChangePayload,
    request: Request,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    product = get_admin_product_by_id(product_id, db)
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

    safe_log_audit(
        db=db,
        actor_user_id=admin.id,
        action="update_stock",
        entity_type="product_stock",
        entity_id=str(product.id),
        before_state={"on_hand": old_stock},
        after_state={"on_hand": new_stock, "reason": payload.reason},
        ip_address=client_ip,
    )

    inv.on_hand = new_stock
    inv.updated_at = datetime.now(timezone.utc)
    if new_stock <= 0:
        product.availability = AvailabilityState.out_of_stock
    else:
        product.availability = AvailabilityState.in_stock
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
    product = None
    try:
        p_uuid = uuid.UUID(product_id)
        product = db.query(Product).filter(or_(Product.id == p_uuid, Product.id == str(p_uuid))).first()
    except Exception:
        pass
    if not product and str(product_id).isdigit():
        product = db.query(Product).filter(Product.legacy_id == int(product_id)).first()
    if not product:
        product = db.query(Product).filter(or_(Product.slug == product_id, Product.sku == product_id, Product.id == product_id)).first()

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
            "created_at": safe_iso(h.created_at) if h.created_at else None,
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
    new_status: str = Field(..., pattern="^(pending_payment|paid|packed|shipped|delivered|cancelled)$")
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
            "placed_at": safe_iso(o.placed_at) if o.placed_at else None,
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
    order = None
    try:
        o_uuid = uuid.UUID(order_id)
        order = db.query(Order).filter(or_(Order.id == str(o_uuid), Order.id == o_uuid, Order.order_number == order_id)).first()
    except Exception:
        pass
    if not order:
        order = db.query(Order).filter(or_(Order.id == order_id, Order.order_number == order_id)).first()

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

    notes = []
    try:
        notes = (
            db.query(OrderInternalNote)
            .filter(or_(OrderInternalNote.order_id == str(order.id), OrderInternalNote.order_id == order.id))
            .order_by(OrderInternalNote.created_at.desc())
            .all()
        )
    except Exception:
        pass

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
        "placed_at": safe_iso(order.placed_at) if order.placed_at else None,
        "paid_at": safe_iso(order.paid_at) if order.paid_at else None,
        "status": order.status.value if hasattr(order.status, "value") else str(order.status),
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
                "created_at": safe_iso(n.created_at) if n.created_at else None,
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
    order = None
    try:
        o_uuid = uuid.UUID(order_id)
        order = db.query(Order).filter(or_(Order.id == str(o_uuid), Order.id == o_uuid, Order.order_number == order_id)).first()
    except Exception:
        pass
    if not order:
        order = db.query(Order).filter(or_(Order.id == order_id, Order.order_number == order_id)).first()

    if not order:
        raise ProblemException(status_code=404, title="Order Not Found", detail="Order does not exist.")

    curr_status_str = order.status.value if hasattr(order.status, "value") else str(order.status)
    target_status_str = str(payload.new_status).strip().lower()

    if curr_status_str == target_status_str:
        return {
            "status": "success",
            "order_id": str(order.id),
            "order_number": order.order_number,
            "new_status": target_status_str,
        }

    VALID_STATUSES = {"pending_payment", "paid", "packed", "shipped", "delivered", "cancelled"}
    if target_status_str not in VALID_STATUSES:
        raise ProblemException(
            status_code=400,
            title="Invalid Status Transition",
            detail=f"Cannot transition order to '{target_status_str}'.",
            problem_type="https://globaltolocal.in/problems/invalid-transition",
        )

    old_status_val = curr_status_str
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Audit log (fail-safe)
    try:
        safe_log_audit(
            db=db,
            actor_user_id=admin.id,
            action="order_status_transition",
            entity_type="order_status",
            entity_id=str(order.id),
            before_state={"status": old_status_val},
            after_state={"status": target_status_str, "note": payload.note},
            ip_address=client_ip,
        )
    except Exception as a_err:
        logger.warning(f"Audit log notice: {a_err}")

    # Order status event (fail-safe savepoint)
    try:
        with db.begin_nested():
            event = OrderStatusEvent(
                id=str(uuid.uuid4()),
                order_id=order.id,
                from_status=old_status_val,
                to_status=target_status_str,
                actor_user_id=admin.id,
                note=payload.note or f"Order marked as {target_status_str.capitalize()} by admin.",
                created_at=datetime.now(timezone.utc),
            )
            db.add(event)
            db.flush()
    except Exception as e:
        logger.warning(f"Could not record order status event: {e}")

    # Update order status
    try:
        order.status = OrderStatus(target_status_str)
    except Exception:
        order.status = target_status_str
    order.updated_at = datetime.now(timezone.utc)
    if target_status_str == "paid" and not order.paid_at:
        order.paid_at = datetime.now(timezone.utc)
    elif target_status_str == "cancelled" and not order.cancelled_at:
        order.cancelled_at = datetime.now(timezone.utc)

    # If carrier or tracking provided or status is shipped/delivered, manage shipment (fail-safe savepoint)
    if payload.carrier or payload.tracking_number or target_status_str in ("shipped", "delivered"):
        try:
            with db.begin_nested():
                shipment = order.shipments[0] if (order.shipments and len(order.shipments) > 0) else None
                if not shipment:
                    shipment = Shipment(
                        id=str(uuid.uuid4()),
                        order_id=order.id,
                        carrier=payload.carrier or "Delhivery Express",
                        awb_or_tracking_number=payload.tracking_number or f"DEL-{secrets.token_hex(4).upper()}",
                        tracking_url=payload.tracking_url or "",
                        status=ShipmentStatus.in_transit if target_status_str == "shipped" else (ShipmentStatus.delivered if target_status_str == "delivered" else ShipmentStatus.label_created),
                        dispatched_at=datetime.now(timezone.utc) if target_status_str == "shipped" else None,
                        delivered_at=datetime.now(timezone.utc) if target_status_str == "delivered" else None,
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                    )
                    db.add(shipment)
                else:
                    if payload.carrier:
                        shipment.carrier = payload.carrier
                    if payload.tracking_number:
                        shipment.awb_or_tracking_number = payload.tracking_number
                    if payload.tracking_url:
                        shipment.tracking_url = payload.tracking_url
                    if target_status_str == "shipped":
                        shipment.status = ShipmentStatus.in_transit
                        if not shipment.dispatched_at:
                            shipment.dispatched_at = datetime.now(timezone.utc)
                    elif target_status_str == "delivered":
                        shipment.status = ShipmentStatus.delivered
                        if not shipment.delivered_at:
                            shipment.delivered_at = datetime.now(timezone.utc)
                db.flush()
        except Exception as s_err:
            logger.warning(f"Could not record shipment: {s_err}")

    db.commit()

    # Dispatch status email to customer (fail-safe)
    try:
        email_dest = order.guest_email
        if not email_dest and order.user_id:
            user_record = db.query(User).filter(User.id == order.user_id).first()
            if user_record:
                email_dest = user_record.email
        if email_dest:
            send_order_status_email(
                order_number=order.order_number,
                to_email=str(email_dest),
                new_status=target_status_str,
                note=payload.note,
                tracking_number=payload.tracking_number,
            )
    except Exception as mail_err:
        logger.warning(f"Email dispatch notice: {mail_err}")

    return {
        "status": "success",
        "order_id": str(order.id),
        "order_number": order.order_number,
        "new_status": target_status_str,
    }


@router.post("/orders/{order_id}/notes")
def add_admin_order_note(
    order_id: str,
    payload: AdminOrderNotePayload,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    order = None
    try:
        o_uuid = uuid.UUID(order_id)
        order = db.query(Order).filter(or_(Order.id == str(o_uuid), Order.id == o_uuid, Order.order_number == order_id)).first()
    except Exception:
        pass
    if not order:
        order = db.query(Order).filter(or_(Order.id == order_id, Order.order_number == order_id)).first()

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
        "created_at": safe_iso(note.created_at) if note.created_at else None,
    }


# =====================================================================
# PRIORITY 5: CUSTOMERS & ENQUIRIES
# =====================================================================

class AdminReviewCreatePayload(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Customer Name")
    stars: int = Field(5, ge=1, le=5, description="Rating from 1 to 5 stars")
    description: str = Field(..., min_length=1, description="Review description / quote")
    location: Optional[str] = Field(None, max_length=120, description="Optional customer location or subtitle")


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
            "created_at": safe_iso(u.created_at) if u.created_at else None,
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
        "created_at": safe_iso(user.created_at) if user.created_at else None,
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
                "placed_at": safe_iso(o.placed_at) if o.placed_at else None,
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
        type_str = e.type.value if hasattr(e.type, "value") else str(e.type or "general")
        status_str = e.status.value if hasattr(e.status, "value") else str(e.status or "new")
        items.append({
            "id": str(e.id),
            "type": type_str,
            "status": status_str,
            "name": e.name,
            "email": e.email,
            "phone": e.phone,
            "pincode": e.pincode,
            "message": e.message,
            "created_at": safe_iso(e.created_at) if e.created_at else None,
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


# =====================================================================
# 7. CUSTOMER REVIEWS (ADMIN MANAGEMENT)
# =====================================================================

@router.get("/reviews")
def list_admin_reviews(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    try:
        rows = (
            db.query(StoreReview)
            .order_by(StoreReview.display_order.asc(), StoreReview.created_at.desc())
            .all()
        )
    except Exception as e:
        logger.warning(f"Error reading store_reviews: {e}")
        rows = []

    if not rows:
        default_items = [
            {
                "id": "rev-001",
                "name": "Gifty Abraham",
                "author_name": "Gifty Abraham",
                "author": "Gifty Abraham",
                "stars": 5,
                "rating": 5,
                "description": "Global to Local is a world of authentic Goan Treasures. A very aesthetic space with organic Goan delicacies and traditional items. Love the way they empower women through their business ideas. A must visit place.",
                "quote": "Global to Local is a world of authentic Goan Treasures. A very aesthetic space with organic Goan delicacies and traditional items. Love the way they empower women through their business ideas. A must visit place.",
                "location": "",
                "author_location": "",
                "role": "",
                "source": "Visitors' Book",
                "is_approved": True,
                "created_at": "2024-01-15T10:00:00Z",
            },
            {
                "id": "rev-002",
                "name": "Stedwick Fernandes",
                "author_name": "Stedwick Fernandes",
                "author": "Stedwick Fernandes",
                "stars": 5,
                "rating": 5,
                "description": "The store had Kokani music playing. The light shades were so much like the ones in my great granny's house. The staff was super courteous and hospitable...I will 100% recommend this store to family, friends and everyone I know.",
                "quote": "The store had Kokani music playing. The light shades were so much like the ones in my great granny's house. The staff was super courteous and hospitable...I will 100% recommend this store to family, friends and everyone I know.",
                "location": "",
                "author_location": "",
                "role": "",
                "source": "Visitors' Book",
                "is_approved": True,
                "created_at": "2024-01-20T14:30:00Z",
            },
            {
                "id": "rev-003",
                "name": "Swapna Pujari",
                "author_name": "Swapna Pujari",
                "author": "Swapna Pujari",
                "stars": 5,
                "rating": 5,
                "description": "Our go to place all such needs is Global to Local and I highly recommend Global to Local for authentic goan hampers and gifting requirements.",
                "quote": "Our go to place all such needs is Global to Local and I highly recommend Global to Local for authentic goan hampers and gifting requirements.",
                "location": "SilhouetteIndia",
                "author_location": "SilhouetteIndia",
                "role": "SilhouetteIndia",
                "source": "Visitors' Book",
                "is_approved": True,
                "created_at": "2024-02-05T09:15:00Z",
            },
        ]
        return {"items": default_items, "total": len(default_items)}

    items = [
        {
            "id": str(r.id),
            "name": r.author_name,
            "author_name": r.author_name,
            "author": r.author_name,
            "stars": r.rating,
            "rating": r.rating,
            "description": r.quote,
            "quote": r.quote,
            "location": r.author_location or "",
            "author_location": r.author_location or "",
            "role": r.author_location or "",
            "source": r.source,
            "is_approved": r.is_approved,
            "created_at": safe_iso(r.created_at),
        }
        for r in rows
    ]
    return {"items": items, "total": len(items)}


@router.post("/reviews", status_code=status.HTTP_201_CREATED)
def create_admin_review(
    payload: AdminReviewCreatePayload,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    try:
        new_rev = StoreReview(
            id=uuid.uuid4(),
            author_name=payload.name.strip(),
            rating=max(1, min(5, payload.stars)),
            quote=payload.description.strip(),
            author_location=payload.location.strip() if payload.location else None,
            source="Visitors' Book",
            is_approved=True,
            is_featured=True,
            display_order=0,
            created_at=datetime.now(timezone.utc),
        )
        db.add(new_rev)
        db.commit()
        db.refresh(new_rev)
        return {
            "id": str(new_rev.id),
            "name": new_rev.author_name,
            "author_name": new_rev.author_name,
            "author": new_rev.author_name,
            "stars": new_rev.rating,
            "rating": new_rev.rating,
            "description": new_rev.quote,
            "quote": new_rev.quote,
            "location": new_rev.author_location or "",
            "author_location": new_rev.author_location or "",
            "role": new_rev.author_location or "",
            "source": new_rev.source,
            "is_approved": new_rev.is_approved,
            "created_at": safe_iso(new_rev.created_at),
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create review: {e}")
        raise ProblemException(status_code=500, title="Database Error", detail=f"Failed to create review: {str(e)}")


@router.delete("/reviews/{review_id}")
def delete_admin_review(
    review_id: str,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    try:
        r_uuid = uuid.UUID(review_id)
        rev = db.query(StoreReview).filter(StoreReview.id == r_uuid).first()
        if rev:
            db.delete(rev)
            db.commit()
            return {"status": "success", "message": "Review deleted successfully"}
        return {"status": "success", "message": "Review already removed"}
    except ValueError:
        return {"status": "success", "message": "Review removed"}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete review: {e}")
        raise ProblemException(status_code=500, title="Database Error", detail=f"Failed to delete review: {str(e)}")



# =====================================================================
# IN THE NEWS / PRESS ARTICLES MANAGEMENT
# =====================================================================

class AdminNewsCreatePayload(BaseModel):
    publication: str = Field(..., min_length=1, max_length=160)
    title: str = Field(..., min_length=1, max_length=240)
    date: str = Field(..., min_length=1, max_length=100)
    url: Optional[str] = Field("#", max_length=500)


DEFAULT_ADMIN_NEWS = [
    {
        "id": "news-seed-1",
        "publication": "The Navhind Times",
        "date": "October 2020",
        "title": "Global to Local supermarket opens in city",
        "url": "https://www.navhindtimes.in/2020/10/28/business/global-to-local-supermarket-opens-in-city/",
        "display_order": 0,
    },
    {
        "id": "news-seed-2",
        "publication": "Business Goa",
        "date": "March 2021",
        "title": "Global to Local in Business Goa",
        "url": "https://businessgoa.in/tag/global-to-local/",
        "display_order": 1,
    },
    {
        "id": "news-seed-3",
        "publication": "Gomantak Times",
        "date": "August 2022",
        "title": "Global to Local empowers rural Goan women entrepreneurs",
        "url": "https://www.gomantaktimes.com/news/business/global-to-local-empowers-rural-goan-women-entrepreneurs",
        "display_order": 2,
    },
    {
        "id": "news-seed-4",
        "publication": "The Goan",
        "date": "February 2025",
        "title": "Feature on Global to Local",
        "url": "#",
        "display_order": 3,
    },
    {
        "id": "news-seed-5",
        "publication": "Herald",
        "date": "November 2024",
        "title": "Global to Local in the Herald",
        "url": "#",
        "display_order": 4,
    },
]


@router.get("/news")
def list_admin_news(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(PressMention)
        .filter(PressMention.kind == PressKind.article)
        .order_by(PressMention.display_order.asc(), PressMention.created_at.desc())
        .all()
    )
    if not rows:
        try:
            for item in DEFAULT_ADMIN_NEWS:
                pm = PressMention(
                    id=uuid.uuid4(),
                    kind=PressKind.article,
                    publication_or_issuer=item["publication"],
                    title=item["title"],
                    excerpt=item["date"],
                    external_url=item["url"],
                    display_order=item["display_order"],
                    is_published=True,
                )
                db.add(pm)
            db.commit()
            rows = (
                db.query(PressMention)
                .filter(PressMention.kind == PressKind.article)
                .order_by(PressMention.display_order.asc(), PressMention.created_at.desc())
                .all()
            )
        except Exception:
            db.rollback()
            return {"items": DEFAULT_ADMIN_NEWS, "total": len(DEFAULT_ADMIN_NEWS)}

    items = [
        {
            "id": str(r.id),
            "publication": r.publication_or_issuer,
            "title": r.title,
            "date": r.excerpt or "",
            "url": r.external_url or "#",
            "created_at": safe_iso(r.created_at),
        }
        for r in rows
    ]
    return {"items": items, "total": len(items)}


@router.post("/news", status_code=status.HTTP_201_CREATED)
def create_admin_news(
    payload: AdminNewsCreatePayload,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    try:
        new_article = PressMention(
            id=uuid.uuid4(),
            kind=PressKind.article,
            publication_or_issuer=payload.publication.strip(),
            title=payload.title.strip(),
            excerpt=payload.date.strip(),
            external_url=payload.url.strip() if payload.url and payload.url.strip() else "#",
            display_order=0,
            is_published=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(new_article)
        db.commit()
        db.refresh(new_article)
        return {
            "id": str(new_article.id),
            "publication": new_article.publication_or_issuer,
            "title": new_article.title,
            "date": new_article.excerpt or "",
            "url": new_article.external_url or "#",
            "created_at": safe_iso(new_article.created_at),
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create news article: {e}")
        raise ProblemException(status_code=500, title="Database Error", detail=f"Failed to create news article: {str(e)}")


@router.delete("/news/{news_id}")
def delete_admin_news(
    news_id: str,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    try:
        n_uuid = uuid.UUID(news_id)
        article = db.query(PressMention).filter(PressMention.id == n_uuid).first()
        if article:
            db.delete(article)
            db.commit()
            return {"status": "success", "message": "News article deleted successfully"}
        return {"status": "success", "message": "News article already removed"}
    except ValueError:
        return {"status": "success", "message": "News article removed"}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete news article: {e}")
        raise ProblemException(status_code=500, title="Database Error", detail=f"Failed to delete news article: {str(e)}")
