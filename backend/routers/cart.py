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


LEGACY_MAP = {6471: 'goan-themed-blue-mug', 6346: 'wine-biscuits-200-grams', 6344: 'coconut-macaroons-250-grams', 6342: 'batika', 6336: 'unpeeled-cashew-nuts-500-grams', 6334: 'garlic-sticks', 6332: 'cones', 6330: 'canapes', 6324: 'kunbi-shawl', 6323: 'kunbi-saree-7', 6322: 'kunbi-saree-6', 6321: 'kunbi-saree-5', 6320: 'kunbi-saree-4', 6314: 'kunbi-saree-3', 6312: 'kunbi-saree-2', 6310: 'kunbi-saree-1', 6268: 'mitti-vases-8211-medium', 6267: 'mitti-vases-8211-small', 6266: 'mitti-suraahi', 6265: 'mitti-plate', 6264: 'mitti-mug', 6263: 'mitti-kullad', 6262: 'mitti-candle-holder', 6260: 'mitti-foot-scrubber', 6259: 'mitti-fish-ashtray', 6258: 'mitti-dhoop-holder', 6257: 'mitti-curd-pot', 6256: 'mitti-cup', 6255: 'mitti-cooking-pot', 6253: 'mitti-bottle-1-litre', 6252: 'goan-themed-cloth-bags', 6215: 'dried-sungta-150-grams', 6214: 'dried-khaapi-150-grams', 6213: 'dried-gaalmo-150-grams', 6212: 'dried-bombil-fish-100-grams', 6211: 'dried-bangda-fish-200-grams', 6205: 'pineapple-jam-250-grams', 6204: 'raw-mango-jam-250-grams', 6203: 'coconut-garlic-chutney-100-grams', 6202: 'coconut-cashew-chutney-100-grams', 6197: 'white-chawli-200-grams', 6196: 'ukda-taandul-1-kg', 6195: 'raagi-millet-500-grams', 6194: 'raagi-atta-500-grams', 6192: 'pohe-250-grams', 6191: 'kulith-200-grams', 6190: 'brown-taandul-1-kg', 6189: 'alsaande-200-grams', 6180: 'coconut-shell-spoon-8211-large', 6179: 'wooden-lotus-candle-holder', 6178: 'wooden-flower-candle-holder', 6177: 'whelks-shells', 6176: 'shell-tortoise--large', 6175: 'shell-tortoise--medium', 6174: 'shell-tortoise--small', 6173: 'shell-toothpicks', 6172: 'shell-skewers', 6171: 'shell-rooster', 6169: 'shell-rabbit', 6168: 'shell-peacock', 6167: 'shell-mirror--round', 6165: 'shell-mirror--square', 6163: 'shell-lamp--round', 6162: 'shell-lamp--square', 6161: 'shell-keychain', 6159: 'shell-ganpati', 6158: 'shell-frog', 6157: 'shell-fisherwoman', 6156: 'shell-dog', 6155: 'shell-crane', 6154: 'shell-chopsticks', 6153: 'shell-birds', 6152: 'mud-rooster', 6151: 'jute-pot-holder', 6150: 'goan-themed-colourful-tiles', 6149: 'goan-themed-colourful-mugs', 6148: 'goan-themed-blue-tiles', 6147: 'goan-recipe-book', 6146: 'goan-painting-four', 6145: 'goan-painting-three', 6144: 'goan-painting-two', 6143: 'goan-painting-one', 6142: 'mud-statue-of-fisherwoman', 6141: 'cowrie-shells', 6140: 'conche-shells', 6139: 'colourful-mud-rooster', 6138: 'coconut-shell-spoon--small', 6135: 'cane-soop', 6134: 'cane-paatlo', 6088: 'old-goa-virgin-coconut-body-oil--lanvendar-200ml', 6086: 'old-goa-virgin-coconut-body-oil--english-rose-200ml', 6085: 'epsom-salts-100-grams', 6084: 'paaripat-30-grams', 6083: 'kokum-butter-per-piece', 6082: 'kodu-50-grams', 6081: 'kiraayte-50-grams', 6080: 'handmade-soap--besan', 6079: 'handmade-soap--charcoal', 6078: 'handmade-soap--neem', 6077: 'dhoop', 6076: 'cow-dung-diyas-10-pieces', 6075: 'bath-salts--rose-500-grams', 6074: 'bath-salts--lotus-500-grams', 6073: 'bath-salts--lavender-500-grams', 6072: 'bath-salts--coffee-500-grams', 6071: 'bath-salts-sandalwood-500-grams', 6070: 'agarbatti-8211-sandalwood-80-grams', 6069: 'agarbatti-lavender-80-grams', 6068: 'agarbatti--musk-80-grams', 6051: 'crop-xacuti-masala-100-grams', 6050: 'crop-sorpotel-masala-powder-100-grams', 6049: 'crop-samarachi-kodi-masala-powder-100-grams', 6048: 'crop-peri-peri-mix-100-grams', 6047: 'crop-mutton-masala-powder-100-grams', 6046: 'crop-goan-curry-powder-100-grams', 6045: 'crop-fish-fry-masala-powder-100-grams', 6044: 'crop-fish-curry-masala-powder-100-grams', 6043: 'crop-crab-xec-xec-masala-powder-100-grams', 6042: 'crop-chicken-masala-powder-100-grams', 6041: 'crop-caldine-masala-powder-100-grams', 6040: 'crop-cafreal-masala-mix-100-grams', 6039: 'crop-balchao-masala-powder-100-grams', 6038: 'crop-ambot-tik-masala-powder-100-grams', 6036: 'udda-methi-powder-250-grams', 6035: 'sorpotel-masala-paste-250-grams', 6034: 'samarachi-koddi-powder-250-grams', 6033: 'rechado-masala-paste-500-grams', 6032: 'prawn-curry-masala-powder-250-grams', 6031: 'pork-vindaloo-masala-powder-250-grams', 6030: 'pork-roast-masala-powder-250-grams', 6029: 'pork-curry-masala-powder-250-grams', 6028: 'fish-fry-masala-powder-250-grams', 6027: 'fish-curry-powder-250-grams', 6026: 'fish-curry-masala-powder-200-grams', 6025: 'chicken-xacuti-masala-powder-200-grams', 6024: 'chicken-roast-masala-powder', 6023: 'caldine-masala-powder-100-grams', 6022: 'cafreal-masala-paste-250-grams', 6021: 'balchao-masala-paste-250-grams', 6020: 'ambot-tik-masala-paste-250-grams', 5985: 'wheat-sheviyo-100-grams', 5984: 'onion-vaddiyo-100-grams', 5983: 'kuwaale-vaddiyo-100-grams', 5982: 'tomato-papad-50-grams', 5981: 'star-taarvoti-papad-200-grams', 5980: 'spinach-papad-50-grams', 5979: 'sabudana-papad-50-grams', 5978: 'rice-papad-50-grams', 5977: 'red-chilli-papad-50-grams', 5976: 'jeera-papad-50-grams', 5975: 'green-chilli-papad-50-grams', 5974: 'garlic-papad-50-grams', 5973: 'water-mango-pickle-300-grams', 5972: 'tendli-pickle-200-grams', 5971: 'stuffed-mango-pickle-300-grams', 5970: 'starfruit-pickle-200-grams', 5969: 'prawn-balchao-pickle-250-grams', 5968: 'mango-pickle-200-grams', 5967: 'mackarel-mol-pickle-250-grams', 5966: 'lemon-pickle-200-grams', 5965: 'kingfish-balchao-pickle-250-grams', 5964: 'jackfruit-pickle-200-grams', 5941: 'fresh-turmeric-pickle-200-grams', 5940: 'chilli-lemon-pickle-200-grams', 5939: 'brinjal-pickle-200-grams', 5938: 'bombil-pickle-250-grams', 5932: 'bimbli-pickle-200-grams', 5930: 'tirphal-50-grams', 5928: 'tamarind-salt-balls', 5926: 'stuffed-curd-chilli', 5924: 'pernem-red-chillies-200-grams', 5922: 'mango-sola-100-grams', 5920: 'mango-padde-250-grams', 5917: 'kokum-sola-400-grams', 5916: 'cold-pressed-virgin-coconut-oil-200-ml', 5913: 'curd-chilli', 5914: 'narla-cold-pressed-virgin-coconut-oil-500ml', 5911: 'old-goa-cold-pressed-coconut-oil-500ml', 5909: 'coconut-jaggery-powder-250-grams', 5910: 'mulgao-verde-virgin-coconut-oil-250ml', 5907: 'mulgao-verde-virgin-coconut-oil-100ml', 5906: 'coconut-jaggery-blocks-500-grams', 5905: 'kokamrut-kokum-syrup-500-ml', 5903: 'black-pepper-50-grams', 5902: 'kokamrut-kokum-aagal-500-ml', 5900: 'fresh-kokum-aagal-500-ml', 5898: 'atom-sola-50-grams', 5899: 'filtered-cooking-coconut-oil-500ml', 5897: 'filtered-cooking-coconut-oil-200ml', 5896: 'extra-virgin-coconut-oil-250ml', 5884: 'desi-cow-ghee-500-grams', 5883: 'coconut-vinegar-500-ml', 5879: 'cashew-vinegar-700-ml', 5773: 'mango-saat', 5772: 'mango-bites', 5771: 'mango-bar', 5765: 'zuzoops-100-grams', 5764: 'sugar-boondi-ladoo', 5763: 'shev-ladoo', 5762: 'rum-038-raisin-cake-500-grams', 5761: 'rose-cookies', 5760: 'pinaagr', 5759: 'guava-peraad-500-grams', 5758: 'peanut-ladoo', 5751: 'khat-khate', 5744: 'khajjur-katli-pack-of-4', 5741: 'jackfruit-saat', 5739: 'guava-cheese-500-grams', 5737: 'goan-khaaje-500-grams', 5735: 'dodol-500-grams', 5732: 'coconut-mila', 5730: 'coconut-chikki', 5728: 'churmuli-ladoo', 5727: 'sweet-potato-chips-250-grams', 5726: 'spicy-mini-chakli-100-grams', 5725: 'spicy-corn-churma-300-grams', 5720: 'cashew-ladoo', 5718: 'spicy-besan-chakli-250-grams', 5716: 'bolacho-corpial', 5714: 'bol', 5712: 'salted-goan-cashews-500-grams', 5708: 'bebinca-500-grams', 5709: 'pohe-churma-ladoo', 5705: 'plain-goan-cashews-500-grams', 5697: 'aataa-rings', 5703: 'moong-chakli-250-grams', 5700: 'masala-phenori-500-grams', 5698: 'butter-rice-chakli-250-grams', 5695: 'banana-chips-in-palm-oil-250-grams', 5691: 'banana-chips-in-coconut-oil-500-grams'}

