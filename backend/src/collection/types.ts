export type SourceName = 'INDEED' | 'HELLOWORK' | 'LINKEDIN'
export const SOURCES: SourceName[] = ['HELLOWORK', 'INDEED', 'LINKEDIN']

export type Seniority = 'intern' | 'apprentice' | 'junior' | 'mid' | 'senior' | 'lead'
export type RemoteType = 'hybrid' | 'full'

export const UNKNOWN_COMPANY = 'Entreprise non précisée'

// Ce qu'on lit dans la liste de résultats d'un site
export interface ListedOffer {
  externalId: string
  title: string
  company: string
  location: string
  url: string
  contractType?: string
  remoteType?: RemoteType
  salaryMin?: number
  salaryMax?: number
  postedAt?: Date
}

// Ce qu'on lit sur la page de l'offre elle-même
export interface OfferDetails {
  description: string
  company?: string
  postedAt?: Date
  contractType?: string
  remoteType?: RemoteType
  seniority?: Seniority
  salaryMin?: number
  salaryMax?: number
}

export interface ResultPage {
  offers: ListedOffer[]
  hasMore: boolean
  endReason?: string
}

// Une session garde l'état propre à un site (navigateur ouvert pour Indeed, par exemple)
export interface SourceSession {
  listPage(query: string, location: string, pageIndex: number): Promise<ResultPage>
  fetchDetails(offer: ListedOffer): Promise<OfferDetails | null>
  close(): Promise<void>
}

export interface Source {
  name: SourceName
  maxPages: number
  open(): Promise<SourceSession>
}

// Le site refuse de nous servir (anti-bot, 403, 429…)
export class SourceBlockedError extends Error {}
