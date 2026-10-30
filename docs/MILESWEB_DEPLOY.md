# Global to Local — MilesWeb (cPanel) Production Deployment Guide

This document describes the production deployment architecture, environment configurations, and service keepalive procedures for **Global to Local** (`globaltolocal.in`) hosted on MilesWeb (Apache / LiteSpeed cPanel shared/VPS hosting).

---

## 1. Architecture Overview

- **Web Server:** Apache / LiteSpeed with `mod_rewrite` and `mod_proxy`.
- **Frontend:** React 19 SPA built with Vite, served directly from the public web root (`public_html` / `dist_live`).
- **Routing & Reverse Proxy:** `public/.htaccess` routes all standard paths to `index.html` and reverse-proxies `/api/*` to the FastAPI backend running locally on `http://127.0.0.1:8008`.
- **Backend Application:** FastAPI + SQLAlchemy running under Uvicorn daemon or Phusion Passenger (cPanel "Setup Python App").
- **Database:** PostgreSQL database instance (or MySQL/MariaDB with PyMySQL if configured).

---

## 2. Required Production Environment Variables (`.env`)

The production `.env` file must reside in the backend application directory (protected outside `public_html` or blocked by `.htaccess`).

```ini
# --- Core Environment ---
ENV=production
DEBUG=false
APP_NAME="Global to Local"

# --- Domain & Security ---
FRONTEND_ORIGIN=https://globaltolocal.in
COOKIE_DOMAIN=globaltolocal.in
COOKIE_SECURE=true
COOKIE_SAMESITE=lax

# --- Cryptography & Secrets ---
SECRET_KEY=<generate-strong-64-char-random-key>
CSRF_SECRET=<generate-strong-64-char-random-key>
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# --- Database Connection ---
# Dedicated PostgreSQL instance URL
DATABASE_URL=postgresql+psycopg2://<db_user>:<db_password>@127.0.0.1:5432/<db_name>
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30

# --- Payments (Razorpay) ---
RAZORPAY_KEY_ID=<your_live_razorpay_key_id>
RAZORPAY_KEY_SECRET=<your_live_razorpay_key_secret>
RAZORPAY_WEBHOOK_SECRET=<your_live_webhook_secret>

# --- Messaging & Communications ---
# IMPORTANT: In ENV=production, the application strictly refuses 'console' providers
# to ensure customer order notifications and OTPs are genuinely dispatched.
SMS_PROVIDER=msg91            # Supported: msg91, twilio, fast2sms
SMS_API_KEY=<your_sms_gateway_api_key>
SMS_SENDER_ID=GLBLOC

EMAIL_PROVIDER=resend         # Supported: resend, sendgrid, smtp
EMAIL_API_KEY=<your_email_api_key>
EMAIL_FROM="Global to Local <orders@globaltolocal.in>"
SUPPORT_EMAIL=contact@globaltolocal.in

# --- Admin Initial Setup ---
ADMIN_INITIAL_EMAIL=admin@globaltolocal.in
ADMIN_INITIAL_PHONE=+919876543210
```

> [!IMPORTANT]
> When `ENV=production`, `SMS_PROVIDER=console` or `EMAIL_PROVIDER=console` will fail startup assertions. You must provide valid provider credentials.

---

## 3. Reverse Proxy Configuration (`public/.htaccess`)

The `.htaccess` file proxies incoming API traffic to port `8008`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Reverse proxy all API traffic directly to backend on 127.0.0.1:8008
  RewriteRule ^api/(.*)$ http://127.0.0.1:8008/api/$1 [P,L]
  RewriteRule ^api$ http://127.0.0.1:8008/api/ [P,L]

  # SPA fallback for frontend client routing
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

---

## 4. Keeping Uvicorn Running on Port 8008

On shared cPanel hosting environments, long-running background processes (`nohup uvicorn ...`) may periodically be terminated by OS resource guardians (LVE / CloudLinux). 

### Option A: 5-Minute Keepalive Cron Job (Standard cPanel)

A watchdog script is provided at `scripts/keepalive_8008.sh`. It probes `http://127.0.0.1:8008/api/v1/health/live`. If the port is unresponsive or down, it cleanly kills any dangling PID and restarts Uvicorn.

1. Ensure executable permissions:
   ```bash
   chmod +x /home/<cpanel_user>/public_html/scripts/keepalive_8008.sh
   ```

2. Open **cPanel &rarr; Cron Jobs &rarr; Add New Cron Job**:
   - **Timing:** Every 5 minutes (`*/5 * * * *`)
   - **Command:**
     ```bash
     /bin/bash /home/<cpanel_user>/public_html/scripts/keepalive_8008.sh >> /home/<cpanel_user>/gtl_cron.log 2>&1
     ```

### Option B: cPanel "Setup Python App" (Phusion Passenger — Preferred Alternative)

If your MilesWeb plan includes **Setup Python App** (CloudLinux Passenger):
1. In cPanel, navigate to **Setup Python App**.
2. Click **Create Application**:
   - **Python Version:** 3.11 or 3.12
   - **Application Root:** `/home/<cpanel_user>/backend_app`
   - **Application URL:** Leave empty or map domain
   - **Application Startup File:** `passenger_wsgi.py`
   - **Application Entry Point:** `application`
3. In `passenger_wsgi.py`:
   ```python
   from a2wsgi import ASGIMiddleware
   from backend.main import app

   application = ASGIMiddleware(app)
   ```
4. Passenger automatically manages process lifecycle, eliminating the need for manual background processes or keepalive crons.

---

## 5. Deployment Verification Checklist

After deploying updates:
1. Verify backend health endpoint:
   ```bash
   curl -i http://127.0.0.1:8008/api/v1/health/live
   # Expect: HTTP/1.1 200 OK -> {"status":"ok","timestamp":"..."}
   ```
2. Verify public proxy routing:
   ```bash
   curl -i https://globaltolocal.in/api/v1/health/live
   # Expect: HTTP/2 200 (or HTTP/1.1 200)
   ```
3. Verify admin order transition:
   - Status changes strictly follow: `paid` &rarr; `packed` &rarr; `shipped` &rarr; `delivered`.
   - Invalid jumps (e.g. `paid` &rarr; `delivered`) return HTTP 400 with a clear error problem message.
   - Idempotent requests (updating to the current status) return HTTP 200 with no side effects.
