import { api } from '../shared/api/client'
import { toApiParams, type FeedFilters, type SortOrder } from './feed-query'
import type { FeedCounts, FeedPage, FeedView, OfferDetail, OfferStatus } from './types'

export interface FeedParams {
  view: FeedView
  sort: SortOrder
  filters: FeedFilters
  offset: number
  limit: number
}

export const offersApi = {
  feed: async ({ filters, ...params }: FeedParams): Promise<FeedPage> =>
    (await api.get<FeedPage>('/offers', { params: { ...params, ...toApiParams(filters) } })).data,
  counts: async (): Promise<FeedCounts> => (await api.get<FeedCounts>('/offers/counts')).data,
  detail: async (id: string): Promise<OfferDetail> => (await api.get<OfferDetail>(`/offers/${id}`)).data,
  setStatus: async (id: string, status: OfferStatus): Promise<void> => {
    await api.put(`/offers/${id}/status`, { status })
  },
  clearStatus: async (id: string): Promise<void> => {
    await api.delete(`/offers/${id}/status`)
  },
}
