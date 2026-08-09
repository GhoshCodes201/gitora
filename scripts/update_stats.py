#!/usr/bin/env python3
"""Fetch public GitHub stats and regenerate assets/stats.svg.

Used locally (dev) and in CI (.github/workflows/contribution.yml) to keep the
animated stats badge in the README fresh.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from datetime import datetime, timezone

USER = "GhoshCodes201"
BG = "#0b0d10"
BG2 = "#0d1117"
SURFACE = "#11151a"
BORDER = "#21262d"
INK = "#e6edf3"
MUTED = "#8b949e"
PURPLE = "#8b5cf6"
PURPLE_LT = "#a78bfa"
CYAN = "#22d3ee"


def api(path: str):
    import os

    headers = {
        "User-Agent": "gitora-stats",
        "Accept": "application/vnd.github+json",
    }
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GITORA_GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"https://api.github.com{path}",
        headers=headers,
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return json.load(r)
    except urllib.error.HTTPError as exc:
        if exc.code == 403:
            print(f"warning: GitHub API rate limit exceeded ({path})", file=sys.stderr)
            return []
        raise


def count_up_layer(final: int, dur: float) -> str:
    """Layered <text> elements that animate a counter 0..final."""
    n = final + 1
    slice_ = 1.0 / n
    eps = 0.0001
    layers = []
    for i in range(n):
        s = i * slice_
        e = (i + 1) * slice_
        if i == 0:
            vals = "1;1;0;0"
            keys = f"0;{e:.4f};{min(e + eps, 1):.4f};1"
        elif i == n - 1:
            vals = "0;1;1;1"
            keys = f"0;{s:.4f};{min(s + eps, 1):.4f};1"
        else:
            vals = "0;1;1;0;0;0"
            keys = f"0;{s:.4f};{min(s + eps, 1):.4f};{e:.4f};{min(e + eps, 1):.4f};1"
        anim = (
            f'<animate attributeName="opacity" values="{vals}" keyTimes="{keys}" '
            f'dur="{dur}s" fill="freeze"/>'
        )
        layers.append(
            f'<text x="0" y="0" text-anchor="middle" font-size="46" font-weight="800" '
            f'fill="{INK}" opacity="0">{i}{anim}</text>'
        )
    return "".join(layers)


def tile(cx: int, label: str, value: int, dot: str) -> str:
    return f"""
  <g>
    <rect x="{cx - 115}" y="118" width="230" height="104" rx="16" fill="{SURFACE}" stroke="{BORDER}"/>
    <circle cx="{cx - 92}" cy="143" r="4" fill="{dot}">
      <animate attributeName="opacity" values="1;0.35;1" dur="2.4s" repeatCount="indefinite"/>
    </circle>
    <text x="{cx}" y="150" text-anchor="middle" font-size="15" fill="{MUTED}">{label}</text>
    <g transform="translate({cx},198)">{count_up_layer(value, 1.3)}</g>
    <rect x="{cx - 92}" y="206" width="184" height="4" rx="2" fill="{BORDER}"/>
    <rect x="{cx - 92}" y="206" width="0" height="4" rx="2" fill="{dot}">
      <animate attributeName="width" from="0" to="184" dur="1.3s" begin="0.6s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
    </rect>
  </g>"""


def lang_row(y: int, name: str, pct: float, grad: str, delay: float) -> str:
    width = 700
    fill = round(width * pct / 100, 1)
    return f"""
  <text x="150" y="{y + 9}" font-size="21" font-weight="600" fill="{INK}">{name}</text>
  <text x="1070" y="{y + 9}" font-size="20" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" fill="{CYAN}" text-anchor="end" opacity="0">
    <animate attributeName="opacity" values="0;1" dur="0.4s" begin="{delay + 0.7}s" fill="freeze"/>{pct:.0f}%
  </text>
  <rect x="300" y="{y - 11}" width="{width}" height="22" rx="11" fill="{SURFACE}" stroke="{BORDER}"/>
  <rect x="300" y="{y - 11}" width="0" height="22" rx="11" fill="url({grad})">
    <animate attributeName="width" from="0" to="{fill}" dur="1.1s" begin="{delay}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
  </rect>"""


def main() -> int:
    user = api(f"/users/{USER}")
    if not user:
        print("error: could not fetch user data (rate limited?)", file=sys.stderr)
        return 1
    repos = api(f"/users/{USER}/repos?per_page=100&sort=pushed")

    public = user.get("public_repos", len(repos))
    followers = user.get("followers", 0)
    stars = sum(r.get("stargazers_count", 0) for r in repos)
    forks = sum(r.get("forks_count", 0) for r in repos)

    lang_totals: dict[str, int] = {}
    for r in repos:
        lang = r.get("language")
        if lang:
            lang_totals[lang] = lang_totals.get(lang, 0) + 1
    total = sum(lang_totals.values()) or 1
    langs = sorted(lang_totals.items(), key=lambda kv: kv[1], reverse=True)[:4]

    rows = [
        lang_row(270 + i * 45, name, count / total * 100, "#langGrad", 0.7 + i * 0.45)
        for i, (name, count) in enumerate(langs)
    ]

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" role="img" aria-label="Live GitHub stats for {USER}" font-family="Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{BG}"/>
      <stop offset="1" stop-color="{BG2}"/>
    </linearGradient>
    <linearGradient id="headGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{PURPLE_LT}">
        <animate attributeName="stop-color" values="{PURPLE_LT};{PURPLE};{PURPLE_LT}" dur="5s" repeatCount="indefinite"/>
      </stop>
      <stop offset="1" stop-color="{CYAN}">
        <animate attributeName="stop-color" values="{CYAN};{PURPLE_LT};{CYAN}" dur="5s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    <linearGradient id="langGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{PURPLE}">
        <animate attributeName="stop-color" values="{PURPLE};{PURPLE_LT};{PURPLE}" dur="5s" repeatCount="indefinite"/>
      </stop>
      <stop offset="1" stop-color="{CYAN}">
        <animate attributeName="stop-color" values="{CYAN};{PURPLE};{CYAN}" dur="5s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="{PURPLE}" stop-opacity="0.35">
        <animate attributeName="stop-opacity" values="0.35;0.1;0.35" dur="5s" repeatCount="indefinite"/>
      </stop>
      <stop offset="1" stop-color="{PURPLE}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="42"/>
    </filter>
    <clipPath id="cardClip"><rect width="1200" height="420"/></clipPath>
  </defs>

  <g clip-path="url(#cardClip)">
    <rect width="1200" height="420" fill="url(#bgGrad)"/>
    <circle cx="140" cy="60" r="200" fill="url(#glow)" filter="url(#blur)"/>
    <circle cx="1060" cy="380" r="200" fill="url(#glow)" filter="url(#blur)"/>

    <g opacity="0.5" fill="{MUTED}">
      <circle cx="60" cy="50" r="2"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite"/></circle>
      <circle cx="380" cy="40" r="2"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.6s" repeatCount="indefinite" begin="0.5s"/></circle>
      <circle cx="760" cy="70" r="2"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="4s" repeatCount="indefinite" begin="1s"/></circle>
      <circle cx="1140" cy="50" r="2"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="3.2s" repeatCount="indefinite" begin="0.7s"/></circle>
    </g>

    <text x="600" y="52" text-anchor="middle" font-size="30" font-weight="800" fill="url(#headGrad)">Live GitHub stats</text>
    <text x="600" y="82" text-anchor="middle" font-size="18" fill="{MUTED}">for @{USER}</text>

    {tile(210, "Public Repos", public, PURPLE)}
    {tile(470, "Total Stars", stars, CYAN)}
    {tile(730, "Total Forks", forks, PURPLE_LT)}
    {tile(990, "Followers", followers, CYAN)}

    <text x="600" y="248" text-anchor="middle" font-size="24" font-weight="700" fill="{INK}">Top Languages</text>
    {''.join(rows)}

    <text x="150" y="402" font-size="13" fill="{MUTED}" opacity="0">
      <animate attributeName="opacity" values="0;0.8" dur="1s" begin="3s" fill="freeze"/>
      auto-refreshed weekly via GitHub Actions · {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC
    </text>
  </g>
</svg>
"""
    with open("assets/stats.svg", "w") as f:
        f.write(svg)
    print(f"wrote assets/stats.svg  (repos={public} stars={stars} forks={forks} followers={followers} langs={langs})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
