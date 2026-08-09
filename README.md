# Gitora — Your Code. Your Aura.

Gitora turns raw GitHub activity into developer intelligence. Instead of just
counting commits, it tells a story about activity, consistency, project
quality, collaboration and open-source contributions, and rolls it all into a
single **Gitora Score**.

> **Gitora Score is a custom metric created by Gitora based on public GitHub
> data. It is not affiliated with or endorsed by GitHub.**

## Monorepo layout

```
gitora/
├── backend/          # FastAPI + httpx + SQLite (this session)
├── frontend/         # React + TypeScript + Vite + Tailwind (next session)
├── docs/
└── README.md
```

## Backend quickstart

Requires Python 3.12+.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env      # optional, defaults are fine
uvicorn app.main:app --reload --port 8000
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | Liveness check |
| GET | `/api/v1/analyze/{username}` | Fetch, analyze and cache a GitHub user |
| GET | `/api/v1/analyze/{username}?force=true` | Bypass cache and re-fetch |

### Try it

```bash
curl -s localhost:8000/api/v1/analyze/octocat | python3 -m json.tool
```

## Frontend

Requires Node 18+.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, /api proxied to :8000
```

Pages: `/` landing, `/analyze` analyzer, `/dashboard/:username` analytics dashboard.

## How the score works

Five pillars, each 0–100, weighted:

```
Gitora Score =
  Activity       × 0.20   (commits, repos, stars/forks, issues)
+ Consistency    × 0.25   (active weeks, streaks, monthly activity)
+ Collaboration  × 0.20   (issues, forks, external forks)  [partial]
+ Project Quality× 0.20   (README, license, docs, stars/forks, recency)
+ Open Source    × 0.15   (public repos, external forks, stars) [partial]
```

Without a GitHub token, PR/review data is unavailable, so the Collaboration and
Open Source pillars are marked `partial` in the API response and disclosed to
the user.

## Testing

```bash
cd backend
source .venv/bin/activate
pytest -q
```

## Roadmap

- V1: Analyze → Score → Activity → Languages → Repositories → Achievements (this session: backend)
- V2: React dashboard, shareable profiles, comparison
- V3: Gitora AI insights and recommendations
