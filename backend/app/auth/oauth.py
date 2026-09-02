from __future__ import annotations

import secrets
import urllib.parse
from typing import Optional

import httpx

from app.core.config import get_settings


class OAuthConfigError(Exception):
    """Raised when GitHub OAuth is not configured."""


class OAuthError(Exception):
    """Raised when the GitHub OAuth exchange fails."""


def is_oauth_configured() -> bool:
    settings = get_settings()
    return bool(settings.github_client_id and settings.github_client_secret)


def login_url(state: str) -> str:
    settings = get_settings()
    params = {
        "client_id": settings.github_client_id,
        "redirect_uri": callback_uri(),
        "scope": "read:user",  # minimal scope - only public profile
        "state": state,
    }
    return f"{settings.auth_base_url.rstrip('/')}/login/oauth/authorize?{urllib.parse.urlencode(params)}"


def callback_uri() -> str:
    settings = get_settings()
    if settings.auth_redirect_uri:
        return settings.auth_redirect_uri
    return ""  # frontend/request will supply it when configured


def generate_state() -> str:
    """Cryptographically random anti-CSRF state token for the OAuth flow."""
    return secrets.token_urlsafe(32)


async def exchange_code(code: str) -> dict:
    """Exchange an authorization code for a GitHub access token."""
    settings = get_settings()
    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        try:
            response = await client.post(
                f"{settings.auth_base_url.rstrip('/')}/login/oauth/access_token",
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
        except httpx.HTTPError as exc:
            raise OAuthError("Failed to reach GitHub during token exchange") from exc
    if response.status_code != 200:
        raise OAuthError(f"GitHub token exchange failed with status {response.status_code}")
    data = response.json()
    if "error" in data or "access_token" not in data:
        raise OAuthError(f"GitHub token exchange error: {data.get('error_description') or data.get('error')}")
    return data


async def fetch_provider_user(access_token: str) -> dict:
    """Fetch the authenticated GitHub user's public profile."""
    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        try:
            response = await client.get(
                f"{settings.auth_api_base.rstrip('/')}/user",
                headers=headers,
            )
        except httpx.HTTPError as exc:
            raise OAuthError("Failed to reach GitHub while fetching user") from exc
    if response.status_code != 200:
        raise OAuthError(f"GitHub user fetch failed with status {response.status_code}")
    return response.json()
