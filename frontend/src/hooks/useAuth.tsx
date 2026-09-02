import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchMe, logout as apiLogout, setToken, type AuthUser } from '../services/api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: () => void
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function consumeHashToken(): void {
  if (!window.location.hash.startsWith('#/auth/callback')) return
  const params = new URLSearchParams(window.location.hash.slice('#/auth/callback?'.length))
  const token = params.get('token')
  if (token) {
    setToken(token)
    window.history.replaceState({}, '', '/')
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const me = await fetchMe()
    setUser(me)
    setLoading(false)
  }, [])

  useEffect(() => {
    consumeHashToken()
    void refresh()
  }, [refresh])

  const signIn = useCallback(() => {
    window.location.href = '/api/v1/auth/login'
  }, [])

  const signOut = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refresh }),
    [user, loading, signIn, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
