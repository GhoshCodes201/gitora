import pytest
import respx
from datetime import datetime, timezone
from httpx import Response

from app.github.client import GitHubClient, GitHubNotFound, GitHubRateLimited

USER_JSON = {
    "login": "octocat",
    "name": "The Octocat",
    "avatar_url": "https://example.com/a.png",
    "html_url": "https://github.com/octocat",
    "public_repos": 8,
    "followers": 100,
    "following": 10,
    "created_at": "2011-01-25T18:44:36Z",
}

STATS_JSON = [
    {"week": 1755388800, "total": 5, "days": [1, 0, 1, 1, 0, 2, 0]},
    {"week": 1755993600, "total": 3, "days": [0, 0, 1, 0, 1, 0, 1]},
]


async def test_get_user(settings):
    async with respx.mock() as mock:
        mock.get("https://api.github.com/users/octocat").mock(return_value=Response(200, json=USER_JSON))
        client = GitHubClient(settings=settings)
        user = await client.get_user("octocat")
        await client.close()
    assert user.login == "octocat"
    assert user.name == "The Octocat"
    assert user.created_at is not None


async def test_get_repos_paginates(settings):
    page1 = [{"id": i, "name": f"repo-{i}", "owner": {"login": "octocat"}} for i in range(100)]
    page2 = [{"id": 100, "name": "last", "owner": {"login": "octocat"}}]
    async with respx.mock() as mock:
        mock.get(
            "https://api.github.com/users/octocat/repos",
            params={"per_page": 100, "page": 1},
        ).mock(return_value=Response(200, json=page1))
        mock.get(
            "https://api.github.com/users/octocat/repos",
            params={"per_page": 100, "page": 2},
        ).mock(return_value=Response(200, json=page2))
        client = GitHubClient(settings=settings)
        repos = await client.get_repos("octocat")
        await client.close()
    assert len(repos) == 101
    assert repos[0].owner_login == "octocat"


async def test_get_commit_activity(settings):
    async with respx.mock() as mock:
        mock.get("https://api.github.com/repos/o/r/stats/commit_activity").mock(
            return_value=Response(200, json=STATS_JSON)
        )
        client = GitHubClient(settings=settings)
        weeks = await client.get_commit_activity("o", "r")
        await client.close()
    assert weeks[0].total == 5
    assert weeks[1].days == [0, 0, 1, 0, 1, 0, 1]


async def test_get_commit_activity_retries_202(settings):
    async with respx.mock() as mock:
        route = mock.get("https://api.github.com/repos/o/r/stats/commit_activity")
        route.side_effect = [Response(202), Response(200, json=STATS_JSON)]
        client = GitHubClient(settings=settings)
        weeks = await client.get_commit_activity("o", "r")
        await client.close()
    assert len(weeks) == 2


async def test_has_readme(settings):
    async with respx.mock() as mock:
        mock.get("https://api.github.com/repos/o/r/readme").mock(return_value=Response(200, json={"name": "README.md"}))
        client = GitHubClient(settings=settings)
        assert await client.has_readme("o", "r") is True
        await client.close()
    async with respx.mock() as mock:
        mock.get("https://api.github.com/repos/o/r/readme").mock(return_value=Response(404, json={"message": "Not Found"}))
        client = GitHubClient(settings=settings)
        assert await client.has_readme("o", "r") is False
        await client.close()


async def test_user_not_found(settings):
    async with respx.mock() as mock:
        mock.get("https://api.github.com/users/nope").mock(return_value=Response(404, json={"message": "Not Found"}))
        client = GitHubClient(settings=settings)
        with pytest.raises(GitHubNotFound):
            await client.get_user("nope")
        await client.close()


async def test_rate_limit(settings):
    async with respx.mock() as mock:
        mock.get("https://api.github.com/users/octocat").mock(
            return_value=Response(
                403,
                headers={"x-ratelimit-remaining": "0", "x-ratelimit-reset": "1787000000"},
                json={"message": "rate limit"},
            )
        )
        client = GitHubClient(settings=settings)
        with pytest.raises(GitHubRateLimited):
            await client.get_user("octocat")
        await client.close()


