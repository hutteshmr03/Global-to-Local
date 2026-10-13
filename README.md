# Global to Local — Heritage Goan Marketplace (Fontainhas, Panjim, Goa)

Full-stack e-commerce platform for **Global to Local**, featuring a React + Vite customer storefront and a FastAPI + PostgreSQL + SQLAlchemy + Alembic + Redis backend.

---

## Architecture & Stack

- **Frontend**: React 19 (Vite SPA), `react-router-dom` v7, Tailwind CSS v4 (Goan heritage design tokens), Zustand (`cart-store`, `auth-store`), `@tanstack/react-query`, Framer Motion, `lucide-react`.
- **Backend**: Python FastAPI, SQLAlchemy 2.0 ORM, Alembic migrations, PostgreSQL (`pgcrypto`, `citext`, `pg_trgm`), Redis rate limiting (with transparent `fakeredis` fallback for local dev/test), Argon2id (`argon2-cffi`) password hashing, HMAC-SHA256 OTP & reset token hashing, JWT access + rotating refresh tokens in `httpOnly`, `SameSite=Lax` cookies with double-submit `X-CSRF-Token`, Razorpay order creation & HMAC-SHA256 payment/webhook verification, and `APScheduler` for 30-minute stock reservation cleanup.
- **Money & Time**: All prices and totals are stored and computed in integer **paise** (`INR`, `100 paise = ₹1`); all database timestamps are **UTC** (`TIMESTAMPTZ`).

---

## Quick Start

### 1. Environment & Database Setup

Copy `.env.example` to `.env` if customizing credentials:
```bash
cp .env.example .env
```

Start PostgreSQL & Redis (via Docker Compose or local PostgreSQL service):
```bash
docker compose up -d
```

Install Python dependencies and apply Alembic migrations:
```bash
pip install -r requirements.txt
python -m alembic upgrade head
```

### 2. Idempotent Catalogue & Content Seed

Seed the 13 shelves, 230 products, 10 Shell Shelf items, 19 FAQs, 3 visitor reviews (`Gifty Abraham`, `Stedwick Fernandes`, `Swapna Pujari`), 7 press mentions/awards, CMS pages, site settings, and shipping zones/rates (`Goa Express ₹80` for `403xxx` vs `Pan-India Standard ₹120` with no free-shipping threshold and no minimum order):
```bash
python -m backend.seed
```
*(Safe to run multiple times; updates in place by natural keys `slug`/`sku` without duplicating rows.)*

### 3. Run the Backend & Frontend

**Terminal 1 — FastAPI Backend (`http://127.0.0.1:8000`):**
```bash
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
- OpenAPI Docs: `http://127.0.0.1:8000/api/v1/docs`
- Health Liveness: `http://127.0.0.1:8000/api/v1/health/live`
- Health Readiness: `http://127.0.0.1:8000/api/v1/health/ready`

**Terminal 2 — React + Vite Storefront (`http://localhost:5173`):**
```bash
npm install
npm run dev
```
*(Vite automatically proxies `/api/*` requests to `http://127.0.0.1:8000`.)*

---

## Testing & Verification

### Backend API & Database Integration Suite (`pytest`)
Runs against the isolated `gtl_test_db` database:
```bash
python -m pytest backend/tests/test_part1_api.py -v
```

### End-to-End, Two-Browser Proof & Visual Baseline Verification (`Playwright`)
```bash
npm run build
node scripts/verify_part1_e2e_and_visual.mjs
```
