import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useStableValue } from '../shared/lib/useStableValue'
import { apiErrorMessage } from '../shared/api/client'
import { feedReducer, INITIAL_FEED, type FeedAction, type FeedData } from './feed-reducer'
import { offersApi } from './offers-api'
import type { FeedFilters, SortOrder } from './feed-query'
import type { FeedPage, FeedView, OfferSummary } from './types'

const PAGE_SIZE = 30

export interface FeedState extends FeedData {
  reload: () => Promise<void>
  loadMore: () => Promise<void>
  removeLocal: (id: string) => void
  patchLocal: (id: string, patch: Partial<OfferSummary>) => void
}

// Transforme le résultat d'une requête en action du reducer, succès ou échec
async function settle(request: Promise<FeedPage>, type: 'loaded' | 'appended', message: string): Promise<FeedAction> {
  try {
    return { type, page: await request }
  } catch (err) {
    return { type: 'failed', error: apiErrorMessage(err, message) }
  }
}

export function useFeed(view: FeedView, sort: SortOrder, filters: FeedFilters): FeedState {
  const [state, dispatch] = useReducer(feedReducer, INITIAL_FEED)
  const request = useRef(0)
  const fetchPage = useFeedFetcher(view, sort, filters)

  const reload = useCallback(async () => {
    const id = ++request.current
    dispatch({ type: 'loading' })
    const action = await settle(fetchPage(0), 'loaded', 'Impossible de charger les offres')
    if (id === request.current) dispatch(action)
  }, [fetchPage])

  // Décalage = offres déjà affichées : le tri en cours ne fait sauter aucune offre
  const loadMore = useCallback(async () => {
    if (state.loadingMore || !state.hasMore) return
    dispatch({ type: 'loadingMore' })
    dispatch(await settle(fetchPage(state.offers.length), 'appended', 'Impossible de charger la suite'))
  }, [fetchPage, state.offers.length, state.hasMore, state.loadingMore])

  const removeLocal = useCallback((id: string) => dispatch({ type: 'removed', id }), [])
  const patchLocal = useCallback(
    (id: string, patch: Partial<OfferSummary>) => dispatch({ type: 'patched', id, patch }),
    [],
  )

  useEffect(() => {
    void reload()
  }, [reload])

  return { ...state, reload, loadMore, removeLocal, patchLocal }
}

function useFeedFetcher(view: FeedView, sort: SortOrder, filters: FeedFilters) {
  // Les filtres arrivent de l'URL sous forme d'un nouvel objet à chaque rendu
  const stableFilters = useStableValue(filters)
  return useCallback(
    (offset: number) => offersApi.feed({ view, sort, filters: stableFilters, offset, limit: PAGE_SIZE }),
    [view, sort, stableFilters],
  )
}
