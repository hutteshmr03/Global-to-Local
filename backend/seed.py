import json
from datetime import date
from pathlib import Path
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.database import SessionLocal
import uuid
from backend.core.security import hash_password
from backend.models import (
    Address,
    AvailabilityState,
    Category,
    CmsPage,
    Collection,
    Faq,
    Inventory,
    Maker,
    MakerKind,
    PressKind,
    PressMention,
    Product,
    ProductCollection,
    ProductImage,
    ShippingPincode,
    ShippingRate,
    ShippingZone,
    SiteSetting,
    StockMovement,
    StockMovementReason,
    StoreReview,
    User,
    UserRole,
)

SHELL_SHELF_LEGACY_IDS = [6163, 6167, 6176, 6140, 6168, 6141, 6157, 6180, 6155, 6177]

LIVE_FAQS = [
    ("Registration & Account", "Are there any charges for registration?", "No, registration on globaltolocal.in is free."),
    ("Registration & Account", "Do I have to necessarily register to shop?", "You can browse and add items without registering, but only registered shoppers will be able to checkout and place orders."),
    ("Registration & Account", "Can I have multiple registrations?", "Each email address and contact number can only be associated with one globaltolocal account."),
    ("Registration & Account", "Can I add multiple delivery addresses?", "Yes, you can save multiple delivery addresses on your globaltolocal account. However, please note that all items placed in a single order can only be delivered to one address."),
    ("Registration & Account", "What is My Account?", "My Account is the section you get access to after logging in to globaltolocal.in. It allows you to track your active orders, check your order history, and update contact information."),
    ("Pricing & Payment", "Are there any additional charges or taxes?", "No, the product prices will remain the same. However, delivery cost will be additionally charged."),
    ("Pricing & Payment", "Is it safe to use my credit or debit card?", "Yes, it is safe to use your card on globaltolocal.in."),
    ("Delivery & Shipping", "How long will delivery take?", "Once you have placed your order, based on the product selection and location of delivery, you will be given an intimation of the estimated date of delivery."),
    ("Delivery & Shipping", "How are the products delivered?", "We are partnered with a courier service."),
    ("Delivery & Shipping", "Is there a minimum order value?", "No, there is no minimum order value."),
    ("Delivery & Shipping", "What are the delivery charges?", "Standard delivery charges are set based on the weight of the package and the city of delivery."),
    ("Delivery & Shipping", "Is there free shipping above a certain order value?", "No, there will not be free shipping on the basis of order value."),
    ("Delivery & Shipping", "How is quality assured?", "At the time of delivery, we advise you to kindly check every item as in the invoice."),
    ("Our Store & Makers", "Do you have offline stores?", "Yes, we have a quaint little store situated in the Latin Quarters of Goa, Fontainhas."),
    ("Orders & Gifting", "Do you take bulk or corporate orders?", "Yes, we do bulk orders of products at special prices for institutions such as hotels, corporates, and event management companies."),
    ("Our Store & Makers", "Where do the products come from?", "No, at Global to Local all our products are made in Goa and of Goan origin."),
    ("Our Store & Makers", "Who makes the products?", "80% of our products are made by women from self-help groups, we believe in our mantra 'We support livelihoods.'"),
    ("Orders & Gifting", "Do you make gift hampers?", "Yes, however this service can only be availed for the state of Goa."),
    ("Support", "How do I share feedback?", "Please feel free to write to us on customerservice@globaltolocal.in"),
]

VISITORS_BOOK_REVIEWS = [
    {
        "author_name": "Gifty Abraham",
        "author_location": "",
        "rating": 5,
        "quote": "Global to Local is a world of authentic Goan Treasures. A very aesthetic space with organic Goan delicacies and traditional items. Love the way they empower women through their business ideas. A must visit place.",
        "source": "Visitors' Book",
        "is_featured": False,
        "display_order": 1,
    },
    {
        "author_name": "Stedwick Fernandes",
        "author_location": "",
        "rating": 5,
        "quote": "The store had Kokani music playing. The light shades were so much like the ones in my great granny's house. The staff was super courteous and hospitable...I will 100% recommend this store to family, friends and everyone I know.",
        "source": "Visitors' Book",
        "is_featured": False,
        "display_order": 2,
    },
    {
        "author_name": "Swapna Pujari",
        "author_location": "SilhouetteIndia",
        "rating": 5,
        "quote": "Our go to place all such needs is Global to Local and I highly recommend Global to Local for authentic goan hampers and gifting requirements.",
        "source": "Visitors' Book",
        "is_featured": False,
        "display_order": 3,
    },
]