async def test_budget_exhausted(settings):
    from app.github.client import GitHubBudgetExhausted

    client = GitHubClient(settings=settings, budget=0)
    try:
        with pytest.raises(GitHubBudgetExhausted):
            await client.get_user("octocat")
    finally:
        await client.close()


def _commit_json(date: str) -> dict:
    return {"sha": "abc", "commit": {"committer": {"date": date}}}


async def test_get_personal_commits_buckets_by_week_and_day(settings):
    async with respx.mock() as mock:
        route = mock.get(
            "https://api.github.com/repos/o/r/commits",
            params={"author": "octocat", "per_page": 100, "page": 1},
        )
        route.mock(
            return_value=Response(
                200,
                json=[
                    _commit_json("2025-08-18T10:00:00Z"),
                    _commit_json("2025-08-18T15:00:00Z"),
                    _commit_json("2025-08-20T10:00:00Z"),
                ],
            )
        )
        client = GitHubClient(settings=settings)
        weeks, complete = await client.get_personal_commits("o", "r", "octocat")
        await client.close()
    assert complete is True
    assert len(weeks) == 1
    week_start = datetime(2025, 8, 18, tzinfo=timezone.utc)
    assert weeks[0].week == int(week_start.timestamp())
    assert weeks[0].total == 3
    assert weeks[0].days[0] == 2
    assert weeks[0].days[2] == 1


async def test_get_personal_commits_paginates(settings):
    async with respx.mock() as mock:
        route = mock.get("https://api.github.com/repos/o/r/commits")
        route.side_effect = [
            Response(200, json=[_commit_json("2025-08-18T10:00:00Z")] * 100),
            Response(200, json=[_commit_json("2025-08-18T11:00:00Z")]),
        ]
        client = GitHubClient(settings=settings)
        weeks, complete = await client.get_personal_commits("o", "r", "octocat")
        await client.close()
    assert complete is True
    assert weeks[0].total == 101
    assert route.call_count == 2
    assert route.calls[1].request.url.params["page"] == "2"


async def test_get_personal_commits_caps_pages(settings):
    settings = settings.model_copy(update={"personal_commits_max_pages": 2})
    async with respx.mock() as mock:
        route = mock.get("https://api.github.com/repos/o/r/commits")
        route.side_effect = [
            Response(200, json=[_commit_json("2025-08-18T10:00:00Z")] * 100),
            Response(200, json=[_commit_json("2025-08-18T11:00:00Z")] * 100),
            Response(200, json=[_commit_json("2025-08-18T12:00:00Z")] * 100),
        ]
        client = GitHubClient(settings=settings)
        weeks, complete = await client.get_personal_commits("o", "r", "octocat")
        await client.close()
    assert complete is False
    assert weeks[0].total == 200
    assert route.call_count == 2


async def test_get_personal_commits_empty(settings):
    async with respx.mock() as mock:
        mock.get("https://api.github.com/repos/o/r/commits").mock(return_value=Response(200, json=[]))
        client = GitHubClient(settings=settings)
        weeks, complete = await client.get_personal_commits("o", "r", "octocat")
        await client.close()
    assert weeks == []
    assert complete is True


async def test_get_personal_commits_not_found(settings):
    async with respx.mock() as mock:
        mock.get("https://api.github.com/repos/o/r/commits").mock(
            return_value=Response(404, json={"message": "Not Found"})
        )
        client = GitHubClient(settings=settings)
        weeks, complete = await client.get_personal_commits("o", "r", "octocat")
        await client.close()
    assert weeks == []
    assert complete is True


async def test_get_personal_commits_budget_exhausted(settings):
    from app.github.client import GitHubBudgetExhausted

    async with respx.mock() as mock:
        mock.get("https://api.github.com/repos/o/r/commits").mock(
            return_value=Response(200, json=[_commit_json("2025-08-18T10:00:00Z")] * 100)
        )
        client = GitHubClient(settings=settings, budget=1)
        weeks, complete = await client.get_personal_commits("o", "r", "octocat")
        await client.close()
    assert complete is False
    assert weeks[0].total == 100
