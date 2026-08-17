# Gitora Security Audit Report

**Date:** 2026-08-17
**Target:** Gitora — GitHub developer intelligence platform
**Stack:** FastAPI 0.115 (Python 3.12) + React 18 (TypeScript/Vite/Tailwind) + SQLite
**Deployment:** Single Docker container on Render free tier
**Methodology:** Black-box + white-box hybrid (full source access, live testing against local server)

---

## Executive Summary

| Severity | Count | Status |
|---|---|---|
| HIGH | 1 | Confirmed |
| MEDIUM | 4 | Confirmed |
| LOW | 6 | Confirmed |
| INFO | 3 | Noted |

**Overall posture:** The application has solid input validation and clean architecture, but has several deployment-hardening gaps — most critically, a broken rate limiter behind reverse proxies and exposed developer documentation endpoints in production.

---

## HIGH

### H1: Rate Limiter Collapses Behind Reverse Proxy

**Location:** `backend/app/api/ratelimit.py:56`
**Impact:** Denial of Service — rate limiting is effectively disabled in production

The rate limiter keys on `request.client.host`, which behind any reverse proxy (nginx, Render, ALB, Cloudflare) is always the proxy's IP (e.g., `127.0.0.1`). All users share a single rate-limit bucket.

**Proof of concept:**
```
# Configured limit: 10 requests per 10 minutes
# Sent 15 rapid requests — all returned HTTP 200
Request 1: HTTP 200
Request 2: HTTP 200
...
Request 15: HTTP 200
```

**Impact:** An attacker can send unlimited requests, exhausting the GitHub API quota (60 req/hr anonymous, 5000/hr with token) and causing service degradation for all users.

**Fix:** Add `X-Forwarded-For` header parsing with a trusted-proxy allowlist, or use a library like `slowapi` that handles this. Example:

```python
client_host = request.headers.get("X-Forwarded-For", request.client.host).split(",")[0].strip()
```

---

## MEDIUM

### M1: OpenAPI Spec, Swagger UI, and ReDoc Exposed in Production

**Location:** FastAPI default routes
**Impact:** Information disclosure — full API schema exposed to attackers

| Endpoint | Status | Content |
|---|---|---|
| `/openapi.json` | HTTP 200 | Full OpenAPI 3.1.0 spec with all schemas |
| `/docs` | HTTP 200 | Swagger UI (interactive API explorer) |
| `/redoc` | HTTP 200 | ReDoc (API documentation) |

The OpenAPI spec reveals all endpoints, parameter types, full response schemas (including internal field names like `partial_components`, `rate_limit_remaining`, `requests_used`), and validation error structures.

**Fix:** Disable docs in production:
```python
app = FastAPI(title="Gitora API", docs_url=None, redoc_url=None, openapi_url=None)
```

---

### M2: CORS Wildcard Allows Any Origin

