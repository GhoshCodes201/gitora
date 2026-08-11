"""Tests for the data-firewall sanitization layer and model validators."""
from __future__ import annotations

from app.github.models import CommitWeek
from app.github.sanitize import (
    normalize_days,
    parse_date,
    to_float,
    to_int,
    to_int_or_none,
    to_str,
    valid_week,
)


def test_to_int_defaults_and_clamps():
    assert to_int(None) == 0
    assert to_int("abc") == 0
    assert to_int(-5) == 0
    assert to_int(3.9) == 3
    assert to_int(True) == 0
    assert to_int(False) == 0
    assert to_int(42) == 42
    assert to_int("12") == 12
    assert to_int([], default=7) == 7


def test_to_int_or_none():
    assert to_int_or_none(None) is None
    assert to_int_or_none("x") is None
    assert to_int_or_none(True) is None
    assert to_int_or_none(5) == 5
    assert to_int_or_none("5") == 5


def test_to_float_defaults_and_clamps():
    assert to_float(None) == 0.0
    assert to_float("1.5") == 1.5
    assert to_float(-2) == 0.0
    assert to_float("nope") == 0.0
    assert to_float(True) == 0.0


def test_to_str_defaults():
    assert to_str(None) == ""
    assert to_str("hi") == "hi"
    assert to_str(5) == "5"
    assert to_str(None, "main") == "main"


def test_normalize_days():
    assert normalize_days(None) == [0] * 7
    assert normalize_days([1, 2]) == [1, 2, 0, 0, 0, 0, 0]
    assert normalize_days([1] * 9) == [1] * 7
    assert normalize_days([None, "2", -3, True]) == [0, 2, 0, 0, 0, 0, 0]
    assert normalize_days("garbage") == [0] * 7


def test_parse_date():
    assert parse_date(None) is None
    assert parse_date("") is None
    assert parse_date("garbage") is None
    assert parse_date("2026-01-01T00:00:00Z") is not None
    assert parse_date("2026-01-01T00:00:00+00:00") is not None


def test_valid_week():
    assert valid_week(0) is False
    assert valid_week(-5) is False
    assert valid_week(1755388800) is True
    assert valid_week(4102444800 + 1) is False
    assert valid_week(946684799) is False


def test_commit_week_validators_normalize_bad_input():
    week = CommitWeek(week=1755388800, total=-3, days=[1, 2])
    assert week.total == 0
    assert week.days == [1, 2, 0, 0, 0, 0, 0]


def test_commit_week_validator_coerces_week():
    week = CommitWeek(week="1755388800", total="5", days=[0] * 7)
    assert week.week == 1755388800
    assert week.total == 5
