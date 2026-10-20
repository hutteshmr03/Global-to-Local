import os
import uuid
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from backend.config import settings
from backend.core.errors import ProblemException, register_exception_handlers
from backend.core.providers import DEV_EMAIL_OUTBOX, DEV_SMS_OUTBOX
from backend.database import SessionLocal, get_db
from backend.routers import admin, auth_account, cart, catalogue, checkout_orders, content
from backend.routers.checkout_orders import release_expired_reservations


def _scheduled_reservation_cleanup() -> None:
    try:
        with SessionLocal() as db:
            release_expired_reservations(db)
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    scheduler.add_job(_scheduled_reservation_cleanup, "interval", seconds=60, id="release_expired_reservations")
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="Global to Local — Heritage Goa E-Commerce API",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    lifespan=lifespan,
)

allowed_origins = list(
    {
        settings.FRONTEND_ORIGIN,
        "https://globaltolocal.in",
        "https://www.globaltolocal.in",
        "http://globaltolocal.in",
        "http://www.globaltolocal.in",
        "https://global-to-local.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Idempotency-Key",
        "X-CSRF-Token",
        "X-Cart-Session",
        "X-Request-Id",
    ],
    expose_headers=["X-Request-Id"],
)


@app.middleware("http")
async def add_security_and_trace_headers(request: Request, call_next):
    trace_id = request.headers.get("X-Request-Id") or f"req_{uuid.uuid4().hex[:12]}"
    request.state.trace_id = trace_id
    response = await call_next(request)
    response.headers["X-Request-Id"] = trace_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


register_exception_handlers(app)

# Serve uploaded / catalogue static images
public_images_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "images"))
if os.path.exists(public_images_dir):
    app.mount("/images", StaticFiles(directory=public_images_dir), name="images")

app.include_router(catalogue.router)
app.include_router(content.router)
app.include_router(cart.router)
app.include_router(auth_account.router)
app.include_router(checkout_orders.router)
app.include_router(admin.router)


@app.get("/api/v1/health", tags=["System"])
@app.get("/api/v1/health/live", tags=["System"])
def health_liveness():
    return {"status": "ok", "service": "global-to-local-api", "env": settings.APP_ENV}


@app.get("/api/v1/ready", tags=["System"])
@app.get("/api/v1/health/ready", tags=["System"])
def health_readiness(db: Session = Depends(get_db)):
    pg_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        pg_status = f"error: {e}"

    redis_status = "ok"
    try:
        from backend.core.redis import get_redis
        r = get_redis()
        r.ping()
    except Exception as e:
        redis_status = f"error: {e}"

    if pg_status != "ok" or redis_status != "ok":
        raise ProblemException(
            status_code=503,
            title="Service Unavailable",
            detail=f"Service not ready. Postgres: {pg_status}, Redis: {redis_status}",
            problem_type="https://globaltolocal.in/problems/not-ready",
        )

    return {"status": "ready", "database": "connected", "checks": {"postgres": pg_status, "redis": redis_status}}


@app.get("/api/v1/dev/outbox", tags=["Development Only"])
def get_dev_outbox(phone: str | None = None, email: str | None = None):
    if settings.APP_ENV.lower() == "production":
        raise ProblemException(
            status_code=404,
            title="Not Found",
            detail="Endpoint not available in production.",
        )
    sms_list = [
        {
            "recipient": m.recipient,
            "subject": m.subject,
            "body": m.body,
            "meta": m.meta,
            "sent_at": m.sent_at.isoformat(),
        }
        for m in reversed(DEV_SMS_OUTBOX)
        if not phone or phone in m.recipient
    ]
    email_list = [
        {
            "recipient": m.recipient,
            "subject": m.subject,
            "body": m.body,
            "meta": m.meta,
            "sent_at": m.sent_at.isoformat(),
        }
        for m in reversed(DEV_EMAIL_OUTBOX)
        if not email or email.lower() in m.recipient.lower()
    ]
    return {"sms": sms_list[:20], "emails": email_list[:20]}
