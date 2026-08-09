import {
  Award,
  CalendarCheck,
  Coffee,
  Flame,
  Globe,
  Hammer,
  Languages,
  Rocket,
  type LucideIcon,
} from 'lucide-react'
import type { Achievement } from '../types/gitora'

const ICONS: Record<string, LucideIcon> = {
  Flame,
  CalendarCheck,
  Coffee,
  Languages,
  Hammer,
  Rocket,
  Globe,
}

interface AchievementBadgeProps {
  achievement: Achievement
}

export default function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const Icon = ICONS[achievement.icon] ?? Award
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface2 p-3">
      <div className="rounded-lg bg-accent/15 p-2 text-accent2">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-semibold text-ink">{achievement.name}</div>
        <div className="mt-0.5 text-xs text-muted">{achievement.description}</div>
      </div>
    </div>
  )
}
