import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  GitFork,
  GitPullRequest,
  Repeat,
  SearchX,
  Star,
  TerminalSquare,
} from 'lucide-react'
import { motion } from 'framer-motion'
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
import AchievementGrid from '../components/AchievementGrid'
import ProfileCard from '../components/ProfileCard'
import SectionHeader from '../components/SectionHeader'
import { useAnalysis } from '../hooks/useAnalysis'
import { usePageTitle } from '../hooks/usePageTitle'
import { compact } from '../utils/format'
import type { GitoraAnalysis } from '../types/gitora'

export default function Dashboard() {
  const { username = '' } = useParams()
  usePageTitle(`Gitora — @${username}`)
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

const STAT_ACCENTS = ['#22d3ee', '#f59e0b', '#34d399', '#8b5cf6', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa']

function DashboardBody({ data, refreshing, onRefresh }: DashboardBodyProps) {
  const {
    profile,
    score,
    summary,
    heatmap,
    monthly,
    growth_trend_pct,
    weekend_ratio_pct,
    repositories,
    achievements,
    meta,
  } = data
  const rising = growth_trend_pct >= 0

  const stats = [
    { icon: GitPullRequest, label: 'Commits', value: compact(summary.total_commits), sub: 'last 52 weeks' },
    { icon: Star, label: 'Stars', value: compact(summary.total_stars) },
    { icon: GitFork, label: 'Forks', value: compact(summary.total_forks) },
    { icon: Boxes, label: 'Repositories', value: `${summary.public_repos}` },
    { icon: CalendarDays, label: 'Longest streak', value: `${summary.longest_streak_days}d` },
    { icon: Repeat, label: 'Active weeks', value: `${summary.active_weeks}`, sub: '/ 52' },
    { icon: TerminalSquare, label: 'Languages', value: `${summary.language_count}` },
    { icon: Boxes, label: 'Open issues', value: compact(summary.open_issues) },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <ProfileCard
        profile={profile}
        score={score}
        summary={summary}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {meta.warning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{meta.warning}</span>
        </motion.div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center justify-center">
          <ScoreGauge score={score.total} label={score.label} />
        </Card>
        <Card className="lg:col-span-2">
          <SectionHeader title="Stat breakdown" />
          <PillarBreakdown components={score.components} />
          {meta.partial_components.length > 0 && (
            <p className="mt-4 text-xs text-muted">
              Partially estimated: {meta.partial_components.join(', ')} — full signals need a GitHub token.
            </p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            accent={STAT_ACCENTS[index % STAT_ACCENTS.length]}
            index={index}
          />
        ))}
      </div>

      <Card>
        <SectionHeader title="Contributions" right={<span className="text-xs text-muted">last 52 weeks</span>} />
        <ContributionHeatmap weeks={heatmap} total={summary.total_commits} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeader
            title="Activity trend"
            right={
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  rising ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                }`}
              >
                {rising ? '▲' : '▼'} {Math.abs(growth_trend_pct)}% last 8 weeks
              </span>
            }
          />
          <GrowthChart weeks={heatmap} />
          <p className="mt-3 text-xs text-muted">
            {rising
              ? `Your activity is trending upward. Keep the momentum.`
              : `Your activity has declined recently — consistency is the key metric.`}{' '}
            Weekend commits: {weekend_ratio_pct}%.
          </p>
        </Card>
        <Card>
          <SectionHeader title="Monthly activity" />
          <MonthlyBars months={monthly} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Languages" />
          <LanguageBars languages={summary.languages} />
          <p className="mt-3 text-xs text-muted">
            {summary.language_count} languages • {summary.top_languages.join(', ')}
          </p>
        </Card>
        <Card>
          <AchievementGrid achievements={achievements} />
        </Card>
      </div>

      <div>
        <SectionHeader title={`Repositories (${repositories.length})`} />
        {repositories.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
            No public repositories found for this profile.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {repositories.map((repo) => (
              <RepoCard key={repo.full_name} repo={repo} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <div className="h-36 animate-pulse rounded-2xl bg-gradient-to-br from-surface2 to-surface" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl bg-gradient-to-br from-surface2 to-surface" />
        <div className="h-80 animate-pulse rounded-2xl bg-gradient-to-br from-surface2 to-surface lg:col-span-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-gradient-to-br from-surface2 to-surface" />
        ))}
      </div>
    </div>
  )
}
