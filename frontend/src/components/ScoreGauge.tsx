import { motion } from 'framer-motion'
import { useCountUp } from '../hooks/useCountUp'
import { rankForScore, xpProgress } from '../utils/ranks'

interface ScoreGaugeProps {
  score: number
  label: string
}

const SPARKLES = [
  { x: -70, y: -78, size: 5, delay: 1.5 },
  { x: 66, y: -62, size: 4, delay: 1.62 },
  { x: -44, y: 70, size: 4, delay: 1.7 },
  { x: 72, y: 52, size: 5, delay: 1.8 },
  { x: 8, y: -92, size: 3, delay: 1.56 },
  { x: -92, y: 18, size: 3, delay: 1.88 },
  { x: 92, y: 10, size: 3, delay: 1.66 },
]

export default function ScoreGauge({ score, label }: ScoreGaugeProps) {
  const safe = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0
  const tier = rankForScore(safe)
  const shown = useCountUp(safe, 1.15, 0, 0.15)
  const { current, next } = xpProgress(safe)
  const radius = 82
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative flex w-full max-w-xs flex-col items-center">
      <div
        className="pointer-events-none absolute inset-4 rounded-full blur-2xl"
        style={{ background: tier.glow, opacity: 0.35 }}
      />
      <div className="relative flex items-center justify-center">
        <svg width="228" height="228" viewBox="0 0 228 228" className="-rotate-90">
          <defs>
            <linearGradient id="tierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={tier.color} />
              <stop offset="100%" stopColor={tier.gradient.includes('#f') ? '#f472b6' : tier.color} />
            </linearGradient>
          </defs>
          <circle cx="114" cy="114" r={radius} fill="none" stroke="#161b22" strokeWidth="14" />
          <circle
            cx="114"
            cy="114"
            r={radius}
            fill="none"
            stroke="#21262d"
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - 0.12)}
            strokeLinecap="round"
          />
          <motion.circle
            cx="114"
            cy="114"
            r={radius}
            fill="none"
            stroke="url(#tierGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - safe / 100) }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
        </svg>

        <motion.div
          className="absolute flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="font-display text-6xl font-bold leading-none tracking-tight" style={{ color: tier.color }}>
            {shown}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            / 100 · {current}/{next} xp
          </div>
        </motion.div>

        {/* sparkle burst on completion */}
        {SPARKLES.map((spark, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full"
            style={{
              width: spark.size,
              height: spark.size,
              background: tier.color,
              boxShadow: `0 0 10px ${tier.color}`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0] }}
            transition={{ delay: spark.delay, duration: 0.9, ease: 'easeOut' }}
          />
        ))}
      </div>

      <motion.div
        className="mt-4 flex flex-col items-center gap-2 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <span
          className="rounded-full border px-4 py-1.5 text-sm font-semibold"
          style={{
            borderColor: `${tier.color}55`,
            color: tier.color,
            background: tier.colorSoft,
            boxShadow: `0 0 24px -6px ${tier.glow}`,
          }}
        >
          {label} · {tier.name}
        </span>
        <p className="max-w-[240px] text-xs text-muted">{tier.tagline}</p>
      </motion.div>
    </div>
  )
}
