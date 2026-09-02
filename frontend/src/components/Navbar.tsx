import { Link, NavLink } from 'react-router-dom'
import { Github, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, signIn, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-pink font-display text-lg font-bold text-white shadow-[0_0_20px_-4px_rgba(128,70,254,0.8)] transition group-hover:shadow-[0_0_28px_-4px_rgba(224,124,233,0.9)]">
            G
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight text-ink">Gitora</span>
            <span className="hidden text-[10px] text-muted sm:block">Your Code. Your Aura.</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <NavLink
            to="/analyze"
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-sm transition ${
                isActive ? 'bg-accent/10 text-accent2' : 'text-muted hover:text-ink'
              }`
            }
          >
            Analyze
          </NavLink>
          <Link
            to="/analyze"
            className="btn-neon hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white md:flex"
          >
            Get your aura
          </Link>
          {user ? (
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="h-6 w-6 rounded-full border border-border"
                  referrerPolicy="no-referrer"
                />
                <span className="hidden max-w-[8rem] truncate text-ink lg:inline">
                  {user.display_name || user.login}
                </span>
              </span>
              <button
                onClick={() => void signOut()}
                title="Sign out"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition hover:bg-surface hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="btn-neon flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
            >
              <Github className="h-4 w-4" /> <span className="hidden sm:inline">Sign in</span>
              <span className="sm:hidden">Sign in</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
