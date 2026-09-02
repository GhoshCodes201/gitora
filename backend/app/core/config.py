from __future__ import annotations

from functools import lru_cache
from urllib.parse import urlparse

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_GITHUB_API_HOSTS = ("api.github.com", "github.com")
_LOCAL_HOSTS = ("localhost", "127.0.0.1", "::1")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="GITORA_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    github_api_base: str = "https://api.github.com"
    github_token: str = ""
    allow_custom_github_api_base: bool = False
    environment: str = "production"
    request_timeout: float = 15.0
    max_repos_fetched: int = 300
    repos_page_size: int = 100
    repo_stats_budget: int = 10
    request_budget: int = 45
    personal_commits_max_pages: int = 3
    cache_ttl_hours: float = 6.0
    db_path: str = "data/gitora.db"
    static_dir: str = "../frontend/dist"
    cors_origins: str = "https://gitora.onrender.com"
    api_rate_limit: int = 10
    api_rate_window_seconds: int = 600
    api_global_daily_limit: int = 200

    auth_required: bool = False
    github_client_id: str = ""
    github_client_secret: str = ""
    auth_secret: str = ""
    auth_redirect_uri: str = ""
    auth_token_ttl_hours: int = 72
    auth_base_url: str = "https://github.com"
    auth_api_base: str = "https://api.github.com"

    @model_validator(mode="after")
    def _validate_github_api_base(self) -> "Settings":
        """Block SSRF: only https to GitHub hosts unless explicitly allowed.

        The app interpolates user-controlled paths after this base URL, so a
        misconfigured base (e.g. an internal address) would turn the service
        into an open proxy. Enforce https + GitHub-only hosts by default.
        """
        parsed = urlparse(self.github_api_base)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("github_api_base must use http or https")
        host = (parsed.hostname or "").lower()
        if parsed.scheme != "https" and host not in _LOCAL_HOSTS:
            raise ValueError("github_api_base must use https outside localhost")
        if not self.allow_custom_github_api_base:
            if host not in _GITHUB_API_HOSTS and not host.endswith(".github.com"):
                raise ValueError(
                    "github_api_base must point at a GitHub host "
                    "(set GITORA_ALLOW_CUSTOM_GITHUB_API_BASE=true to allow custom hosts)"
                )
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
