import { create } from 'zustand'
import type { JobFilters } from '../types'

interface JobStoreState {
  filters: JobFilters
  setFilters: (filters: Partial<JobFilters>) => void
  resetFilters: () => void
  selectedJobId: string | null
  setSelectedJobId: (id: string | null) => void
  viewMode: 'list' | 'grid'
  setViewMode: (mode: 'list' | 'grid') => void
}

const defaultFilters: JobFilters = {
  viewed: 'unviewed',
  rejected: 'not_rejected',
  sortBy: 'postedAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
}

export const useJobStore = create<JobStoreState>((set) => ({
  filters: defaultFilters,
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters, page: 1 },
  })),
  resetFilters: () => set({ filters: defaultFilters }),
  selectedJobId: null,
  setSelectedJobId: (id) => set({ selectedJobId: id }),
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),
}))