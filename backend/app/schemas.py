from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class Profile(BaseModel):
    login: str
    name: Optional[str] = None
    avatar_url: str = ""
    github_url: str = ""
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    blog: Optional[str] = None
    followers: int = 0
    following: int = 0
    public_repos: int = 0
    public_gists: int = 0
    member_since: Optional[str] = None


class ScoreComponentOut(BaseModel):
    key: str
    label: str
    score: int
    weight: float
    partial: bool
    explanation: str


class ScoreOut(BaseModel):
    total: int
    label: str
    disclaimer: str
    components: list[ScoreComponentOut]


class LanguageOut(BaseModel):
    name: str
    percentage: float


class HeatmapWeek(BaseModel):
    week: int
    total: int
    days: list[int]


class MonthOut(BaseModel):
    month: str
    commits: int


class SummaryOut(BaseModel):
    total_commits: int = 0
    active_weeks: int = 0
    current_streak_days: int = 0
    longest_streak_days: int = 0
    total_stars: int = 0
    total_forks: int = 0
    open_issues: int = 0
    public_repos: int = 0
    forked_repos: int = 0
    language_count: int = 0
    top_languages: list[str] = Field(default_factory=list)
    languages: list[LanguageOut] = Field(default_factory=list)


class RepoOut(BaseModel):
    name: str
    full_name: str = ""
    url: str = ""
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int = 0
    forks: int = 0
    size_kb: int = 0
    open_issues: int = 0
    license_spdx: Optional[str] = None
    topics: list[str] = Field(default_factory=list)
    has_readme: bool = False
    is_fork: bool = False
    is_archived: bool = False
    pushed_at: Optional[str] = None
    total_commits: Optional[int] = None
    stats_complete: bool = False
    weekly: list[HeatmapWeek] = Field(default_factory=list)


class AchievementOut(BaseModel):
    id: str
    name: str
    description: str
    icon: str


class MetaOut(BaseModel):
    generated_at: str
    cache_hit: bool = False
    stale: bool = False
    warning: Optional[str] = None
    partial_components: list[str] = Field(default_factory=list)
    requests_used: int = 0
    rate_limit_remaining: Optional[int] = None
    rate_limit_reset: Optional[int] = None


class GitoraAnalysis(BaseModel):
    username: str
    profile: Profile
    score: ScoreOut
    summary: SummaryOut
    heatmap: list[HeatmapWeek] = Field(default_factory=list)
    monthly: list[MonthOut] = Field(default_factory=list)
    growth_trend_pct: float = 0.0
    weekend_ratio_pct: float = 0.0
    repositories: list[RepoOut] = Field(default_factory=list)
    achievements: list[AchievementOut] = Field(default_factory=list)
    meta: MetaOut
