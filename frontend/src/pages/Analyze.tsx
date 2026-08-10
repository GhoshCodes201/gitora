import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, AlertCircle, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AnalyzeSteps from '../components/AnalyzeSteps'
import { fetchAnalysis } from '../services/api'
import { cleanUsername } from '../utils/format'
import { usePageTitle } from '../hooks/usePageTitle'

export default function Analyze() {
  usePageTitle('Analyze — Gitora')
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
      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center overflow-hidden px-4 py-16">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[30rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />

        {!running && (
          <motion.div
            className="relative flex w-full flex-col items-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent2">
              <Sparkles className="h-3.5 w-3.5" /> The analyzer
            </span>
            <h1 className="mt-4 text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Reveal your aura
            </h1>
            <p className="mt-3 text-center text-muted">
              Enter a username and Gitora builds your developer profile.
            </p>
            <form onSubmit={handleSubmit} className="mt-9 flex w-full max-w-md items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="username"
                  className="w-full rounded-xl border border-border bg-surface py-3 pl-9 pr-4 text-ink outline-none transition placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
                  aria-label="GitHub username"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!cleanUsername(input)}
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent2 px-5 py-3 font-medium text-white transition hover:shadow-[0_8px_30px_-8px_rgba(139,92,246,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Analyze
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex w-full max-w-md items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <span>{error}</span>
                  <button
                    onClick={() => {
                      setError(null)
                      void start(input)
                    }}
                    className="ml-2 font-medium text-rose-300 underline underline-offset-2 hover:text-rose-200"
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {running && (
          <motion.div
            className="relative flex w-full max-w-lg flex-col items-center gap-8 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-center font-display text-2xl font-bold tracking-tight">
              Summoning the aura of{' '}
              <span className="bg-gradient-to-r from-accent to-cyan bg-clip-text text-transparent">
                @{cleanUsername(input)}
              </span>
            </h1>
            <AnalyzeSteps activeStep={step} />
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  )
}
