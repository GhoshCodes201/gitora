import { CheckCircle2, Loader2 } from 'lucide-react'

const STEPS = [
  'Fetching GitHub profile',
  'Analyzing repositories',
  'Calculating developer metrics',
  'Generating Gitora profile',
]

interface AnalyzeStepsProps {
  activeStep: number
}

export default function AnalyzeSteps({ activeStep }: AnalyzeStepsProps) {
  return (
    <div className="w-full max-w-md space-y-3">
      {STEPS.map((step, index) => {
        const done = index < activeStep
        const active = index === activeStep
        return (
          <div
            key={step}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              active ? 'border-accent/40 bg-accent/10' : done ? 'border-border bg-surface' : 'border-border bg-surface opacity-60'
            }`}
          >
            {done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : active ? (
              <Loader2 className="h-4 w-4 animate-spin text-accent2" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-muted" />
            )}
            <span className="text-ink">{step}</span>
          </div>
        )
      })}
    </div>
  )
}
