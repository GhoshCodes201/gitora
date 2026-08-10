import { motion } from 'framer-motion'
import { CalendarCheck, Flame, GitPullRequest, Globe, Info, Lock, ShieldCheck, type LucideIcon } from 'lucide-react'
import type { ScoreComponent } from '../types/gitora'
import { useCountUp } from '../hooks/useCountUp'

const PILLAR_META: Record<string, { icon: LucideIcon; color: string }> = {
  activity: { icon: Flame, color: '#22d3ee' },
  consistency: { icon: CalendarCheck, color: '#34d399' },
  collaboration: { icon: GitPullRequest, color: '#60a5fa' },
  quality: { icon: ShieldCheck, color: '#f59e0b' },
  opensource: { icon: Globe, color: '#f472b6' },
}

interface PillarBreakdownProps {
  components: ScoreComponent[]
}

export default function PillarBreakdown({ components }: PillarBreakdownProps) {
  return (
    <div className="space-y-5">
      {components.map((component, index) => {
        const meta = PILLAR_META[component.key] ?? { icon: Flame, color: '#8b5cf6' }
        const Icon = meta.icon
        const value = useCountUp(component.score, 1, 0, 0.2 + index * 0.12)

        return (
          <motion.div
            key={component.key}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{ background: `${meta.color}22`, color: meta.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium text-ink">{component.label}</span>
                {component.partial && (
                  <span className="flex items-center gap-1 rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">
                    <Lock className="h-2.5 w-2.5" /> partial
                  </span>
                )}
                <span className="group relative cursor-help" title={component.explanation}>
                  <Info className="h-3.5 w-3.5 text-muted" />
                </span>
              </span>
              <span className="flex items-center gap-2 font-mono text-sm text-ink">
                <span style={{ color: meta.color }}>{value}</span>
                <span className="text-xs text-muted">/100</span>
                <span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">×{component.weight}</span>
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${meta.color}66, ${meta.color})` }}
                initial={{ width: 0 }}
                whileInView={{ width: `${component.score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 + index * 0.1 }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
