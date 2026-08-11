from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.github.models import CommitWeek, GitHubRepo, RepoAnalysis
from app.github.sanitize import normalize_days


def _commit_count(week: CommitWeek) -> int:
    try:
        return max(int(week.total or 0), 0)
    except (TypeError, ValueError):
        return 0


def merge_weekly(series_list: list[list[CommitWeek]]) -> list[CommitWeek]:
    """Sum weekly commit series from multiple repositories into one timeline."""
    merged: dict[int, CommitWeek] = {}
    for series in series_list:
        for week in series:
            days = normalize_days(week.days)
            total = _commit_count(week)
            if week.week in merged:
                existing = merged[week.week]
                merged[week.week] = CommitWeek(
                    week=week.week,
                    total=existing.total + total,
                    days=[a + b for a, b in zip(existing.days, days)],
                )
            else:
                merged[week.week] = CommitWeek(week=week.week, total=total, days=days)
    return [merged[key] for key in sorted(merged)]


def total_commits(series: list[CommitWeek]) -> int:
    return sum(_commit_count(week) for week in series)


def active_weeks(series: list[CommitWeek]) -> int:
    return sum(1 for week in series if _commit_count(week) > 0)


def daily_series(series: list[CommitWeek]) -> list[int]:
    days: list[int] = []
    for week in series:
        days.extend(normalize_days(week.days))
    return days


def compute_streaks(series: list[CommitWeek]) -> tuple[int, int]:
    """Return (current_streak_days, longest_streak_days).

    The trailing week is treated as incomplete (only the days up to today are
    counted) only when it is the actual current calendar week. All past weeks
    count in full, so historical/partial data can never silently zero a
    current streak.
    """
    if not series:
        return 0, 0

    today = datetime.now(timezone.utc)
    current_week_start = int(
        (today - timedelta(days=today.weekday()))
        .replace(hour=0, minute=0, second=0, microsecond=0)
        .timestamp()
    )
    latest = max(week.week for week in series)

    days: list[int] = []
    for week in sorted(series, key=lambda week: week.week):
        week_days = normalize_days(week.days)
        if week.week == latest and week.week == current_week_start:
            days.extend(week_days[: today.weekday() + 1])
        else:
            days.extend(week_days)

    current = 0
    for value in reversed(days):
        if value > 0:
            current += 1
        else:
            break
    longest = 0
    run = 0
    for value in days:
        if value > 0:
            run += 1
            longest = max(longest, run)
        else:
            run = 0
    return current, longest


def weekend_ratio(series: list[CommitWeek]) -> float:
    """Percentage of commits that happen on Saturday/Sunday."""
    total = sum(_commit_count(week) for week in series)
    if total == 0:
        return 0.0
    weekend = 0
    for week in series:
        days = normalize_days(week.days)
        weekend += sum(days[i] for i in (5, 6))
    return round(weekend / total * 100.0, 1)


def growth_trend(series: list[CommitWeek], window: int = 8) -> float:
    """Percent change of the last `window` weeks vs the `window` before them."""
    values = [_commit_count(week) for week in series]
    if len(values) < window:
        return 0.0
    recent = sum(values[-window:])
    previous = sum(values[-2 * window : -window]) if len(values) >= 2 * window else sum(values[:-window])
    if previous == 0:
        return 100.0 if recent > 0 else 0.0
    return round((recent - previous) / previous * 100.0, 1)


def monthly_breakdown(series: list[CommitWeek]) -> list[dict[str, int]]:
    buckets: dict[str, int] = defaultdict(int)
    for week in series:
        if _commit_count(week) <= 0:
            continue
        try:
            month = datetime.fromtimestamp(week.week, tz=timezone.utc).strftime("%Y-%m")
        except (ValueError, OverflowError, OSError):
            continue
        buckets[month] += _commit_count(week)
    return [{"month": month, "commits": commits} for month, commits in sorted(buckets.items())]


def language_distribution(repos: list[GitHubRepo]) -> list[dict[str, float]]:
    """Primary-language distribution weighted by repository size, desc by share."""
    weights: dict[str, int] = defaultdict(int)
    for repo in repos:
        if repo.language:
            weights[repo.language] += max(int(repo.size_kb or 0), 1)
    total = sum(weights.values())
    if total == 0:
        return []
    distribution = {lang: round(weight / total * 100.0, 1) for lang, weight in weights.items()}
    return [
        {"name": lang, "percentage": pct}
        for lang, pct in sorted(distribution.items(), key=lambda kv: -kv[1])
    ]


def repo_quality_score(repo: GitHubRepo, has_readme: bool, now: Optional[datetime] = None) -> float:
    now = now or datetime.now(timezone.utc)
    stars = int(repo.stargazers_count or 0)
    forks = int(repo.forks_count or 0)
    size_kb = int(repo.size_kb or 0)
    score = 0.0
    score += 25.0 if has_readme else 0.0
    score += 10.0 if repo.license_spdx else 0.0
    score += 10.0 if repo.description else 0.0
    score += 5.0 if repo.topics else 0.0
    score += 20.0 * min(1.0, stars / 50.0)
    score += 10.0 * min(1.0, forks / 20.0)
    score += 10.0 * min(1.0, size_kb / 20000.0)
    if repo.pushed_at:
        pushed = repo.pushed_at
        if pushed.tzinfo is None:
            pushed = pushed.replace(tzinfo=timezone.utc)
        days_since_push = max(0, (now - pushed).days)
        if days_since_push <= 30:
            score += 10.0
        elif days_since_push <= 180:
            score += 5.0
    return round(min(100.0, score), 1)


def average_repo_quality(analyses: list[RepoAnalysis], now: Optional[datetime] = None) -> float:
    candidates = [a for a in analyses if not a.repo.is_archived and not a.repo.is_template]
    if not candidates:
        return 0.0
    total = sum(repo_quality_score(a.repo, a.has_readme, now) for a in candidates)
    return round(total / len(candidates), 1)
