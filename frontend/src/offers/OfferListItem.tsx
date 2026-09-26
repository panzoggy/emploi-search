import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../shared/lib/cn'
import { compactAge } from '../shared/lib/format'
import { ScoreMeter } from '../shared/ui/ScoreMeter'
import { offerFacts, SOURCE_CODES } from './OfferMeta'
import { SOURCE_LABELS, type OfferStatus, type OfferSummary } from './types'

interface OfferListItemProps {
  offer: OfferSummary
  selected: boolean
  onSelect: () => void
}

const STATUS_MARKS: Partial<Record<OfferStatus, string>> = { FAVORITE: 'Favori', INTERESTED: 'Intéressé' }

export const OfferListItem = forwardRef<HTMLButtonElement, OfferListItemProps>(function OfferListItem(
  { offer, selected, onSelect },
  ref,
) {
  const unseen = offer.status === null
  const mark = offer.status ? STATUS_MARKS[offer.status] : undefined
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.16 } }}
      transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
      className="border-b border-rule"
    >
      <button
        ref={ref}
        onClick={onSelect}
        aria-current={selected}
        className={cn(
          'grid w-full grid-cols-[40px_minmax(0,1fr)_auto] gap-4 px-4 py-4 text-left lg:px-6',
          'transition-colors duration-150',
          selected ? 'bg-surface shadow-[inset_2px_0_0_rgb(var(--accent))]' : 'hover:bg-surface/60',
        )}
      >
        <ScoreMeter score={offer.score} />
        <div className="min-w-0 space-y-1">
          <h3 className={cn('text-[15px] font-medium leading-snug tracking-tight', unseen ? 'text-fg' : 'text-fg-2')}>
            {offer.title}
          </h3>
          <p className="truncate text-xs text-fg-2">{[offer.company, offer.location].filter(Boolean).join(' · ')}</p>
          <p className="truncate font-mono text-[11px] text-fg-3">
            {[...offerFacts(offer), mark].filter(Boolean).join('  ·  ')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 font-mono text-[11px] text-fg-3">
          <span title={SOURCE_LABELS[offer.source]}>{SOURCE_CODES[offer.source]}</span>
          <span className="tabular">{compactAge(offer.postedAt ?? offer.scrapedAt)}</span>
        </div>
      </button>
    </motion.li>
  )
})
