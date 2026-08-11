import { motion } from 'framer-motion'
import { ExternalLink, Flame, MapPin, RefreshCw, Sparkles } from 'lucide-react'
import type { Profile, Score, Summary } from '../types/gitora'
import { levelForScore, rankForScore, xpProgress } from '../utils/ranks'
import { useCountUp } from '../hooks/useCountUp'

interface ProfileCardProps {
  profile: Profile
  score: Score
  summary: Summary
  refreshing: boolean
  onRefresh: () => void
}

export default function ProfileCard({ profile, score, summary, refreshing, onRefresh }: ProfileCardProps) {
  const safeScore = Number.isFinite(score.total) ? Math.max(0, Math.min(100, score.total)) : 0
  const tier = rankForScore(safeScore)
  const level = levelForScore(safeScore)
  const { current, next } = xpProgress(safeScore)
  const levelPct = Math.round((current / next) * 100)
  const streakActive = summary.current_streak_days > 0
  const levelShown = useCountUp(level, 0.8, 1, 0.1)

  return (
    <motion.div
      className="card-hover shine-surface relative overflow-hidden p-5"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-25 blur-3xl"
        style={{ background: tier.color }}
      />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="absolute -inset-1.5 rounded-full blur-md"
              style={{ background: `conic-gradient(from 0deg, transparent, ${tier.color}, transparent)`, opacity: 0.7 }}
            />
            <div
              className="absolute -inset-1 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${tier.color}, transparent 40%, ${tier.color} 70%, transparent)`,
                animation: 'spin 6s linear infinite',
              }}
            />
            <img
              src={profile.avatar_url}
              alt={profile.login}
              className="relative h-20 w-20 rounded-full border-2 border-bg object-cover"
            />
            <span
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-bg"
              style={{ background: tier.color, boxShadow: `0 0 12px ${tier.glow}` }}
              title={`Level ${level} · ${tier.name}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-bg" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
                {profile.name ?? profile.login}
              </h1>
              <a
                href={profile.github_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-accent2 transition hover:underline"
              >
                @{profile.login}
              </a>
              <span
                className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                style={{ borderColor: `${tier.color}55`, color: tier.color, background: tier.colorSoft }}
              >
                LVL {levelShown} · {tier.name}
              </span>
            </div>
            {profile.bio && <p className="mt-1 line-clamp-2 text-sm text-muted">{profile.bio}</p>}
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {profile.location}
                </span>
              )}
              {profile.company && <span>{profile.company}</span>}
              <span className="flex items-center gap-1 font-mono">{profile.public_repos} public repos</span>
              <span className="flex items-center gap-1 font-mono">{profile.followers} followers</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {streakActive && (
              <span
                className="flex items-center gap-1 rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300"
                title="Current streak"
              >
                <Flame className="h-4 w-4 animate-pulse-glow" />
                {summary.current_streak_days}d
              </span>
            )}
            <a
              href={profile.github_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-ink transition hover:bg-surface2"
            >
              <ExternalLink className="h-4 w-4" /> GitHub
            </a>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Re-analyze
            </button>
          </div>

          <div className="w-full md:w-56">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>XP to level {level + 1}</span>
              <span className="font-mono">
                {current}/{next}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${tier.color}66, ${tier.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${levelPct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
