import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  ExternalLink,
  Flame,
  GitFork,
  GitPullRequest,
  Repeat,
  RefreshCw,
  SearchX,
  Star,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import ScoreGauge from '../components/ScoreGauge'
import PillarBreakdown from '../components/PillarBreakdown'
import ContributionHeatmap from '../components/ContributionHeatmap'
import LanguageBars from '../components/LanguageBars'
import GrowthChart from '../components/GrowthChart'
import MonthlyBars from '../components/MonthlyBars'
import RepoCard from '../components/RepoCard'
import AchievementBadge from '../components/AchievementBadge'
import { useAnalysis } from '../hooks/useAnalysis'
import { compact } from '../utils/format'
import type { GitoraAnalysis } from '../types/gitora'

export default function Dashboard() {
  const { username = '' } = useParams()
  const { data, loading, error, reload } = useAnalysis(username)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {!data && loading && <Skeleton />}

        {!data && !loading && error && (
          <div className="mx-auto max-w-6xl px-4 py-24 text-center">
            <SearchX className="mx-auto h-10 w-10 text-muted" />
            <h1 className="mt-4 text-2xl font-semibold">Could not load @{username}</h1>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <Link
              to="/analyze"
              className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent2"
            >
              Analyze another profile
            </Link>
          </div>
        )}

        {data && (
          <DashboardBody data={data} refreshing={loading} onRefresh={() => void reload(true)} />
        )}
      </main>
      <Footer />
    </div>
  )
}

interface DashboardBodyProps {
  data: GitoraAnalysis
  refreshing: boolean
  onRefresh: () => void
}

function DashboardBody({ data, refreshing, onRefresh }: DashboardBodyProps) {
  const { profile, score, summary, heatmap, monthly, growth_trend_pct, weekend_ratio_pct, repositories, achievements, meta } = data
  const rising = growth_trend_pct >= 0

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar_url}
            alt={profile.login}
            className="h-16 w-16 rounded-full border border-border"
          />
          <div>
            <h1 className="text-2xl font-bold text-ink">{profile.name ?? profile.login}</h1>
            <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-accent2 hover:underline">
              @{profile.login}
            </a>
            {profile.bio && <p className="mt-0.5 text-sm text-muted">{profile.bio}</p>}
            <p className="mt-0.5 text-xs text-muted">
              {[profile.location, profile.company].filter(Boolean).join(' • ')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
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
      </header>

      {meta.warning && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{meta.warning}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-4">
          <ScoreGauge score={score.total} label={score.label} />
          <p className="text-center text-xs text-muted">{score.disclaimer}</p>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Score breakdown</h2>
          <PillarBreakdown components={score.components} />
          {meta.partial_components.length > 0 && (
            <p className="mt-4 text-xs text-muted">
              Partially estimated: {meta.partial_components.join(', ')} — full signals need a GitHub token.
            </p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={GitPullRequest} label="Commits" value={compact(summary.total_commits)} sub="last 52 weeks" />
        <StatCard icon={Flame} label="Current streak" value={`${summary.current_streak_days}d`} />
        <StatCard icon={CalendarDays} label="Longest streak" value={`${summary.longest_streak_days}d`} />
        <StatCard icon={Repeat} label="Active weeks" value={`${summary.active_weeks}`} sub="/ 52" />
        <StatCard icon={Star} label="Stars" value={compact(summary.total_stars)} />
        <StatCard icon={GitFork} label="Forks" value={compact(summary.total_forks)} />
        <StatCard icon={Boxes} label="Repositories" value={`${summary.public_repos}`} />
        <StatCard icon={Boxes} label="Languages" value={`${summary.language_count}`} />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Contributions</h2>
          <span className="text-xs text-muted">last 52 weeks</span>
        </div>
        <ContributionHeatmap weeks={heatmap} total={summary.total_commits} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Activity trend</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                rising ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
              }`}
            >
              {rising ? '▲' : '▼'} {Math.abs(growth_trend_pct)}% last 8 weeks
            </span>
          </div>
          <GrowthChart weeks={heatmap} />
          <p className="mt-3 text-xs text-muted">
            {rising
              ? `Your activity is trending upward. Keep the momentum.`
              : `Your activity has declined recently — consistency is the key metric.`}{' '}
            Weekend commits: {weekend_ratio_pct}%.
          </p>
        </Card>
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Monthly activity</h2>
          <MonthlyBars months={monthly} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Languages</h2>
          <LanguageBars languages={summary.languages} />
          <p className="mt-3 text-xs text-muted">
            {summary.language_count} languages • {summary.top_languages.join(', ')}
          </p>
        </Card>
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Achievements</h2>
          {achievements.length === 0 ? (
            <p className="text-sm text-muted">No achievements yet — keep coding!</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {achievements.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Repositories ({repositories.length})
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repo) => (
            <RepoCard key={repo.full_name} repo={repo} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-surface2" />
        <div className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded bg-surface2" />
          <div className="h-3 w-32 animate-pulse rounded bg-surface2" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-surface2" />
        <div className="h-72 animate-pulse rounded-2xl bg-surface2 lg:col-span-2" />
      </div>
    </div>
  )
}
