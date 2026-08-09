# Gitora Architecture

## Flow

```
                    USER
                      │
                      ▼
              React Frontend          (V2)
                      │
                  REST API
                      ▼
             FastAPI Backend  ──────►  GitHub REST API
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
   Score Engine   Metrics     SQLite Cache
          │           │            │
          └───────────┼────────────┘
                      ▼
                Gitora Analytics
```

## Backend modules

| Module | Responsibility |
|---|---|
| `app/github/client.py` | httpx client for GitHub REST API, pagination, rate-limit and 404 handling, request budget |
| `app/github/models.py` | Pydantic models for GitHub responses |
| `app/analysis/metrics.py` | Pure functions: language distribution, streaks, growth, weekly series |
| `app/analysis/score.py` | Five-pillar scoring engine (pure functions, weighted total) |
| `app/analysis/achievements.py` | Badge rules as pure functions |
| `app/analysis/service.py` | Orchestrates fetch → analyze → cache |
| `app/db/cache.py` | SQLite cache of analysis payloads with TTL |
| `app/api/routes.py` | FastAPI routers |
| `app/schemas.py` | API response DTOs |

## Design notes

- **Anonymous API constraint**: no GraphQL/token → no cross-repo contribution
  calendar or PR/review data. Daily commit history comes from
  `GET /repos/{owner}/{repo}/stats/commit_activity` (52 weeks), which works
  anonymously and powers the heatmap, streaks and growth charts.
- **Rate limits**: anonymous = 60 req/hr. A budgeted fetch (profile + repos +
  top-N repo stats) costs ~2N+2 requests, and the SQLite cache makes repeat
  views free. On a rate-limit 403 the API serves stale cache if available.
- **Data freshness**: analyses are cached for `GITORA_CACHE_TTL_HOURS` (default 6h).

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `GITORA_GITHUB_TOKEN` | *(empty)* | Optional PAT; unlocks full pillars + higher limits |
| `GITORA_REQUEST_BUDGET` | `30` | Max GitHub requests per analysis |
| `GITORA_REPO_STATS_BUDGET` | `10` | Max repos to deep-analyze (stats + README) |
| `GITORA_CACHE_TTL_HOURS` | `6` | Cache lifetime |
| `GITORA_DB_PATH` | `data/gitora.db` | SQLite file location |
| `GITORA_CORS_ORIGINS` | `*` | Comma-separated allowed origins |
