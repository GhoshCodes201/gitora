from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="GITORA_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    github_api_base: str = "https://api.github.com"
    github_token: str = ""
    request_timeout: float = 15.0
    max_repos_fetched: int = 300
    repos_page_size: int = 100
    repo_stats_budget: int = 10
    request_budget: int = 45
    personal_commits_max_pages: int = 3
    cache_ttl_hours: float = 6.0
    db_path: str = "data/gitora.db"
    cors_origins: str = "*"
    api_rate_limit: int = 10
    api_rate_window_seconds: int = 600
    api_global_daily_limit: int = 200


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