def resolve_product(
    db: Session,
    product_ref: Union[str, int],
) -> Product:
    prod: Optional[Product] = None
    ref_str = str(product_ref).strip()

    # 1. Try legacy integer or fallback mapping by slug
    if ref_str.isdigit():
        int_id = int(ref_str)
        fallback_slug = LEGACY_MAP.get(int_id)
        q = db.query(Product).options(joinedload(Product.inventory), joinedload(Product.images), joinedload(Product.category))
        if fallback_slug:
            prod = q.filter(
                ((Product.legacy_id == int_id) | (Product.slug == fallback_slug)),
                Product.is_active == True
            ).first()
        else:
            prod = q.filter(Product.legacy_id == int_id, Product.is_active == True).first()

    # 2. Try UUID
    if not prod:
        try:
            u = uuid.UUID(ref_str)
            prod = (
                db.query(Product)
                .options(joinedload(Product.inventory), joinedload(Product.images), joinedload(Product.category))
                .filter(Product.id == u, Product.is_active == True)
                .first()
            )
        except ValueError:
            pass

    # 3. Try slug or SKU
    if not prod:
        prod = (
            db.query(Product)
            .options(joinedload(Product.inventory), joinedload(Product.images), joinedload(Product.category))
            .filter((Product.slug == ref_str) | (Product.sku == ref_str), Product.is_active == True)
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
    if not prod.is_active or str(getattr(prod, 'availability', '')) in ('out_of_stock', 'AvailabilityState.out_of_stock'):
        return 0
    if prod.inventory is None:
        return 100
    oh = getattr(prod.inventory, 'on_hand', None)
    res = getattr(prod.inventory, 'reserved', None)
    try:
        on_hand_val = int(oh) if oh is not None else 100
    except Exception:
        on_hand_val = 100
    try:
        reserved_val = int(res) if res is not None else 0
    except Exception:
        reserved_val = 0
    return max(0, on_hand_val - reserved_val)


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


def serialize_cart(cart: Cart, db: Optional[Session] = None) -> dict[str, Any]:
    items_out: list[dict[str, Any]] = []
    subtotal_paise = 0
    total_qty = 0
    total_weight_grams = 0
    removed_items: list[str] = []

    for ci in list(cart.items):
        prod = ci.product
        if not prod or not prod.is_active or prod.deleted_at is not None:
            removed_items.append(prod.name if prod else "An item")
            if db:
                db.delete(ci)
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
        img_url = primary_img.url if primary_img else f"/images/catalog/{prod.slug}.jpg"
        if "goan-themed-blue-mug.jpg" in img_url and prod.slug != "goan-themed-blue-mug":
            img_url = f"/images/catalog/{prod.slug}.jpg"
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

    res = {
        "id": str(cart.id),
        "user_id": str(cart.user_id) if cart.user_id else None,
        "items": items_out,
        "item_count": total_qty,
        "subtotal_paise": subtotal_paise,
        "total_weight_grams": total_weight_grams,
    }
    if removed_items:
        if db:
            db.flush()
        names = ", ".join(f"'{n}'" for n in removed_items)
        res["notice"] = f"{names} was removed from your bag as it is no longer available."
    return res


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
    return serialize_cart(cart, db=db)


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
    return serialize_cart(cart, db=db)


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
            return serialize_cart(cart, db=db)

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
    return serialize_cart(cart, db=db)


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
    return serialize_cart(cart, db=db)


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
    return serialize_cart(cart, db=db)


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
    return serialize_cart(cart, db=db)
