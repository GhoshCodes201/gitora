from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.analysis.service import AnalysisService
from app.api.ratelimit import FixedWindowLimiter
from app.api.routes import get_service
from app.db.cache import CacheStore
from app.github.client import (
    GitHubBudgetExhausted,
    GitHubClient,
    GitHubError,
    GitHubNotFound,
)
from app.github.models import CommitWeek, GitHubRepo, GitHubUser
from app.main import create_app


class FakeClient:
    def __init__(self, *args, **kwargs):
        self.requests_used = 5
        self.rate_limit_remaining = 55
        self.rate_limit_reset = 0
        self._user = GitHubUser(
            login="octocat",
            name="The Octocat",
            avatar_url="https://example.com/a.png",
            html_url="https://github.com/octocat",
            bio="Developer",
            public_repos=2,
            followers=100,
            following=10,
        )
        self._repos = [
            GitHubRepo(name="alpha", owner_login="octocat", language="Python", stargazers_count=10, size_kb=100),
            GitHubRepo(name="beta", owner_login="octocat", language="Java", stargazers_count=3, size_kb=50),
        ]
        self._weekly = [
            CommitWeek(week=1755302400, total=2, days=[1, 1, 0, 0, 0, 0, 0]),
            CommitWeek(week=1755388800, total=2, days=[0, 0, 0, 1, 1, 0, 0]),
        ]
        self._personal_weekly = [
            CommitWeek(week=1755302400, total=1, days=[1, 0, 0, 0, 0, 0, 0]),
            CommitWeek(week=1755388800, total=1, days=[0, 0, 0, 1, 0, 0, 0]),
        ]

    async def get_user(self, username: str) -> GitHubUser:
        if username == "ghost":
            raise GitHubNotFound("ghost not found")
        if username == "boom":
            raise GitHubError("GitHub API error 500 for /users/boom")
        return self._user

    async def get_repos(self, username: str) -> list[GitHubRepo]:
        return self._repos

    async def get_commit_activity(self, owner: str, repo: str) -> tuple[list[CommitWeek], bool]:
        return self._weekly, True

    async def get_personal_commits(
        self, owner: str, repo: str, username: str
    ) -> tuple[list[CommitWeek], list, bool]:
        return self._personal_weekly, [], True

    async def has_readme(self, owner: str, repo: str) -> bool:
        return True

    async def close(self) -> None:
        pass


@pytest.fixture
def client(settings, tmp_path):
    app = create_app()
    app.state.rate_limiter = FixedWindowLimiter(10_000, 60)
    store = CacheStore(str(tmp_path / "gitora.db"))
    service = AnalysisService(cache=store, settings=settings, client_factory=lambda settings: FakeClient())
    app.dependency_overrides[get_service] = lambda: service
    with TestClient(app) as test_client:
        yield test_client
    store.close()


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analyze_happy_path(client):
    response = client.get("/api/v1/analyze/octocat")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "octocat"
    assert data["profile"]["name"] == "The Octocat"
    assert data["score"]["total"] >= 0
    assert {c["key"] for c in data["score"]["components"]} == {
        "activity",
        "consistency",
        "collaboration",
        "quality",
        "opensource",
    }
    assert data["summary"]["total_commits"] == 4
    assert data["summary"]["current_streak_days"] == 0
    assert data["summary"]["longest_streak_days"] == 1
    assert sum(week["total"] for week in data["heatmap"]) == 4
    assert data["meta"]["cache_hit"] is False
    assert data["meta"]["requests_used"] == 5
    assert data["meta"]["repos_analyzed"] == 2
    assert len(data["repositories"]) == 2
    assert data["repositories"][0]["stats_complete"] is True
    assert "Gitora" in data["score"]["disclaimer"]


def test_analyze_not_found(client):
    response = client.get("/api/v1/analyze/ghost")
    assert response.status_code == 404


def test_analyze_caches_second_call(client):
    first = client.get("/api/v1/analyze/octocat")
    assert first.json()["meta"]["cache_hit"] is False
    second = client.get("/api/v1/analyze/octocat")
    assert second.status_code == 200
    assert second.json()["meta"]["cache_hit"] is True


def test_analyze_force_bypasses_cache(client):
    client.get("/api/v1/analyze/octocat")
    forced = client.get("/api/v1/analyze/octocat", params={"force": "true"})
    assert forced.status_code == 200
    assert forced.json()["meta"]["cache_hit"] is False


def test_analyze_username_cleaning(client):
    response = client.get("/api/v1/analyze/%40octocat")
    assert response.status_code == 200
    assert response.json()["username"] == "octocat"


def test_analyze_empty_username(client):
    response = client.get("/api/v1/analyze/%20")
    assert response.status_code == 422


@pytest.mark.parametrize(
    "username",
    [
        "octocat%3Ffoo",
        "octocat%2e%2e",
        "octocat..",
        "a--b",
        "octocat-",
        "-octocat",
        "octocat%00",
    ],
)
def test_analyze_rejects_malicious_usernames(client, username):
    response = client.get(f"/api/v1/analyze/{username}")
    assert response.status_code == 422


