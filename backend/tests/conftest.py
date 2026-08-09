from __future__ import annotations

import pytest

from app.core.config import Settings
from app.db.cache import CacheStore


@pytest.fixture
def settings(tmp_path):
    return Settings(
        db_path=str(tmp_path / "gitora.db"),
        github_token="",
        cache_ttl_hours=6.0,
    )


@pytest.fixture
def cache(tmp_path):
    store = CacheStore(str(tmp_path / "gitora.db"))
    yield store
    store.close()
