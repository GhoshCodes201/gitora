from __future__ import annotations

import asyncio

import pytest
from fastapi import HTTPException

from app.analysis.service import AnalysisService
from app.db.cache import CacheStore
from app.github.client import GitHubNotFound
from app.github.models import CommitWeek, GitHubRepo, GitHubUser


class FakeClient:
    def __init__(self):
        self.requests_used = 0
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


class CountingClient(FakeClient):
    def __init__(self):
        super().__init__()
        self.user_calls = 0

    async def get_user(self, username: str) -> GitHubUser:
        self.user_calls += 1
        await asyncio.sleep(0.05)
        return await super().get_user(username)


def make_service(settings, tmp_path, client) -> AnalysisService:
    return AnalysisService(
        cache=CacheStore(str(tmp_path / "gitora.db")),
        settings=settings,
        client_factory=lambda s: client,
    )


@pytest.mark.asyncio
async def test_concurrent_analyze_deduplicates_fetches(settings, tmp_path):
    client = CountingClient()
    service = make_service(settings, tmp_path, client)
    first, second = await asyncio.gather(service.analyze("octocat"), service.analyze("octocat"))
    assert first.username == "octocat"
    assert second.username == "octocat"
    assert client.user_calls == 1


@pytest.mark.asyncio
async def test_failed_analyze_does_not_poison_subsequent(settings, tmp_path):
    class FlakyClient(FakeClient):
        def __init__(self):
            super().__init__()
            self.calls = 0

        async def get_user(self, username: str) -> GitHubUser:
            self.calls += 1
            if self.calls == 1:
                raise GitHubNotFound("octocat not found")
            return await super().get_user(username)

    service = make_service(settings, tmp_path, FlakyClient())
    with pytest.raises(HTTPException) as exc_info:
        await service.analyze("octocat")
    assert exc_info.value.status_code == 404
    result = await service.analyze("octocat")
    assert result.username == "octocat"


@pytest.mark.asyncio
async def test_personal_commits_flow_to_recent_feed(settings, tmp_path):
    from datetime import datetime, timezone

    from app.github.models import CommitInfo

    class CommitsClient(FakeClient):
        async def get_personal_commits(
            self, owner: str, repo: str, username: str
        ) -> tuple[list[CommitWeek], list[CommitInfo], bool]:
            return (
                self._personal_weekly,
                [CommitInfo(sha="abc123", date=datetime.now(timezone.utc), message="fix: the bug")],
                True,
            )

    service = make_service(settings, tmp_path, CommitsClient())
    result = await service.analyze("octocat")
    assert len(result.recent_commits) == 2
    assert {c.sha for c in result.recent_commits} == {"abc123"}
    assert {c.message for c in result.recent_commits} == {"fix: the bug"}
    assert {c.repo for c in result.recent_commits} == {"alpha", "beta"}


@pytest.mark.asyncio
async def test_force_and_normal_requests_do_not_share_inflight(settings, tmp_path):
    client = CountingClient()
    service = make_service(settings, tmp_path, client)
    first, second = await asyncio.gather(
        service.analyze("octocat", force=True), service.analyze("octocat", force=False)
    )
    assert first.username == "octocat"
    assert second.username == "octocat"
    assert client.user_calls == 2
