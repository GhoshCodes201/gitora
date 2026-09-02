from __future__ import annotations

from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt import AuthError, AuthUser, decode_token

_bearer = HTTPBearer(auto_error=False)


def _credentials_error() -> HTTPException:
    return HTTPException(
        status_code=401,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> AuthUser:
    """Required-auth dependency: 401 if no valid bearer token is supplied."""
    if credentials is None:
        raise _credentials_error()
    try:
        return decode_token(credentials.credentials)
    except AuthError:
        raise _credentials_error()


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[AuthUser]:
    """Optional-auth dependency: returns the user or None for anonymous requests."""
    if credentials is None:
        return None
    try:
        return decode_token(credentials.credentials)
    except AuthError:
        # A present but invalid token should not silently downgrade to public
        # access in a way that bypasses required-auth. Callers decide how to
        # treat this; for optional mode we treat it as anonymous.
        return None
