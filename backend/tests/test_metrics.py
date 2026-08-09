from datetime import datetime, timezone

from app.analysis.metrics import (
    active_weeks,
    average_repo_quality,
    compute_streaks,
    growth_trend,
    language_distribution,
    merge_weekly,
    monthly_breakdown,
    repo_quality_score,
    total_commits,
    weekend_ratio,
)
from app.github.models import CommitWeek, GitHubRepo, RepoAnalysis


def make_week(ts: int, total: int, days: list[int]) -> CommitWeek:
    return CommitWeek(week=ts, total=total, days=days)


def test_merge_weekly_sums_and_sorts():
    a = [make_week(2, 5, [0] * 7), make_week(1, 3, [0] * 7)]
    b = [make_week(1, 2, [1] * 7), make_week(2, 1, [0] * 7)]
    merged = merge_weekly([a, b])
    assert [week.week for week in merged] == [1, 2]
    assert merged[0].total == 5
    assert merged[1].total == 6
    assert total_commits(merged) == 11


def test_active_weeks():
    series = [make_week(1, 5, [0] * 7), make_week(2, 0, [0] * 7), make_week(3, 2, [0] * 7)]
    assert active_weeks(series) == 2


def test_compute_streaks_ignores_incomplete_final_week():
    series = [
        make_week(1, 4, [1, 1, 1, 1, 0, 0, 0]),
        make_week(2, 4, [0, 0, 0, 1, 1, 1, 1]),
        make_week(3, 3, [1, 1, 1, 0, 0, 0, 0]),
    ]
    current, longest = compute_streaks(series)
    assert current == 4
    assert longest == 7


def test_compute_streaks_empty():
    assert compute_streaks([]) == (0, 0)
    assert compute_streaks([make_week(1, 0, [0] * 7)]) == (0, 0)


def test_weekend_ratio():
    days = [1, 1, 1, 1, 1, 3, 3]
    series = [make_week(1, 11, days)]
    assert weekend_ratio(series) == round(6 / 11 * 100, 1)


def test_growth_trend_flat_and_rising():
    flat = [make_week(i, 10, [0] * 7) for i in range(16)]
    assert growth_trend(flat, window=8) == 0.0
    rising = [make_week(i, 10, [0] * 7) for i in range(8)] + [
        make_week(i, 30, [0] * 7) for i in range(8, 16)
    ]
    assert growth_trend(rising, window=8) == 200.0
    assert growth_trend([make_week(1, 1, [0] * 7)], window=8) == 0.0


def test_monthly_breakdown():
    jan = int(datetime(2026, 1, 5, tzinfo=timezone.utc).timestamp())
    feb = int(datetime(2026, 2, 2, tzinfo=timezone.utc).timestamp())
    series = [
        make_week(jan, 4, [0] * 7),
        make_week(jan + 604800, 6, [0] * 7),
        make_week(feb, 3, [0] * 7),
    ]
    result = monthly_breakdown(series)
    assert [item["month"] for item in result] == ["2026-01", "2026-02"]
    assert result[0]["commits"] == 10


def test_language_distribution_weights_by_size():
    repos = [
        GitHubRepo(name="a", language="Python", size_kb=100),
        GitHubRepo(name="b", language="Python", size_kb=100),
        GitHubRepo(name="c", language="Java", size_kb=50),
        GitHubRepo(name="d", language=None, size_kb=1000),
    ]
    dist = language_distribution(repos)
    assert dist[0]["name"] == "Python"
    assert dist[0]["percentage"] == 80.0
    assert dist[1]["name"] == "Java"
    assert dist[1]["percentage"] == 20.0


def test_language_distribution_empty():
    assert language_distribution([GitHubRepo(name="x", language=None, size_kb=10)]) == []


def test_repo_quality_score():
    now = datetime(2026, 7, 1, tzinfo=timezone.utc)
    solid = GitHubRepo(
        name="x",
        description="d",
        topics=["t"],
        size_kb=500,
        stargazers_count=10,
        forks_count=2,
        license_spdx="MIT",
        pushed_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
    )
    score = repo_quality_score(solid, has_readme=True, now=now)
    assert score > 50.0
    bare = GitHubRepo(name="y", size_kb=10)
    assert repo_quality_score(bare, has_readme=False, now=now) == 0.0


def test_average_repo_quality():
    now = datetime(2026, 7, 1, tzinfo=timezone.utc)
    good = RepoAnalysis(
        repo=GitHubRepo(name="a", description="d", size_kb=100, pushed_at=now),
        has_readme=True,
    )
    bad = RepoAnalysis(repo=GitHubRepo(name="b", size_kb=10), has_readme=False)
    average = average_repo_quality([good, bad], now=now)
    assert 0 < average < 100
    assert average_repo_quality([], now=now) == 0.0
