import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, RefreshCw, X } from 'lucide-react'

interface CacheNoticeProps {
  generatedAt: string
  expiresAt: string
  refreshing: boolean
  onRefresh: () => void
}

function remainingLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'any moment now'
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return 'under a minute'
}

function ageLabel(generatedAt: string): string {
  const ms = Date.now() - new Date(generatedAt).getTime()
  if (ms <= 0) return 'just now'
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'moments ago'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function CacheNotice({ generatedAt, expiresAt, refreshing, onRefresh }: CacheNoticeProps) {
  const [remaining, setRemaining] = useState(() => remainingLabel(expiresAt))
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(`gitora.cache-notice.${generatedAt}`) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    setRemaining(remainingLabel(expiresAt))
    const id = setInterval(() => setRemaining(remainingLabel(expiresAt)), 30_000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(`gitora.cache-notice.${generatedAt}`, '1')
    } catch {
      // ignore storage errors
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100"
      role="status"
    >
      <Clock className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        Showing cached data from {ageLabel(generatedAt)}. It refreshes automatically in{' '}
        <span className="font-mono font-medium text-cyan-100">{remaining}</span>.
      </span>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="btn-neon flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 disabled:shadow-none"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        Re-analyze now
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss cache notice"
        className="rounded-lg p-1 text-cyan-200/70 transition hover:bg-cyan-500/10 hover:text-cyan-100"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
