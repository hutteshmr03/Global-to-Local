# Global to Local — Strict Page Functionality & Mobile Audit Report

**Audit Timestamp**: 2026-10-14T09:48:23.239Z
**Target Frontend**: http://127.0.0.1:5173
**Target Backend API**: http://127.0.0.1:8000

## Executive Summary

- **Total Verified Audit Items**: 74
- **Passed Elements**: 74
- **Failed Elements**: 0
- **Success Rate**: 100%
- **Console Errors**: 0
- **Unintended Network Failures**: 0

## Verified Core Functionality & Test Order Lifecycle

1. **All 13 Shelves Strictly Asserted on Home**: All 13 category rails rendered with zero omissions.
2. **End-to-End Test Order Placed**: Real customer checkout executed, Razorpay test payment verified.
3. **Live Sync to Customer Account**: Captured order `GTL-2026-1012` verified in `/account` order history.
4. **Live Sync to Admin Back-Office**: Order `GTL-2026-1012` verified in `/admin/orders`.
5. **Real Database Registry Rows Verified**: Real database order rows (>= 5) and customer rows (>= 3) confirmed.
6. **360px Mobile Inspection**: Complete horizontal overflow and menu reachability tested across all 30 customer pages and all 6 admin pages.

## Detailed Element Verification Results

| Page / Route | Element / Interaction | Status | Details / Observations |
| :--- | :--- | :---: | :--- |
| `/` | Header Logo Link | ✅ PASS | Navigates to / |
| `/` | Header Navigation Links | ✅ PASS | 6 links present |
| `/` | Hero Audio Banner Toggle | ✅ PASS | Found interactive audio banner |
| `/` | All 13 Shelves Displayed on Home | ✅ PASS | 13/13 shelves rendered on Home (strict fail if < 13) |
| `/` | Review Carousel & Testimonials | ✅ PASS | Testimonial section active |
| `/` | Direct Page Reload (SPA Rewrite) | ✅ PASS | 200 OK |
| `/shop` | Total Product Count Badge (230) | ✅ PASS | Catalogue loaded |
| `/shop` | Real-Time Search Input | ✅ PASS | Found matching item for Bebinca |
| `/shop` | In Stock Toggle / Filter | ✅ PASS | Filter exists |
| `/shop` | Category Filter Chips | ✅ PASS | 13 chips rendered |
| `/shop` | Direct Page Reload (SPA Rewrite) | ✅ PASS | 200 OK |
| `/product-category/*` | All 13 Shelf Category Pages | ✅ PASS | 13/13 shelves loaded |
| `/product/wine-biscuits-200-grams` | Product Title & Metadata | ✅ PASS | Wine Biscuits 200 grams |
| `/product/wine-biscuits-200-grams` | Product Pricing Display | ✅ PASS | Price shown |
| `/product/wine-biscuits-200-grams` | Product Stepper (Increase Qty) | ✅ PASS | Qty stepped to 2 |
| `/product/wine-biscuits-200-grams` | Add to Bag Action | ✅ PASS | Item added with fly-to-cart |
| `/our-story` | Our Story Content & Layout | ✅ PASS | We are your favourite store. |
| `/our-social-corner` | Our Social Corner Content & Layout | ✅ PASS | Our Social Corner |
| `/in-the-news` | In the News Content & Layout | ✅ PASS | In the News |
| `/contact` | Contact Enquiry Form Fields | ✅ PASS | Name & email inputs ready |
| `/contact` | 19 FAQs Initial State (Start Closed) | ✅ PASS | 19 FAQs, 0 open |
| `/shipping-policy` | Policy Document Render | ✅ PASS | Shipping & Delivery Policy |
| `/return-and-exchange-policy` | Policy Document Render | ✅ PASS | Return & Exchange Policy |
| `/terms-and-conditions` | Policy Document Render | ✅ PASS | Terms & Conditions |
| `/privacy-policy` | Policy Document Render | ✅ PASS | Privacy Policy |
| `/bag` | Shopping Bag Page & Items Display | ✅ PASS | 1 items in bag |
| `/checkout` | Secure Checkout Multi-Step Container | ✅ PASS | Secure Checkout |
| `/checkout` | Delivery & Razorpay Payment Sections | ✅ PASS | Pay ₹1,200 via Razorpay |
| `/order/GTL-2026-1012` | Full Test Order Placed & Payment Captured | ✅ PASS | Order GTL-2026-1012 confirmed with Razorpay payment capture |
| `/order/GTL-2026-1012` | Canonical Order Number Format (GTL-YYYY-NNNN) | ✅ PASS | Order number: GTL-2026-1012 matches canonical pattern GTL-YYYY-NNNN |
| `/account` | Order Visible in Customer Account History | ✅ PASS | Order GTL-2026-1012 displayed in customer order history |
| `/admin` | Admin Dashboard (Revenue & Metrics) | ✅ PASS | Admin Dashboard |
| `/admin/products` | Admin Products List & Price Editor | ✅ PASS | 251 table rows |
| `/admin/orders` | Real Order Rows Verified in Admin Table | ✅ PASS | 14 real order rows verified in database |
| `/admin/orders` | Test Order Visible in Admin Orders Table | ✅ PASS | Order GTL-2026-1012 verified in admin back-office registry |
| `/admin/customers` | Real Customer Registry Rows Verified | ✅ PASS | 10 real customer rows verified in registry |
| `/admin/enquiries` | Admin Enquiries Inbox | ✅ PASS | Enquiries table loaded |
| `/unknown-404` | 404 Page Not Found Route | ✅ PASS | Page Not Found |
| `/ (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/shop (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/chutneys-and-spreads (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/farsaan (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/grains (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/hand-crafted (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/kunbi (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/masala (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/oils-and-vinegars (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/papads-and-pickles (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/seafood (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/spices (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/sustainable-products (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/sweet (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product-category/wellness (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/product/wine-biscuits-200-grams (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/our-story (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/our-social-corner (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/in-the-news (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/contact (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/shipping-policy (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/return-and-exchange-policy (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/terms-and-conditions (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/privacy-policy (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/bag (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/checkout (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/login (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/account (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/order/GTL-2026-1012 (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/unknown-page-404 (Mobile 360px)` | Horizontal Scroll & Menu Check | ✅ PASS | Width: 360px (<= 360px), Menu button reachable: true |
| `/admin (Mobile 360px)` | Horizontal Scroll & Admin Menu Check | ✅ PASS | Width: 360px (<= 360px), Admin menu button reachable: true |
| `/admin/products (Mobile 360px)` | Horizontal Scroll & Admin Menu Check | ✅ PASS | Width: 360px (<= 360px), Admin menu button reachable: true |
| `/admin/orders (Mobile 360px)` | Horizontal Scroll & Admin Menu Check | ✅ PASS | Width: 360px (<= 360px), Admin menu button reachable: true |
| `/admin/orders/GTL-2026-1012 (Mobile 360px)` | Horizontal Scroll & Admin Menu Check | ✅ PASS | Width: 360px (<= 360px), Admin menu button reachable: true |
| `/admin/customers (Mobile 360px)` | Horizontal Scroll & Admin Menu Check | ✅ PASS | Width: 360px (<= 360px), Admin menu button reachable: true |
| `/admin/enquiries (Mobile 360px)` | Horizontal Scroll & Admin Menu Check | ✅ PASS | Width: 360px (<= 360px), Admin menu button reachable: true |
