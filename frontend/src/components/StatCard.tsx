import { motion } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCountUp } from '../hooks/useCountUp'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  hint?: string
  accent?: string
  index?: number
}

export default function StatCard({ icon: Icon, label, value, sub, hint, accent = '#8046fe', index = 0 }: StatCardProps) {
  const numeric = parseFloat(value.replace(/[^\d.]/g, ''))
  const isCountable = value !== '0' && (value.includes('.') ? /^\d+(\.\d+)?[kM]?$/.test(value) : /^\d+$/.test(value))
  const shown = useCountUp(isCountable ? numeric : 0, 0.9, 0, 0.1 + index * 0.05)
  const suffix = value.replace(/[\d.]/g, '')
  const display = isCountable ? `${shown}${suffix}` : value

  return (
    <motion.div
      className="card-hover group relative overflow-hidden p-4"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-2 text-xs text-muted">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex items-center gap-1">
          {label}
          {hint && (
            <span className="cursor-help" title={hint}>
              <HelpCircle className="h-3.5 w-3.5 text-muted opacity-60 transition hover:opacity-100" />
            </span>
          )}
        </span>
      </div>
      <div className="mt-2.5 font-display text-2xl font-semibold tracking-tight text-ink">{display}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </motion.div>
  )
}
