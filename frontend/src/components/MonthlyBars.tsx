import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Month } from '../types/gitora'

interface MonthlyBarsProps {
  months: Month[]
}

export default function MonthlyBars({ months }: MonthlyBarsProps) {
  const data = months.map((month) => ({ month: month.month, commits: month.commits }))

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
          <XAxis dataKey="month" stroke="#8b949e" fontSize={11} tickLine={false} minTickGap={24} />
          <YAxis stroke="#8b949e" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: '#161b22' }}
            contentStyle={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#8b949e' }}
            itemStyle={{ color: '#e6edf3' }}
          />
          <Bar dataKey="commits" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
