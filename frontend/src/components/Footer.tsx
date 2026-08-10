import { Link } from 'react-router-dom'
import { Github, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative border-t border-border py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center text-sm text-muted">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-cyan text-sm font-bold text-white">
            G
          </span>
          <span className="font-display text-base font-bold tracking-tight text-ink">Gitora</span>
          <span className="hidden text-xs text-muted sm:inline">Your Code. Your Aura.</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link to="/analyze" className="transition hover:text-ink">
            Analyze
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition hover:text-ink"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
        </nav>
        <p className="flex flex-col items-center gap-1">
          <span className="flex items-center gap-1">
            Built with <Heart className="h-3.5 w-3.5 text-rose-400" /> for developers
          </span>
          <span className="text-xs">
            Gitora Score is a custom metric — not affiliated with or endorsed by GitHub.
          </span>
        </p>
      </div>
    </footer>
  )
}
