Global to Local — Backend Specification 
Build the Global to Local REST API with Python FastAPI, SQLAlchemy, and PostgreSQL, versioned under 
/api/v1. Use Alembic for schema migrations. The API serves the React + Vite storefront and is designed 
so a future React Native + Expo + TypeScript mobile client can use the same endpoints. 
1. Architecture 
Component Choice Role 
Storefront React + Vite static frontend on 
Vercel or equivalent static 
hosting 
Client-side routes and API calls; 
staff admin under /admin 
API Python FastAPI service  Business logic, auth, validation 
Database PostgreSQL 16 (Neon or 
Supabase) 
Source of truth 
Cache and limits Redis (Upstash) Rate limiting, OTP codes, hot 
catalogue reads 
Media Cloudinary or S3 with CDN Product and story images 
Payments Razorpay Card, UPI, net banking; signed 
webhooks 
Shipping Courier API such as Shiprocket 
or Delhivery 
Labels, tracking webhooks 
Email and SMS Resend or SES; an SMS provider 
for codes 
Receipts, status updates, one-
time codes 
Observability Sentry, structured logs, uptime 
monitor 
Errors and health 
Redis is part of the stack for rate limits, one-time-code attempts and cached catalogue reads. Local 
development runs PostgreSQL and Redis in Docker Compose. 
2. Conventions 
• JSON only; money in integer paise; times in UTC ISO 8601 
• Errors follow RFC 7807 (application/problem+json) with a stable code 
• Pagination with page and limit (max 60); lists return items, total, page 
• Write endpoints accept an Idempotency-Key header; order and payment creation require it. 
Keys are stored in idempotency_keys with a hash of the request and the saved response, and 
expire after 24 hours. A repeat with the same key returns the saved response; the same key 
with a different body returns 409. 

• Validate API requests with Pydantic; publish the OpenAPI contract for the React client and keep 
its form validation aligned. 
3. Authentication and authorization 
• Passwords hashed with Argon2id; optional one-time code by SMS or email 
• Access token (JWT, 15 minutes) and refresh token (30 days, rotated, stored hashed) in 
httpOnly, Secure, SameSite=Lax cookies 
• Roles: customer, staff, admin; a guard on every admin route 
• Rate limits: 5 login attempts per 15 minutes per account and IP; 3 one-time-code requests per 
hour 
• Serve the storefront and the API from the same registrable domain (for example globaltolocal.in 
and api.globaltolocal.in), or proxy /api/v1 through the storefront host. Without this, 
SameSite=Lax cookies are not sent on API calls. Set the cookie Domain explicitly and allow 
credentials only for the storefront origin. 
• The guest bag is identified by a signed httpOnly session cookie that maps to carts.session_token; 
on login the guest bag is merged into the customer bag. 
4. Endpoints 
Method Path Auth Purpose 
POST /auth/register none Create account with 
email, phone, 
password 
POST /auth/login none Log in; sets cookies 
POST /auth/otp/request, 
/auth/otp/verify 
none One-time-code login 
and phone verification 
POST /auth/refresh, 
/auth/logout 
cookie Rotate or revoke 
tokens 
POST /auth/password/forg
ot, 
/auth/password/rese
t 
none Reset by emailed link 
GET /categories, 
/categories/{slug} 
none The 13 shelves with 
product counts 
GET /products none Query: q, category, 
min_price, 
max_price, in_stock, 
sort, page, limit 
GET /products/{slug} none Detail with images, 
maker and related 

Method Path Auth Purpose 
items 
GET /collections/{slug} none Curated rails such as 
the shell shelf 
GET /search/suggest none Typeahead from q 
GET /cart session or user Current bag with live 
prices and stock 
POST /cart/items session or user Add item 
PATCH, DELETE /cart/items/{produc
tId} 
session or user Change quantity, 
remove 
POST /cart/merge user Merge the guest bag 
after login 
GET /shipping/estimate none Query pincode, 
weight_g; returns 
charge and days 
POST /checkout/quote user Totals for bag plus 
chosen address 
POST /orders user Create order and 
Razorpay order from 
the bag 
POST /payments/razorpay/
verify 
user Verify signature after 
client payment 
POST /webhooks/razorpay signature Authoritative payment 
events 
POST /webhooks/courier signature Shipment status 
updates 
GET /orders, 
/orders/{orderNumbe
r} 
user History and detail with 
tracking 
POST /orders/{orderNumbe
r}/cancel 
user Cancel while pending 
payment, paid or 
packed; a paid order is 
refunded 
GET, PATCH /me user Profile 

