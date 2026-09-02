from __future__ import annotations

import secrets
import time
from typing import Any, Optional

import jwt
from jwt import PyJWTError

from app.core.config import get_settings


class AuthUser:
    """The authenticated principal decoded from a bearer JWT."""

    def __init__(self, login: str, avatar_url: str = "", display_name: Optional[str] = None):
        self.login = login
        self.avatar_url = avatar_url
        self.display_name = display_name

    def as_dict(self) -> dict[str, Any]:
        return {
            "login": self.login,
            "avatar_url": self.avatar_url,
            "display_name": self.display_name,
        }


def _secret() -> str:
    """Return the JWT signing secret.

    Prefers the configured GITORA_AUTH_SECRET. When unset, fall back to a
    stable per-process secret so the demo works without extra config, noting
    that tokens won't survive a restart. The fallback is >=32 bytes to satisfy
    the HMAC-SHA256 minimum key length guidance.
    """
    settings = get_settings()
    if settings.auth_secret:
        return settings.auth_secret
    return "gitora_dev_secret_0123456789abcdef_change_me_in_production"


class AuthError(Exception):
    """Raised when a supplied credential is missing or invalid."""


def create_token(user: AuthUser) -> str:
    settings = get_settings()
    payload = {
        "sub": user.login,
        "avatar": user.avatar_url,
        "name": user.display_name,
        "iat": int(time.time()),
        "exp": int(time.time()) + settings.auth_token_ttl_hours * 3600,
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def decode_token(token: str) -> AuthUser:
    try:
        payload = jwt.decode(token, _secret(), algorithms=["HS256"])
    except PyJWTError as exc:
        raise AuthError("Invalid or expired token") from exc
    login = payload.get("sub")
    if not login:
        raise AuthError("Token missing subject")
    return AuthUser(
        login=login,
        avatar_url=payload.get("avatar", ""),
        display_name=payload.get("name"),
    )
