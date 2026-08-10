export interface RankTier {
  name: string
  min: number
  color: string
  colorSoft: string
  glow: string
  gradient: string
  tagline: string
}

export const RANKS: RankTier[] = [
  {
    name: 'Faint',
    min: 0,
    color: '#7d8590',
    colorSoft: 'rgba(125,133,144,0.18)',
    glow: 'rgba(125,133,144,0.5)',
    gradient: 'linear-gradient(135deg,#7d8590,#4b5563)',
    tagline: 'Every aura starts as a whisper.',
  },
  {
    name: 'Glow',
    min: 20,
    color: '#60a5fa',
    colorSoft: 'rgba(96,165,250,0.18)',
    glow: 'rgba(96,165,250,0.55)',
    gradient: 'linear-gradient(135deg,#60a5fa,#3b82f6)',
    tagline: 'The light is starting to show.',
  },
  {
    name: 'Spark',
    min: 40,
    color: '#22d3ee',
    colorSoft: 'rgba(34,211,238,0.18)',
    glow: 'rgba(34,211,238,0.6)',
    gradient: 'linear-gradient(135deg,#22d3ee,#0ea5e9)',
    tagline: 'Signals igniting into momentum.',
  },
  {
    name: 'Beam',
    min: 55,
    color: '#a78bfa',
    colorSoft: 'rgba(167,139,250,0.18)',
    glow: 'rgba(167,139,250,0.6)',
    gradient: 'linear-gradient(135deg,#a78bfa,#8b5cf6)',
    tagline: 'A steady, focused light.',
  },
  {
    name: 'Aura',
    min: 70,
    color: '#8b5cf6',
    colorSoft: 'rgba(139,92,246,0.2)',
    glow: 'rgba(139,92,246,0.65)',
    gradient: 'linear-gradient(135deg,#a78bfa,#8b5cf6,#7c3aed)',
    tagline: 'The Aura — rare and unmistakable.',
  },
  {
    name: 'Legend',
    min: 85,
    color: '#f59e0b',
    colorSoft: 'rgba(245,158,11,0.18)',
    glow: 'rgba(251,191,36,0.65)',
    gradient: 'linear-gradient(135deg,#fbbf24,#f59e0b,#f472b6)',
    tagline: 'A legend. Your aura defines the room.',
  },
]

export function rankForScore(score: number): RankTier {
  return RANKS.reduce(
    (current, tier) => (score >= tier.min ? tier : current),
    RANKS[0],
  )
}

export function levelForScore(score: number): number {
  return Math.min(Math.floor(score / 10) + 1, 10)
}

export function xpProgress(score: number): { current: number; next: number } {
  const current = score % 10
  return { current, next: 10 }
}
