from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_default_api_base_is_github():
    settings = Settings()
    assert settings.github_api_base == "https://api.github.com"


@pytest.mark.parametrize(
    "url",
    [
        "http://169.254.169.254/latest/meta-data",
        "http://localhost:8080",
        "http://127.0.0.1",
        "https://example.com",
        "ftp://api.github.com",
        "https://internal.corp.local",
    ],
)
def test_ssrf_guard_rejects_non_github_bases(url):
    with pytest.raises(ValidationError):
        Settings(github_api_base=url)


def test_custom_host_allowed_when_explicitly_flagged():
    settings = Settings(
        github_api_base="http://127.0.0.1:8000",
        allow_custom_github_api_base=True,
    )
    assert settings.github_api_base == "http://127.0.0.1:8000"


@pytest.mark.parametrize(
    "url",
    [
        "https://api.github.com",
        "https://github.com",
        "https://gist.github.com",
    ],
)
def test_github_hosts_allowed(url):
    assert Settings(github_api_base=url).github_api_base == url
