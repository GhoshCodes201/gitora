from __future__ import annotations

import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any, Optional

from app.core.config import get_settings


class CacheStore:
    """SQLite-backed cache for analysis payloads with a TTL."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                username   TEXT PRIMARY KEY,
                payload    TEXT NOT NULL,
                created_at REAL NOT NULL,
                expires_at REAL NOT NULL
            )
            """
        )
        self._conn.commit()

    def get(self, username: str, ignore_ttl: bool = False) -> Optional[dict[str, Any]]:
        with self._lock:
            row = self._conn.execute(
                "SELECT payload, expires_at FROM analyses WHERE username = ?",
                (username,),
            ).fetchone()
        if not row:
            return None
        payload, expires_at = row
        if not ignore_ttl and time.time() >= expires_at:
            return None
        return json.loads(payload)

    def put(self, username: str, payload: dict[str, Any], ttl_hours: Optional[float] = None) -> None:
        ttl_hours = ttl_hours if ttl_hours is not None else get_settings().cache_ttl_hours
        now = time.time()
        with self._lock:
            self._conn.execute(
                """
                INSERT INTO analyses (username, payload, created_at, expires_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(username) DO UPDATE SET
                    payload = excluded.payload,
                    created_at = excluded.created_at,
                    expires_at = excluded.expires_at
                """,
                (username, json.dumps(payload), now, now + ttl_hours * 3600),
            )
            self._conn.commit()

    def close(self) -> None:
        self._conn.close()
