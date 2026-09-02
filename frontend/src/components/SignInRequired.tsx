import { Github } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function SignInRequired() {
  const { signIn } = useAuth()
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
        <Github className="h-7 w-7 text-accent2" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold">Sign in to continue</h1>
      <p className="mt-2 text-sm text-muted">
        This action requires a GitHub login. It only takes a second.
      </p>
      <button
        onClick={signIn}
        className="btn-neon mx-auto mt-6 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white"
      >
        <Github className="h-4 w-4" /> Sign in with GitHub
      </button>
    </div>
  )
}
