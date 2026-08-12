import { useMemo, useRef, useState } from 'react'
import type { Commit, HeatmapWeek } from '../types/gitora'
import { compact } from '../utils/format'

const CELL_COLORS = ['#1c1933', '#2e1e5c', '#5b3ad6', '#9a6bff', '#e07ce9']

function cellLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

function toDateKey(ts: number): string {
  const d = new Date(ts * 1000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

interface ContributionHeatmapProps {
  weeks: HeatmapWeek[]
  recentCommits?: Commit[]
}

interface TooltipState {
  x: number
  y: number
  date: string
  count: number
  commits: Commit[]
}

export default function ContributionHeatmap({ weeks, recentCommits = [] }: ContributionHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const dayMap = useMemo(() => {
    const map = new Map<string, Commit[]>()
    for (const commit of recentCommits) {
      if (!commit.date) continue
      const key = commit.date.slice(0, 10)
      const list = map.get(key) || []
      list.push(commit)
      map.set(key, list)
    }
    return map
  }, [recentCommits])

  const dayData = useMemo(() => {
    const result: { count: number; dateKey: string; dateLabel: string }[] = []
    for (const week of weeks) {
      for (let i = 0; i < 7; i++) {
        const dayTs = week.week + i * 86400
        const dateKey = toDateKey(dayTs)
        const d = new Date(dayTs * 1000)
        const dateLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        result.push({ count: week.days[i] || 0, dateKey, dateLabel })
      }
    }
    return result
  }, [weeks])

  const max = Math.max(1, ...dayData.map((d) => d.count))
  const columns = Math.max(weeks.length, 1)
  const total = weeks.reduce((sum, week) => sum + week.total, 0)

  const handleMouse = (e: React.MouseEvent, index: number) => {
    const cell = dayData[index]
    if (!cell || cell.count === 0) {
      setTooltip(null)
      return
    }
    const commits = dayMap.get(cell.dateKey) || []
    const rect = gridRef.current?.getBoundingClientRect()
    setTooltip({
      x: rect ? e.clientX - rect.left : e.clientX,
      y: rect ? e.clientY - rect.top : e.clientY,
      date: cell.dateLabel,
      count: cell.count,
      commits,
    })
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div
            ref={gridRef}
            className="relative grid gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(11px, 1fr))` }}
            onMouseLeave={() => setTooltip(null)}
          >
            {dayData.map((cell, index) => (
              <div
                key={index}
                className="aspect-square rounded-[3px] transition-transform hover:scale-125"
                style={{
                  backgroundColor: CELL_COLORS[cellLevel(cell.count, max)],
                  boxShadow:
                    cellLevel(cell.count, max) >= 4 ? '0 0 6px rgba(224,124,233,0.45)' : 'none',
                }}
                onMouseEnter={(e) => handleMouse(e, index)}
                onMouseMove={(e) => handleMouse(e, index)}
              />
            ))}
            {tooltip && (
              <div
                className="pointer-events-none absolute z-20 max-w-[280px] rounded-xl border border-border bg-surface p-3 text-xs shadow-[0_8px_30px_-12px_rgba(128,70,254,0.5)]"
                style={{
                  left: Math.min(tooltip.x + 12, (gridRef.current?.clientWidth ?? 800) - 300),
                  top: tooltip.y - 8,
                }}
              >
                <div className="font-semibold text-ink">{tooltip.date}</div>
                <div className="mt-0.5 text-muted">
                  {tooltip.count} commit{tooltip.count !== 1 ? 's' : ''}
                </div>
                {tooltip.commits.length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                    {tooltip.commits.slice(0, 5).map((c) => (
                      <div key={c.sha} className="min-w-0">
                        <div className="truncate text-ink" title={c.message}>
                          {c.message || '(no message)'}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted">
                          <span>{formatTime(c.date)}</span>
                          <span className="text-border">·</span>
                          <span className="truncate">{c.repo}</span>
                        </div>
                      </div>
                    ))}
                    {tooltip.commits.length > 5 && (
                      <div className="text-muted">
                        +{tooltip.commits.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {recentCommits.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Recent commits</div>
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {recentCommits.slice(0, 20).map((commit) => (
              <div
                key={commit.sha}
                className="group flex items-start gap-3 rounded-lg px-2 py-1.5 transition hover:bg-surface2"
              >
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink" title={commit.message}>
                    {commit.message || '(no message)'}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                    <span title={formatDate(commit.date)}>{formatRelative(commit.date)}</span>
                    {commit.date && <span>{formatTime(commit.date)}</span>}
                    <span className="text-border">·</span>
                    <span className="truncate">{commit.repo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
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
