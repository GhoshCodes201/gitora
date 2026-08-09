interface ScoreGaugeProps {
  score: number
  label: string
}

export default function ScoreGauge({ score, label }: ScoreGaugeProps) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(score, 100) / 100)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative inline-flex items-center justify-center">
        <svg width="190" height="190" viewBox="0 0 200 200" className="-rotate-90">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#161b22" strokeWidth="14" />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-mono text-5xl font-bold text-ink">{score}</div>
          <div className="text-xs text-muted">/ 100</div>
        </div>
      </div>
      <div className="rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent2">{label}</div>
    </div>
  )
}
