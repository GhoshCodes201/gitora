from __future__ import annotations

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.ratelimit import FixedWindowLimiter
from app.api.routes import router
from app.core.config import get_settings
from app.static import mount_frontend


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Hardening headers on every response.

    A CSP is emitted in production (the SPA ships as static assets with no
    inline scripts); in development we skip it so tooling is not restricted.
    """

    _BASE_HEADERS = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    }
    _CSP = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' https://fonts.googleapis.com; "
        "img-src 'self' data: https:; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "connect-src 'self'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'"
    )

    def __init__(self, app, *, environment: str = "production"):
        super().__init__(app)
        self._emit_csp = environment == "production"

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        for key, value in self._BASE_HEADERS.items():
            response.headers.setdefault(key, value)
        if "server" in response.headers:
            del response.headers["server"]
        if self._emit_csp:
            response.headers.setdefault("Content-Security-Policy", self._CSP)
        return response


def create_app() -> FastAPI:
    settings = get_settings()
    origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
    docs_url = "/docs" if settings.environment != "production" else None
    redoc_url = "/redoc" if settings.environment != "production" else None
    openapi_url = "/openapi.json" if settings.environment != "production" else None
    app = FastAPI(
        title="Gitora API",
        version="0.1.0",
        description="Gitora - GitHub developer intelligence API",
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,
    )
    app.state.rate_limiter = FixedWindowLimiter(
        settings.api_rate_limit, settings.api_rate_window_seconds
    )
    app.state.global_limiter = (
        FixedWindowLimiter(settings.api_global_daily_limit, 86400)
        if settings.api_global_daily_limit > 0
        else None
    )
    app.state.force_limiter = FixedWindowLimiter(5, 600)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(SecurityHeadersMiddleware, environment=settings.environment)
    app.include_router(router)
    mount_frontend(app, settings.static_dir)
    return app


app = create_app()
