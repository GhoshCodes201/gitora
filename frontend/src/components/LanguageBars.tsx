import { motion } from 'framer-motion'
import type { Language } from '../types/gitora'
import { useCountUp } from '../hooks/useCountUp'

const COLORS = ['#8b5cf6', '#22d3ee', '#f59e0b', '#34d399', '#f87171', '#60a5fa', '#e879f9', '#a3e635']

interface LangBarProps {
  lang: Language
  color: string
  index: number
}

function LangBar({ lang, color, index }: LangBarProps) {
  const safePct = Number.isFinite(lang.percentage)
    ? Math.max(0, Math.min(100, lang.percentage))
    : 0
  const pct = useCountUp(safePct, 0.9, 0, 0.1 + index * 0.06)

  return (
    <div className="group">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-ink">
          <span
            className="h-2.5 w-2.5 rounded-full transition group-hover:scale-110"
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
          />
          {lang.name}
        </span>
        <span className="font-mono text-muted">{pct.toFixed(1)}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
          initial={{ width: 0 }}
          whileInView={{ width: `${safePct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 + index * 0.07 }}
        />
      </div>
    </div>
  )
}

interface LanguageBarsProps {
  languages: Language[]
}

export default function LanguageBars({ languages }: LanguageBarsProps) {
  if (languages.length === 0) {
    return <p className="text-sm text-muted">No language data available.</p>
  }
  return (
    <div className="space-y-3.5">
      {languages.slice(0, 8).map((lang, index) => (
        <LangBar key={lang.name} lang={lang} color={COLORS[index % COLORS.length]} index={index} />
      ))}
    </div>
  )
}