Method Path Auth Purpose 
GET, POST, PATCH, 
DELETE 
/me/addresses user Saved addresses, one 
default 
GET /reviews, /press, 
/faqs, 
/pages/{slug}, 
/settings/public 
none Content for the pages 
POST /enquiries none Contact, bulk and 
hamper forms; hamper 
requires a delivery 
pincode; CAPTCHA and 
rate limit 
CRUD /admin/products, 
/admin/categories, 
/admin/makers, 
/admin/collections 
staff Catalogue 
management 
POST /admin/products/imp
ort 
staff CSV import with dry-
run report 
GET, PATCH /admin/orders, 
/admin/orders/{id} 
staff Review, change status, 
add shipment 
POST /admin/stock/{produ
ctId} 
staff Stock adjustment with 
reason 
GET, PATCH /admin/enquiries staff Inbox and status 
CRUD /admin/reviews, 
/admin/press, 
/admin/faqs, 
/admin/pages 
staff Content editing 
CRUD /admin/users admin Users and roles 
POST, DELETE /admin/products/{id
}/images 
staff Upload and remove 
product images, set the 
primary image and alt 
text 
GET /admin/stock/low staff Products at or below 
their low-stock 
threshold 
POST /admin/orders/{id}/
refund 
staff Full or partial refund 

Method Path Auth Purpose 
through Razorpay 
GET, PATCH /admin/settings staff Read and update site 
settings: address, 
phone, email, hours, 
social links 
GET /admin/audit-logs admin Filter the audit log by 
actor, entity and date 
5. Business rules 
• A bag line cannot exceed available stock or 20 units; prices are re-read from the database at 
checkout, never trusted from the client. 
• Shipping charge = rate for the package's total weight slab in the zone matching the destination 
pincode. No free-shipping rule and no minimum order. 
• Stock is reserved when the order is created and released if payment is not captured within 30 
minutes. 
• An order has exactly one shipping address, copied into the order so later address edits do not 
change history. 
• Hamper enquiries are accepted only for Goa pincodes (pincodes beginning 403, checked against 
the pincode table). The form sends the delivery pincode and it is stored in enquiries.pincode. 
• Order status moves only forward: pending_payment, paid, packed, shipped, delivered; 
cancellation and refund are separate end states, and each change writes an event row. 
• Product prices include taxes; the order total is subtotal plus delivery. 
• Cancelling a paid or packed order releases the reserved stock and starts a full Razorpay refund. 
The order moves to cancelled, then to refunded when the refund.processed webhook arrives. 
Staff can also issue partial refunds; every refund is saved in the refunds table. 
6. Payment flow 
1. The API creates an order row and a Razorpay order for the total in paise. 
2. The browser opens Razorpay Checkout and returns the payment id and signature. 
3. The API verifies the signature, but the order is marked paid only when the signed webhook 
arrives; webhooks are de-duplicated by event id. 
4. On failure or timeout the stock reservation is released. 
5. Refunds call the Razorpay refund API with an idempotency key; the signed refund webhook 
marks the refund processed and updates payments and orders. 
7. Notifications 
Event Channel Recipient 
Order placed and paid Email Customer and store team 

Event Channel Recipient 
Order packed, shipped, 
delivered 
Email, with tracking link when 
shipped 
Customer 
Password reset or login code Email or SMS Customer 
New enquiry Email Store team 
Low stock, failed webhook Email or alert Staff and developer 
Refund started or completed Email Customer 
8. Security 
• Parameterized queries only; CSRF protection on cookie-authenticated writes; strict CORS to the 
storefront origin 
• Security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy) 
• Webhook signature checks; secrets in the platform's secret store; no card data ever touches our 
servers 
• Audit log of staff actions; personal data export and delete endpoints to meet DPDP 
requirements 
9. Operations 
• /health endpoint for uptime checks; structured logs with request ids 
• Daily database backup with point-in-time restore; restore drill before launch 
• Background jobs for emails, reservation release, abandoned-bag cleanup and removal of expired 
idempotency keys and one-time codes 
• Environments: local, preview, staging, production, each with its own keys 