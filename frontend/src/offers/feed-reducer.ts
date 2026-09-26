import type { FeedPage, OfferSummary } from './types'

export interface FeedData {
  offers: OfferSummary[]
  total: number
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  error: string | null
}

export type FeedAction =
  | { type: 'loading' }
  | { type: 'loadingMore' }
  | { type: 'loaded'; page: FeedPage }
  | { type: 'appended'; page: FeedPage }
  | { type: 'failed'; error: string }
  | { type: 'removed'; id: string }
  | { type: 'patched'; id: string; patch: Partial<OfferSummary> }

export const INITIAL_FEED: FeedData = {
  offers: [],
  total: 0,
  hasMore: false,
  loading: true,
  loadingMore: false,
  error: null,
}

export function feedReducer(state: FeedData, action: FeedAction): FeedData {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true, error: null }
    case 'loadingMore':
      return { ...state, loadingMore: true }
    case 'loaded':
      return { ...state, ...action.page, loading: false }
    case 'appended': {
      const fresh = action.page.offers.filter(o => !state.offers.some(c => c.id === o.id))
      return {
        ...state,
        offers: [...state.offers, ...fresh],
        total: action.page.total,
        hasMore: action.page.hasMore,
        loadingMore: false,
      }
    }
    case 'failed':
      return { ...state, loading: false, loadingMore: false, error: action.error }
    case 'removed':
      return { ...state, offers: state.offers.filter(o => o.id !== action.id), total: Math.max(0, state.total - 1) }
    case 'patched':
      return { ...state, offers: state.offers.map(o => (o.id === action.id ? { ...o, ...action.patch } : o)) }
  }
}
