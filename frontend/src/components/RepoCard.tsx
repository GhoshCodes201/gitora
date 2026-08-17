import { motion } from 'framer-motion'
import { BookMarked, ExternalLink, GitFork, Star } from 'lucide-react'
import type { Repo } from '../types/gitora'
import { compact, timeAgo } from '../utils/format'

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  C: '#555555',
  'C++': '#f34b7d',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  Jupyter: '#DA5B0B',
}

interface RepoCardProps {
  repo: Repo
}

export default function RepoCard({ repo }: RepoCardProps) {
  const activity = repo.weekly.slice(-26)
  const max = Math.max(1, ...activity.map((week) => week.total))
  const languageColor = repo.language ? LANGUAGE_COLORS[repo.language] ?? '#8046fe' : undefined

  return (
    <motion.div
      className="card-hover group flex h-full flex-col p-4"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start justify-between gap-2">
        <a
          href={repo.url?.startsWith('https://') ? repo.url : '#'}
          target="_blank"
          rel="noreferrer"
          className="truncate font-semibold text-ink transition group-hover:text-accent2"
        >
          {repo.name}
        </a>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" />
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{repo.description ?? 'No description'}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {languageColor && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: languageColor }} />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" /> {compact(repo.stars)}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3 w-3" /> {compact(repo.forks)}
        </span>
        <span className="flex items-center gap-1">
          <BookMarked className={`h-3 w-3 ${repo.has_readme ? 'text-emerald-400' : ''}`} />
          README
        </span>
        <span>{timeAgo(repo.pushed_at)}</span>
      </div>

      <div className="mt-auto pt-3">
        <div className="flex h-1.5 items-stretch gap-px">
          {activity.map((week, index) => (
            <span
              key={index}
              className="flex-1 rounded-[1px]"
              style={{
                backgroundColor:
                  week.total > 0
                    ? `rgba(224, 124, 233, ${(0.25 + 0.75 * (week.total / max)).toFixed(2)})`
                    : '#1c1933',
              }}
              title={`${week.total} commits`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
