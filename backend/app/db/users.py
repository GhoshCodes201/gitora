from __future__ import annotations

import sqlite3
import threading
import time
from pathlib import Path
from typing import Optional


class UserStore:
    """SQLite-backed store for GitHub OAuth users.

    Persists the minimal identity needed for auth alongside the analysis
    cache in the same database file. Single-writer SQLite is fine here as the
    write rate (a login per user) is tiny compared to cache writes.
    """

    def __init__(self, db_path: str):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(db_path, check_same_thread=False, timeout=5.0)
        self._conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                login          TEXT PRIMARY KEY,
                display_name   TEXT,
                avatar_url     TEXT NOT NULL,
                github_token   TEXT,
                created_at     REAL NOT NULL,
                updated_at     REAL NOT NULL
            )
            """
        )
        self._conn.commit()

    def upsert(
        self,
        login: str,
        avatar_url: str,
        display_name: Optional[str] = None,
        github_token: Optional[str] = None,
    ) -> None:
        now = time.time()
        with self._lock:
            self._conn.execute(
                """
                INSERT INTO users (login, display_name, avatar_url, github_token, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(login) DO UPDATE SET
                    display_name = excluded.display_name,
                    avatar_url = excluded.avatar_url,
                    github_token = COALESCE(excluded.github_token, users.github_token),
                    updated_at = excluded.updated_at
                """,
                (login, display_name, avatar_url, github_token, now, now),
            )
            self._conn.commit()

    def get(self, login: str) -> Optional[dict]:
        with self._lock:
            row = self._conn.execute(
                "SELECT login, display_name, avatar_url, github_token FROM users WHERE login = ?",
                (login,),
            ).fetchone()
        if not row:
            return None
        login, display_name, avatar_url, github_token = row
        return {
            "login": login,
            "display_name": display_name,
            "avatar_url": avatar_url,
            "github_token": github_token,
        }

    def close(self) -> None:
        self._conn.close()
