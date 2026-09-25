export interface User {
  id: string
  email: string
  name: string | null
  createdAt: string
  updatedAt: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  id: string
  userId: string
  keywords: string[]
  locations: string[]
  contractTypes: string[]
  remoteOnly: boolean
  salaryMin?: number
  salaryMax?: number
  experienceLevel?: string
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  externalId: string
  source: 'INDEED' | 'HELLOWORK' | 'LINKEDIN'
  title: string
  company: string
  location: string
  description: string
  url: string
  salaryMin?: number
  salaryMax?: number
  contractType?: string
  experienceLevel?: string
  remoteType?: string
  postedAt?: string
  scrapedAt: string
  searchId?: string
  search?: Search
  viewed: boolean
  viewedAt?: string
  rejected: boolean
  rejectedAt?: string
  rejectionReason: string | null | undefined
}

export interface Search {
  id: string
  userId: string
  query: string
  location: string
  filters: SearchFilters
  createdAt: string
  results?: Job[]
  _count?: { results: number }
}

export interface SearchFilters {
  contractTypes?: string[]
  remoteOnly?: boolean
  salaryMin?: number
  salaryMax?: number
  experienceLevel?: string
  sources?: ('INDEED' | 'HELLOWORK' | 'LINKEDIN')[]
}

export interface JobFilters {
  source?: 'INDEED' | 'HELLOWORK' | 'LINKEDIN'
  viewed?: 'all' | 'viewed' | 'unviewed'
  rejected?: 'all' | 'rejected' | 'not_rejected'
  searchId?: string
  company?: string
  location?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'postedAt' | 'scrapedAt' | 'title' | 'company'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
  contractType?: string
  experienceLevel?: string
  salaryMin?: number
  salaryMax?: number
  remoteOnly?: boolean
}

export interface PaginatedResponse<T> {
  jobs: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface JobStats {
  total: number
  viewed: number
  rejected: number
  unviewed: number
  newToday: number
  bySource: { source: string; count: number }[]
}

export interface UserStats {
  totalViews: number
  totalRejections: number
  viewsThisWeek: number
  rejectionsThisWeek: number
  topCompanies: Record<string, number>
  topLocations: Record<string, number>
}

export interface ScrapingLog {
  id: string
  source: 'INDEED' | 'HELLOWORK' | 'LINKEDIN'
  query: string
  location: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  jobsFound: number
  error?: string
  startedAt: string
  finishedAt?: string
}