# Global to Local — Interaction Specification & Audit

Audited from the live production site at https://gtl-khaki.vercel.app/ and Frontend Specification.

## 1. Global Navigation & Layout
- **Skip Link:** Accessible "Skip to main content" link at the top, visible on focus (`#main-content`).
- **Header:**
  - Sticky glass header with background blur (`backdrop-blur-md bg-ground/85 border-b border-border/40`).
  - Left: Logo linking to `/`.
  - Center/Right: "Shop" nav link (`/shop`), search toggle / input, Bag drawer trigger with item count badge (`rounded-pill bg-accent text-white`), Account link (`/account` / `/login`).
- **Footer:**
  - Column 1: Brand description, store address at Tarcar Mansion, opening hours, contact numbers.
  - Column 2: Explore links (`/shop`, `/our-story`, `/our-social-corner`, `/in-the-news`, `/contact`).
  - Column 3: Policy links (`/shipping-policy`, `/return-and-exchange-policy`, `/terms-and-conditions`, `/privacy-policy`).
  - Bottom row: Copyright notice.

## 2. Home Page Interactions
- **Hero Section:**
  - Background: Autoplaying ambient muted background video with fallback poster (`/videos/street.mp4`, poster `/videos/street-poster.jpg`).
  - Headline word reveal: Words rise 24px and fade in with stagger on load (`cubic-bezier(0.22, 1, 0.36, 1)`, 600ms).
  - Hero image settle: Subtle scale transition from 1.06 to 1.0 over 1200ms.
  - Call-to-action buttons: "Shop the shelves" (`/shop`) and "Visit Fontainhas" (`/contact`).
  - "Hear the street" audio toggle: Audio element playing `/audio/fontainhas-street.wav` (volume 0.28). Interactive button toggles "Hear the street" / "Quiet the street", animates sound-wave indicator while playing. Audio **never** autoplays.
- **Facts Ticker:**
  - Continuous horizontal looping ribbon with facts:
    - "Handmade in Goa"
    - "80% by women's self-help groups"
    - "Thirteen shelves"
    - "No artificial preservatives"
    - "Direct from Fontainhas"
  - Pauses automatically on mouse hover and keyboard focus.
- **13-Shelf Grid (`ShelfGrid`):**
  - 13 numbered category tiles:
    1. Chutneys & Spreads
    2. Farsaan
    3. Grains
    4. Hand-Crafted
    5. Kunbi
    6. Masala
    7. Oils & Vinegars
    8. Papads & Pickles
    9. Seafood
    10. Spices
    11. Sustainable Products
    12. Sweet
    13. Wellness
  - Hover: Tile image scales from 1.0 to 1.05 smoothly with lift and shadow.
  - Shows category name, brief blurb, and active product count.
- **Maker Story Steps (`MakerSteps`):**
  - 4-step narrative with progress indicator ("01 / 04", "02 / 04", "03 / 04", "04 / 04").
  - Sticky / scroll-linked progression with image cross-fades and smooth typography transitions.
- **Curated Rails & Shell Shelf:**
  - Horizontal swipeable / scrollable product carousels with snap points and drag/wheel support.
- **Visitors' Book (`ReviewCarousel`):**
  - 3 featured quotes from visitors and patrons with author name and origin. Smooth carousel navigation.
- **Closing Store Block:**
  - Direct invitation to visit the Panaji heritage store, with Google Maps link and telephone call link.

## 3. Shop & Catalogue Interactions
- **Category Filter Tabs:**
  - "All Products" plus all 13 shelves.
  - Filter state synced with URL search params (`?category=...&sort=...&q=...`).
- **Search with Typeahead:**
  - Live search input with debounce, highlighting matching products, keyboard navigation (Arrow Up/Down/Enter/Escape).
- **Sorting Options:**
  - Sort by Featured, Price: Low to High, Price: High to Low, Name: A to Z.
- **Product Card (`ProductCard`):**
  - Image with fixed aspect ratio, fallback blur placeholder.
  - Product name, maker / origin subtitle, formatted price in ₹ (INR), quick "Add to Bag" button.
  - Hover effect: Card lifts 4px, soft drop shadow, quick Add button slides up.
  - Click transitions smoothly to `/product/{slug}`.

## 4. Product Detail Interactions (`/product/{slug}`)
- **Breadcrumb navigation:** Home > Shelf > Product Name.
- **Image Gallery:** Primary high-resolution image with thumbnail selector and keyboard support.
- **Quantity Stepper:** Decrement / Increment controls (minimum 1, maximum 20 per line), numeric display with animated roll transition.
- **Add to Bag:**
  - Optimistic bag update.
  - Fly-to-bag animation / badge bounce with screen-reader announcement (`aria-live="polite"`).
  - Opens Bag Drawer automatically or reveals Toast notification.
- **Details Accordions / Sections:**
  - Origin & Maker notes ("Made in Goa, of Goan origin").
  - Shipping & dispatch estimates ("Dispatches in 24–48 hours across India").
  - Availability status ("In stock and ready to ship").
- **Related Products Shelf:** Curated related items from the same shelf.

## 5. Bag & Checkout Flow
- **Bag Drawer (`BagDrawer`):**
  - Slides in from the right with dimmed backdrop overlay and focus trap.
  - Line items with product thumbnail, title, unit price, quantity stepper, remove button.
  - Subtotal calculation in integer paise formatted as ₹.
  - "Proceed to Checkout" button.
- **Checkout Page (`/checkout`):**
  - Step 1: Delivery Address selection or new address form with pincode validation.
  - Step 2: Shipping rate estimate calculation based on destination pincode and total package weight.
  - Step 3: Order summary with clear breakdown (Subtotal + Shipping = Total).
  - Step 4: Razorpay Checkout payment gateway integration (Card, UPI, Net Banking).
- **Order Confirmation (`/order/{orderNumber}`):**
  - Order details snapshot, delivery address snapshot, itemized receipts, courier tracking status timeline, print-friendly invoice view.

## 6. Motion & Accessibility Constraints
- Easing curve: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Respects `prefers-reduced-motion`: disables animations, halts ticker loop, converts slide transitions to instant/fade.
- Full keyboard operability and visible focus outlines on all interactive elements.
