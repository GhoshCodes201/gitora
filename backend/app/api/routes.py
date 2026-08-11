from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends

from app.api.ratelimit import rate_limit
from app.analysis.service import AnalysisService
from app.core.config import get_settings
from app.db.cache import CacheStore
from app.schemas import GitoraAnalysis

router = APIRouter(prefix="/api/v1", tags=["gitora"])

_cache: Optional[CacheStore] = None
_service: Optional[AnalysisService] = None


def get_service() -> AnalysisService:
    global _cache, _service
    if _cache is None:
        _cache = CacheStore(get_settings().db_path)
    if _service is None:
        _service = AnalysisService(cache=_cache, settings=get_settings())
    return _service


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "gitora-backend"}


@router.get(
    "/analyze/{username}",
    response_model=GitoraAnalysis,
    dependencies=[Depends(rate_limit)],
)
async def analyze(
    username: str,
    force: bool = False,
    service: AnalysisService = Depends(get_service),
) -> GitoraAnalysis:
    return await service.analyze(username, force=force)
