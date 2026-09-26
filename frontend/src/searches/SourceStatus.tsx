import { SOURCE_LABELS, type Source } from '../offers/types'
import { cn } from '../shared/lib/cn'
import type { SourceProgress } from './types'

const describe = (p: SourceProgress): string => {
  switch (p.state) {
    case 'waiting':
      return 'en attente'
    case 'listing':
      return `page ${p.pages + 1}`
    case 'details':
      return `${p.fresh} nouvelles…`
    case 'done':
      return p.fresh > 0 ? `${p.fresh} nouvelles` : 'rien de neuf'
    case 'blocked':
      return 'bloqué par le site'
    case 'error':
      return 'erreur'
  }
}

// "HelloWork 12 nouvelles" ; un petit carré qui clignote tant que le site est interrogé
export function SourceStatus({ source, progress }: { source: Source; progress: SourceProgress }) {
  const running = ['waiting', 'listing', 'details'].includes(progress.state)
  const failed = progress.state === 'blocked' || progress.state === 'error'
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px]" title={progress.note}>
      <span
        className={cn('h-1.5 w-1.5', running ? 'animate-pulse bg-accent' : failed ? 'bg-warning' : 'bg-fg-3')}
        aria-hidden
      />
      <span className="text-fg">{SOURCE_LABELS[source]}</span>
      <span className={cn('tabular', failed ? 'text-warning' : 'text-fg-2')}>{describe(progress)}</span>
    </span>
  )
}
