import { useCallback, useEffect } from 'react'
import { useMediaQuery } from '../shared/lib/useMediaQuery'
import { useSearchActivity } from '../searches'
import { activeFilterCount } from './feed-query'
import { useFeed, type FeedState } from './useFeed'
import { useFeedQuery } from './useFeedQuery'
import { useFeedCounts } from './useFeedCounts'
import { useFeedKeyboard } from './useFeedKeyboard'
import { useSeenOnDwell } from './useSeenOnDwell'
import { useSelection } from './useSelection'
import { useTriage } from './useTriage'
import type { FeedView, OfferStatus, OfferSummary } from './types'

export type FeedController = ReturnType<typeof useFeedController>

export function useFeedController() {
  const query = useFeedQuery()
  const { view, sort, filters } = query
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const feed = useFeed(view, sort, filters)
  const { counts, refresh: refreshCounts } = useFeedCounts()
  const { revision } = useSearchActivity()
  const { selected, setSelectedId, leave, step } = useSelection(feed.offers, isDesktop)
  const triage = useTriage({ view, feed, refreshCounts, onLeave: leave })

  useEffect(refreshCounts, [revision, refreshCounts])
  useSeenTracking(selected, feed, refreshCounts)
  useTriageShortcuts(selected, triage, step, feed.offers.length > 0)

  const changeView = (next: FeedView) => {
    query.update({ view: next })
    setSelectedId(null)
  }
  const pendingNew = activeFilterCount(filters) ? 0 : countPendingNew(view, feed, counts.new)
  return { query, changeView, feed, counts, selected, setSelectedId, triage, isDesktop, pendingNew }
}

function useSeenTracking(selected: OfferSummary | null, feed: FeedState, refreshCounts: () => void) {
  const { patchLocal } = feed
  const onSeen = useCallback(
    (id: string) => {
      patchLocal(id, { status: 'SEEN' })
      refreshCounts()
    },
    [patchLocal, refreshCounts],
  )
  useSeenOnDwell(selected, onSeen)
}

type Triage = (offer: OfferSummary, status: OfferStatus | null) => Promise<void>

function useTriageShortcuts(
  selected: OfferSummary | null,
  triage: Triage,
  step: (d: number) => void,
  enabled: boolean,
) {
  // Rappuyer sur la touche de l'état actif le retire
  const act = (status: OfferStatus) => selected && void triage(selected, selected.status === status ? 'SEEN' : status)
  useFeedKeyboard(
    {
      next: () => step(1),
      previous: () => step(-1),
      favorite: () => act('FAVORITE'),
      interested: () => act('INTERESTED'),
      reject: () => act('REJECTED'),
      open: () => selected && window.open(selected.url, '_blank', 'noopener'),
    },
    enabled,
  )
}

// Offres arrivées pendant la lecture : on propose de les afficher plutôt que de bousculer la liste.
// Les offres vues pendant la lecture restent affichées mais ne comptent plus parmi les nouvelles.
function countPendingNew(view: FeedView, feed: FeedState, newCount: number): number {
  if (view !== 'new' || feed.loading) return 0
  const seenHere = feed.offers.filter(o => o.status === 'SEEN').length
  return Math.max(0, newCount - (feed.total - seenHere))
}
