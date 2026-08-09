import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HeatmapWeek } from '../types/gitora'
import { monthLabel } from '../utils/format'

interface GrowthChartProps {
  weeks: HeatmapWeek[]
}

export default function GrowthChart({ weeks }: GrowthChartProps) {
  const data = weeks.map((week) => ({ label: monthLabel(week.week), commits: week.total }))

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
          <XAxis dataKey="label" stroke="#8b949e" fontSize={11} tickLine={false} minTickGap={24} />
          <YAxis stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#8b949e' }}
            itemStyle={{ color: '#e6edf3' }}
          />
          <Area type="monotone" dataKey="commits" stroke="#8b5cf6" strokeWidth={2} fill="url(#growthFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
