Global to Local — Frontend Specification 
Oct 8, 2026 · @Huttesh M R 
Build the storefront as a React + Vite web application connected to the Python FastAPI backend. Style it 
from the locked token file, with motion as a separate layer that can be removed without breaking 
layout. The design, colors, fonts, photography, and copy stay exactly as on the current site. 
Future mobile client: React Native + Expo + TypeScript, delivered after the web release and connected to 
the same versioned API. 
1. Design rules 
• Layout, section order, spacing, breakpoints, colors, typography, logo, photography and copy are 
locked. 
• Only the cream theme color #F4E8D0 is confirmed from page metadata. In week 1, export every 
color, font, size and spacing value from the live CSS into tokens.css and treat it as read-only. 
• No new color may be introduced; motion must not change how any page looks at rest. 
2. Stack 
Concern Choice Why 
Framework React + Vite Vite matches the project 
frontend stack and provides a 
fast development server and 
production asset build 
Styling Tailwind CSS mapped to 
tokens.css variables 
Fast to build; tokens keep colors 
and spacing locked 
Motion Motion (Framer Motion) for 
components; GSAP ScrollTrigger 
for scroll-linked scenes; optional 
Lenis for smooth scroll 
Each covers a different job; load 
GSAP only where used 
Data TanStack Query for server state; 
Zustand for bag drawer and UI 
state 
Small and predictable 
Forms React Hook Form with Zod 
browser validation aligned with 
FastAPI Pydantic/OpenAPI 
schemas 
One validation source 
Images Responsive AVIF and WebP 
assets with srcset, blur 
Prevents layout shift 

Concern Choice Why 
placeholders, and fixed aspect 
ratios 
Testing Vitest, Testing Library, 
Playwright, axe 
Unit, component, end to end, 
accessibility 
API access All calls go to /api/v1 on the 
same site (a proxy or an api. 
subdomain), with credentials 
included and the CSRF header 
on writes 
Cookies are sent and no cross-
site cookie problems appear 
3. Folder structure 
index.html 
src/ 
  main.jsx, App.jsx, routes/ 
  features/ shop/, product/, content/, account/, checkout/, admin/ 
  components/ ui/, layout/, product/, home/, motion/ 
  lib/ api-client.js, schemas/, format.js, seo.js 
  styles/ tokens.css (read-only), globals.css 
tests/ unit/, e2e/, visual/ 
4. Pages and routes 
Route Purpose Rendering 
/ Home Static Vite assets; fetch public 
home content from the API with 
CDN caching 
/shop All shelves and filterable 
catalogue 
Client-rendered paginated 
product grid backed by the API 
/product-category/{slug} One of 13 shelves Client route; fetch category data 
from the API and cache 
responses appropriately 
/product/{slug} Product detail Client route; fetch product 
details from the API and cache 
responses appropriately 
/our-story, /our-social-
corner, /in-the-news 
Brand and press content Client route; fetch published 
content from the API and cache 
public responses 
/contact Store details, form, FAQs Client route with API-backed 