def test_security_headers_present(client):
    response = client.get("/api/v1/analyze/octocat")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("referrer-policy") == "no-referrer"
    assert response.headers.get("strict-transport-security", "").startswith("max-age=")
    assert "default-src 'self'" in response.headers.get("content-security-policy", "")
    assert "frame-ancestors 'none'" in response.headers.get("content-security-policy", "")


def test_csp_omitted_in_development(settings, tmp_path):
    from app.main import SecurityHeadersMiddleware

    app = create_app()
    for middleware in app.user_middleware:
        if middleware.cls is SecurityHeadersMiddleware:
            middleware.kwargs["environment"] = "development"
    app.state.rate_limiter = FixedWindowLimiter(100, 60)
    store = CacheStore(str(tmp_path / "gitora.db"))
    service = AnalysisService(cache=store, settings=settings, client_factory=lambda s: FakeClient())
    app.dependency_overrides[get_service] = lambda: service
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/health")
    assert response.status_code == 200
    assert "content-security-policy" not in response.headers
    assert response.headers.get("x-frame-options") == "DENY"
    store.close()


def test_repo_error_marks_stats_incomplete(client, monkeypatch):
    async def boom(self, owner: str, repo: str):
        if repo == "beta":
            raise GitHubError("GitHub API error 500")
        return self._weekly, True

    monkeypatch.setattr(FakeClient, "get_commit_activity", boom)
    response = client.get("/api/v1/analyze/octocat")
    assert response.status_code == 200
    data = response.json()
    by_name = {repo["name"]: repo for repo in data["repositories"]}
    assert by_name["alpha"]["stats_complete"] is True
    assert by_name["beta"]["stats_complete"] is False
    assert "activity" in data["meta"]["partial_components"]
    assert "consistency" in data["meta"]["partial_components"]
    assert data["summary"]["total_commits"] == 2
    assert data["meta"]["warning"] is not None


def test_repo_crash_is_isolated(client, monkeypatch):
    async def boom(self, owner: str, repo: str):
        raise ValueError("unexpected crash")

    monkeypatch.setattr(FakeClient, "get_commit_activity", boom)
    response = client.get("/api/v1/analyze/octocat")
    assert response.status_code == 200
    data = response.json()
    assert all(repo["stats_complete"] is False for repo in data["repositories"])
    assert "activity" in data["meta"]["partial_components"]
    assert data["meta"]["warning"] is not None


def test_analyze_partial_commit_activity_flags_incomplete(client, monkeypatch):
    async def partial_activity(self, owner: str, repo: str):
        return self._weekly, False

    monkeypatch.setattr(FakeClient, "get_commit_activity", partial_activity)
    response = client.get("/api/v1/analyze/octocat")
    assert response.status_code == 200
    data = response.json()
    assert all(repo["stats_complete"] is False for repo in data["repositories"])
    assert data["meta"]["warning"] is not None


def test_analyze_github_error_returns_502(client):
    response = client.get("/api/v1/analyze/boom")
    assert response.status_code == 502
    assert "Failed to fetch GitHub data" in response.json()["detail"]


def test_analyze_budget_exhausted_returns_503(settings, tmp_path):
    app = create_app()
    store = CacheStore(str(tmp_path / "gitora.db"))
    service = AnalysisService(
        cache=store,
        settings=settings,
        client_factory=lambda s: GitHubClient(settings=s, budget=0),
    )
    app.dependency_overrides[get_service] = lambda: service
    with TestClient(app) as test_client:
        response = test_client.get("/api/v1/analyze/octocat")
    assert response.status_code == 503
    store.close()


def test_budget_exhausted_during_repo_analysis_is_graceful(client, monkeypatch):
    async def boom(self, owner: str, repo: str):
        raise GitHubBudgetExhausted()

    monkeypatch.setattr(FakeClient, "get_commit_activity", boom)
    response = client.get("/api/v1/analyze/octocat")
    assert response.status_code == 200
    data = response.json()
    assert all(repo["stats_complete"] is False for repo in data["repositories"])
    assert "activity" in data["meta"]["partial_components"]
    assert "consistency" in data["meta"]["partial_components"]
    assert data["meta"]["warning"] is not None


def test_analyze_rate_limited(settings, tmp_path):
    app = create_app()
    app.state.rate_limiter = FixedWindowLimiter(1, 600)
    store = CacheStore(str(tmp_path / "gitora.db"))
    service = AnalysisService(
        cache=store,
        settings=settings,
        client_factory=lambda s: FakeClient(),
    )
    app.dependency_overrides[get_service] = lambda: service
    with TestClient(app) as test_client:
        first = test_client.get("/api/v1/analyze/octocat")
        assert first.status_code == 200
        second = test_client.get("/api/v1/analyze/octocat")
        assert second.status_code == 429
        assert "Retry-After" in second.headers
        assert second.json()["detail"]
    store.close()
