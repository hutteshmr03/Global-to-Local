Global to Local — Database Schema 
Oct 8, 2026 · @Huttesh M R 
The schema has 31 PostgreSQL 16 tables in five groups. It is the relational data layer for the React + Vite 
storefront and Python FastAPI backend. SQLAlchemy ORM models map the tables, and Alembic 
manages versioned migrations. Money is stored as integer paise, tables use UUID keys where 
appropriate, and order rows keep snapshots of names, prices, and addresses so history never changes 
when the catalogue does. The same API and schema support the planned React Native + Expo + 
TypeScript mobile client. Authentication uses JWT access and refresh tokens; refresh-token hashes and 
OTP challenge metadata are held in the existing refresh_tokens and otp_codes tables. 
1. Table groups 
Group Tables 
People users, refresh_tokens, otp_codes, addresses 
Catalogue categories, makers, collections, products, 
product_images, product_collections, 
inventory_movements 
Selling carts, cart_items, shipping_zones, 
shipping_rates, pincode_zones, orders, 
order_items, order_status_events, 
payments, webhook_events, shipments, 
refunds 
Content store_reviews, press_items, faqs, cms_pages, 
site_settings 
Operations enquiries, audit_logs, idempotency_keys 
2. Key relationships 
From To Meaning 
addresses.user_id users.id A customer has many saved 
addresses 
products.category_id categories.id Each product sits on one of the 
13 shelves 
products.maker_id makers.id A product may name its maker 
or self-help group 
product_collections products, collections Many-to-many for curated rails 

From To Meaning 
cart_items.cart_id, 
cart_items.product_id 
carts, products One line per product per bag 
orders.user_id users.id A customer has many orders 
order_items.order_id orders.id An order has many lines 
payments.order_id, 
shipments.order_id 
orders.id Payment and delivery records 
pincode_zones.zone_id, 
shipping_rates.zone_id 
shipping_zones.id Pincode maps to a zone; zone 
and weight give the charge 
refunds.payment_id, 
refunds.order_id 
payments.id, orders.id A refund belongs to one 
payment and one order 
idempotency_keys.user_id users.id Saved results of repeated order 
and payment requests 
3. Schema (PostgreSQL 16) 
CREATE EXTENSION IF NOT EXISTS pgcrypto; 
CREATE EXTENSION IF NOT EXISTS citext; 
CREATE EXTENSION IF NOT EXISTS pg_trgm; 
 
CREATE TYPE user_role       AS ENUM ('customer','staff','admin'); 
CREATE TYPE order_status    AS ENUM 
('pending_payment','paid','packed','shipped','delivered','cancelled','refunded'); 
CREATE TYPE payment_status  AS ENUM 
('created','authorized','captured','failed','refunded'); 
CREATE TYPE shipment_status AS ENUM 
('pending','picked_up','in_transit','delivered','returned'); 
CREATE TYPE enquiry_type    AS ENUM ('bulk','hamper','general'); 
CREATE TYPE enquiry_status  AS ENUM ('new','in_progress','closed'); 
CREATE TYPE stock_reason    AS ENUM 
('purchase','sale','return','adjustment','cancel','reservation_release'); 
 
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$ 
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql; 
 
-- PEOPLE ------------------------------------------------------------- 
CREATE TABLE users ( 
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  email             citext NOT NULL UNIQUE, 
  phone             varchar(15) NOT NULL UNIQUE, 
  password_hash     text, 
  full_name         text NOT NULL, 
  role              user_role NOT NULL DEFAULT 'customer', 
  email_verified_at timestamptz, 
  phone_verified_at timestamptz, 
  is_active         boolean NOT NULL DEFAULT true, 

  created_at        timestamptz NOT NULL DEFAULT now(), 
  updated_at        timestamptz NOT NULL DEFAULT now() 
); 
 
