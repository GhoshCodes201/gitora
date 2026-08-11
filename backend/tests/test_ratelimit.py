from __future__ import annotations

import time

from app.api.ratelimit import FixedWindowLimiter


def test_limiter_allows_up_to_limit():
    limiter = FixedWindowLimiter(3, 60)
    for _ in range(3):
        assert limiter.hit("ip") == (True, 0.0)
    allowed, retry = limiter.hit("ip")
    assert allowed is False
    assert 0 < retry <= 60


def test_limiter_resets_after_window():
    limiter = FixedWindowLimiter(2, 1)
    assert limiter.hit("ip") == (True, 0.0)
    assert limiter.hit("ip") == (True, 0.0)
    assert limiter.hit("ip")[0] is False
    time.sleep(1.05)
    assert limiter.hit("ip")[0] is True


def test_limiter_is_per_key():
    limiter = FixedWindowLimiter(1, 60)
    assert limiter.hit("a")[0] is True
    assert limiter.hit("b")[0] is True
    assert limiter.hit("a")[0] is False
    assert limiter.hit("b")[0] is False


def test_limiter_zero_max_rejects_everything():
    limiter = FixedWindowLimiter(0, 60)
    assert limiter.hit("ip")[0] is False
    assert limiter.hit("ip")[0] is False
