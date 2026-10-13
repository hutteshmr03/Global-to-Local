import os
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENV: str = "development"
    APP_ENV: str = "development"
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    DATABASE_URL: str = "postgresql+psycopg2://postgres@127.0.0.1:5432/gtl_db"
    TEST_DATABASE_URL: str = "postgresql+psycopg2://postgres@127.0.0.1:5432/gtl_test_db"
    REDIS_URL: str = "redis://127.0.0.1:6379/0"

    JWT_SECRET_KEY: str = "gtl-dev-jwt-secret-key-change-in-production-32bytes"
    CSRF_SECRET_KEY: str = "gtl-dev-csrf-secret-key-change-in-production-32bytes"
    TOTP_ENCRYPTION_KEY: str = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="
    COOKIE_DOMAIN: str = ""
    COOKIE_SECURE: bool = False

    SMS_PROVIDER: str = "console"
    SMS_API_KEY: str = ""
    SMS_SENDER_ID: str = "GTLGOA"

    EMAIL_PROVIDER: str = "console"
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Global to Local <customerservice@globaltolocal.in>"

    RAZORPAY_KEY_ID: str = "rzp_test_gtl_1234567890"
    RAZORPAY_KEY_SECRET: str = "rzp_test_secret_gtl_1234567890"
    RAZORPAY_WEBHOOK_SECRET: str = "whsec_test_gtl_webhook_secret_12345"

    CAPTCHA_PROVIDER: str = "turnstile"
    CAPTCHA_SITE_KEY: str = "1x00000000000000000000AA"
    CAPTCHA_SECRET_KEY: str = "1x0000000000000000000000000000000AA"

    ADMIN_EMAIL: str = "admin@globaltolocal.in"
    ADMIN_PASSWORD: str = "ChangeMeAdmin!2026"
    ADMIN_FULL_NAME: str = "Asha Arondekar"

    @model_validator(mode="after")
    def validate_production_providers(self) -> "Settings":
        if self.ENV.lower() == "production" or self.APP_ENV.lower() == "production":
            self.ENV = "production"
            self.APP_ENV = "production"
            if self.SMS_PROVIDER.lower() == "console":
                raise ValueError(
                    "Console SMS provider is strictly forbidden when ENV=production."
                )
            if self.EMAIL_PROVIDER.lower() == "console":
                raise ValueError(
                    "Console Email provider is strictly forbidden when ENV=production."
                )
            if not self.COOKIE_SECURE:
                self.COOKIE_SECURE = True
        return self


settings = Settings()

