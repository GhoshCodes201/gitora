import { useEffect, useMemo, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { RANKS } from '../utils/ranks'

const DEMO_CYCLE = [8, 30, 48, 63, 78, 92]

function previewScore(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997
  return 35 + (hash % 58)
}

interface DemoGaugeProps {
  username: string
}

export default function DemoGauge({ username }: DemoGaugeProps) {
  const [display, setDisplay] = useState(8)
  const [cycle, setCycle] = useState(0)
  const value = useMotionValue(8)
  const rounded = useTransform(value, (v) => Math.round(v))

  useEffect(() => rounded.on('change', setDisplay), [rounded])

  const target = useMemo(() => (username.trim() ? previewScore(username.trim()) : null), [username])

  useEffect(() => {
    if (target !== null) return
    const id = window.setInterval(() => setCycle((c) => (c + 1) % DEMO_CYCLE.length), 2800)
    return () => window.clearInterval(id)
  }, [target])

  useEffect(() => {
    const goal = target ?? DEMO_CYCLE[cycle]
    const controls = animate(value, goal, {
      duration: 1.3,
      ease: [0.16, 1, 0.3, 1],
      onComplete: () => setDisplay(goal),
    })
    return () => controls.stop()
  }, [target, cycle, value])

  const tier = RANKS.reduce((current, t) => (display >= t.min ? t : current), RANKS[0])
  const radius = 62
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(display, 4)

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="pointer-events-none absolute inset-6 rounded-full blur-2xl"
        style={{ background: tier.glow, opacity: 0.4 }}
      />
      <div className="relative">
        <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90">
          <defs>
            <linearGradient id="demoTier" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={tier.color} />
              <stop offset="100%" stopColor={tier.color} stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <circle cx="88" cy="88" r={radius} fill="none" stroke="#1c1933" strokeWidth="12" />
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke="url(#demoTier)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl font-bold leading-none" style={{ color: tier.color }}>
            {display}
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            preview score
          </span>
        </div>
      </div>

      <motion.div
        key={tier.name}
        className="mt-4 flex flex-col items-center gap-1.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span
          className="rounded-full border px-3.5 py-1 text-sm font-semibold"
          style={{
            borderColor: `${tier.color}55`,
            color: tier.color,
            background: tier.colorSoft,
            boxShadow: `0 0 24px -6px ${tier.glow}`,
          }}
        >
          {tier.name}
        </span>
        <span className="max-w-[220px] text-center text-xs text-muted">{tier.tagline}</span>
      </motion.div>
    </div>
  )
}
