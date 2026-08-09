from app.analysis.achievements import evaluate_achievements


def test_commit_machine():
    earned = evaluate_achievements(
        total_commits=600,
        longest_streak=5,
        repos_count=3,
        language_count=2,
        growth_pct=0,
        weekend_pct=0,
        forked_repos=0,
    )
    assert any(item.id == "commit-machine" for item in earned)


def test_polyglot_and_builder():
    earned = evaluate_achievements(
        total_commits=100,
        longest_streak=5,
        repos_count=12,
        language_count=6,
        growth_pct=0,
        weekend_pct=0,
        forked_repos=0,
    )
    ids = {item.id for item in earned}
    assert {"polyglot", "builder"} <= ids


def test_rising_developer():
    earned = evaluate_achievements(
        total_commits=100,
        longest_streak=5,
        repos_count=2,
        language_count=2,
        growth_pct=40,
        weekend_pct=10,
        forked_repos=0,
    )
    assert any(item.id == "rising-developer" for item in earned)


def test_open_source_explorer():
    earned = evaluate_achievements(
        total_commits=0,
        longest_streak=0,
        repos_count=1,
        language_count=1,
        growth_pct=0,
        weekend_pct=0,
        forked_repos=3,
    )
    assert any(item.id == "open-source-explorer" for item in earned)


def test_none_for_inactive():
    assert evaluate_achievements(0, 0, 0, 0, 0, 0, 0) == []
