"""Defensive coercion helpers (the data firewall).

Every raw value coming from the GitHub API flows through these functions
before it is allowed into a Pydantic model or analytics math. The goal is to
guarantee sane primitives (ints >= 0, 7-length day lists, valid timestamps)
so that missing, null or oddly-shaped upstream data degrades gracefully
instead of crashing the analysis.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

# Unix timestamps for 2000-01-01 and 2100-01-01 (UTC) — sane range for weeks.
MIN_WEEK_TS = 946684800
MAX_WEEK_TS = 4102444800


def to_int(value: Any, default: int = 0) -> int:
    """Coerce to a non-negative int; None/garbage -> default, negatives -> 0."""
    if isinstance(value, bool):
        return default
    try:
        return max(int(value), 0)
    except (TypeError, ValueError):
        return default


def to_int_or_none(value: Any) -> Optional[int]:
    """Coerce to int, or None when not convertible (used for optional ints)."""
    if isinstance(value, bool):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def to_float(value: Any, default: float = 0.0) -> float:
    """Coerce to a non-negative float; None/garbage -> default, negatives -> 0."""
    if isinstance(value, bool):
        return default
    try:
        return max(float(value), 0.0)
    except (TypeError, ValueError):
        return default


def to_str(value: Any, default: str = "") -> str:
    """Coerce to a string; None -> default."""
    if value is None:
        return default
    return str(value)


def normalize_days(value: Any) -> list[int]:
    """Normalize a weekly day-count list to exactly 7 non-negative ints.

    Pads missing cells with 0 and truncates anything beyond the 7th, so
    downstream sums never silently lose or misalign data.
    """
    if not isinstance(value, (list, tuple)):
        value = []
    days = [to_int(d) for d in value[:7]]
    return days + [0] * (7 - len(days))


def valid_week(ts: int) -> bool:
    """True when the week timestamp is within a sane (2000..2100) range."""
    return MIN_WEEK_TS <= ts <= MAX_WEEK_TS


def parse_date(value: Optional[str]) -> Optional[datetime]:
    """Parse an ISO-8601 date string to an aware datetime, or None on failure."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