PRESS_ITEMS = [
    {
        "kind": PressKind.article,
        "publication_or_issuer": "The Navhind Times",
        "title": "Global to Local supermarket opens in city",
        "excerpt": "October 2020",
        "external_url": "https://www.navhindtimes.in/2020/10/28/business/global-to-local-supermarket-opens-in-city/",
        "published_on": date(2020, 10, 28),
        "display_order": 1,
    },
    {
        "kind": PressKind.article,
        "publication_or_issuer": "Business Goa",
        "title": "Global to Local in Business Goa",
        "excerpt": "March 2021",
        "external_url": "https://businessgoa.in/tag/global-to-local/",
        "published_on": date(2021, 3, 15),
        "display_order": 2,
    },
    {
        "kind": PressKind.article,
        "publication_or_issuer": "Gomantak Times",
        "title": "Global to Local empowers rural Goan women entrepreneurs",
        "excerpt": "August 2022",
        "external_url": "https://www.gomantaktimes.com/news/business/global-to-local-empowers-rural-goan-women-entrepreneurs",
        "published_on": date(2022, 8, 10),
        "display_order": 3,
    },
    {
        "kind": PressKind.article,
        "publication_or_issuer": "The Goan",
        "title": "Feature on Global to Local",
        "excerpt": "February 2025",
        "external_url": "#",
        "published_on": date(2025, 2, 1),
        "display_order": 4,
    },
    {
        "kind": PressKind.article,
        "publication_or_issuer": "Herald",
        "title": "Global to Local in the Herald",
        "excerpt": "November 2024",
        "external_url": "#",
        "published_on": date(2024, 11, 1),
        "display_order": 5,
    },
    {
        "kind": PressKind.award,
        "publication_or_issuer": "",
        "title": "Award for supporting local livelihoods",
        "excerpt": "Recognised for providing structured retail access and financial independence to 100+ Goan women from self-help groups.",
        "external_url": None,
        "published_on": None,
        "display_order": 6,
    },
    {
        "kind": PressKind.award,
        "publication_or_issuer": "",
        "title": "Award for women-led enterprise",
        "excerpt": "Honouring founder Asha Arondekar and the network of village micro-producers across North and South Goa.",
        "external_url": None,
        "published_on": None,
        "display_order": 7,
    },
]

