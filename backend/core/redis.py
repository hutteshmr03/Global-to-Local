import os
import redis
import fakeredis
from backend.config import settings

_redis_client = None


def _is_production_env() -> bool:
    return (
        settings.APP_ENV.lower() == "production"
        or getattr(settings, "ENV", "").lower() == "production"
        or os.environ.get("ENV", "").lower() == "production"
        or os.environ.get("APP_ENV", "").lower() == "production"
    )


def get_redis(force_reconnect: bool = False):
    global _redis_client
    if _redis_client is not None and not force_reconnect:
        if _is_production_env() and isinstance(_redis_client, fakeredis.FakeStrictRedis):
            raise RuntimeError("In-memory Redis fallback is refused when ENV=production.")
        return _redis_client
    try:
        client = redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=0.5,
            socket_timeout=0.5,
        )
        client.ping()
        _redis_client = client
    except Exception:
        if _is_production_env():
            raise RuntimeError("In-memory Redis fallback is refused when ENV=production.")
        _redis_client = fakeredis.FakeStrictRedis(decode_responses=True)
    return _redis_client


def check_rate_limit(key: str, max_attempts: int, window_seconds: int) -> tuple[bool, int, int]:
    """
    Increment rate limit counter in Redis.
    Returns (allowed: bool, current_count: int, ttl_seconds: int).
    """
    r = get_redis()
    pipe = r.pipeline()
    pipe.incr(key)
    pipe.ttl(key)
    count, ttl = pipe.execute()
    if count == 1 or ttl < 0:
        r.expire(key, window_seconds)
        ttl = window_seconds
    allowed = count <= max_attempts
    return allowed, int(count), max(int(ttl), 0)


def reset_rate_limit(key: str) -> None:
    r = get_redis()
    r.delete(key)
