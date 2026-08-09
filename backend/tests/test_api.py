from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.analysis.service import AnalysisService
from app.api.routes import get_service
from app.db.cache import CacheStore
from app.github.client import GitHubNotFound
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

    async def get_user(self, username: str) -> GitHubUser:
        if username == "ghost":
            raise GitHubNotFound("ghost not found")
        return self._user

    async def get_repos(self, username: str) -> list[GitHubRepo]:
        return self._repos

    async def get_commit_activity(self, owner: str, repo: str) -> list[CommitWeek]:
        return self._weekly

    async def has_readme(self, owner: str, repo: str) -> bool:
        return True

    async def close(self) -> None:
        pass


@pytest.fixture
def client(settings, tmp_path):
    app = create_app()
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
    assert data["summary"]["total_commits"] == 8
    assert data["summary"]["current_streak_days"] == 0
    assert data["summary"]["longest_streak_days"] == 2
    assert data["meta"]["cache_hit"] is False
    assert data["meta"]["requests_used"] == 5
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
