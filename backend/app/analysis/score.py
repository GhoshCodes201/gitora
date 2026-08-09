from __future__ import annotations

from app.schemas import ScoreComponentOut, ScoreOut

DISCLAIMER = (
    "Gitora Score is a custom metric created by Gitora based on public GitHub data. "
    "It is not affiliated with or endorsed by GitHub, and is a rough estimate, not an official rating."
)


def _scale(value: int | float, cap: int | float) -> float:
    return min(100.0, float(value) / float(cap) * 100.0)


def activity_score(commits: int, repos: int, stars: int, forks: int, issues: int) -> tuple[int, str]:
    commit = _scale(commits, 1000)
    repo = _scale(repos, 50)
    star_fork = _scale(stars + forks, 200)
    issue = _scale(issues, 50)
    score = round(0.5 * commit + 0.2 * repo + 0.2 * star_fork + 0.1 * issue)
    explanation = (
        f"Activity considers {commits} commits, {repos} repositories, "
        f"{stars + forks} stars/forks and {issues} open issues."
    )
    return score, explanation


def consistency_score(active_weeks: int, current_streak: int, longest_streak: int, active_months: int) -> tuple[int, str]:
    weekly = _scale(active_weeks, 52)
    current = _scale(current_streak, 30)
    longest = _scale(longest_streak, 60)
    monthly = _scale(active_months, 12)
    score = round(0.4 * weekly + 0.3 * current + 0.15 * longest + 0.15 * monthly)
    explanation = (
        f"Consistency measures {active_weeks}/52 active weeks, a current "
        f"{current_streak}-day streak, a longest {longest_streak}-day streak "
        f"across {active_months} active months."
    )
    return score, explanation


def collaboration_score(open_issues: int, forks_received: int, forked_repos: int) -> tuple[int, str]:
    issue = _scale(open_issues, 50)
    forks = _scale(forks_received, 100)
    external = _scale(forked_repos, 10)
    score = round(0.5 * issue + 0.3 * forks + 0.2 * external)
    explanation = (
        f"Collaboration estimates community engagement from {open_issues} open issues, "
        f"{forks_received} forks and {forked_repos} forked repositories. "
        "PR and review activity need a GitHub token."
    )
    return score, explanation


def quality_score(average_quality: float) -> tuple[int, str]:
    score = round(average_quality)
    explanation = (
        "Project quality averages documentation (READMEs, licenses, descriptions), "
        "community interest (stars/forks) and maintenance recency across analyzed repositories."
    )
    return score, explanation


def opensource_score(public_repos: int, forked_repos: int, total_stars: int) -> tuple[int, str]:
    public = _scale(public_repos, 20)
    forks = _scale(forked_repos, 10)
    stars = _scale(total_stars, 300)
    score = round(0.4 * public + 0.4 * forks + 0.2 * stars)
    explanation = (
        f"Open source measures {public_repos} public repositories, {forked_repos} forks of external "
        f"projects and {total_stars} total stars. External pull-request data needs a GitHub token."
    )
    return score, explanation


def score_label(total: int) -> str:
    if total >= 85:
        return "Exceptional Developer"
    if total >= 70:
        return "Strong Developer"
    if total >= 50:
        return "Active Developer"
    if total >= 30:
        return "Early Stage"
    return "Just Starting"


def build_score(
    commits: int,
    repos_count: int,
    stars: int,
    forks: int,
    open_issues: int,
    active_weeks: int,
    current_streak: int,
    longest_streak: int,
    active_months: int,
    forked_repos: int,
    average_quality: float,
    public_repos: int,
    total_stars: int,
    partial: bool = True,
) -> ScoreOut:
    activity, activity_expl = activity_score(commits, repos_count, stars, forks, open_issues)
    consistency, consistency_expl = consistency_score(active_weeks, current_streak, longest_streak, active_months)
    collaboration, collaboration_expl = collaboration_score(open_issues, forks, forked_repos)
    quality, quality_expl = quality_score(average_quality)
    opensource, opensource_expl = opensource_score(public_repos, forked_repos, total_stars)

    components = [
        ScoreComponentOut(key="activity", label="Activity", score=activity, weight=0.20, partial=False, explanation=activity_expl),
        ScoreComponentOut(key="consistency", label="Consistency", score=consistency, weight=0.25, partial=False, explanation=consistency_expl),
        ScoreComponentOut(key="collaboration", label="Collaboration", score=collaboration, weight=0.20, partial=partial, explanation=collaboration_expl),
        ScoreComponentOut(key="quality", label="Project Quality", score=quality, weight=0.20, partial=False, explanation=quality_expl),
        ScoreComponentOut(key="opensource", label="Open Source", score=opensource, weight=0.15, partial=partial, explanation=opensource_expl),
    ]
    total = round(sum(component.score * component.weight for component in components))
    return ScoreOut(total=total, label=score_label(total), disclaimer=DISCLAIMER, components=components)
