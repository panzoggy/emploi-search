import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ActiveSearches, SearchLauncher } from '../searches'
import { cn } from '../shared/lib/cn'
import { Kbd } from '../shared/ui/Kbd'
import { FeedColumn } from './FeedColumn'
import { FeedTabs } from './FeedTabs'
import { FilterBar } from './FilterBar'
import { OfferDetailPanel } from './OfferDetailPanel'
import { useFeedController, type FeedController } from './useFeedController'

const SHORTCUTS: [string[], string][] = [
  [['J', 'K'], 'naviguer'],
  [['F'], 'favori'],
  [['I'], 'intéressé'],
  [['X'], 'écarter'],
  [['O'], 'ouvrir'],
  [['/'], 'rechercher'],
]

export function FeedPage() {
  const c = useFeedController()
  const { query } = c
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex items-end justify-between gap-6 border-b border-rule px-4 lg:px-6">
        <FeedTabs view={query.view} counts={c.counts} onChange={c.changeView} />
        <div className="shrink-0 py-2">
          <SearchLauncher />
        </div>
      </div>
      <ActiveSearches />
      <FilterBar
        filters={query.filters}
        sort={query.sort}
        setFilter={query.setFilter}
        setSort={sort => query.update({ sort })}
        reset={query.resetFilters}
      />
      <div
        className={cn(
          'grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)]',
          'lg:grid-cols-[minmax(400px,480px)_minmax(0,1fr)]',
        )}
      >
        <FeedColumn controller={c} />
        {c.isDesktop && <DesktopDetail controller={c} />}
      </div>
      <MobileDetail controller={c} />
    </div>
  )
}

function DesktopDetail({ controller: c }: { controller: FeedController }) {
  const offer = c.selected
  return (
    <section aria-label="Détail de l'offre" className="scrollbar-quiet hidden min-h-0 overflow-y-auto lg:block">
      {offer ? (
        <OfferDetailPanel offer={offer} onTriage={status => void c.triage(offer, status)} />
      ) : (
        <div className="flex h-full items-end p-8">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs text-fg-3">
            {SHORTCUTS.map(([keys, label]) => (
              <div key={label} className="contents">
                <dt className="flex gap-1">
                  {keys.map(key => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </dt>
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}

function MobileDetail({ controller: c }: { controller: FeedController }) {
  const offer = !c.isDesktop ? c.selected : null
  return (
    <AnimatePresence>
      {offer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-30 overflow-y-auto bg-canvas"
        >
          <div className="sticky top-0 z-10 flex h-12 items-center border-b border-rule bg-canvas px-4">
            <button
              onClick={() => c.setSelectedId(null)}
              className="flex items-center gap-2 text-sm text-fg-2 hover:text-fg"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Retour à la liste
            </button>
          </div>
          <OfferDetailPanel offer={offer} onTriage={status => void c.triage(offer, status)} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
