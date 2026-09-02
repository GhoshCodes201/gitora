import type { GitoraAnalysis } from '../types/gitora'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const TOKEN_KEY = 'gitora_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // storage unavailable; auth will be treated as anonymous
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface AuthUser {
  login: string
  avatar_url: string
  display_name: string | null
}

export async function fetchMe(): Promise<AuthUser | null> {
  const token = getToken()
  if (!token) return null
  let response: Response
  try {
    response = await fetch('/api/v1/auth/me', { headers: authHeaders() })
  } catch {
    return null
  }
  if (!response.ok) {
    clearToken()
    return null
  }
  return (await response.json()) as AuthUser
}

export function loginUrl(): string {
  return '/api/v1/auth/login'
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/v1/auth/logout', { method: 'POST', headers: authHeaders() })
  } catch {
    // best-effort; token is cleared regardless
  } finally {
    clearToken()
  }
}

export async function fetchAnalysis(username: string, force = false): Promise<GitoraAnalysis> {
  const params = new URLSearchParams()
  if (force) params.set('force', 'true')
  const query = params.toString()

  let response: Response
  try {
    response = await fetch(
      `/api/v1/analyze/${encodeURIComponent(username)}${query ? `?${query}` : ''}`,
      { headers: authHeaders() },
    )
  } catch {
    throw new ApiError('Could not reach the Gitora API. Is the backend running on port 8000?', 0)
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body && typeof body.detail === 'string') detail = body.detail
    } catch {
      // keep default message
    }
    throw new ApiError(detail, response.status)
  }

  return (await response.json()) as GitoraAnalysis
}
