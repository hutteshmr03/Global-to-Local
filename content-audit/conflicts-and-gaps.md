# Global to Local — Part 1 Audit, Conflicts & Gaps Report (Step B0)

**Date:** October 13, 2026  
**Audited Sources:**
1. `docs/URS.md` (`Global_to_Local_URS_User_Requirements_Specification.docx`)
2. `docs/Frontend_Specification.md` (`Global_to_Local_Frontend_Specification.docx`)
3. `docs/Backend_Specification.md` (`Global_to_Local_Backend_Specification.docx`)
4. `docs/Database_Schema.md` (`Global_to_Local_Database_Schema.docx`)
5. `docs/SDLC_Plan.md` (`Global_to_Local_SDLC_Plan.docx`)
6. Existing React + Vite Frontend (`src/`) and Live Reference Site (`https://gtl-khaki.vercel.app/`)

---

## 1. Category / Shelf Comparison (`src/lib/data.js` vs. Live Site)

> **Finding:** The note mentioning "Azulejos" was from an informal summary message, **not** the repository code. Inside `src/lib/data.js`, all **13 shelves**, their **slugs**, their **names**, and their **per-shelf product counts (230 total)** already match the live site (`https://gtl-khaki.vercel.app/`) **100% with zero discrepancies**.
>
> Public routes in `src/App.jsx` also already match the live site: `/shop`, `/product-category/:slug`, and `/product/:slug`.

| # | Live Site Shelf Name | `src/lib/data.js` Name | `src/lib/data.js` Slug | Live Count | `data.js` Count | Status |
| :- | :--- | :--- | :--- | :-: | :-: | :-: |
| 1 | Chutneys & Spreads | Chutneys & Spreads | `chutneys-and-spreads` | 4 | 4 | Match |
| 2 | Farsaan | Farsaan | `farsaan` | 16 | 16 | Match |
| 3 | Grains | Grains | `grains` | 8 | 8 | Match |
| 4 | Hand-Crafted | Hand-Crafted | `hand-crafted` | 42 | 42 | Match |
| 5 | Kunbi | Kunbi | `kunbi` | 8 | 8 | Match |
| 6 | Masala | Masala | `masala` | 31 | 31 | Match |
| 7 | Oils & Vinegars | Oils & Vinegars | `oils-vinegars` | 14 | 14 | Match |
| 8 | Papads & Pickles | Papads & Pickles | `papads-pickles` | 27 | 27 | Match |
| 9 | Seafood | Seafood | `seafood` | 5 | 5 | Match |
| 10 | Spices | Spices | `spices` | 12 | 12 | Match |
| 11 | Sustainable Products | Sustainable Products | `sustainable-products` | 15 | 15 | Match |
| 12 | Sweet | Sweet | `sweet` | 28 | 28 | Match |
| 13 | Wellness | Wellness | `wellness` | 20 | 20 | Match |
| **Total** | **13 Shelves** | **13 Shelves** | — | **230** | **230** | **100% Match** |

**Proposed Fix:** No renaming needed — seed all 13 categories and 230 products directly from `src/lib/data.js` as-is.

---

## 2. Color Tokens Comparison (`src/styles/tokens.css` vs. Live Site CSS)

> **Finding:** The informal summary note mentioned `#1f4e3d`, which is **not** in the codebase. The actual codebase (`tokens.css` and `src/styles/tokens.css`) was extracted directly from the live production stylesheet (`fc1ff755c46d4fce.css`) and matches the live site's exact palette:

