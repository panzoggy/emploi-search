export type Source = 'INDEED' | 'HELLOWORK' | 'LINKEDIN'
export type FeedView = 'new' | 'favorites' | 'interested' | 'seen' | 'rejected'
export type OfferStatus = 'SEEN' | 'FAVORITE' | 'INTERESTED' | 'REJECTED'
export type Verdict = 'ok' | 'partial' | 'ko' | 'unknown'

export interface MatchReason {
  key: string
  label: string
  verdict: Verdict
  detail: string
}

export interface OfferSummary {
  id: string
  source: Source
  title: string
  company: string
  location: string
  url: string
  contractType: string | null
  remoteType: 'hybrid' | 'full' | null
  seniority: string | null
  salaryMin: number | null
  salaryMax: number | null
  postedAt: string | null
  scrapedAt: string
  status: OfferStatus | null
  score: number
  excluded: boolean
  reasons: MatchReason[]
}

export interface OfferDetail extends Omit<OfferSummary, 'score'> {
  description: string
  score: number | null
  search: { query: string; location: string } | null
}

export interface FeedPage {
  offers: OfferSummary[]
  total: number
  hasMore: boolean
}

export type FeedCounts = Record<FeedView, number>

export const SOURCE_LABELS: Record<Source, string> = { INDEED: 'Indeed', HELLOWORK: 'HelloWork', LINKEDIN: 'LinkedIn' }
export const SOURCES: Source[] = ['HELLOWORK', 'INDEED', 'LINKEDIN']