CREATE TABLE refresh_tokens ( 
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
  token_hash  text NOT NULL UNIQUE, 
  user_agent  text, 
  expires_at  timestamptz NOT NULL, 
  revoked_at  timestamptz, 
  created_at  timestamptz NOT NULL DEFAULT now() 
); 
 
CREATE TABLE otp_codes ( 
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  target      text NOT NULL,                 -- email or phone 
  code_hash   text NOT NULL, 
  purpose     text NOT NULL CHECK (purpose IN 
('login','verify_phone','verify_email','reset')), 
  attempts    smallint NOT NULL DEFAULT 0, 
  expires_at  timestamptz NOT NULL, 
  consumed_at timestamptz, 
  created_at  timestamptz NOT NULL DEFAULT now() 
); 
 
CREATE TABLE addresses ( 
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
  label          text, 
  recipient_name text NOT NULL, 
  phone          varchar(15) NOT NULL, 
  line1          text NOT NULL, 
  line2          text, 
  landmark       text, 
  city           text NOT NULL, 
  state          text NOT NULL, 
  pincode        char(6) NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'), 
  country        char(2) NOT NULL DEFAULT 'IN', 
  is_default     boolean NOT NULL DEFAULT false, 
  created_at     timestamptz NOT NULL DEFAULT now() 
); 
CREATE UNIQUE INDEX one_default_address ON addresses(user_id) WHERE is_default; 
 
-- CATALOGUE ---------------------------------------------------------- 
CREATE TABLE categories (            -- the 13 shelves 
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  slug            text NOT NULL UNIQUE, 
  name            text NOT NULL, 
  description     text, 
  cover_image_url text, 
  cover_image_alt text, 
  sort_order      int NOT NULL DEFAULT 0, 
  is_active       boolean NOT NULL DEFAULT true, 
  created_at      timestamptz NOT NULL DEFAULT now() 

); 
 
CREATE TABLE makers (                -- self-help groups and individual makers 
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  name       text NOT NULL, 
  kind       text NOT NULL DEFAULT 'self_help_group' 
             CHECK (kind IN ('self_help_group','individual','cooperative')), 
  story      text, 
  photo_url  text, 
  district   text, 
  created_at timestamptz NOT NULL DEFAULT now() 
); 
 
CREATE TABLE collections (           -- curated rails, e.g. the shell shelf 
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  slug       text NOT NULL UNIQUE, 
  title      text NOT NULL, 
  subtitle   text, 
  body       text, 
  sort_order int NOT NULL DEFAULT 0, 
  is_active  boolean NOT NULL DEFAULT true 
); 
 
CREATE TABLE products ( 
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  slug                text NOT NULL UNIQUE, 
  sku                 text UNIQUE, 
  category_id         uuid NOT NULL REFERENCES categories(id), 
  maker_id            uuid REFERENCES makers(id), 
  name                text NOT NULL, 
  short_description   text, 
  description         text, 
  price_paise         integer NOT NULL CHECK (price_paise >= 0), 
  unit_label          text NOT NULL DEFAULT 'One piece', 
  weight_grams        integer NOT NULL CHECK (weight_grams > 0), 
  stock_qty           integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0), 
  reserved_qty        integer NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0), 
  low_stock_threshold integer NOT NULL DEFAULT 5, 
  origin_note         text NOT NULL DEFAULT 'Made in Goa, of Goan origin', 
  is_active           boolean NOT NULL DEFAULT true, 
  is_featured         boolean NOT NULL DEFAULT false, 
  search_tsv          tsvector GENERATED ALWAYS AS ( 
                        to_tsvector('simple', coalesce(name,'') || ' ' || 
coalesce(short_description,'')) 
                      ) STORED, 
  created_at          timestamptz NOT NULL DEFAULT now(), 
  updated_at          timestamptz NOT NULL DEFAULT now(), 
  CHECK (reserved_qty <= stock_qty) 
); 
CREATE INDEX products_category_idx ON products(category_id) WHERE is_active; 
CREATE INDEX products_search_idx   ON products USING gin(search_tsv); 
CREATE INDEX products_name_trgm    ON products USING gin(name gin_trgm_ops); 
 
