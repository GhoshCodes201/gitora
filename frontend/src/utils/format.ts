export function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return `${value}`
}

export function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const date = new Date(iso)
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

export function monthLabel(weekTs: number): string {
  return new Date(weekTs * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function cleanUsername(raw: string): string {
  return raw.trim().replace(/^@/, '').replace(/\s+/g, '')
}