CMS_PAGES_SEED = [
    {
        "slug": "our-story",
        "title": "Our Story",
        "subtitle": "How a small store in Fontainhas, Panaji became a home for Goan makers, self-help groups and age-old recipes.",
        "body_md": json.dumps(
            {
                "founder": "Asha Arondekar",
                "headline": "A one-of-a-kind Goan store in the Latin Quarters of Panaji.",
                "mantra": "We support livelihoods.",
                "shg_percent": 80,
                "location": "Tarcar Mansion, Fontainhas, Panaji, Goa 403001",
            }
        ),
        "hero_image_url": "/images/site/founder-asha.jpg",
    },
    {
        "slug": "our-social-corner",
        "title": "Our Social Corner",
        "subtitle": "80% of our products are made by women from self-help groups. This is the part of the store that matters most to us.",
        "body_md": json.dumps(
            {
                "instagram_url": "https://www.instagram.com/globaltolocalgoa/",
                "mantra": "We support livelihoods.",
                "shg_percentage": 80,
            }
        ),
        "hero_image_url": "/videos/maker-poster.jpg",
    },
    {
        "slug": "in-the-news",
        "title": "In the News",
        "subtitle": "What has been written about the store, the women who make its products, and the idea behind it.",
        "body_md": json.dumps({"press_count": 5, "awards_count": 2}),
        "hero_image_url": "/images/site/store-front.jpg",
    },
    {
        "slug": "shipping-policy",
        "title": "Shipping & Delivery Policy",
        "subtitle": "Fulfillment & Rates",
        "body_md": json.dumps(
            [
                {
                    "heading": "Pan-India Delivery",
                    "body": "We dispatch packages to all postal pincodes across India from our heritage store at Tarcar Mansion, Fontainhas, Panaji, Goa 403001.",
                },
                {
                    "heading": "Dispatch Timeline",
                    "body": "All orders are carefully packed in protective packaging and dispatched within 24 to 48 hours of order confirmation. You will receive an SMS and email notification with your live courier tracking link.",
                },
                {
                    "heading": "Delivery Estimates",
                    "body": "• Within Goa: 1–2 business days\n• Major Metros (Mumbai, Bengaluru, Delhi, Hyderabad, Chennai, Kolkata): 3–5 business days\n• Rest of India: 4–7 business days",
                },
                {
                    "heading": "Shipping Charges",
                    "body": "Delivery charges are calculated based on the destination pincode and total package weight slab according to courier partner rate cards. All rates are shown transparently before payment.",
                },
            ]
        ),
        "hero_image_url": None,
    },
    {
        "slug": "return-and-exchange-policy",
        "title": "Return & Exchange Policy",
        "subtitle": "Quality Guarantee",
        "body_md": json.dumps(
            [
                {
                    "heading": "Perishable Goods & Food Safety",
                    "body": "Due to the consumable nature of spices, bakery products, masalas, oils, and handmade soaps, we do not accept general returns once a package has been opened.",
                },
                {
                    "heading": "Damaged or Defective Items",
                    "body": "If your item arrives damaged in transit, leaking, defective, or expired, please email us at customerservice@globaltolocal.in or call +91 80103 67153 within 48 hours of delivery with photos of the damaged shipment.",
                },
                {
                    "heading": "Order Cancellation",
                    "body": "Customers can cancel orders directly while pending payment. For paid orders, please contact the store to cancel.",
                },
            ]
        ),
        "hero_image_url": None,
    },
    {
        "slug": "terms-and-conditions",
        "title": "Terms & Conditions",
        "subtitle": "Legal Agreement",
        "body_md": json.dumps(
            [
                {
                    "heading": "Use of the Site",
                    "body": "By accessing and ordering from Global to Local, you agree to comply with and be bound by these terms and conditions.",
                },
                {
                    "heading": "Pricing & Taxes",
                    "body": "All prices listed on the site are in Indian Rupees (INR) and are inclusive of all applicable Goods and Services Taxes (GST).",
                },
                {
                    "heading": "Order Acceptance",
                    "body": "We reserve the right to refuse or cancel any order in the event of product unavailability or pricing inaccuracies. For paid orders, please contact the store to cancel.",
                },
            ]
        ),
        "hero_image_url": None,
    },
    {
        "slug": "privacy-policy",
        "title": "Privacy Policy",
        "subtitle": "Data Protection (DPDP Compliant)",
        "body_md": json.dumps(
            [
                {
                    "heading": "Information We Collect",
                    "body": "We collect your name, delivery address, email, and phone number solely to process and deliver your orders and send tracking updates.",
                },
                {
                    "heading": "Payment Information Security",
                    "body": "We do not store your credit card, debit card, or UPI credentials. All transactions are securely processed through Razorpay with 256-bit encryption.",
                },
                {
                    "heading": "Your Rights",
                    "body": "In accordance with India’s Digital Personal Data Protection (DPDP) Act, you have the right to request access to or deletion of your personal account data at any time by contacting our support team.",
                },
            ]
        ),
        "hero_image_url": None,
    },
]


