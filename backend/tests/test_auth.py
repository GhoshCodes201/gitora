from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.api.routes import get_service
from app.analysis.service import AnalysisService
from app.api.ratelimit import FixedWindowLimiter
from app.auth.jwt import AuthUser, create_token, decode_token
from app.core.config import Settings
from app.db.cache import CacheStore
from app.main import create_app


class FakeAuthClient:
    def __init__(self, *args, **kwargs):
        self.requests_used = 1
        self.rate_limit_remaining = 59
        self.rate_limit_reset = 0

    async def get_user(self, username):
        from app.github.models import GitHubUser
        return GitHubUser(login=username, name=username, avatar_url="", html_url=f"https://github.com/{username}")

    async def get_repos(self, username):
        return []

    async def get_commit_activity(self, owner, repo):
        return [], True

    async def get_personal_commits(self, owner, repo, username):
        return [], [], True

    async def has_readme(self, owner, repo):
        return False

    async def close(self):
        pass


def make_app(tmp_path, **settings_kwargs):
    settings = Settings(
        db_path=str(tmp_path / "gitora.db"),
        github_token="",
        environment="development",
        **settings_kwargs,
    )
    app = create_app()
    app.state.settings = settings
    app.state.rate_limiter = FixedWindowLimiter(10_000, 60)
    app.state.user_limiter = FixedWindowLimiter(10_000, 60)
    store = CacheStore(str(tmp_path / "gitora.db"))
    service = AnalysisService(cache=store, settings=settings, client_factory=lambda s: FakeAuthClient())
    app.dependency_overrides[get_service] = lambda: service
    return app


@pytest.fixture
def client(tmp_path):
    app = make_app(tmp_path)
    with TestClient(app) as test_client:
        yield test_client


def test_login_redirects_when_not_configured(client):
    resp = client.get("/api/v1/auth/login", follow_redirects=False)
    assert resp.status_code == 503


def test_me_without_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_with_valid_token(client):
    token = create_token(AuthUser(login="octocat", avatar_url="https://x/a.png", display_name="Octo"))
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["login"] == "octocat"
    assert body["display_name"] == "Octo"


def test_me_with_invalid_token(client):
    resp = client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer not.a.real.token"}
    )
    assert resp.status_code == 401


def test_analyze_public_by_default(client):
    resp = client.get("/api/v1/analyze/octocat")
    assert resp.status_code == 200


def test_analyze_requires_auth_when_configured(tmp_path):
    app = make_app(tmp_path, auth_required=True)
    with TestClient(app) as test_client:
        anon = test_client.get("/api/v1/analyze/octocat")
        assert anon.status_code == 401

        token = create_token(AuthUser(login="octocat"))
        authed = test_client.get(
            "/api/v1/analyze/octocat", headers={"Authorization": f"Bearer {token}"}
        )
        assert authed.status_code == 200


def test_analyze_per_user_rate_limit(tmp_path):
    app = make_app(tmp_path)
    app.state.user_limiter = FixedWindowLimiter(1, 600)
    with TestClient(app) as test_client:
        token = create_token(AuthUser(login="octocat"))
        headers = {"Authorization": f"Bearer {token}"}
        first = test_client.get("/api/v1/analyze/octocat", headers=headers)
        assert first.status_code == 200
        second = test_client.get("/api/v1/analyze/octocat", headers=headers)
        assert second.status_code == 429


def test_jwt_roundtrip():
    user = AuthUser(login="alice", avatar_url="https://x/a.png", display_name="Alice")
    token = create_token(user)
    decoded = decode_token(token)
    assert decoded.login == "alice"
    assert decoded.display_name == "Alice"


def test_jwt_requires_subject():
    import jwt as pyjwt
    from app.auth.jwt import AuthError, _secret

    bogus = pyjwt.encode({"iat": 1}, _secret(), algorithm="HS256")
    with pytest.raises(AuthError):
        decode_token(bogus)