| Token Variable | Value in `src/styles/tokens.css` | Live Site CSS (`fc1ff755c46d4fce.css`) | Notes |
| :--- | :--- | :--- | :--- |
| `--color-ground` | `#F7F0E2` (`rgb(247, 240, 226)`) | `rgb(247, 240, 226)` | Main warm cream page background |
| `--color-ground-alt` | `#FBF6EB` (`rgb(251, 246, 235)`) | `rgb(251, 246, 235)` | Light cream surface |
| `--color-surface` | `#FFFFFF` | `#ffffff` | Card surface |
| `--color-surface-muted` | `#F4E8D0` (`rgb(244, 232, 208)`) | `#F4E8D0` (`rgb(244, 232, 208)`) | Live site `theme-color` & muted cream section |
| `--color-surface-tint` | `#ECE0C8` | `#ECE0C8` | Subtle warm tint |
| `--color-palm` | `#1C393F` (`rgb(28, 57, 63)`) | `rgb(28, 57, 63)` | Deep Goan palm-teal green |
| `--color-palm-shade` | `#17332D` | `#17332D` | Darker palm hover/gradient |
| `--color-ink-deep` | `#12262B` (`rgba(18, 38, 43, 1)`) | `rgba(18, 38, 43, 1)` | Deepest ink / scrim color |
| `--color-accent` | `#C45C4A` (`rgb(196, 92, 74)`) | `rgb(196, 92, 74)` | Goan terracotta / red-clay accent |
| `--color-accent-hover` | `#B04F3E` | `#B04F3E` | Terracotta hover |
| `--color-content` | `#2A221C` (`rgb(42, 34, 28)`) | `rgb(42, 34, 28)` | Primary body & heading ink |
| `--color-content-muted` | `#6B625B` | `#6B625B` | Secondary text |
| `--color-content-subtle` | `#8C827A` | `#8C827A` | Muted captions |
| `--color-border` | `#D4C2A4` (`rgb(212, 194, 164)`) | `rgb(212, 194, 164)` | Cane border |

**Proposed Action:** Keep `src/styles/tokens.css` and `tailwind.config.js` untouched (locked).

---

## 3. Conflicts & Gaps Between Specifications and Existing Frontend

### C1. Customer Registration — Phone-Only or Email-Only Accounts
- **Database Schema Doc:** Declares `email citext NOT NULL UNIQUE` and `phone varchar(15) NOT NULL UNIQUE` on `users`.
- **Existing Frontend (`LoginPage.jsx`):** Allows customers to sign up and sign in using **Phone only** (Full Name + 10-digit Mobile + OTP) **or** **Email only** (Full Name + Email + Password).
- **Resolution (per Step B1 instructions):** Make `email` and `phone` nullable in `users`, keep each `UNIQUE` when present, and add `CHECK (email IS NOT NULL OR phone IS NOT NULL)`.

### C2. OTP Length (4 Digits vs. 6 Digits)
- **Existing Frontend (`LoginPage.jsx`):** Uses a 4-digit mock OTP (`['1', '2', '3', '4']`).
- **Step B2 Requirement:** Explicitly specifies a **6-digit** one-time code (expires in 5 minutes, max 5 attempts, max 3 sends/hour/number, hashed in storage, printed to server console in `development` mode only).
- **Resolution:** Update the OTP verification step in `LoginPage.jsx` to 6 input boxes using the exact same input styling, and remove the `"Demo OTP: 1234"` caption once connected to the backend OTP endpoint.

### C3. Shipping Charges & Weight Slabs
- **Existing Frontend (`CheckoutPage.jsx` lines 54–65):**
  - Pincodes starting with `403` (**Goa Express**): **`₹80` (`8000` paise)**
  - All other pincodes (**Pan-India Standard**): **`₹120` (`12000` paise)**
  - No minimum order value; no free-shipping threshold; all product prices are tax-inclusive; `Total = Subtotal + Shipping`.
- **Database Schema & URS-14:** Define `shipping_zones`, `pincode_zones`, and `shipping_rates` with `min_weight_g`, `max_weight_g`, `price_paise`, `eta_days_min`, `eta_days_max`.
- **Resolution (per Step B3 instructions):** Seed `shipping_zones` (`Goa Express` and `Pan-India Standard`), seed `pincode_zones` for Goa `403xxx` pincodes, and seed `shipping_rates` (`0g – 100,000g`) at **`8000` paise (`₹80`, 1–2 days)** for Goa and **`12000` paise (`₹120`, 3–7 days)** for Pan-India so checkout quotes match the current site (`₹80` / `₹120`) while supporting multi-slab weight rates whenever the owner updates them in Admin Shipping.

### C4. Product Weights (`unit_label` vs. `weight_grams`)
- **Existing Frontend (`src/lib/data.js`):** Each product has a single string field `"weight"` which serves as the display unit label (e.g., `"250 g"`, `"200 ml"`, `"One piece"`, `"Pack of 4"`, `"10 pieces"`).
- **Database Schema (`products`):** Requires both `unit_label text NOT NULL` and `weight_grams integer NOT NULL CHECK (weight_grams > 0)`.
- **Resolution:** Seed `unit_label` with the exact string from `data.js` (`product.weight`) so UI display (`One piece · ₹100`, `/ 250 g`) is 100% unchanged, and parse `weight_grams` from the numeric gram/ml value in `product.weight` (defaulting to `250` grams for non-weight unit labels like `"One piece"` until adjusted by the admin).

