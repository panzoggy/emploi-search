import { describe, expect, it } from 'vitest'
import { feedFiltersSchema, offerConditions } from './feed-filters.js'

describe('filtres du flux', () => {
  it("lit les listes passées dans l'URL", () => {
    const filters = feedFiltersSchema.parse({ sources: 'INDEED,LINKEDIN', contracts: 'CDI', minScore: '60' })
    expect(filters).toMatchObject({ sources: ['INDEED', 'LINKEDIN'], contracts: ['CDI'], minScore: 60 })
  })
  it('refuse une source inconnue', () => {
    expect(() => feedFiltersSchema.parse({ sources: 'MONSTER' })).toThrow()
  })
  it('"au moins partiel" inclut le télétravail complet', () => {
    const [condition] = offerConditions(feedFiltersSchema.parse({ remote: 'hybrid' }))
    expect(condition).toEqual({ remoteType: { in: ['hybrid', 'full'] } })
  })
  it('sans filtre, aucune condition', () => {
    expect(offerConditions(feedFiltersSchema.parse({}))).toEqual([])
  })
})
