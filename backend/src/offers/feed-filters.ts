import type { Prisma } from '@prisma/client'
import { z } from 'zod'

const SOURCES = ['INDEED', 'HELLOWORK', 'LINKEDIN'] as const
const CONTRACTS = ['CDI', 'CDD', 'Intérim', 'Freelance', 'Stage', 'Alternance'] as const

// Listes passées en "a,b,c" dans l'URL
const csv = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .optional()
    .transform(raw => (raw ? raw.split(',').filter(Boolean) : []))
    .pipe(z.array(z.enum(values)))

export const feedFiltersSchema = z.object({
  q: z.string().trim().max(80).optional(),
  sources: csv(SOURCES),
  contracts: csv(CONTRACTS),
  remote: z.enum(['hybrid', 'full']).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxAgeDays: z.coerce.number().int().min(1).max(365).optional(),
})

export type FeedFilters = z.infer<typeof feedFiltersSchema>

const DAY_MS = 86_400_000

// Conditions sur l'offre elle-même ; le score minimum porte sur la table des scores
export function offerConditions(filters: FeedFilters): Prisma.OfferWhereInput[] {
  const conditions: Prisma.OfferWhereInput[] = []
  if (filters.q) conditions.push({ OR: [{ title: { contains: filters.q } }, { company: { contains: filters.q } }] })
  if (filters.sources.length) conditions.push({ source: { in: filters.sources } })
  if (filters.contracts.length) conditions.push({ contractType: { in: filters.contracts } })
  // "Au moins partiel" inclut le télétravail complet
  if (filters.remote) conditions.push({ remoteType: { in: filters.remote === 'full' ? ['full'] : ['hybrid', 'full'] } })
  if (filters.maxAgeDays) {
    const since = new Date(Date.now() - filters.maxAgeDays * DAY_MS)
    conditions.push({ OR: [{ postedAt: { gte: since } }, { postedAt: null, scrapedAt: { gte: since } }] })
  }
  return conditions
}