#### Complete List of Products Where `weight_grams` Was Defaulted to `250` (96 of 230 Products)

| # | SKU | Slug | Product Name | Shelf (`categorySlug`) | `unit_label` (`data.js` `weight`) | Defaulted `weight_grams` |
| :- | :--- | :--- | :--- | :--- | :--- | :-: |
| 1 | `GTL-6471` | `goan-themed-blue-mug` | Goan-themed Blue Mug | `hand-crafted` | `One piece` | `250` |
| 2 | `GTL-6342` | `batika` | Batika | `sweet` | `One piece` | `250` |
| 3 | `GTL-6334` | `garlic-sticks` | Garlic Sticks | `farsaan` | `One piece` | `250` |
| 4 | `GTL-6332` | `cones` | Cones | `farsaan` | `One piece` | `250` |
| 5 | `GTL-6330` | `canapes` | Canapes | `farsaan` | `One piece` | `250` |
| 6 | `GTL-6324` | `kunbi-shawl` | Kunbi Shawl | `kunbi` | `One piece` | `250` |
| 7 | `GTL-6323` | `kunbi-saree-7` | Kunbi Saree 7 | `kunbi` | `One piece` | `250` |
| 8 | `GTL-6322` | `kunbi-saree-6` | Kunbi Saree 6 | `kunbi` | `One piece` | `250` |
| 9 | `GTL-6321` | `kunbi-saree-5` | Kunbi Saree 5 | `kunbi` | `One piece` | `250` |
| 10 | `GTL-6320` | `kunbi-saree-4` | Kunbi Saree 4 | `kunbi` | `One piece` | `250` |
| 11 | `GTL-6314` | `kunbi-saree-3` | Kunbi Saree 3 | `kunbi` | `One piece` | `250` |
| 12 | `GTL-6312` | `kunbi-saree-2` | Kunbi Saree 2 | `kunbi` | `One piece` | `250` |
| 13 | `GTL-6310` | `kunbi-saree-1` | Kunbi Saree 1 | `kunbi` | `One piece` | `250` |
| 14 | `GTL-6268` | `mitti-vases-8211-medium` | Mitti Vases – Medium | `sustainable-products` | `One piece` | `250` |
| 15 | `GTL-6267` | `mitti-vases-8211-small` | Mitti Vases – Small | `sustainable-products` | `One piece` | `250` |
| 16 | `GTL-6266` | `mitti-suraahi` | Mitti Suraahi | `sustainable-products` | `One piece` | `250` |
| 17 | `GTL-6265` | `mitti-plate` | Mitti Plate | `sustainable-products` | `One piece` | `250` |
| 18 | `GTL-6264` | `mitti-mug` | Mitti Mug | `sustainable-products` | `One piece` | `250` |
| 19 | `GTL-6263` | `mitti-kullad` | Mitti Kullad | `sustainable-products` | `One piece` | `250` |
| 20 | `GTL-6262` | `mitti-candle-holder` | Mitti Candle Holder | `sustainable-products` | `One piece` | `250` |
| 21 | `GTL-6260` | `mitti-foot-scrubber` | Mitti Foot Scrubber | `sustainable-products` | `One piece` | `250` |
| 22 | `GTL-6259` | `mitti-fish-ashtray` | Mitti Fish Ashtray | `sustainable-products` | `One piece` | `250` |
| 23 | `GTL-6258` | `mitti-dhoop-holder` | Mitti Dhoop Holder | `sustainable-products` | `One piece` | `250` |
| 24 | `GTL-6257` | `mitti-curd-pot` | Mitti Curd Pot | `sustainable-products` | `One piece` | `250` |
| 25 | `GTL-6256` | `mitti-cup` | Mitti Cup | `sustainable-products` | `One piece` | `250` |
| 26 | `GTL-6255` | `mitti-cooking-pot` | Mitti Cooking Pot | `sustainable-products` | `One piece` | `250` |
| 27 | `GTL-6252` | `goan-themed-cloth-bags` | Goan-themed Cloth Bags | `sustainable-products` | `One piece` | `250` |
| 28 | `GTL-6180` | `coconut-shell-spoon-8211-large` | Coconut Shell Spoon – Large | `hand-crafted` | `One piece` | `250` |
| 29 | `GTL-6179` | `wooden-lotus-candle-holder` | Wooden Lotus Candle Holder | `hand-crafted` | `One piece` | `250` |
| 30 | `GTL-6178` | `wooden-flower-candle-holder` | Wooden Flower Candle Holder | `hand-crafted` | `One piece` | `250` |
| 31 | `GTL-6177` | `whelks-shells` | Whelks Shells | `hand-crafted` | `One piece` | `250` |
| 32 | `GTL-6176` | `shell-tortoise--large` | Shell Tortoise- Large | `hand-crafted` | `One piece` | `250` |
| 33 | `GTL-6175` | `shell-tortoise--medium` | Shell Tortoise- Medium | `hand-crafted` | `One piece` | `250` |
| 34 | `GTL-6174` | `shell-tortoise--small` | Shell Tortoise- Small | `hand-crafted` | `One piece` | `250` |
| 35 | `GTL-6173` | `shell-toothpicks` | Shell Toothpicks | `hand-crafted` | `One piece` | `250` |
| 36 | `GTL-6172` | `shell-skewers` | Shell Skewers | `hand-crafted` | `One piece` | `250` |
| 37 | `GTL-6171` | `shell-rooster` | Shell Rooster | `hand-crafted` | `One piece` | `250` |
| 38 | `GTL-6169` | `shell-rabbit` | Shell Rabbit | `hand-crafted` | `One piece` | `250` |
| 39 | `GTL-6168` | `shell-peacock` | Shell Peacock | `hand-crafted` | `One piece` | `250` |
| 40 | `GTL-6167` | `shell-mirror--round` | Shell Mirror- Round | `hand-crafted` | `One piece` | `250` |
| 41 | `GTL-6165` | `shell-mirror--square` | Shell Mirror- Square | `hand-crafted` | `One piece` | `250` |
| 42 | `GTL-6163` | `shell-lamp--round` | Shell Lamp- Round | `hand-crafted` | `One piece` | `250` |
| 43 | `GTL-6162` | `shell-lamp--square` | Shell Lamp- Square | `hand-crafted` | `One piece` | `250` |
| 44 | `GTL-6161` | `shell-keychain` | Shell Keychain | `hand-crafted` | `One piece` | `250` |
| 45 | `GTL-6159` | `shell-ganpati` | Shell Ganpati | `hand-crafted` | `One piece` | `250` |
| 46 | `GTL-6158` | `shell-frog` | Shell Frog | `hand-crafted` | `One piece` | `250` |
| 47 | `GTL-6157` | `shell-fisherwoman` | Shell Fisherwoman | `hand-crafted` | `One piece` | `250` |
| 48 | `GTL-6156` | `shell-dog` | Shell Dog | `hand-crafted` | `One piece` | `250` |
| 49 | `GTL-6155` | `shell-crane` | Shell Crane | `hand-crafted` | `One piece` | `250` |
| 50 | `GTL-6154` | `shell-chopsticks` | Shell Chopsticks | `hand-crafted` | `One piece` | `250` |
| 51 | `GTL-6153` | `shell-birds` | Shell Birds | `hand-crafted` | `One piece` | `250` |
| 52 | `GTL-6152` | `mud-rooster` | Mud Rooster | `hand-crafted` | `One piece` | `250` |
| 53 | `GTL-6151` | `jute-pot-holder` | Jute Pot Holder | `hand-crafted` | `One piece` | `250` |
| 54 | `GTL-6150` | `goan-themed-colourful-tiles` | Goan-themed Colourful Tiles | `hand-crafted` | `One piece` | `250` |
| 55 | `GTL-6149` | `goan-themed-colourful-mugs` | Goan-themed Colourful Mugs | `hand-crafted` | `One piece` | `250` |
| 56 | `GTL-6148` | `goan-themed-blue-tiles` | Goan-themed Blue Tiles | `hand-crafted` | `One piece` | `250` |
| 57 | `GTL-6147` | `goan-recipe-book` | Goan Recipe Book | `hand-crafted` | `One piece` | `250` |
| 58 | `GTL-6146` | `goan-painting-four` | Goan Painting Four | `hand-crafted` | `One piece` | `250` |
| 59 | `GTL-6145` | `goan-painting-three` | Goan Painting Three | `hand-crafted` | `One piece` | `250` |
| 60 | `GTL-6144` | `goan-painting-two` | Goan Painting Two | `hand-crafted` | `One piece` | `250` |
| 61 | `GTL-6143` | `goan-painting-one` | Goan Painting One | `hand-crafted` | `One piece` | `250` |
| 62 | `GTL-6142` | `mud-statue-of-fisherwoman` | Mud Statue of Fisherwoman | `hand-crafted` | `One piece` | `250` |
| 63 | `GTL-6141` | `cowrie-shells` | Cowrie Shells | `hand-crafted` | `One piece` | `250` |
| 64 | `GTL-6140` | `conche-shells` | Conche Shells | `hand-crafted` | `One piece` | `250` |
| 65 | `GTL-6139` | `colourful-mud-rooster` | Colourful Mud Rooster | `hand-crafted` | `One piece` | `250` |
| 66 | `GTL-6138` | `coconut-shell-spoon--small` | Coconut Shell Spoon- Small | `hand-crafted` | `One piece` | `250` |
| 67 | `GTL-6135` | `cane-soop` | Cane Soop | `hand-crafted` | `One piece` | `250` |
| 68 | `GTL-6134` | `cane-paatlo` | Cane Paatlo | `hand-crafted` | `One piece` | `250` |
| 69 | `GTL-6083` | `kokum-butter-per-piece` | Kokum Butter per piece | `wellness` | `per piece` | `250` |
| 70 | `GTL-6080` | `handmade-soap--besan` | Handmade Soap- Besan | `wellness` | `One piece` | `250` |
| 71 | `GTL-6079` | `handmade-soap--charcoal` | Handmade Soap- Charcoal | `wellness` | `One piece` | `250` |
| 72 | `GTL-6078` | `handmade-soap--neem` | Handmade Soap- Neem | `wellness` | `One piece` | `250` |
| 73 | `GTL-6077` | `dhoop` | Dhoop | `wellness` | `One piece` | `250` |
| 74 | `GTL-6076` | `cow-dung-diyas-10-pieces` | Cow dung Diyas 10 pieces | `wellness` | `One piece` | `250` |
| 75 | `GTL-5928` | `tamarind-salt-balls` | Tamarind Salt Balls | `spices` | `One piece` | `250` |
| 76 | `GTL-5926` | `stuffed-curd-chilli` | Stuffed Curd Chilli | `spices` | `One piece` | `250` |
| 77 | `GTL-5913` | `curd-chilli` | Curd Chilli | `spices` | `One piece` | `250` |
| 78 | `GTL-5773` | `mango-saat` | Mango Saat | `sweet` | `One piece` | `250` |
| 79 | `GTL-5772` | `mango-bites` | Mango Bites | `sweet` | `One piece` | `250` |
| 80 | `GTL-5771` | `mango-bar` | Mango Bar | `sweet` | `One piece` | `250` |
| 81 | `GTL-5764` | `sugar-boondi-ladoo` | Sugar Boondi Ladoo | `sweet` | `One piece` | `250` |
| 82 | `GTL-5763` | `shev-ladoo` | Shev Ladoo | `sweet` | `One piece` | `250` |
| 83 | `GTL-5761` | `rose-cookies` | Rose Cookies | `sweet` | `One piece` | `250` |
| 84 | `GTL-5760` | `pinaagr` | Pinaagr | `sweet` | `One piece` | `250` |
| 85 | `GTL-5758` | `peanut-ladoo` | Peanut Ladoo | `sweet` | `One piece` | `250` |
| 86 | `GTL-5751` | `khat-khate` | Khat-khate | `sweet` | `One piece` | `250` |
| 87 | `GTL-5744` | `khajjur-katli-pack-of-4` | Khajjur katli pack of 4 | `sweet` | `One piece` | `250` |
| 88 | `GTL-5741` | `jackfruit-saat` | Jackfruit Saat | `sweet` | `One piece` | `250` |
| 89 | `GTL-5732` | `coconut-mila` | Coconut Mila | `sweet` | `One piece` | `250` |
| 90 | `GTL-5730` | `coconut-chikki` | Coconut Chikki | `sweet` | `One piece` | `250` |
| 91 | `GTL-5728` | `churmuli-ladoo` | Churmuli Ladoo | `sweet` | `One piece` | `250` |
| 92 | `GTL-5720` | `cashew-ladoo` | Cashew Ladoo | `sweet` | `One piece` | `250` |
| 93 | `GTL-5716` | `bolacho-corpial` | Bolacho Corpial | `sweet` | `One piece` | `250` |
| 94 | `GTL-5714` | `bol` | Bol | `sweet` | `One piece` | `250` |
| 95 | `GTL-5709` | `pohe-churma-ladoo` | Pohe Churma Ladoo | `farsaan` | `One piece` | `250` |
| 96 | `GTL-5697` | `aataa-rings` | Aataa Rings | `sweet` | `One piece` | `250` |

