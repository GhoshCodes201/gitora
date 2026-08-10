import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return <div className={`card ${hover ? 'card-hover' : ''} p-5 ${className}`}>{children}</div>
}
