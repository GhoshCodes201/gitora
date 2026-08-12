import { motion } from 'framer-motion'
import {
  CalendarCheck,
  Coffee,
  Flame,
  Globe,
  Hammer,
  Languages,
  Lock,
  Rocket,
  type LucideIcon,
} from 'lucide-react'
import type { Achievement } from '../types/gitora'

interface CatalogEntry {
  id: string
  name: string
  description: string
  icon: LucideIcon
  rarity: string
  color: string
}

const CATALOG: CatalogEntry[] = [
  { id: 'builder', name: 'Builder', description: 'Maintains 10+ repositories', icon: Hammer, rarity: 'Common', color: '#4edbed' },
  { id: 'polyglot', name: 'Polyglot', description: 'Codes in 5+ languages', icon: Languages, rarity: 'Common', color: '#9a6bff' },
  { id: 'weekend-warrior', name: 'Weekend Warrior', description: '20%+ weekend commits', icon: Coffee, rarity: 'Uncommon', color: '#8d72d3' },
  { id: 'rising-developer', name: 'Rising Developer', description: 'Recent activity grew 25%+', icon: Rocket, rarity: 'Uncommon', color: '#a78bfa' },
  { id: 'open-source-explorer', name: 'Open Source Explorer', description: 'Forked 2+ external repos', icon: Globe, rarity: 'Rare', color: '#f472b6' },
  { id: 'consistent-coder', name: 'Consistent Coder', description: 'Reached a 30-day streak', icon: CalendarCheck, rarity: 'Rare', color: '#b8a1ed' },
  { id: 'commit-machine', name: 'Commit Machine', description: '500+ total commits', icon: Flame, rarity: 'Legendary', color: '#e07ce9' },
]

const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Legendary']

function Badge({ entry, unlocked }: { entry: CatalogEntry; unlocked: boolean }) {
  const Icon = entry.icon
  return (
    <motion.div
      className="group flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.6, y: 12 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      <div
        className={`relative transition-transform duration-200 ${unlocked ? 'group-hover:scale-110' : ''}`}
        style={{
          filter: unlocked ? `drop-shadow(0 0 14px ${entry.color}88)` : 'none',
        }}
        title={unlocked ? `${entry.name} — ${entry.rarity}` : `${entry.description} (${entry.rarity})`}
      >
        <div
          className="flex h-16 w-16 items-center justify-center"
          style={{
            clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
            background: unlocked
              ? `linear-gradient(160deg, ${entry.color}cc, ${entry.color}33)`
              : '#0d1014',
            border: unlocked ? `1px solid ${entry.color}66` : '1px solid #2a2438',
          }}
        >
          <Icon
            className={`h-7 w-7 ${unlocked ? '' : 'text-muted'}`}
            style={unlocked ? { color: '#fff' } : undefined}
          />
          {!unlocked && (
            <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-bg text-muted">
              <Lock className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
      <div className="text-center">
        <div className={`text-xs font-semibold ${unlocked ? 'text-ink' : 'text-muted'}`}>
          {unlocked ? entry.name : '???'}
        </div>
        <div className="text-[10px] uppercase tracking-wide" style={{ color: unlocked ? entry.color : '#3c444e' }}>
          {unlocked ? entry.rarity : 'locked'}
        </div>
      </div>
    </motion.div>
  )
}

interface AchievementGridProps {
  achievements: Achievement[]
}

export default function AchievementGrid({ achievements }: AchievementGridProps) {
  const earnedIds = new Set(achievements.map((a) => a.id))
  const earnedCount = earnedIds.size
  const sorted = [...CATALOG].sort(
    (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity),
  )

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">Achievements</span>
        <span className="font-mono text-xs text-accent2">
          {earnedCount} / {CATALOG.length} collected
        </span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#8046fe,#e07ce9)' }}
          initial={{ width: 0 }}
          whileInView={{ width: `${(earnedCount / CATALOG.length) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-7">
        {sorted.map((entry) => (
          <Badge key={entry.id} entry={entry} unlocked={earnedIds.has(entry.id)} />
        ))}
      </div>
      {earnedCount === 0 && (
        <p className="mt-4 text-sm text-muted">No achievements yet — keep coding to unlock your first badge!</p>
      )}
    </div>
  )
}
