from __future__ import annotations

import time
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.auth import oauth
from app.auth.deps import get_current_user
from app.auth.jwt import AuthUser, create_token
from app.core.config import get_settings
from app.db.users import UserStore

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

_user_store: UserStore | None = None
_pending_states: dict[str, float] = {}
_STATE_TTL_SECONDS = 600


def get_user_store() -> UserStore:
    global _user_store
    if _user_store is None:
        _user_store = UserStore(get_settings().db_path)
    return _user_store


@router.get("/login")
async def login() -> RedirectResponse:
    """Redirect the browser to GitHub's OAuth consent screen."""
    if not oauth.is_oauth_configured():
        raise HTTPException(status_code=503, detail="GitHub OAuth is not configured")
    state = oauth.generate_state()
    _pending_states[state] = time.time()
    return RedirectResponse(oauth.login_url(state), status_code=302)


def _verify_state(state: str) -> bool:
    """One-time consumption of a pending OAuth state token (CSRF protection)."""
    now = time.time()
    for s in list(_pending_states):
        if now - _pending_states[s] > _STATE_TTL_SECONDS:
            del _pending_states[s]
    if state not in _pending_states:
        return False
    del _pending_states[state]
    return True


@router.get("/callback")
async def callback(code: str, state: str, request: Request) -> RedirectResponse:
    """Handle GitHub's OAuth redirect, exchange code, and issue a JWT."""
    if not oauth.is_oauth_configured():
        raise HTTPException(status_code=503, detail="GitHub OAuth is not configured")
    if not _verify_state(state):
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    token_data = await oauth.exchange_code(code)
    access_token = token_data["access_token"]
    provider_user = await oauth.fetch_provider_user(access_token)

    login = provider_user.get("login")
    if not login:
        raise HTTPException(status_code=502, detail="GitHub did not return a username")

    avatar_url = provider_user.get("avatar_url", "") or ""
    display_name = provider_user.get("name")

    store = get_user_store()
    store.upsert(
        login=login,
        avatar_url=avatar_url,
        display_name=display_name,
        github_token=access_token,
    )

    user = AuthUser(login=login, avatar_url=avatar_url, display_name=display_name)
    token = create_token(user)

    frontend_origin = request.base_url.replace(path="", query="", fragment="").rstrip("/")
    params = urlencode({"token": token, "login": login})
    return RedirectResponse(f"{frontend_origin}/#/auth/callback?{params}", status_code=302)


@router.get("/me")
async def me(user: AuthUser = Depends(get_current_user)) -> dict:
    return user.as_dict()


@router.post("/logout")
async def logout() -> dict:
    """Stateless JWTs are discarded client-side; nothing to revoke server-side."""
    return {"ok": True, "logout": True}
