import { ArrowUpRight } from 'lucide-react'
import { cn } from '../shared/lib/cn'
import { Kbd } from '../shared/ui/Kbd'
import type { OfferStatus, OfferSummary } from './types'

interface TriageActionsProps {
  offer: OfferSummary
  onTriage: (status: OfferStatus | null) => void
}

const ACTIONS: { status: OfferStatus; label: string; key: string }[] = [
  { status: 'FAVORITE', label: 'Favori', key: 'F' },
  { status: 'INTERESTED', label: 'Intéressé', key: 'I' },
  { status: 'REJECTED', label: 'Écarter', key: 'X' },
]

export function TriageActions({ offer, onTriage }: TriageActionsProps) {
  const classified = offer.status !== null && offer.status !== 'SEEN'
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusButtons status={offer.status} onTriage={onTriage} />
      {classified && (
        <button
          type="button"
          onClick={() => onTriage(null)}
          className="px-2 text-xs text-fg-2 underline-offset-4 hover:text-fg hover:underline"
        >
          Remettre dans les nouvelles
        </button>
      )}
      <a
        href={offer.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'ml-auto inline-flex h-9 items-center gap-2 bg-accent px-4',
          'text-sm font-medium text-accent-fg hover:bg-accent/85',
        )}
      >
        Voir l'offre sur le site
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </a>
    </div>
  )
}

function StatusButtons({
  status: current,
  onTriage,
}: {
  status: OfferStatus | null
  onTriage: TriageActionsProps['onTriage']
}) {
  return (
    <div className="flex divide-x divide-rule-strong border border-rule-strong">
      {ACTIONS.map(({ status, label, key }) => {
        const active = current === status
        return (
          <button
            key={status}
            type="button"
            aria-pressed={active}
            // Recliquer sur l'état actif le retire : l'offre reste simplement "vue"
            onClick={() => onTriage(active ? 'SEEN' : status)}
            className={cn(
              'flex h-9 items-center gap-2 px-3.5 text-sm transition-colors duration-150 ease-swiss',
              active ? 'bg-fg text-canvas' : 'text-fg hover:bg-elevated',
            )}
          >
            {label}
            <Kbd>{key}</Kbd>
          </button>
        )
      })}
    </div>
  )
}
