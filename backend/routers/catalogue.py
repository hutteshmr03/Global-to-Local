from typing import Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, text
from sqlalchemy.orm import Session, joinedload
from backend.core.errors import ProblemException
from backend.database import get_db
from backend.deps import serialize_product
from backend.models import (
    AvailabilityState,
    Category,
    Collection,
    Inventory,
    Maker,
    Product,
    ProductCollection,
)

router = APIRouter(prefix="/api/v1", tags=["Catalogue & Discovery"])


def serialize_category(cat: Category, product_count: int = 0) -> dict[str, Any]:
    return {
        "id": str(cat.id),
        "slug": cat.slug,
        "name": cat.name,
        "tagline": cat.tagline or "",
        "description": cat.description or "",
        "hero_image_url": cat.hero_image_url or "",
        "display_order": cat.display_order,
        "product_count": product_count,
        "count": product_count,
        # Frontend compatibility fields
        "blurb": cat.tagline or cat.description or "",
        "imageSrc": cat.hero_image_url or "",
        "imageAlt": cat.name,
    }


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(Category, func.count(Product.id))
        .outerjoin(
            Product,
            (Product.category_id == Category.id)
            & (Product.is_active == True)  # noqa: E712
            & (Product.deleted_at.is_(None)),
        )
        .filter(Category.is_active == True)  # noqa: E712
        .group_by(Category.id)
        .order_by(Category.display_order.asc())
        .all()
    )
    items = [serialize_category(cat, int(cnt)) for cat, cnt in rows]
    return {"items": items, "total": len(items)}


@router.get("/categories/{slug}")
def get_category_detail(slug: str, db: Session = Depends(get_db)):
    cat = (
        db.query(Category)
        .filter(Category.slug == slug, Category.is_active == True)  # noqa: E712
        .first()
    )
    if not cat:
        raise ProblemException(
            status_code=404,
            title="Category Not Found",
            detail=f"No active shelf found with slug '{slug}'.",
            problem_type="https://globaltolocal.in/problems/category-not-found",
        )
    count = (
        db.query(func.count(Product.id))
        .filter(
            Product.category_id == cat.id,
            Product.is_active == True,  # noqa: E712
            Product.deleted_at.is_(None),
        )
        .scalar()
        or 0
    )
    return serialize_category(cat, int(count))


@router.get("/products")
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=60),
    category: Optional[str] = Query(None, description="Category slug filter"),
    shelf: Optional[str] = Query(None, description="Alias for category slug filter"),
    maker: Optional[str] = Query(None, description="Maker slug filter"),
    q: Optional[str] = Query(None, max_length=120, description="Search query"),
    min_price_paise: Optional[int] = Query(None, ge=0),
    max_price_paise: Optional[int] = Query(None, ge=0),
    in_stock: Optional[bool] = Query(None),
    featured: Optional[bool] = Query(None),
    sort: str = Query("featured", pattern="^(featured|price_asc|price_desc|newest|name_asc)$"),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.maker),
            joinedload(Product.images),
            joinedload(Product.inventory),
        )
        .filter(Product.is_active == True, Product.deleted_at.is_(None))  # noqa: E712
    )

    cat_slug = category or shelf
    if cat_slug:
        query = query.join(Product.category).filter(Category.slug == cat_slug)

    if maker:
        query = query.join(Product.maker).filter(Maker.slug == maker)

    if min_price_paise is not None:
        query = query.filter(Product.price_paise >= min_price_paise)

    if max_price_paise is not None:
        query = query.filter(Product.price_paise <= max_price_paise)

    if featured is not None:
        query = query.filter(Product.is_featured == featured)

    if in_stock is True:
        query = query.outerjoin(Product.inventory).filter(
            Product.availability.in_([AvailabilityState.in_stock, AvailabilityState.low_stock]),
            or_(Inventory.product_id.is_(None), (Inventory.on_hand - Inventory.reserved) > 0),
        )
    elif in_stock is False:
        query = query.outerjoin(Product.inventory).filter(
            or_(
                Product.availability == AvailabilityState.out_of_stock,
                (Inventory.on_hand - Inventory.reserved) <= 0,
            )
        )

    if q and q.strip():
        clean_q = q.strip()
        query = query.filter(
            or_(
                Product.search_tsv.op("@@")(func.websearch_to_tsquery("english", clean_q)),
                Product.name.ilike(f"%{clean_q}%"),
                Product.short_description.ilike(f"%{clean_q}%"),
                func.similarity(Product.name, clean_q) > 0.2,
            )
        )

    total = query.count()

    if sort == "price_asc":
        query = query.order_by(Product.price_paise.asc(), Product.id.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price_paise.desc(), Product.id.asc())
    elif sort == "newest":
        query = query.order_by(Product.created_at.desc(), Product.id.asc())
    elif sort == "name_asc":
        query = query.order_by(Product.name.asc(), Product.id.asc())
    else:
        query = query.order_by(Product.is_featured.desc(), Product.legacy_id.desc().nullslast(), Product.name.asc())

    offset = (page - 1) * page_size
    products = query.offset(offset).limit(page_size).all()
    total_pages = max(1, (total + page_size - 1) // page_size)

    return {
        "items": [serialize_product(p) for p in products],
        "total": total,
        "total_pages": total_pages,
        "page": page,
        "page_size": page_size,
        "meta": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
    }


@router.get("/products/{slug}")
def get_product_detail(slug: str, db: Session = Depends(get_db)):
    prod = (
        db.query(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.maker),
            joinedload(Product.images),
            joinedload(Product.inventory),
        )
        .filter(Product.slug == slug, Product.is_active == True, Product.deleted_at.is_(None))  # noqa: E712
        .first()
    )
    if not prod:
        raise ProblemException(
            status_code=404,
            title="Product Not Found",
            detail=f"No active product found with slug '{slug}'.",
            problem_type="https://globaltolocal.in/problems/product-not-found",
        )

    related = (
        db.query(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.maker),
            joinedload(Product.images),
            joinedload(Product.inventory),
        )
        .filter(
            Product.category_id == prod.category_id,
            Product.id != prod.id,
            Product.is_active == True,  # noqa: E712
            Product.deleted_at.is_(None),
        )
        .order_by(Product.is_featured.desc(), Product.name.asc())
        .limit(4)
        .all()
    )

    data = serialize_product(prod)
    data["related_products"] = [serialize_product(r) for r in related]
    return data


