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
    color: '#4edbed',
    colorSoft: 'rgba(78,219,237,0.18)',
    glow: 'rgba(78,219,237,0.55)',
    gradient: 'linear-gradient(135deg,#4edbed,#22a7c9)',
    tagline: 'The light is starting to show.',
  },
  {
    name: 'Spark',
    min: 40,
    color: '#9a6bff',
    colorSoft: 'rgba(154,107,255,0.18)',
    glow: 'rgba(154,107,255,0.6)',
    gradient: 'linear-gradient(135deg,#9a6bff,#8046fe)',
    tagline: 'Signals igniting into momentum.',
  },
  {
    name: 'Beam',
    min: 55,
    color: '#b8a1ed',
    colorSoft: 'rgba(184,161,237,0.18)',
    glow: 'rgba(184,161,237,0.6)',
    gradient: 'linear-gradient(135deg,#b8a1ed,#8d72d3)',
    tagline: 'A steady, focused light.',
  },
  {
    name: 'Aura',
    min: 70,
    color: '#a78bfa',
    colorSoft: 'rgba(167,139,250,0.2)',
    glow: 'rgba(128,70,254,0.65)',
    gradient: 'linear-gradient(135deg,#b8a1ed,#8046fe,#6d28d9)',
    tagline: 'The Aura — rare and unmistakable.',
  },
  {
    name: 'Legend',
    min: 85,
    color: '#e07ce9',
    colorSoft: 'rgba(224,124,233,0.18)',
    glow: 'rgba(224,124,233,0.65)',
    gradient: 'linear-gradient(135deg,#e07ce9,#a78bfa,#8046fe)',
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