Route Purpose Rendering 
form submission 
/shipping-policy, /return-
and-exchange-policy, 
/terms-and-conditions, 
/privacy-policy 
Policies Client route; fetch published 
content from the API and cache 
public responses 
/bag, /checkout, 
/order/{orderNumber} 
Bag, payment, confirmation Client route; authenticated API 
required for checkout 
/account, /account/orders, 
/account/addresses 
My Account Authenticated client route; API 
enforces customer ownership 
/login, /register, /forgot-
password 
Authentication Client 
/admin/* Staff panel Role-gated client route; API 
enforces staff authorization 
5. Component inventory 
Component Behavior 
Header, Footer Logo, Shop link, bag icon with count, account link; 
footer address, phone, email, hours, Explore and 
Policies lists 
Hero Fontainhas photo, headline, two buttons, address 
line, "Hear the street" audio toggle 
Ticker Looping facts strip (Handmade in Goa, 80% by 
women's self-help groups, Thirteen shelves, and 
so on) 
ShelfGrid 13 numbered tiles with image, name, product 
count 
MakerSteps Four-step story with progress "01 / 04" 
ProductRail Horizontal swipe list with keyboard and drag 
support 
ProductCard Image, name, maker line, price, quick Add 
ProductDetail Breadcrumb, gallery, price and unit, quantity 
stepper, Add to bag, Origin / Shipping / 
Availability, related products 

Component Behavior 
FilterBar Shelf, price, in-stock, sort; state kept in the URL 
BagDrawer Line items, quantity edit, subtotal, Checkout 
button 
CheckoutForm Address picker, shipping quote, payment 
launcher 
ReviewCarousel Visitors' book quotes 
FAQAccordion 19 questions from the contact page 
Forms Contact, bulk enquiry, hamper enquiry with spam 
protection 
6. Admin screens 
Staff screens live under /admin and are shown only to staff and administrators. The API enforces the 
same permissions on every call. Screens marked administrator are hidden from staff. 
Screen and route What staff do API used 
Dashboard /admin See new orders, low-stock 
products and new enquiries 
/admin/orders, 
/admin/stock/low, 
/admin/enquiries 
Products /admin/products, 
/admin/products/new, 
/admin/products/{id} 
Search, create, edit, hide and 
price products; edit description, 
category, maker, availability and 
images 
/admin/products, 
/admin/products/{id}/images 
CSV import 
/admin/products/import 
Upload a CSV, review the dry-
run preview with row-level 
errors, then confirm 
/admin/products/import 
Catalogue setup 
/admin/categories, 
/admin/makers, 
/admin/collections 
Manage shelves, makers and 
curated rails 
/admin/categories, 
/admin/makers, 
/admin/collections 
Stock /admin/stock Adjust stock with a required 
reason, see movement history 
and the low-stock view 
/admin/stock/{productId}, 
/admin/stock/low 
Orders /admin/orders, 
/admin/orders/{id} 
Review orders, change status, 
add courier and tracking, issue 
refunds 
/admin/orders, 
/admin/orders/{id}/refund 

Screen and route What staff do API used 
Enquiries /admin/enquiries Read the inbox, filter by type 
and status, mark in progress or 
closed 
/admin/enquiries 
Content /admin/content Edit reviews, press items, FAQs 
and pages 
/admin/reviews, /admin/press, 
/admin/faqs, /admin/pages 
Settings /admin/settings Edit address, phone, email, 
hours and social links 
/admin/settings 
Users /admin/users 
(administrator) 
Add users and change roles /admin/users 
Audit log /admin/audit 
(administrator) 
Review sensitive staff actions /admin/audit-logs 
7. Animation specification 
All motion uses one easing curve, cubic-bezier(0.22, 1, 0.36, 1), durations between 200 and 700 
ms, and animates only transform and opacity. 
Animation Where Trigger Motion Time 
Headline word 
reveal 
Hero and section 
headings 
On load / in view Words rise 24 px 
and fade in, 40 ms 
stagger 
600 ms 
Hero image settle Home hero On load Scale from 1.06 to 
1 
1200 ms 
Ticker Home Always Continuous slide; 
pauses on hover 
and focus 
40 s loop 
Shelf tile reveal Home, shop In view Tiles fade up with 
a 60 ms stagger; 
image scales 1.05 
to 1 on hover 
500 ms 
Maker steps Home Scroll-linked Section pins; step 
image cross-fades 
and the counter 
changes 01 to 04 
scrubbed 
Product rail Home, shelves Drag and wheel Momentum scroll 
with snap; edge 
native 

Animation Where Trigger Motion Time 
fade 
Card hover Product cards Hover and focus Lift 4 px, soft 
shadow, Add 
button slides in 
250 ms 
Add to bag Product and card Click Small image flies 
to the bag icon; 
icon bounces; 
count ticks 
600 ms 
Bag drawer Header Click Slides in from the 
right with 
dimmed 
backdrop; items 
stagger in 
350 ms 
Quantity stepper Product, bag Click Number rolls up 
or down 
200 ms 
Skeletons Shop grid, search While loading Shimmer replaces 
the "Loading the 
shelves…" text 
until loaded 
Page transition Route changes Navigate Cross-fade with 
12 px upward 
shift 
300 ms 
Image reveal Product and story 
images 
In view Clip-path wipe 
from bottom 
700 ms 
FAQ accordion Contact Click Height eases 
open; plus sign 
rotates to minus 
300 ms 
Count-up Our Social Corner In view "100+" counts up 
once 
1200 ms 
Toasts Forms, bag Event Slide up from 
bottom, auto-
dismiss in 4 s 
250 ms 
Audio toggle Hero Click Sound-wave bars 
animate while 
playing; audio 
never autoplays 
continuous 
Motion rules 

• Honor prefers-reduced-motion: replace movement with fades, stop the ticker, disable scroll-
linked pinning. 
• No animation may delay main content: LCP content renders first, motion hydrates after. 
• Lazy-load GSAP and Lenis; keep the animation bundle under 60 KB gzipped. 
• Every animation has a Playwright check that the resting state matches the baseline screenshot. 
8. Accessibility, SEO and performance 
• Semantic landmarks, skip link, focus trap in the drawer, aria-live for bag updates, alt text on 
every image 
• Product pages emit JSON-LD (Product, Offer, BreadcrumbList); store details emit 
LocalBusiness with hours 
• Generate sitemap.xml and robots.txt during the Vite build; set canonical URLs and Open Graph 
metadata on globaltolocal.in. Prerender every public route (home, shelves, products, content 
and policy pages) at build or deploy time, so crawlers and link previews receive full HTML with 
title, description, Open Graph tags and JSON-LD; rebuild a product page when staff change it. 
• Fonts self-hosted with font-display: swap; hero image preloaded; third-party scripts deferred 
• Targets: mobile LCP under 2.5 s, INP under 200 ms, CLS under 0.1, Lighthouse performance 90 or 
higher, WCAG 2.2 AA 