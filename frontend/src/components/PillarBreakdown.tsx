import { Info } from 'lucide-react'
import type { ScoreComponent } from '../types/gitora'

interface PillarBreakdownProps {
  components: ScoreComponent[]
}

export default function PillarBreakdown({ components }: PillarBreakdownProps) {
  return (
    <div className="space-y-4">
      {components.map((component) => (
        <div key={component.key}>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-ink">{component.label}</span>
              {component.partial && (
                <span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px] text-muted">partial</span>
              )}
              <span className="group relative cursor-help" title={component.explanation}>
                <Info className="h-3.5 w-3.5 text-muted" />
              </span>
            </span>
            <span className="font-mono text-ink">
              {component.score}
              <span className="text-muted">/100</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-cyan"
              style={{ width: `${component.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