**Location:** `backend/app/core/config.py:21`, `backend/app/main.py:37`
**Impact:** Cross-origin abuse — any website can make requests to the API

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
```

Confirmed from `evil.com` and `null` origin — both receive full CORS headers.

**Fix:** Lock `cors_origins` to the actual deployment domain:
```
GITORA_CORS_ORIGINS=https://gitora.onrender.com
```

---

### M3: Error Messages Leak Internal GitHub API Details

**Location:** `backend/app/analysis/service.py:136`
**Impact:** Information disclosure — internal paths and HTTP status codes exposed

```
{"detail":"GitHub API error: GitHub API error 401 for /users/octocat"}
```

This reveals:
- Internal API base path (`/users/`)
- Upstream HTTP status code (`401`)
- That the backend proxies to GitHub

**Fix:** Sanitize error messages before returning to clients:
```python
raise HTTPException(status_code=502, detail="Failed to fetch GitHub data. Please try again later.")
```

---

### M4: `?force=true` Cache-Bypass DoS Vector

**Location:** `backend/app/api/routes.py:39`
**Impact:** Rate limiting bypass — GitHub API quota exhaustion

Any client can send `?force=true` on every request, bypassing the 6-hour cache. Each forced analysis consumes ~30-45 GitHub API requests. With a global daily limit of 200 and 60 req/hr anonymous, an attacker can exhaust the quota in minutes.

**Fix:** Add a separate, stricter rate limit for forced refreshes, or add a cooldown period per username for forced requests.

---

### M5: Unvalidated `href` from API Data (Potential `javascript:` XSS)

**Location:** `frontend/src/components/ProfileCard.tsx:70,110`, `frontend/src/components/RepoCard.tsx:44`
**Impact:** XSS — if backend is compromised, `javascript:` URIs execute on click

```tsx
<a href={profile.github_url} target="_blank" rel="noreferrer">
<a href={repo.url} target="_blank" rel="noreferrer">
```

If a compromised backend returns `github_url: "javascript:alert(document.cookie)"`, clicking the link executes arbitrary JS. `rel="noreferrer"` prevents `window.opener` attacks but not inline JS.

**Fix:** Validate URL schemes before using as `href`:
```tsx
const safeHref = (url: string) => url.startsWith('https://') ? url : '#'
<a href={safeHref(profile.github_url)} ...>
```

---

## LOW

### L1: CSP Contains `'unsafe-inline'` for `style-src`

**Location:** `backend/app/main.py:18`
**Impact:** Weakened XSS protection

`style-src 'self' 'unsafe-inline'` allows inline styles. While not as dangerous as `script-src 'unsafe-inline'`, CSS injection can be used for data exfiltration in some scenarios.

---

### L2: GitHub Rate-Limit Reset Timestamp Leaked to Clients

**Location:** `backend/app/analysis/service.py:124`
**Impact:** Minor information disclosure

Rate-limit reset epoch is included in stale-cache warning messages, revealing server-side GitHub API state.

---

### L3: Build Instructions Leaked in 503 Response

**Location:** `backend/app/static.py`
**Impact:** Minor information disclosure

When the frontend is not built, the 503 response includes `npm ci && npm run build` and the `GITORA_STATIC_DIR` env var name.

---

### L4: `server: uvicorn` Header Present

**Location:** Default uvicorn behavior
**Impact:** Server fingerprinting

All responses include `server: uvicorn`, revealing the ASGI server.

---

### L5: SQLite DB Permissions Too Broad

**Location:** `backend/data/gitora.db`
**Impact:** Local privilege escalation on shared systems

```
-rw-r--r-- 1 ag-arnex ag-arnex 368640 Aug 12 13:46 gitora.db
```

World-readable (644). Should be 600 in production.

---

### L6: CSP Disabled When `environment != "production"`

**Location:** `backend/app/main.py:22`
**Impact:** Silent security regression

Setting `GITORA_ENVIRONMENT=development` in production silently drops all CSP headers.

---

## INFORMATIONAL

### I1: SPA Catch-All Returns 200 for Any Path

All non-API paths (including `/.env`, `/.git/config`, `/nonexistent`) return HTTP 200 with `index.html`. While not exploitable (no file disclosure), it confuses security scanners and returns misleading status codes.

**Verified:** `/.env` response is `content-type: text/html`, `content-length: 2208` — same as `index.html`.

### I2: `.env` Properly Excluded from Docker Image

`.dockerignore` contains `.env` — no token leakage in Docker image layers.

### I3: No Secrets in Git History

`.env` is in `.gitignore` and was never committed.

---

## What's Clean (Good Practices)

| Area | Status |
|---|---|
| **SQL injection** | NOT PRESENT — all queries use parameterized placeholders |
| **Input validation** | SOLID — GitHub-compatible regex rejects all injection payloads |
| **Path traversal** | NOT EXPLOITABLE — SPA catch-all swallows, validation rejects |
| **XSS via error reflection** | NOT EXPLOITABLE — React escapes, input validated before rendering |
| **Hardcoded secrets** | NONE — token loaded from env only |
| **Docker hardening** | GOOD — non-root user, multi-stage build, no-cache pip |
| **Security headers** | COMPREHENSIVE — HSTS, nosniff, DENY framing, CSP, referrer policy |
| **SSRF guard** | WELL-IMPLEMENTED — enforces HTTPS + GitHub-only hosts |
| **Input sanitization layer** | EXCELLENT — `sanitize.py` + Pydantic validators on all upstream data |
| **Request budget** | PREVENTS RUNAWAY — semaphore + request count limit |
| **In-flight deduplication** | GOOD — prevents duplicate analyses for same username |
| **Dependencies** | CLEAN — `pip audit: 0 vulnerabilities`, `npm audit: 0 vulnerabilities` |

---

## Recommended Priority

1. **[HIGH]** Fix rate limiter proxy bypass (H1)
2. **[MEDIUM]** Disable docs/OpenAPI in production (M1)
3. **[MEDIUM]** Lock CORS origins (M2)
4. **[MEDIUM]** Sanitize error messages (M3)
5. **[MEDIUM]** Add forced-refresh throttle (M4)
6. **[LOW]** Validate URL schemes in frontend `href` (M5)
7. **[LOW]** Remove `unsafe-inline` from CSP style-src (L1)
