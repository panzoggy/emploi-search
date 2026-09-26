import { cn } from '../shared/lib/cn'
import type { FeedCounts, FeedView } from './types'

const TABS: { view: FeedView; label: string }[] = [
  { view: 'new', label: 'Nouvelles' },
  { view: 'favorites', label: 'Favoris' },
  { view: 'interested', label: 'Intéressé' },
  { view: 'seen', label: 'Vues' },
  { view: 'rejected', label: 'Écartées' },
]

interface FeedTabsProps {
  view: FeedView
  counts: FeedCounts
  onChange: (view: FeedView) => void
}

export function FeedTabs({ view, counts, onChange }: FeedTabsProps) {
  return (
    <nav
      role="tablist"
      aria-label="Classement des offres"
      className="scrollbar-none flex items-stretch gap-6 overflow-x-auto overflow-y-hidden"
    >
      {TABS.map(tab => (
        <button
          key={tab.view}
          role="tab"
          aria-selected={tab.view === view}
          onClick={() => onChange(tab.view)}
          className={cn(
            'flex shrink-0 items-baseline gap-1.5 border-b-2 py-3 text-sm',
            'transition-colors duration-150 ease-swiss',
            tab.view === view ? 'border-fg text-fg' : 'border-transparent text-fg-2 hover:text-fg',
          )}
        >
          {tab.label}
          <span className="tabular font-mono text-[11px] text-fg-3">{counts[tab.view]}</span>
        </button>
      ))}
    </nav>
  )
}
