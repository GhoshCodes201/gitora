import { Link } from 'react-router-dom'
import { Code2 } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-ink">
          <Code2 className="h-6 w-6 text-accent" />
          <span>Gitora</span>
          <span className="hidden text-xs font-normal text-muted sm:inline">Your Code. Your Aura.</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link to="/analyze" className="transition hover:text-ink">
            Analyze
          </Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="transition hover:text-ink">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}
