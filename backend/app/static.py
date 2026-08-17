from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles


def mount_frontend(app: FastAPI, static_dir: str) -> None:
    """Serve the built React frontend from FastAPI with SPA fallback.

    Must be called after the API router is included so /api/* routes win.
    """
    dist = Path(static_dir)
    index = dist / "index.html"
    assets = dist / "assets"

    if index.is_file() and assets.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets)), name="assets")

        @app.get("/{full_path:path}")
        async def spa(full_path: str) -> FileResponse:
            return FileResponse(index)

        return

    @app.get("/{full_path:path}")
    async def not_built(full_path: str) -> JSONResponse:
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        return JSONResponse(
            {"detail": "Service temporarily unavailable. Please try again later."},
            status_code=503,
        )
