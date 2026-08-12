import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Month } from '../types/gitora'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

interface MonthlyBarsProps {
  months: Month[]
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
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-[0_8px_30px_-12px_rgba(224,124,233,0.4)]">
      <div className="text-muted">{label}</div>
      <div className="mt-0.5 font-mono font-semibold text-cyan">
        {payload[0].value.toLocaleString()} commits
      </div>
    </div>
  )
}

export default function MonthlyBars({ months }: MonthlyBarsProps) {
  const reduced = usePrefersReducedMotion()
  const max = Math.max(1, ...months.map((m) => m.commits))
  const data = months.map((month, index) => ({
    month: month.month,
    commits: month.commits,
    peak: month.commits === max,
    current: index === months.length - 1,
  }))

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="monthlyBase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4edbed" />
                <stop offset="100%" stopColor="#22a7c9" />
              </linearGradient>
              <linearGradient id="monthlyPeak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e07ce9" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
              <linearGradient id="monthlyCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8046fe" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2438" vertical={false} />
            <XAxis dataKey="month" stroke="#b1b1b1" fontSize={11} tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis stroke="#b1b1b1" fontSize={11} tickLine={false} axisLine={false} width={44} />
            <Tooltip cursor={{ fill: 'rgba(128,70,254,0.06)' }} content={<ChartTooltip />} />
            <Bar
              dataKey="commits"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
              isAnimationActive={!reduced}
              activeBar={{ fill: 'url(#monthlyPeak)' }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.peak
                      ? 'url(#monthlyPeak)'
                      : entry.current
                        ? 'url(#monthlyCurrent)'
                        : 'url(#monthlyBase)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-[2px]" style={{ background: '#4edbed' }} /> commits
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-[2px]" style={{ background: '#8046fe' }} /> current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-[2px]" style={{ background: '#e07ce9' }} /> peak
        </span>
      </div>
    </div>
  )
}
