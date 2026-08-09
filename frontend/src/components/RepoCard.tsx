import { CheckCircle2, Circle, ExternalLink, GitFork, Star } from 'lucide-react'
import type { Repo } from '../types/gitora'
import { compact, timeAgo } from '../utils/format'

interface RepoCardProps {
  repo: Repo
}

export default function RepoCard({ repo }: RepoCardProps) {
  const activity = repo.weekly.slice(-26)
  const max = Math.max(1, ...activity.map((week) => week.total))

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <a
          href={repo.url}
          target="_blank"
          rel="noreferrer"
          className="truncate font-semibold text-ink transition hover:text-accent2"
        >
          {repo.name}
        </a>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" />
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{repo.description ?? 'No description'}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          {compact(repo.stars)}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3 w-3" />
          {compact(repo.forks)}
        </span>
        <span className="flex items-center gap-1">
          {repo.has_readme ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Circle className="h-3 w-3" />}
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
                    ? `rgba(139, 92, 246, ${(0.25 + 0.75 * (week.total / max)).toFixed(2)})`
                    : '#161b22',
              }}
              title={`${week.total} commits`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
