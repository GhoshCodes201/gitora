from __future__ import annotations

from app.schemas import AchievementOut


def evaluate_achievements(
    total_commits: int,
    longest_streak: int,
    repos_count: int,
    language_count: int,
    growth_pct: float,
    weekend_pct: float,
    forked_repos: int,
) -> list[AchievementOut]:
    achievements: list[AchievementOut] = []
    if total_commits >= 500:
        achievements.append(
            AchievementOut(
                id="commit-machine",
                name="Commit Machine",
                description=f"500+ commits on GitHub ({total_commits} total).",
                icon="Flame",
            )
        )
    if longest_streak >= 30:
        achievements.append(
            AchievementOut(
                id="consistent-coder",
                name="Consistent Coder",
                description=f"Reached a {longest_streak}-day contribution streak.",
                icon="CalendarCheck",
            )
        )
    if weekend_pct >= 20 and total_commits >= 50:
        achievements.append(
            AchievementOut(
                id="weekend-warrior",
                name="Weekend Warrior",
                description=f"{weekend_pct}% of commits happen on weekends.",
                icon="Coffee",
            )
        )
    if language_count >= 5:
        achievements.append(
            AchievementOut(
                id="polyglot",
                name="Polyglot",
                description=f"Codes in {language_count}+ programming languages.",
                icon="Languages",
            )
        )
    if repos_count >= 10:
        achievements.append(
            AchievementOut(
                id="builder",
                name="Builder",
                description=f"Maintains {repos_count} repositories.",
                icon="Hammer",
            )
        )
    if growth_pct >= 25:
        achievements.append(
            AchievementOut(
                id="rising-developer",
                name="Rising Developer",
                description=f"Recent activity grew {growth_pct:+.1f}%.",
                icon="Rocket",
            )
        )
    if forked_repos >= 2:
        achievements.append(
            AchievementOut(
                id="open-source-explorer",
                name="Open Source Explorer",
                description=f"Has forked {forked_repos} external repositories.",
                icon="Globe",
            )
        )
    return achievements
