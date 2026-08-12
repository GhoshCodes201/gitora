from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ratelimit import FixedWindowLimiter
from app.api.routes import router
from app.core.config import get_settings
from app.static import mount_frontend


def create_app() -> FastAPI:
    settings = get_settings()
    origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
    app = FastAPI(
        title="Gitora API",
        version="0.1.0",
        description="Gitora - GitHub developer intelligence API",
    )
    app.state.rate_limiter = FixedWindowLimiter(
        settings.api_rate_limit, settings.api_rate_window_seconds
    )
    app.state.global_limiter = (
        FixedWindowLimiter(settings.api_global_daily_limit, 86400)
        if settings.api_global_daily_limit > 0
        else None
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    mount_frontend(app, settings.static_dir)
    return app


app = create_app()