CREATE TABLE product_images ( 
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(), 

  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, 
  url        text NOT NULL, 
  alt        text NOT NULL, 
  sort_order int NOT NULL DEFAULT 0, 
  is_primary boolean NOT NULL DEFAULT false 
); 
CREATE UNIQUE INDEX one_primary_image ON product_images(product_id) WHERE is_primary; 
 
CREATE TABLE product_collections ( 
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, 
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE, 
  sort_order    int NOT NULL DEFAULT 0, 
  PRIMARY KEY (product_id, collection_id) 
); 
 
CREATE TABLE inventory_movements ( 
  id         bigserial PRIMARY KEY, 
  product_id uuid NOT NULL REFERENCES products(id), 
  delta      integer NOT NULL, 
  reason     stock_reason NOT NULL, 
  order_id   uuid, 
  note       text, 
  created_by uuid REFERENCES users(id), 
  created_at timestamptz NOT NULL DEFAULT now() 
); 
 
-- SELLING ------------------------------------------------------------ 
CREATE TABLE carts ( 
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  user_id       uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE, 
  session_token text UNIQUE, 
  created_at    timestamptz NOT NULL DEFAULT now(), 
  updated_at    timestamptz NOT NULL DEFAULT now(), 
  expires_at    timestamptz, 
  CHECK (user_id IS NOT NULL OR session_token IS NOT NULL) 
); 
 
CREATE TABLE cart_items ( 
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  cart_id    uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE, 
  product_id uuid NOT NULL REFERENCES products(id), 
  quantity   integer NOT NULL CHECK (quantity BETWEEN 1 AND 20), 
  added_at   timestamptz NOT NULL DEFAULT now(), 
  UNIQUE (cart_id, product_id) 
); 
 
CREATE TABLE shipping_zones ( 
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  name text NOT NULL UNIQUE            -- e.g. Goa, Metro, Rest of India 
); 
 
CREATE TABLE pincode_zones ( 
  pincode  char(6) PRIMARY KEY, 
  city     text NOT NULL, 
  state    text NOT NULL, 

  zone_id  uuid NOT NULL REFERENCES shipping_zones(id) 
); 
 
CREATE TABLE shipping_rates ( 
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  zone_id      uuid NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE, 
  min_weight_g integer NOT NULL, 
  max_weight_g integer NOT NULL, 
  price_paise  integer NOT NULL CHECK (price_paise >= 0), 
  eta_days_min smallint NOT NULL, 
  eta_days_max smallint NOT NULL, 
  CHECK (max_weight_g > min_weight_g) 
); 
 
CREATE SEQUENCE order_number_seq START 1000; 
 
CREATE TABLE orders ( 
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  order_number     text NOT NULL UNIQUE 
                   DEFAULT 'GTL-' || to_char(now(),'YY') || '-' || 
lpad(nextval('order_number_seq')::text, 6, '0'), 
  user_id          uuid NOT NULL REFERENCES users(id), 
  status           order_status NOT NULL DEFAULT 'pending_payment', 
  shipping_address jsonb NOT NULL,       -- snapshot at purchase time 
  total_weight_g   integer NOT NULL, 
  subtotal_paise   integer NOT NULL CHECK (subtotal_paise >= 0), 
  shipping_paise   integer NOT NULL CHECK (shipping_paise >= 0), 
  total_paise      integer NOT NULL CHECK (total_paise = subtotal_paise + 
shipping_paise), 
  currency         char(3) NOT NULL DEFAULT 'INR', 
  customer_note    text, 
  placed_at        timestamptz NOT NULL DEFAULT now(), 
  updated_at       timestamptz NOT NULL DEFAULT now() 
); 
CREATE INDEX orders_user_idx ON orders(user_id, placed_at DESC); 
 