### C5. Order Cancellation & Refunds
- **URS-20, URS-41 & Backend Spec:** Mention cancelling paid/packed orders and issuing Razorpay refunds.
- **Prompt Rules (Part 1 Step B3 & Part 2 Rule 4):** Explicitly override this:
  - *"Cancellation: customers can cancel only while an order is unpaid (pending payment). A paid order shows 'Please contact the store to cancel.' There are NO refunds in this task."*
- **Resolution:** Enforce customer cancellation only when `status == 'pending_payment'` (releasing reserved stock), display `"Please contact the store to cancel."` on paid orders, and do not build refund endpoints or UI.

### C6. Contact, Bulk, and Goa-Only Hamper Enquiry Forms
- **Existing Frontend (`ContactPage.jsx`):** Currently shows one form ("Send us a message" with Name, Email, Message) that triggers a `mailto:` link.
- **Step B3 & URS-21..23:** Require Contact (`general`), Bulk (`bulk`), and Goa-only Hamper (`hamper` with mandatory `403xxx` Goa pincode validation) enquiries posting to `POST /api/v1/enquiries` with CAPTCHA and rate limiting.
- **Resolution:** In Step B3, connect the ContactPage form to `POST /api/v1/enquiries`, supporting enquiry type selection (`General`, `Bulk / Corporate`, `Goa Gift Hamper` with pincode field when `hamper` is selected) in the existing visual style.

