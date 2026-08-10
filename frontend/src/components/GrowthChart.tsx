import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HeatmapWeek } from '../types/gitora'
import { monthLabel } from '../utils/format'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

interface GrowthChartProps {
  weeks: HeatmapWeek[]
}

interface TooltipEntry {
  value: number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-[0_8px_30px_-12px_rgba(139,92,246,0.5)]">
      <div className="text-muted">{label}</div>
      <div className="mt-0.5 font-mono font-semibold text-accent2">
        {payload[0].value.toLocaleString()} commits
      </div>
    </div>
  )
}

export default function GrowthChart({ weeks }: GrowthChartProps) {
  const reduced = usePrefersReducedMotion()
  const data = weeks.map((week) => ({ label: monthLabel(week.week), commits: week.total }))

  const seen = new Set<string>()
  const ticks: string[] = []
  for (const point of data) {
    if (!seen.has(point.label)) {
      seen.add(point.label)
      ticks.push(point.label)
    }
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <filter id="growthGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
          <XAxis dataKey="label" ticks={ticks} stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} width={44} />
          <Tooltip cursor={{ stroke: '#39414b', strokeDasharray: '3 3' }} content={<ChartTooltip />} />
          <ReferenceLine y={0} stroke="#21262d" />
          <Area
            type="monotone"
            dataKey="commits"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            fill="url(#growthFill)"
            filter="url(#growthGlow)"
            isAnimationActive={!reduced}
            animationDuration={1400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