@router.get("/collections/{slug}")
def get_collection_detail(slug: str, db: Session = Depends(get_db)):
    col = (
        db.query(Collection)
        .filter(Collection.slug == slug, Collection.is_active == True)  # noqa: E712
        .first()
    )
    if not col:
        raise ProblemException(
            status_code=404,
            title="Collection Not Found",
            detail=f"Collection '{slug}' was not found.",
            problem_type="https://globaltolocal.in/problems/collection-not-found",
        )

    links = (
        db.query(ProductCollection)
        .options(
            joinedload(ProductCollection.product).joinedload(Product.category),
            joinedload(ProductCollection.product).joinedload(Product.maker),
            joinedload(ProductCollection.product).joinedload(Product.images),
            joinedload(ProductCollection.product).joinedload(Product.inventory),
        )
        .filter(ProductCollection.collection_id == col.id)
        .order_by(ProductCollection.sort_order.asc())
        .all()
    )

    products = [
        serialize_product(link.product)
        for link in links
        if link.product and link.product.is_active and link.product.deleted_at is None
    ]

    return {
        "id": str(col.id),
        "slug": col.slug,
        "title": col.title,
        "subtitle": col.subtitle or "",
        "description": col.description or "",
        "hero_image_url": col.hero_image_url or "",
        "items": products,
    }


@router.get("/search/suggest")
def search_suggestions(
    q: str = Query(..., min_length=1, max_length=80),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    clean_q = q.strip()
    sim = func.similarity(Product.name, clean_q)
    products = (
        db.query(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.images),
            joinedload(Product.inventory),
        )
        .filter(
            Product.is_active == True,  # noqa: E712
            Product.deleted_at.is_(None),
            or_(
                Product.name.ilike(f"%{clean_q}%"),
                Product.short_description.ilike(f"%{clean_q}%"),
                sim > 0.18,
            ),
        )
        .order_by(sim.desc(), Product.is_featured.desc(), Product.name.asc())
        .limit(limit)
        .all()
    )

    categories = (
        db.query(Category)
        .filter(
            Category.is_active == True,  # noqa: E712
            or_(
                Category.name.ilike(f"%{clean_q}%"),
                func.similarity(Category.name, clean_q) > 0.2,
            ),
        )
        .order_by(Category.display_order.asc())
        .limit(4)
        .all()
    )

    return {
        "query": clean_q,
        "products": [serialize_product(p) for p in products],
        "categories": [serialize_category(c) for c in categories],
    }


@router.get("/makers")
def list_makers(db: Session = Depends(get_db)):
    makers = (
        db.query(Maker)
        .filter(Maker.is_published == True)  # noqa: E712
        .order_by(Maker.name.asc())
        .all()
    )
    return {
        "items": [
            {
                "id": str(m.id),
                "slug": m.slug,
                "name": m.name,
                "kind": m.kind.value,
                "village_or_ward": m.village_or_ward,
                "taluka": m.taluka,
                "district": m.district,
                "story_short": m.story_short,
                "story_long": m.story_long,
                "hero_image_url": m.hero_image_url,
            }
            for m in makers
        ]
    }
