import type { GitoraAnalysis } from '../types/gitora'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function fetchAnalysis(username: string, force = false): Promise<GitoraAnalysis> {
  const params = new URLSearchParams()
  if (force) params.set('force', 'true')
  const query = params.toString()

  let response: Response
  try {
    response = await fetch(`/api/v1/analyze/${encodeURIComponent(username)}${query ? `?${query}` : ''}`)
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
