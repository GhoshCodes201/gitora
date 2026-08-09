import { useCallback, useEffect, useState } from 'react'
import type { GitoraAnalysis } from '../types/gitora'
import { fetchAnalysis } from '../services/api'

interface UseAnalysisResult {
  data: GitoraAnalysis | null
  loading: boolean
  error: string | null
  reload: (force?: boolean) => Promise<void>
}

export function useAnalysis(username?: string): UseAnalysisResult {
  const [data, setData] = useState<GitoraAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (force = false) => {
      if (!username) return
      setLoading(true)
      setError(null)
      try {
        setData(await fetchAnalysis(username, force))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unexpected error')
      } finally {
        setLoading(false)
      }
    },
    [username],
  )

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, reload: load }
}
