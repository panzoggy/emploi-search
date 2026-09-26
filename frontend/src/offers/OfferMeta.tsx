import { salaryRange } from '../shared/lib/format'
import type { OfferSummary, Source } from './types'

export const REMOTE_LABELS = { hybrid: 'Télétravail partiel', full: 'Télétravail complet' } as const
export const SOURCE_CODES: Record<Source, string> = { HELLOWORK: 'HW', INDEED: 'IN', LINKEDIN: 'LI' }

// "CDI · 40–48 k€ · Télétravail partiel"
export const offerFacts = (offer: OfferSummary): string[] =>
  [
    offer.contractType,
    salaryRange(offer.salaryMin, offer.salaryMax),
    offer.remoteType ? REMOTE_LABELS[offer.remoteType] : null,
  ].filter((fact): fact is string => Boolean(fact))