CREATE TABLE order_items ( 
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE, 
  product_id       uuid NOT NULL REFERENCES products(id), 
  product_name     text NOT NULL,        -- snapshot 
  unit_price_paise integer NOT NULL,     -- snapshot 
  quantity         integer NOT NULL CHECK (quantity > 0), 
  line_total_paise integer NOT NULL CHECK (line_total_paise = unit_price_paise * 
quantity) 
); 
CREATE INDEX order_items_order_idx ON order_items(order_id); 
 
CREATE TABLE order_status_events ( 
  id          bigserial PRIMARY KEY, 
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE, 
  from_status order_status, 
  to_status   order_status NOT NULL, 
  actor_id    uuid REFERENCES users(id), 
  note        text, 

  created_at  timestamptz NOT NULL DEFAULT now() 
); 
 
CREATE TABLE payments ( 
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  order_id            uuid NOT NULL REFERENCES orders(id), 
  provider            text NOT NULL DEFAULT 'razorpay', 
  provider_order_id   text NOT NULL UNIQUE, 
  provider_payment_id text UNIQUE, 
  status              payment_status NOT NULL DEFAULT 'created', 
  amount_paise        integer NOT NULL, 
  method              text, 
  raw                 jsonb, 
  created_at          timestamptz NOT NULL DEFAULT now(), 
  captured_at         timestamptz 
); 
 
CREATE TABLE refunds ( 
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  payment_id         uuid NOT NULL REFERENCES payments(id), 
  order_id           uuid NOT NULL REFERENCES orders(id), 
  provider_refund_id text UNIQUE, 
  amount_paise       integer NOT NULL CHECK (amount_paise > 0), 
  reason             text, 
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN 
('pending','processed','failed')), 
  requested_by       uuid REFERENCES users(id), 
  created_at         timestamptz NOT NULL DEFAULT now(), 
  processed_at       timestamptz 
); 
CREATE INDEX refunds_order_idx ON refunds(order_id); 
 
CREATE TABLE webhook_events (         -- idempotency for payment and courier webhooks 
  id           bigserial PRIMARY KEY, 
  provider     text NOT NULL, 
  event_id     text NOT NULL, 
  payload      jsonb NOT NULL, 
  received_at  timestamptz NOT NULL DEFAULT now(), 
  processed_at timestamptz, 
  UNIQUE (provider, event_id) 
); 
 
CREATE TABLE shipments ( 
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE, 
  courier      text NOT NULL, 
  awb          text, 
  tracking_url text, 
  status       shipment_status NOT NULL DEFAULT 'pending', 
  shipped_at   timestamptz, 
  delivered_at timestamptz 
); 
 
-- CONTENT ------------------------------------------------------------ 
CREATE TABLE store_reviews (          -- the visitors' book 

  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  author_name  text NOT NULL, 
  author_note  text, 
  body         text NOT NULL, 
  source       text, 
  is_published boolean NOT NULL DEFAULT true, 
  sort_order   int NOT NULL DEFAULT 0, 
  created_at   timestamptz NOT NULL DEFAULT now() 
); 
 
CREATE TABLE press_items ( 
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  title        text NOT NULL, 
  publication  text NOT NULL, 
  url          text NOT NULL, 
  published_on date, 
  excerpt      text, 
  image_url    text, 
  is_published boolean NOT NULL DEFAULT true 
); 
 
CREATE TABLE faqs ( 
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  question     text NOT NULL, 
  answer       text NOT NULL, 
  sort_order   int NOT NULL DEFAULT 0, 
  is_published boolean NOT NULL DEFAULT true 
); 
 
CREATE TABLE cms_pages (              -- story, social corner, four policies 
  slug       text PRIMARY KEY, 
  title      text NOT NULL, 
  body_md    text NOT NULL, 
  updated_by uuid REFERENCES users(id), 
  updated_at timestamptz NOT NULL DEFAULT now() 
); 
 
