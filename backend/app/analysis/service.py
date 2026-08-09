from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Callable, Optional

from fastapi import HTTPException

from app.analysis.achievements import evaluate_achievements
from app.analysis.metrics import (
    active_weeks,
    average_repo_quality,
    compute_streaks,
    growth_trend,
    language_distribution,
    merge_weekly,
    monthly_breakdown,
    total_commits,
    weekend_ratio,
)
from app.analysis.score import build_score
from app.core.config import Settings
from app.db.cache import CacheStore
from app.github.client import GitHubClient, GitHubNotFound, GitHubRateLimited
from app.github.models import GitHubRepo, GitHubUser, RepoAnalysis
from app.schemas import (
    GitoraAnalysis,
    HeatmapWeek,
    MetaOut,
    MonthOut,
    Profile,
    RepoOut,
    SummaryOut,
)

ClientFactory = Callable[[Settings], GitHubClient]


def _default_client_factory(settings: Settings) -> GitHubClient:
    return GitHubClient(settings=settings, budget=settings.request_budget)


def _select_stats_repos(repos: list[GitHubRepo], budget: int) -> list[GitHubRepo]:
    def rank(repo: GitHubRepo) -> float:
        recency = 0.0
        if repo.pushed_at:
            pushed = repo.pushed_at
            if pushed.tzinfo is None:
                pushed = pushed.replace(tzinfo=timezone.utc)
            days = max(0, (datetime.now(timezone.utc) - pushed).days)
            recency = max(0.0, 1.0 - days / 365.0)
        return repo.stargazers_count + repo.forks_count + recency * 10.0

    return sorted(repos, key=rank, reverse=True)[:budget]


