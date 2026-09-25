import axios from 'axios'
import type { Job, Search, JobFilters, SearchFilters, JobStats, UserStats, ScrapingLog, User, UserPreferences } from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Use a fixed user ID for personal use
const DEFAULT_USER_ID = 'personal-user'

// Initialize user ID on first load
if (!localStorage.getItem('userId')) {
  localStorage.setItem('userId', DEFAULT_USER_ID)
}

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId') || DEFAULT_USER_ID
  config.headers['x-user-id'] = userId
  return config
})

export const userApi = {
  getPreferences: () => api.get<UserPreferences>('/user/preferences'),
  updatePreferences: (data: Partial<UserPreferences>) => api.put<UserPreferences>('/user/preferences', data),
  getStats: () => api.get<UserStats>('/user/stats'),
}

export const jobsApi = {
  getJobs: (filters: JobFilters = {}) =>
    api.get<{ jobs: Job[]; pagination: any }>('/jobs', { params: filters }),
  getJob: (id: string) => api.get<Job>(`/jobs/${id}`),
  getStats: () => api.get<JobStats>('/jobs/stats'),
  viewJob: (jobId: string) => api.post('/jobs/action', { jobId, action: 'view' }),
  rejectJob: (jobId: string, reason?: string) => api.post('/jobs/action', { jobId, action: 'reject', reason }),
  unrejectJob: (jobId: string) => api.delete(`/jobs/${jobId}/reject`),
}

export const searchApi = {
  createSearch: (data: { query: string; location: string } & SearchFilters) =>
    api.post<{ search: Search; jobs: Job[] }>('/search', data),
  getHistory: (page = 1, limit = 20) =>
    api.get<{ searches: Search[]; pagination: any }>('/search/history', { params: { page, limit } }),
  getSearch: (id: string) => api.get<Search>(`/search/${id}`),
  deleteSearch: (id: string) => api.delete(`/search/${id}`),
}

export const scrapingApi = {
  getLogs: (page = 1, limit = 20) =>
    api.get<{ logs: ScrapingLog[]; pagination: any }>('/scraping/logs', { params: { page, limit } }),
  getStats: () => api.get<{
    bySource: { source: string; runs: number; totalJobs: number }[]
    byStatus: { status: string; count: number }[]
    recent: ScrapingLog[]
  }>('/scraping/stats'),
}

export default api