from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any, Optional

import httpx

from app.core.config import Settings, get_settings
from app.github.models import CommitWeek, GitHubRepo, GitHubUser


class GitHubError(Exception):
    pass


class GitHubNotFound(GitHubError):
    pass


class GitHubRateLimited(GitHubError):
    def __init__(self, reset_at: int = 0, message: str = "GitHub API rate limit reached"):
        self.reset_at = reset_at
        super().__init__(message)


class GitHubBudgetExhausted(GitHubError):
    pass


class GitHubClient:
    """Async httpx client for the GitHub REST API.

    Tracks an optional request budget per analysis, detects rate limits and
    not-found responses, and exposes the remaining rate limit for reporting.
    """

    def __init__(self, settings: Optional[Settings] = None, budget: Optional[int] = None):
        self.settings = settings or get_settings()
        self.budget = budget
        self.requests_used = 0
        self.rate_limit_remaining: Optional[int] = None
        self.rate_limit_reset: Optional[int] = None
        self._semaphore = asyncio.Semaphore(5)
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "gitora/0.1",
        }
        if self.settings.github_token:
            headers["Authorization"] = f"Bearer {self.settings.github_token}"
        self._client = httpx.AsyncClient(
            base_url=self.settings.github_api_base,
            headers=headers,
            timeout=self.settings.request_timeout,
            follow_redirects=True,
        )

    async def close(self) -> None:
        await self._client.aclose()

    def _update_rate_limits(self, response: httpx.Response) -> None:
        remaining = response.headers.get("x-ratelimit-remaining")
        reset = response.headers.get("x-ratelimit-reset")
        if remaining is not None:
            self.rate_limit_remaining = int(remaining)
        if reset is not None:
            self.rate_limit_reset = int(reset)

    async def _get(self, path: str, params: Optional[dict[str, Any]] = None) -> httpx.Response:
        if self.budget is not None and self.requests_used >= self.budget:
            raise GitHubBudgetExhausted()
        async with self._semaphore:
            response = await self._client.get(path, params=params)
            self.requests_used += 1
            self._update_rate_limits(response)
        if response.status_code == 429 or (
            response.status_code == 403 and response.headers.get("x-ratelimit-remaining") == "0"
        ):
            reset = int(response.headers.get("x-ratelimit-reset") or 0)
            raise GitHubRateLimited(reset_at=reset)
        if response.status_code == 404:
            raise GitHubNotFound(f"GitHub resource not found: {path}")
        if response.status_code >= 400:
            raise GitHubError(f"GitHub API error {response.status_code} for {path}")
        return response

    async def get_user(self, username: str) -> GitHubUser:
        response = await self._get(f"/users/{username}")
        return _user_from_json(response.json())

    async def get_repos(self, username: str) -> list[GitHubRepo]:
        repos: list[GitHubRepo] = []
        page = 1
        while len(repos) < self.settings.max_repos_fetched:
            response = await self._get(
                f"/users/{username}/repos",
                params={"per_page": self.settings.repos_page_size, "page": page},
            )
            data = response.json()
            if not isinstance(data, list) or not data:
                break
            repos.extend(_repo_from_json(item) for item in data)
            if len(data) < self.settings.repos_page_size:
                break
            page += 1
        return repos[: self.settings.max_repos_fetched]

    async def get_commit_activity(self, owner: str, repo: str) -> list[CommitWeek]:
        path = f"/repos/{owner}/{repo}/stats/commit_activity"
        response = await self._get(path)
        if response.status_code == 202:
            await asyncio.sleep(1.5)
            response = await self._get(path)
            if response.status_code == 202:
                return []
        data = response.json()
        if not isinstance(data, list):
            return []
        return [
            CommitWeek(
                week=item.get("week", 0),
                total=item.get("total", 0),
                days=item.get("days", [0] * 7),
            )
            for item in data
        ]

    async def has_readme(self, owner: str, repo: str) -> bool:
        try:
            await self._get(f"/repos/{owner}/{repo}/readme")
            return True
        except GitHubNotFound:
            return False


def _user_from_json(data: dict[str, Any]) -> GitHubUser:
    return GitHubUser(
        login=data.get("login", ""),
        name=data.get("name"),
        avatar_url=data.get("avatar_url", ""),
        html_url=data.get("html_url", ""),
        bio=data.get("bio"),
        location=data.get("location"),
        company=data.get("company"),
        blog=data.get("blog"),
        email=data.get("email"),
        twitter_username=data.get("twitter_username"),
        followers=data.get("followers", 0),
        following=data.get("following", 0),
        public_repos=data.get("public_repos", 0),
        public_gists=data.get("public_gists", 0),
        created_at=_parse_datetime(data.get("created_at")),
    )


def _repo_from_json(data: dict[str, Any]) -> GitHubRepo:
    owner = data.get("owner") or {}
    return GitHubRepo(
        id=data.get("id", 0),
        name=data.get("name", ""),
        full_name=data.get("full_name", ""),
        owner_login=owner.get("login", ""),
        html_url=data.get("html_url", ""),
        description=data.get("description"),
        language=data.get("language"),
        stargazers_count=data.get("stargazers_count", 0),
        forks_count=data.get("forks_count", 0),
        open_issues_count=data.get("open_issues_count", 0),
        size_kb=data.get("size", 0),
        default_branch=data.get("default_branch", "main"),
        license_spdx=(data.get("license") or {}).get("spdx_id"),
        topics=data.get("topics", []),
        has_pages=data.get("has_pages", False),
        is_fork=data.get("fork", False),
        is_archived=data.get("archived", False),
        is_template=data.get("is_template", False),
        created_at=_parse_datetime(data.get("created_at")),
        pushed_at=_parse_datetime(data.get("pushed_at")),
    )


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