class AnalysisService:
    def __init__(
        self,
        cache: Optional[CacheStore] = None,
        settings: Optional[Settings] = None,
        client_factory: Optional[ClientFactory] = None,
    ):
        self.settings = settings or Settings()
        self.cache = cache or CacheStore(self.settings.db_path)
        self._client_factory = client_factory or _default_client_factory

    async def analyze(self, username: str, force: bool = False) -> GitoraAnalysis:
        username = username.strip().lstrip("@")
        if not username:
            raise HTTPException(status_code=422, detail="Username is required")

        if not force:
            cached = self.cache.get(username)
            if cached:
                cached["meta"]["cache_hit"] = True
                return GitoraAnalysis(**cached)

        client = self._client_factory(self.settings)
        try:
            user = await client.get_user(username)
            repos = await client.get_repos(username)
            targets = _select_stats_repos(repos, self.settings.repo_stats_budget)
            repo_analyses = list(await asyncio.gather(*(self._analyze_repo(client, repo) for repo in targets)))
        except GitHubNotFound:
            raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found")
        except GitHubRateLimited as exc:
            stale = self.cache.get(username, ignore_ttl=True)
            if stale:
                stale["meta"]["cache_hit"] = True
                stale["meta"]["stale"] = True
                stale["meta"]["warning"] = f"GitHub rate limit reached; showing cached data (resets at {exc.reset_at} UTC)."
                return GitoraAnalysis(**stale)
            raise HTTPException(status_code=429, detail="GitHub API rate limit reached. Try again later.")
        finally:
            await client.close()

        analysis = self._build_analysis(username, user, repos, repo_analyses, client)
        self.cache.put(username, analysis.model_dump(mode="json"))
        return analysis

    async def _analyze_repo(self, client: GitHubClient, repo: GitHubRepo) -> RepoAnalysis:
        weekly = await client.get_commit_activity(repo.owner_login, repo.name)
        has_readme = await client.has_readme(repo.owner_login, repo.name)
        return RepoAnalysis(
            repo=repo,
            has_readme=has_readme,
            weekly=weekly,
            total_commits=sum(week.total for week in weekly),
        )

    def _build_analysis(
        self,
        username: str,
        user: GitHubUser,
        repos: list[GitHubRepo],
        repo_analyses: list[RepoAnalysis],
        client: GitHubClient,
    ) -> GitoraAnalysis:
        series = merge_weekly([a.weekly for a in repo_analyses])
        current_streak, longest_streak = compute_streaks(series)
        languages = language_distribution(repos)
        months = monthly_breakdown(series)
        growth = growth_trend(series)
        weekend = weekend_ratio(series)
        now = datetime.now(timezone.utc)

        total_stars = sum(repo.stargazers_count for repo in repos)
        total_forks = sum(repo.forks_count for repo in repos)
        open_issues = sum(repo.open_issues_count for repo in repos)
        forked_repos = sum(1 for repo in repos if repo.is_fork)
        commits = total_commits(series)

        partial_components: list[str] = []
        if not repo_analyses or len(repo_analyses) < len(repos):
            partial_components.append("activity")
            partial_components.append("consistency")

        score = build_score(
            commits=commits,
            repos_count=len(repos),
            stars=total_stars,
            forks=total_forks,
            open_issues=open_issues,
            active_weeks=active_weeks(series),
            current_streak=current_streak,
            longest_streak=longest_streak,
            active_months=len(months),
            forked_repos=forked_repos,
            average_quality=average_repo_quality(repo_analyses, now),
            public_repos=user.public_repos,
            total_stars=total_stars,
            partial=True,
        )

        summary = SummaryOut(
            total_commits=commits,
            active_weeks=active_weeks(series),
            current_streak_days=current_streak,
            longest_streak_days=longest_streak,
            total_stars=total_stars,
            total_forks=total_forks,
            open_issues=open_issues,
            public_repos=user.public_repos,
            forked_repos=forked_repos,
            language_count=len(languages),
            top_languages=[item["name"] for item in languages[:4]],
            languages=[{"name": item["name"], "percentage": item["percentage"]} for item in languages],
        )

        repositories = self._build_repo_outputs(repos, repo_analyses)
        achievements = evaluate_achievements(
            total_commits=commits,
            longest_streak=longest_streak,
            repos_count=len(repos),
            language_count=len(languages),
            growth_pct=growth,
            weekend_pct=weekend,
            forked_repos=forked_repos,
        )

        meta = MetaOut(
            generated_at=now.isoformat(),
            partial_components=partial_components,
            requests_used=client.requests_used,
            rate_limit_remaining=client.rate_limit_remaining,
            rate_limit_reset=client.rate_limit_reset,
        )

        return GitoraAnalysis(
            username=username,
            profile=Profile(
                login=user.login,
                name=user.name,
                avatar_url=user.avatar_url,
                github_url=user.html_url,
                bio=user.bio,
                location=user.location,
                company=user.company,
                blog=user.blog,
                followers=user.followers,
                following=user.following,
                public_repos=user.public_repos,
                public_gists=user.public_gists,
                member_since=user.created_at.isoformat() if user.created_at else None,
            ),
            score=score,
            summary=summary,
            heatmap=[HeatmapWeek(week=week.week, total=week.total, days=week.days) for week in series],
            monthly=[MonthOut(month=item["month"], commits=item["commits"]) for item in months],
            growth_trend_pct=growth,
            weekend_ratio_pct=weekend,
            repositories=repositories,
            achievements=achievements,
            meta=meta,
        )

    @staticmethod
    def _build_repo_outputs(repos: list[GitHubRepo], repo_analyses: list[RepoAnalysis]) -> list[RepoOut]:
        by_name = {analysis.repo.name: analysis for analysis in repo_analyses}
        outputs: list[RepoOut] = []
        for repo in sorted(repos, key=lambda repo: repo.stargazers_count, reverse=True):
            analysis = by_name.get(repo.name)
            weekly = analysis.weekly if analysis else []
            outputs.append(
                RepoOut(
                    name=repo.name,
                    full_name=repo.full_name,
                    url=repo.html_url,
                    description=repo.description,
                    language=repo.language,
                    stars=repo.stargazers_count,
                    forks=repo.forks_count,
                    size_kb=repo.size_kb,
                    open_issues=repo.open_issues_count,
                    license_spdx=repo.license_spdx,
                    topics=repo.topics,
                    has_readme=analysis.has_readme if analysis else False,
                    is_fork=repo.is_fork,
                    is_archived=repo.is_archived,
                    pushed_at=repo.pushed_at.isoformat() if repo.pushed_at else None,
                    total_commits=analysis.total_commits if analysis else None,
                    stats_complete=analysis is not None,
                    weekly=[HeatmapWeek(week=week.week, total=week.total, days=week.days) for week in weekly],
                )
            )
        return outputs
