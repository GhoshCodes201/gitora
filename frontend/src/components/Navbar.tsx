import { Link, NavLink } from 'react-router-dom'
import { Github } from 'lucide-react'

export default function Navbar() {
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
        <nav className="flex items-center gap-3 sm:gap-5">
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
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 text-sm text-muted transition hover:text-ink sm:flex"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
          <Link
            to="/analyze"
            className="btn-neon flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
          >
            Get your aura
          </Link>
        </nav>
      </div>
    </header>
  )
}
