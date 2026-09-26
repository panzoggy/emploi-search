import { api } from '../shared/api/client'
import type { SearchRun } from './types'

export type LaunchRequest = { query: string; location: string } | { fromProfile: true }

export const searchesApi = {
  launch: async (request: LaunchRequest): Promise<string[]> =>
    (await api.post<{ searchIds: string[] }>('/searches', request)).data.searchIds,
  active: async (): Promise<SearchRun[]> => (await api.get<SearchRun[]>('/searches/active')).data,
  history: async (page: number): Promise<{ searches: SearchRun[]; total: number }> =>
    (await api.get<{ searches: SearchRun[]; total: number }>('/searches', { params: { page, limit: 20 } })).data,
  rerun: async (id: string): Promise<void> => {
    await api.post(`/searches/${id}/rerun`)
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/searches/${id}`)
  },
}
