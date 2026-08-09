import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AnalyzeSteps from '../components/AnalyzeSteps'
import { fetchAnalysis } from '../services/api'
import { cleanUsername } from '../utils/format'

export default function Analyze() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(params.get('u') ?? '')
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const startedRef = useRef(false)

  const start = async (raw: string) => {
    const username = cleanUsername(raw)
    if (!username) return
    setRunning(true)
    setError(null)
    setStep(0)
    timerRef.current = window.setInterval(() => setStep((current) => Math.min(current + 1, 4)), 800)
    try {
      await fetchAnalysis(username)
      navigate(`/dashboard/${encodeURIComponent(username)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze profile')
      setRunning(false)
    } finally {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  useEffect(() => {
    const fromQuery = params.get('u')
    if (fromQuery && !startedRef.current) {
      startedRef.current = true
      void start(fromQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void start(input)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16">
        {!running && (
          <>
            <h1 className="text-3xl font-bold">Analyze a GitHub profile</h1>
            <p className="mt-2 text-muted">Enter a username and Gitora builds your developer profile.</p>
            <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-md items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="username"
                  className="w-full rounded-xl border border-border bg-surface py-3 pl-9 pr-4 text-ink outline-none transition placeholder:text-muted focus:border-accent"
                  aria-label="GitHub username"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!cleanUsername(input)}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-white transition hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ANALYZE <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            {error && (
              <div className="mt-6 flex w-full max-w-md items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </>
        )}

        {running && (
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-bold">Analyzing @{cleanUsername(input)}</h1>
            <AnalyzeSteps activeStep={step} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
