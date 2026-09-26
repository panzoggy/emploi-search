import type { ReactNode } from 'react'

interface EmptyStateProps {
  kicker?: string
  title: string
  children?: ReactNode
  action?: ReactNode
}

export function EmptyState({ kicker, title, children, action }: EmptyStateProps) {
  return (
    <div className="max-w-md px-6 py-12">
      {kicker && <p className="label mb-3">{kicker}</p>}
      <h3 className="text-lg font-semibold tracking-title text-fg">{title}</h3>
      {children && <p className="mt-2 text-sm leading-relaxed text-fg-2">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
