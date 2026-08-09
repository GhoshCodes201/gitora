import type { Language } from '../types/gitora'

const COLORS = ['#8b5cf6', '#22d3ee', '#f59e0b', '#34d399', '#f87171', '#60a5fa', '#e879f9', '#a3e635']

interface LanguageBarsProps {
  languages: Language[]
}

export default function LanguageBars({ languages }: LanguageBarsProps) {
  if (languages.length === 0) {
    return <p className="text-sm text-muted">No language data available.</p>
  }
  return (
    <div className="space-y-3">
      {languages.slice(0, 8).map((lang, index) => (
        <div key={lang.name}>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {lang.name}
            </span>
            <span className="font-mono text-muted">{lang.percentage}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full"
              style={{ width: `${lang.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
