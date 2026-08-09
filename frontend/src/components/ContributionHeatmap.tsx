import type { HeatmapWeek } from '../types/gitora'
import { compact } from '../utils/format'

const CELL_COLORS = ['#161b22', '#2a3a5c', '#3b5ba8', '#6d4fc4', '#a78bfa']

function cellLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

interface ContributionHeatmapProps {
  weeks: HeatmapWeek[]
  total: number
}

export default function ContributionHeatmap({ weeks, total }: ContributionHeatmapProps) {
  const days: number[] = []
  for (const week of weeks) days.push(...week.days.slice(0, 7))
  const max = Math.max(1, ...days)
  const columns = Math.max(weeks.length, 1)

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(10px, 1fr))` }}
          >
            {days.map((count, index) => (
              <div
                key={index}
                title={`${count} commits`}
                className="aspect-square rounded-[2px]"
                style={{ backgroundColor: CELL_COLORS[cellLevel(count, max)] }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>{compact(total)} commits in the last 52 weeks</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {CELL_COLORS.map((color) => (
            <span key={color} className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
