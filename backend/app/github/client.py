from __future__ import annotations

import asyncio
import json
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx

from app.core.config import Settings, get_settings
from app.github.models import CommitWeek, GitHubRepo, GitHubUser
from app.github.sanitize import (
    normalize_days,
    parse_date,
    to_int,
    to_int_or_none,
    to_str,
    valid_week,
)


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
    All upstream data passes through the sanitize helpers before it enters a
    model, so null/oddly-shaped responses degrade instead of crashing.
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

    def _json(self, response: httpx.Response) -> Any:
        """Decode JSON, converting transport garbage into a handled GitHubError."""
        try:
            return response.json()
        except (json.JSONDecodeError, ValueError):
            raise GitHubError(f"Invalid JSON from GitHub API for {response.request.url}") from None

    async def _get(self, path: str, params: Optional[dict[str, Any]] = None) -> httpx.Response:
        if self.budget is not None and self.requests_used >= self.budget:
            raise GitHubBudgetExhausted()
        async with self._semaphore:
            try:
                response = await self._client.get(path, params=params)
            except httpx.RequestError as exc:
                raise GitHubError(f"GitHub API request failed for {path}: {exc}") from exc
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
        data = self._json(response)
        if not isinstance(data, dict):
            raise GitHubError("Unexpected response shape for GitHub user")
        return _user_from_json(data)

    async def get_repos(self, username: str) -> list[GitHubRepo]:
        repos: list[GitHubRepo] = []
        page = 1
        while len(repos) < self.settings.max_repos_fetched:
            response = await self._get(
                f"/users/{username}/repos",
                params={"per_page": self.settings.repos_page_size, "page": page},
            )
            data = self._json(response)
            if not isinstance(data, list) or not data:
                break
            repos.extend(_repo_from_json(item) for item in data if isinstance(item, dict))
            if len(data) < self.settings.repos_page_size:
                break
            page += 1
        return repos[: self.settings.max_repos_fetched]

    async def get_commit_activity(self, owner: str, repo: str) -> tuple[list[CommitWeek], bool]:
        """Repo-wide weekly activity.

        Returns (weeks, complete). GitHub's stats endpoint can return 202 while
        it compiles statistics; after one retry we bail out and report the repo
        as incomplete rather than silently treating it as empty.
        """
        path = f"/repos/{owner}/{repo}/stats/commit_activity"
        response = await self._get(path)
        if response.status_code == 202:
            await asyncio.sleep(1.5)
            response = await self._get(path)
            if response.status_code == 202:
                return [], False
        data = self._json(response)
        if not isinstance(data, list):
            return [], False
        weeks: list[CommitWeek] = []
        for item in data:
            if not isinstance(item, dict):
                continue
            week = _commit_week_from_json(item)
            if week is not None:
                weeks.append(week)
        return weeks, True

    async def has_readme(self, owner: str, repo: str) -> bool:
        try:
            await self._get(f"/repos/{owner}/{repo}/readme")
            return True
        except GitHubNotFound:
            return False

    async def get_personal_commits(
        self, owner: str, repo: str, username: str
    ) -> tuple[list[CommitWeek], bool]:
        """Weekly series of the user's commits on the default branch.

        Returns (weeks, complete). Pagination stops once the per-repo page cap
        is reached (or the request budget runs out), reporting complete=False
        so the caller can flag the stats as partial.
        """
        days_by_week: dict[int, list[int]] = {}
        page = 1
        complete = True
        try:
            while True:
                response = await self._get(
                    f"/repos/{owner}/{repo}/commits",
                    params={"author": username, "per_page": 100, "page": page},
                )
                data = self._json(response)
                if not isinstance(data, list) or not data:
                    break
                for item in data:
                    if not isinstance(item, dict):
                        continue
                    committer = (item.get("commit") or {})
                    if not isinstance(committer, dict):
                        continue
                    committer = committer.get("committer") or {}
                    if not isinstance(committer, dict):
                        continue
                    date = parse_date(committer.get("date"))
                    if date is None:
                        continue
                    date = date.astimezone(timezone.utc)
                    week_start = date - timedelta(days=date.weekday())
                    week_ts = int(
                        week_start.replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
                    )
                    if not valid_week(week_ts):
                        continue
                    bucket = days_by_week.setdefault(week_ts, [0] * 7)
                    bucket[date.weekday()] += 1
                if len(data) < 100:
                    break
                if page >= self.settings.personal_commits_max_pages:
                    complete = False
                    break
                page += 1
        except GitHubBudgetExhausted:
            complete = False
        except GitHubNotFound:
            return [], True
        weeks = [
            CommitWeek(week=week_ts, total=sum(days), days=days)
            for week_ts, days in sorted(days_by_week.items())
            if valid_week(week_ts)
        ]
        return weeks, complete


def _commit_week_from_json(data: dict[str, Any]) -> Optional[CommitWeek]:
    """Build a CommitWeek from raw JSON, skipping invalid weeks entirely."""
    week = to_int_or_none(data.get("week"))
    if week is None or not valid_week(week):
        return None
    return CommitWeek(
        week=week,
        total=to_int(data.get("total")),
        days=normalize_days(data.get("days")),
    )


def _user_from_json(data: dict[str, Any]) -> GitHubUser:
    return GitHubUser(
        login=to_str(data.get("login")),
        name=data.get("name") or None,
        avatar_url=to_str(data.get("avatar_url")),
        html_url=to_str(data.get("html_url")),
        bio=data.get("bio") or None,
        location=data.get("location") or None,
        company=data.get("company") or None,
        blog=data.get("blog") or None,
        email=data.get("email") or None,
        twitter_username=data.get("twitter_username") or None,
        followers=to_int(data.get("followers")),
        following=to_int(data.get("following")),
        public_repos=to_int(data.get("public_repos")),
        public_gists=to_int(data.get("public_gists")),
        created_at=parse_date(data.get("created_at")),
    )


def _repo_from_json(data: dict[str, Any]) -> GitHubRepo:
    owner = data.get("owner") or {}
    if not isinstance(owner, dict):
        owner = {}
    topics = data.get("topics") or []
    if not isinstance(topics, (list, tuple)):
        topics = []
    license_data = data.get("license")
    license_spdx = license_data.get("spdx_id") if isinstance(license_data, dict) else None
    return GitHubRepo(
        id=to_int(data.get("id")),
        name=to_str(data.get("name")),
        full_name=to_str(data.get("full_name")),
        owner_login=to_str(owner.get("login")),
        html_url=to_str(data.get("html_url")),
        description=data.get("description") or None,
        language=data.get("language") or None,
        stargazers_count=to_int(data.get("stargazers_count")),
        forks_count=to_int(data.get("forks_count")),
        open_issues_count=to_int(data.get("open_issues_count")),
        size_kb=to_int(data.get("size")),
        default_branch=to_str(data.get("default_branch"), "main"),
        license_spdx=license_spdx,
        topics=[to_str(topic) for topic in topics if topic],
        has_pages=bool(data.get("has_pages")),
        is_fork=bool(data.get("fork")),
        is_archived=bool(data.get("archived")),
        is_template=bool(data.get("is_template")),
        created_at=parse_date(data.get("created_at")),
        pushed_at=parse_date(data.get("pushed_at")),
    )
