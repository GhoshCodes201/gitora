import { motion } from 'framer-motion'
import { Calculator, CheckCircle2, FolderSearch, Search, Sparkles } from 'lucide-react'

const STEPS = [
  { label: 'Fetching GitHub profile', icon: Search },
  { label: 'Analyzing repositories', icon: FolderSearch },
  { label: 'Calculating developer metrics', icon: Calculator },
  { label: 'Generating Gitora profile', icon: Sparkles },
]

interface AnalyzeStepsProps {
  activeStep: number
}

export default function AnalyzeSteps({ activeStep }: AnalyzeStepsProps) {
  const progress = Math.max(activeStep / STEPS.length, 0.02)
  const radius = 84
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="relative h-56 w-56">
        <div
          className="absolute -inset-3 rounded-full opacity-40 blur-xl"
          style={{
            background: 'conic-gradient(from 0deg, #8046fe, #4edbed, #e07ce9, #8046fe)',
            animation: 'spin 6s linear infinite',
          }}
        />
        <div
          className="absolute -inset-1 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #8046fe, transparent 40%, #e07ce9 60%, transparent 80%, #8046fe)',
            animation: 'spin 8s linear infinite',
          }}
        />
        <svg width="224" height="224" viewBox="0 0 224 224" className="relative -rotate-90">
          <defs>
            <linearGradient id="chargeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8046fe" />
              <stop offset="100%" stopColor="#e07ce9" />
            </linearGradient>
          </defs>
          <circle cx="112" cy="112" r={radius} fill="none" stroke="#1c1933" strokeWidth="10" />
          <circle
            cx="112"
            cy="112"
            r={radius}
            fill="none"
            stroke="url(#chargeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={Math.round(progress * 100)}
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-4xl font-bold text-accent2"
          >
            {Math.round(progress * 100)}%
          </motion.span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted">charging</span>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute bottom-4 left-[19px] top-4 w-px bg-gradient-to-b from-accent/50 via-border to-transparent" />
          {STEPS.map((item, index) => {
            const done = index < activeStep
            const active = index === activeStep
            const Icon = item.icon
            return (
              <div key={item.label} className="relative flex items-center gap-4 py-2">
                <div
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                    done
                      ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-400'
                      : active
                        ? 'border-accent/60 bg-accent/10 text-accent2 shadow-[0_0_20px_-4px_rgba(128,70,254,0.6)]'
                        : 'border-border bg-surface text-muted'
                  }`}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  {active && (
                    <span
                      className="absolute -inset-1 animate-ping rounded-full border border-accent/30"
                      style={{ animationDuration: '1.6s' }}
                    />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm transition ${
                    active
                      ? 'border-accent/40 bg-accent/10'
                      : done
                        ? 'border-border bg-surface'
                        : 'border-border bg-surface opacity-60'
                  }`}
                >
                  <span className="font-medium text-ink">{item.label}</span>
                  <span className="ml-2 text-xs text-muted">
                    {done ? 'done' : active ? 'running…' : 'queued'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
