from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.github.sanitize import normalize_days


def _non_negative(value: Optional[int]) -> int:
    if value is None:
        return 0
    try:
        return max(int(value), 0)
    except (TypeError, ValueError):
        return 0


class GitHubUser(BaseModel):
    login: str
    name: Optional[str] = None
    avatar_url: str = ""
    html_url: str = ""
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    blog: Optional[str] = None
    email: Optional[str] = None
    twitter_username: Optional[str] = None
    followers: int = 0
    following: int = 0
    public_repos: int = 0
    public_gists: int = 0
    created_at: Optional[datetime] = None


class GitHubRepo(BaseModel):
    id: int = 0
    name: str
    full_name: str = ""
    owner_login: str = ""
    html_url: str = ""
    description: Optional[str] = None
    language: Optional[str] = None
    stargazers_count: int = 0
    forks_count: int = 0
    open_issues_count: int = 0
    size_kb: int = 0
    default_branch: str = "main"
    license_spdx: Optional[str] = None
    topics: list[str] = Field(default_factory=list)
    has_pages: bool = False
    is_fork: bool = False
    is_archived: bool = False
    is_template: bool = False
    created_at: Optional[datetime] = None
    pushed_at: Optional[datetime] = None

    @field_validator("stargazers_count", "forks_count", "open_issues_count", "size_kb")
    @classmethod
    def _sanitize_counts(cls, value: Optional[int]) -> int:
        return _non_negative(value)

    @field_validator("topics")
    @classmethod
    def _sanitize_topics(cls, value: Optional[list]) -> list[str]:
        if not isinstance(value, (list, tuple)):
            return []
        return [str(topic) for topic in value if topic]


class CommitWeek(BaseModel):
    week: int
    total: int = 0
    days: list[int] = Field(default_factory=lambda: [0] * 7)

    @field_validator("week")
    @classmethod
    def _sanitize_week(cls, value: Optional[int]) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return 0

    @field_validator("total")
    @classmethod
    def _sanitize_total(cls, value: Optional[int]) -> int:
        return _non_negative(value)

    @field_validator("days")
    @classmethod
    def _sanitize_days(cls, value) -> list[int]:
        return normalize_days(value)


class CommitInfo(BaseModel):
    sha: str = ""
    date: Optional[datetime] = None
    message: str = ""


class RepoAnalysis(BaseModel):
    repo: GitHubRepo
    has_readme: bool = False
    weekly: list[CommitWeek] = Field(default_factory=list)
    personal_weekly: list[CommitWeek] = Field(default_factory=list)
    personal_commits: list[CommitInfo] = Field(default_factory=list)
    personal_complete: bool = True
    stats_complete: bool = True
    total_commits: int = 0