def seed_database(db: Session) -> dict:
    root_dir = Path(__file__).resolve().parent.parent
    seed_json_path = root_dir / "content-audit" / "seed_source.json"
    data = json.loads(seed_json_path.read_text(encoding="utf-8"))

    # 1. Clear any invented Makers (products in data.js do not specify individual maker entities)
    db.query(Product).update({Product.maker_id: None})
    db.query(Maker).delete()
    db.flush()

    # 2. Seed 13 Categories
    categories_by_slug: dict[str, Category] = {}
    for idx, c_data in enumerate(data["categories"], start=1):
        cat = db.query(Category).filter(Category.slug == c_data["slug"]).first()
        if not cat:
            cat = Category(
                slug=c_data["slug"],
                name=c_data["name"],
                tagline=c_data.get("blurb", ""),
                description=c_data.get("blurb", ""),
                hero_image_url=c_data.get("imageSrc", ""),
                display_order=idx,
                is_active=True,
            )
            db.add(cat)
            db.flush()
        else:
            cat.name = c_data["name"]
            cat.tagline = c_data.get("blurb", "")
            cat.description = c_data.get("blurb", "")
            cat.hero_image_url = c_data.get("imageSrc", "")
            cat.display_order = idx
            cat.is_active = True
        categories_by_slug[cat.slug] = cat

    # 3. Seed 230 Products + Images + Inventory
    import re
    products_by_legacy_id: dict[int, Product] = {}
    for idx_p, p_data in enumerate(data["products"]):
        legacy_id = int(p_data["id"])
        sku = f"GTL-{legacy_id}"
        cat = categories_by_slug[p_data["categorySlug"]]

        unit_label = p_data.get("weight") or p_data.get("unit") or "One piece"
        weight_match = re.search(r"(\d+)\s*(kg|g|gm|grams|ml|l)\b", f"{unit_label} {p_data['name']}", re.IGNORECASE)
        if weight_match:
            val = int(weight_match.group(1))
            unit_u = weight_match.group(2).lower()
            net_weight_grams = val * 1000 if unit_u in ("kg", "l") else max(val, 10)
        else:
            net_weight_grams = int(p_data.get("weightGrams") or 250)

        price_paise = int(p_data.get("price") if "price" in p_data else p_data["pricePaise"])
        short_desc = p_data.get("shortDescription") or p_data.get("description") or ""
        full_desc = p_data.get("description") or short_desc
        is_featured = bool(p_data.get("featured", idx_p < 16))
        in_stock = bool(p_data.get("inStock", True))

        prod = db.query(Product).filter(Product.slug == p_data["slug"]).first()
        if not prod:
            prod = Product(
                legacy_id=legacy_id,
                sku=sku,
                slug=p_data["slug"],
                name=p_data["name"],
                category_id=cat.id,
                maker_id=None,
                short_description=short_desc,
                description=full_desc,
                origin_text=p_data.get("origin", "Made in Goa"),
                unit_label=unit_label,
                net_weight_grams=net_weight_grams,
                price_paise=price_paise,
                compare_at_paise=None,
                tax_rate_bps=500,
                is_featured=is_featured,
                is_new=False,
                is_active=True,
                availability=AvailabilityState.in_stock if in_stock else AvailabilityState.out_of_stock,
            )
            db.add(prod)
            db.flush()
        else:
            prod.legacy_id = legacy_id
            prod.sku = sku
            prod.name = p_data["name"]
            prod.category_id = cat.id
            prod.maker_id = None
            prod.short_description = short_desc
            prod.description = full_desc
            prod.origin_text = p_data.get("origin", "Made in Goa")
            prod.unit_label = unit_label
            prod.net_weight_grams = net_weight_grams
            prod.price_paise = price_paise
            prod.is_featured = is_featured
            prod.is_active = True
            prod.availability = AvailabilityState.in_stock if in_stock else AvailabilityState.out_of_stock
            db.flush()

        # Primary Image
        primary_img = (
            db.query(ProductImage)
            .filter(ProductImage.product_id == prod.id, ProductImage.is_primary == True)  # noqa: E712
            .first()
        )
        if not primary_img:
            primary_img = ProductImage(
                product_id=prod.id,
                url=p_data["imageSrc"],
                alt_text=p_data.get("imageAlt") or p_data["name"],
                width=600,
                height=600,
                sort_order=0,
                is_primary=True,
            )
            db.add(primary_img)
        else:
            primary_img.url = p_data["imageSrc"]
            primary_img.alt_text = p_data.get("imageAlt") or p_data["name"]

        # Inventory
        inv = db.query(Inventory).filter(Inventory.product_id == prod.id).first()
        if not inv:
            inv = Inventory(
                product_id=prod.id,
                on_hand=50,
                reserved=0,
                low_stock_threshold=5,
                allow_backorder=False,
            )
            db.add(inv)
            db.add(
                StockMovement(
                    product_id=prod.id,
                    delta=50,
                    reason=StockMovementReason.initial_seed,
                    note="Initial catalogue seed stock",
                )
            )

        products_by_legacy_id[legacy_id] = prod

    # 4. Seed Collections (shell-shelf & featured)
    shell_col = db.query(Collection).filter(Collection.slug == "shell-shelf").first()
    if not shell_col:
        shell_col = Collection(
            slug="shell-shelf",
            title="Picked up on a Goan beach, turned into lamps, coasters and trays",
            subtitle="Shell Craft — Curated from Hand-Crafted",
            description="Part of the Hand-Crafted shelf — twelve shell-craft pieces made by Goan artisans, gathered here so you can browse them together.",
            is_active=True,
            display_order=1,
        )
        db.add(shell_col)
        db.flush()

    db.query(ProductCollection).filter(ProductCollection.collection_id == shell_col.id).delete()
    for sort_idx, leg_id in enumerate(SHELL_SHELF_LEGACY_IDS, start=1):
        if leg_id in products_by_legacy_id:
            db.add(
                ProductCollection(
                    product_id=products_by_legacy_id[leg_id].id,
                    collection_id=shell_col.id,
                    sort_order=sort_idx,
                )
            )

    # 5. Seed 19 FAQs
    db.query(Faq).delete()
    for idx, (cat_name, q_text, a_text) in enumerate(LIVE_FAQS, start=1):
        db.add(
            Faq(
                category=cat_name,
                question=q_text,
                answer_md=a_text,
                display_order=idx,
                is_published=True,
            )
        )

    # 6. Seed Store Reviews (only the 3 Visitors' Book reviews from the frontend/live site)
    db.query(StoreReview).delete()
    for r in VISITORS_BOOK_REVIEWS:
        db.add(
            StoreReview(
                author_name=r["author_name"],
                author_location=r["author_location"],
                rating=r["rating"],
                quote=r["quote"],
                source=r["source"],
                is_featured=r["is_featured"],
                is_approved=True,
                display_order=r["display_order"],
            )
        )

    # 7. Seed Press Mentions & Awards
    db.query(PressMention).delete()
    for item in PRESS_ITEMS:
        db.add(
            PressMention(
                kind=item["kind"],
                publication_or_issuer=item["publication_or_issuer"],
                title=item["title"],
                excerpt=item["excerpt"],
                external_url=item["external_url"],
                published_on=item["published_on"],
                display_order=item["display_order"],
                is_published=True,
            )
        )

    # 8. Seed 7 CMS Pages
    for page_data in CMS_PAGES_SEED:
        page = db.query(CmsPage).filter(CmsPage.slug == page_data["slug"]).first()
        if not page:
            page = CmsPage(**page_data, is_published=True)
            db.add(page)
        else:
            for k, v in page_data.items():
                setattr(page, k, v)
            page.is_published = True

    # 9. Seed Site Settings
    settings_payloads = {
        "store_identity": {
            "name": data["siteConfig"]["name"],
            "short_name": data["siteConfig"]["shortName"],
            "tagline": data["siteConfig"]["tagline"],
            "description": data["siteConfig"]["description"],
            "founder": data["siteConfig"]["founder"],
            "mantra": "We support livelihoods.",
        },
        "store_contact": data["siteConfig"]["contact"],
        "social_impact_stats": {
            "shg_women_percentage": 80,
            "goan_origin_percentage": 100,
            "shelves_count": 13,
            "products_count": 230,
        },
        "shipping_policy_flags": {
            "minimum_order_paise": 0,
            "free_shipping_enabled": False,
            "custom_hampers_region": "GOA_ONLY",
            "prices_include_tax": True,
        },
        "maker_steps": data.get("makerSteps", []),
        "videos": data.get("videos", {}),
    }
    for key, val in settings_payloads.items():
        setting = db.query(SiteSetting).filter(SiteSetting.key == key).first()
        if not setting:
            db.add(SiteSetting(key=key, value=val, description=f"Public configuration for {key}"))
        else:
            setting.value = val

    # 10. Seed Shipping Zones, Pincodes, and Rates (Step B3)
    # Goa Express (403xxx): Rs 80 (8000 paise), 1-2 days
    # Pan-India Standard (all other valid 6-digit Indian pincodes): Rs 120 (12000 paise), 3-7 days
    goa_zone = db.query(ShippingZone).filter(ShippingZone.code == "GOA").first()
    if not goa_zone:
        goa_zone = ShippingZone(
            code="GOA",
            name="Goa Express",
            pincode_regex=r"^403[0-9]{3}$",
            priority=10,
            is_active=True,
        )
        db.add(goa_zone)
        db.flush()
    else:
        goa_zone.name = "Goa Express"
        goa_zone.pincode_regex = r"^403[0-9]{3}$"
        goa_zone.priority = 10
        goa_zone.is_active = True

    roi_zone = db.query(ShippingZone).filter(ShippingZone.code == "ROI").first()
    if not roi_zone:
        roi_zone = ShippingZone(
            code="ROI",
            name="Pan-India Standard",
            pincode_regex=r"^[1-9][0-9]{5}$",
            priority=100,
            is_active=True,
        )
        db.add(roi_zone)
        db.flush()
    else:
        roi_zone.name = "Pan-India Standard"
        roi_zone.pincode_regex = r"^[1-9][0-9]{5}$"
        roi_zone.priority = 100
        roi_zone.is_active = True

    # Pincode prefix rows
    db.query(ShippingPincode).delete()
    db.add(
        ShippingPincode(
            pincode_prefix="403",
            zone_id=goa_zone.id,
            label="Goa State (North & South Goa 403xxx)",
            is_goa=True,
        )
    )

    # Rate rows
    db.query(ShippingRate).delete()
    db.add(
        ShippingRate(
            zone_id=goa_zone.id,
            min_weight_grams=0,
            max_weight_grams=100000,
            rate_paise=8000,
            free_above_paise=None,
            estimated_days_min=1,
            estimated_days_max=2,
            is_active=True,
        )
    )
    db.add(
        ShippingRate(
            zone_id=roi_zone.id,
            min_weight_grams=0,
            max_weight_grams=100000,
            rate_paise=12000,
            free_above_paise=None,
            estimated_days_min=3,
            estimated_days_max=7,
            is_active=True,
        )
    )

    db.commit()

    # Verify per-shelf product counts
    rows = (
        db.query(Category.slug, Category.name, func.count(Product.id))
        .outerjoin(Product, (Product.category_id == Category.id) & (Product.is_active == True))  # noqa: E712
        .group_by(Category.id, Category.slug, Category.name, Category.display_order)
        .order_by(Category.display_order)
        .all()
    )
    shelf_counts = {slug: {"name": name, "count": int(cnt)} for slug, name, cnt in rows}
    total_products = sum(v["count"] for v in shelf_counts.values())
    return {"total_products": total_products, "shelves": shelf_counts}


if __name__ == "__main__":
    with SessionLocal() as session:
        summary = seed_database(session)
        print(f"Seed complete! Total active products: {summary['total_products']}")
        for slug, info in summary["shelves"].items():
            print(f"  - {info['name']:22s} ({slug:22s}): {info['count']}")
