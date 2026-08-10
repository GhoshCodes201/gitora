export interface Profile {
  login: string
  name: string | null
  avatar_url: string
  github_url: string
  bio: string | null
  location: string | null
  company: string | null
  blog: string | null
  followers: number
  following: number
  public_repos: number
  public_gists: number
  member_since: string | null
}

export interface ScoreComponent {
  key: string
  label: string
  score: number
  weight: number
  partial: boolean
  explanation: string
}

export interface Score {
  total: number
  label: string
  disclaimer: string
  components: ScoreComponent[]
}

export interface Language {
  name: string
  percentage: number
}

export interface HeatmapWeek {
  week: number
  total: number
  days: number[]
}

export interface Month {
  month: string
  commits: number
}

export interface Summary {
  total_commits: number
  active_weeks: number
  current_streak_days: number
  longest_streak_days: number
  total_stars: number
  total_forks: number
  open_issues: number
  public_repos: number
  forked_repos: number
  language_count: number
  top_languages: string[]
  languages: Language[]
}

export interface Repo {
  name: string
  full_name: string
  url: string
  description: string | null
  language: string | null
  stars: number
  forks: number
  size_kb: number
  open_issues: number
  license_spdx: string | null
  topics: string[]
  has_readme: boolean
  is_fork: boolean
  is_archived: boolean
  pushed_at: string | null
  total_commits: number | null
  stats_complete: boolean
  weekly: HeatmapWeek[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
}

export interface Meta {
  generated_at: string
  cache_hit: boolean
  stale: boolean
  warning: string | null
  partial_components: string[]
  requests_used: number
  rate_limit_remaining: number | null
  rate_limit_reset: number | null
  repos_analyzed: number
}

export interface GitoraAnalysis {
  username: string
  profile: Profile
  score: Score
  summary: Summary
  heatmap: HeatmapWeek[]
  monthly: Month[]
  growth_trend_pct: number
  weekend_ratio_pct: number
  repositories: Repo[]
  achievements: Achievement[]
  meta: Meta
}
