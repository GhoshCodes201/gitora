from __future__ import annotations

import threading
import time
from typing import Optional

from fastapi import HTTPException, Request


class FixedWindowLimiter:
    """Per-key fixed-window request limiter.

    Each key tracks a (window_start, count) pair on a monotonic clock. The
    state lives in-process only, so every uvicorn worker enforces its own
    window — acceptable for abuse mitigation on a demo deployment.

    Returns (allowed, retry_after_seconds) from hit().
    """

    _PRUNE_THRESHOLD = 10_000

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._buckets: dict[str, tuple[float, int]] = {}
        self._lock = threading.Lock()

    def hit(self, key: str) -> tuple[bool, float]:
        now = time.monotonic()
        with self._lock:
            start, count = self._buckets.get(key, (0.0, 0))
            if start == 0.0 or now - start >= self.window_seconds:
                start, count = now, 1
            else:
                count += 1
            self._buckets[key] = (start, count)
            self._prune(now)
            if count > self.max_requests:
                retry_after = max(0.0, self.window_seconds - (now - start))
                return False, retry_after
            return True, 0.0

    def _prune(self, now: float) -> None:
        if len(self._buckets) <= self._PRUNE_THRESHOLD:
            return
        stale = [
            key
            for key, (start, _count) in self._buckets.items()
            if now - start >= self.window_seconds
        ]
        for key in stale:
            del self._buckets[key]


def rate_limit(request: Request) -> None:
    """FastAPI dependency enforcing per-IP and global limits on /analyze."""
    limiter: Optional[FixedWindowLimiter] = getattr(request.app.state, "rate_limiter", None)
    if limiter is not None:
        client_host = request.client.host if request.client else "unknown"
        allowed, retry_after = limiter.hit(client_host)
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail="Too many analysis requests from this IP. Try again later.",
                headers={"Retry-After": str(max(1, int(retry_after)))},
            )

    global_limiter: Optional[FixedWindowLimiter] = getattr(request.app.state, "global_limiter", None)
    if global_limiter is not None:
        allowed, retry_after = global_limiter.hit("global")
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail="Gitora is at capacity right now. Try again later.",
                headers={"Retry-After": str(max(1, int(retry_after)))},
            )
