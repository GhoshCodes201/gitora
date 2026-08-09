from app.analysis.score import (
    activity_score,
    build_score,
    collaboration_score,
    consistency_score,
    quality_score,
    score_label,
)


def test_activity_score_caps_and_explanation():
    score, explanation = activity_score(commits=2000, repos=10, stars=100, forks=50, issues=20)
    assert 0 <= score <= 100
    assert "2000 commits" in explanation


def test_consistency_high_activity():
    score, _ = consistency_score(active_weeks=52, current_streak=30, longest_streak=60, active_months=12)
    assert score >= 90


def test_collaboration_explanation_notes_token_requirement():
    _, explanation = collaboration_score(open_issues=10, forks_received=5, forked_repos=2)
    assert "token" in explanation


def test_quality_score():
    score, _ = quality_score(80.0)
    assert score == 80


def test_weighted_total_matches_spec():
    score = build_score(
        commits=500,
        repos_count=18,
        stars=50,
        forks=30,
        open_issues=25,
        active_weeks=30,
        current_streak=14,
        longest_streak=31,
        active_months=9,
        forked_repos=2,
        average_quality=75.0,
        public_repos=18,
        total_stars=50,
    )
    weights = {component.key: component.weight for component in score.components}
    assert weights == {
        "activity": 0.20,
        "consistency": 0.25,
        "collaboration": 0.20,
        "quality": 0.20,
        "opensource": 0.15,
    }
    assert score.total == round(sum(c.score * c.weight for c in score.components))
    assert 0 <= score.total <= 100
    assert "Gitora" in score.disclaimer
    assert score.label == score_label(score.total)


def test_collaboration_marked_partial():
    score = build_score(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0, 0, 0)
    collaboration = next(c for c in score.components if c.key == "collaboration")
    opensource = next(c for c in score.components if c.key == "opensource")
    assert collaboration.partial is True
    assert opensource.partial is True


def test_score_labels():
    assert score_label(90) == "Exceptional Developer"
    assert score_label(82) == "Strong Developer"
    assert score_label(55) == "Active Developer"
    assert score_label(35) == "Early Stage"
    assert score_label(10) == "Just Starting"