CREATE TABLE site_settings (          -- address, phone, email, hours, social links 
  key        text PRIMARY KEY, 
  value      jsonb NOT NULL, 
  updated_at timestamptz NOT NULL DEFAULT now() 
); 
 
-- OPERATIONS --------------------------------------------------------- 
CREATE TABLE enquiries ( 
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  type         enquiry_type NOT NULL, 
  name         text NOT NULL, 
  email        citext NOT NULL, 
  phone        varchar(15), 
  organisation text, 
  pincode      char(6) CHECK (pincode IS NULL OR pincode ~ '^[1-9][0-9]{5}$'), 
  message      text NOT NULL, 
  status       enquiry_status NOT NULL DEFAULT 'new', 
  handled_by   uuid REFERENCES users(id), 

  created_at   timestamptz NOT NULL DEFAULT now(), 
  CHECK (type <> 'hamper' OR pincode IS NOT NULL) 
); 
 
CREATE TABLE audit_logs ( 
  id         bigserial PRIMARY KEY, 
  actor_id   uuid REFERENCES users(id), 
  action     text NOT NULL, 
  entity     text NOT NULL, 
  entity_id  text, 
  diff       jsonb, 
  ip         inet, 
  created_at timestamptz NOT NULL DEFAULT now() 
); 
 
CREATE TABLE idempotency_keys ( 
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
  key           text NOT NULL, 
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
  endpoint      text NOT NULL, 
  request_hash  text NOT NULL, 
  response_code smallint, 
  response_body jsonb, 
  created_at    timestamptz NOT NULL DEFAULT now(), 
  expires_at    timestamptz NOT NULL, 
  UNIQUE (user_id, endpoint, key) 
); 
 
-- updated_at triggers 
CREATE TRIGGER trg_users_upd    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE 
FUNCTION set_updated_at(); 
CREATE TRIGGER trg_products_upd BEFORE UPDATE ON products FOR EACH ROW EXECUTE 
FUNCTION set_updated_at(); 
CREATE TRIGGER trg_orders_upd   BEFORE UPDATE ON orders   FOR EACH ROW EXECUTE 
FUNCTION set_updated_at(); 
CREATE TRIGGER trg_carts_upd    BEFORE UPDATE ON carts    FOR EACH ROW EXECUTE 
FUNCTION set_updated_at(); 
4. Design notes 
• One product row equals one sellable item. The live catalogue already makes each weight its own 
product (for example, "Pineapple Jam 250 grams"), so no variants table is needed yet. 
• Shelf counts shown on the site (Hand-Crafted 42, Masala 31 and so on) are computed with a 
COUNT(*) query, not stored. 
• Available stock is stock_qty - reserved_qty; every change also writes an 
inventory_movements row. 
• shipping_address is JSON on the order so editing a saved address later never changes past 
orders. 
• Seed data: 13 categories, the three visitors' book quotes, the 19 FAQs from the contact page, 
store settings, and the Goa zone with its 403 pincodes. 
• Every order or payment creation request stores its Idempotency-Key in idempotency_keys; a 
repeat returns the saved response, and rows are deleted after expires_at. 

• Refunds: each refund request creates a refunds row (pending), and the signed Razorpay refund 
webhook sets it to processed. When the refunds for a payment equal its amount, the payment 
becomes refunded and the order moves to refunded. 
• Password reset by emailed link: store the hash of the link token in otp_codes with purpose reset 
and the account email as target; it expires and can be used once. 
• Hamper enquiries must carry a pincode, which is checked against pincode_zones for the Goa 
zone. 
• SQLAlchemy and Alembic notes: map citext with a custom column type, map search_tsv with 
Computed(persisted=True), declare partial unique indexes with postgresql_where, and create 
the extensions, enum types and updated_at triggers with op.execute in the first migration. 