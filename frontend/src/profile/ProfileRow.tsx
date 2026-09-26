import type { ReactNode } from 'react'

interface ProfileRowProps {
  index: number
  title: string
  hint?: string
  children: ReactNode
}

// Une rubrique numérotée : numéro, intitulé et explication, puis le contrôle
export const ProfileRow = ({ index, title, hint, children }: ProfileRowProps) => (
  <section className="grid gap-3 border-b border-rule py-6 md:grid-cols-[40px_220px_minmax(0,720px)] md:gap-6">
    <span className="tabular font-mono text-xs text-fg-3">{String(index).padStart(2, '0')}</span>
    <div>
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      {hint && <p className="mt-1 text-xs leading-relaxed text-fg-2">{hint}</p>}
    </div>
    <div className="min-w-0">{children}</div>
  </section>
)
