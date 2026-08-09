import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-sm text-muted">
        <p className="flex items-center gap-1">
          Built with <Heart className="h-3.5 w-3.5 text-rose-400" /> for developers
        </p>
        <p className="text-xs">
          Gitora Score is a custom metric — not affiliated with or endorsed by GitHub.
        </p>
      </div>
    </footer>
  )
}
