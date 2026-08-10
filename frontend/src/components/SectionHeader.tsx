import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  right?: ReactNode
}

export default function SectionHeader({ title, right }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {right}
    </div>
  )
}