### C7. Duplicate FAQ & Review Arrays in Frontend Files
- **FAQs:** `src/routes/ContactPage.jsx` defines `liveFaqs` (19 questions extracted verbatim from the live site), whereas `src/lib/data.js` exports a slightly reworded `faqs` array (also 19 questions).
  - **Resolution:** Seed `faqs` in PostgreSQL from `ContactPage.jsx`'s verbatim `liveFaqs` so the rendered text on `/contact` does not change by a single character.
- **Reviews:** `src/components/home/ReviewCarousel.jsx` and `src/routes/OurSocialCornerPage.jsx` render the 3 verbatim live-site reviews (`Gifty Abraham`, `Stedwick Fernandes`, `Swapna Pujari`), whereas `src/lib/data.js` has 3 unused placeholder reviews.
  - **Resolution:** Seed `store_reviews` with the 3 verbatim live-site reviews (`Gifty Abraham`, `Stedwick Fernandes`, `Swapna Pujari`).

### C8. Initial Stock Quantities & SKUs
- **Existing Frontend (`src/lib/data.js`):** Has `"id"` (numeric, e.g., `6471`) and `"inStock": true`, but no `sku` or integer `stock_qty`.
- **Resolution:** Seed `sku = "GTL-" + product.id` (e.g., `GTL-6471`) and `stock_qty = 50` (`reserved_qty = 0`, `low_stock_threshold = 5`) for all 230 in-stock products.

---

## 4. External Accounts & Keys Needed for Production (Dev Providers Included for Local/Test)
1. **Razorpay:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (Test mode supported out of the box).
2. **SMS Provider (for 6-digit OTP):** `SMS_PROVIDER` (`console` in development; Twilio/MSG91 credentials for production).
3. **Email Provider (for order confirmations, status updates, password reset):** `EMAIL_PROVIDER` (`console` in development; Resend/SMTP credentials for production).
4. **CAPTCHA (Cloudflare Turnstile / hCaptcha):** `CAPTCHA_SECRET_KEY` (test secret key `1x0000000000000000000000000000000AA` enabled in dev/test).
5. **Hosting / Database / Redis:** PostgreSQL 16 (`DATABASE_URL`) and Redis (`REDIS_URL`), provided locally via `docker-compose.yml`.
