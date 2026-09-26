import { describe, expect, it } from 'vitest'
import { scoreOffer, type OfferSignals, type ProfileSignals } from './scoring.js'

const profile: ProfileSignals = {
  targetTitles: ['Développeur React'],
  targetVectors: [],
  skills: ['React', 'TypeScript', 'Node.js'],
  locations: ['Lyon'],
  remote: 'any',
  contractTypes: ['CDI'],
  salaryMin: 40000,
  seniority: 'mid',
  excludedKeywords: ['stage'],
  excludedCompanies: ['Arnaque Corp'],
}

const offer = (patch: Partial<OfferSignals>): OfferSignals => ({
  title: 'Développeur React confirmé',
  company: 'Acme',
  location: '69003 Lyon',
  description: 'React, TypeScript et Node.js',
  contractType: 'CDI',
  seniority: 'mid',
  salaryMin: 42000,
  salaryMax: 48000,
  ...patch,
})

describe('scoreOffer', () => {
  it('note haut une offre qui coche tout', () => {
    expect(scoreOffer(profile, offer({})).score).toBeGreaterThanOrEqual(90)
  })
  it('note bas une offre hors sujet', () => {
    const result = scoreOffer(
      profile,
      offer({
        title: 'Comptable',
        description: 'Sage, bilans',
        location: 'Brest',
        contractType: 'CDD',
        seniority: 'senior',
      }),
    )
    expect(result.score).toBeLessThan(30)
  })
  it('reconnaît un lieu du même département', () => {
    const reason = scoreOffer(profile, offer({ location: 'Villeurbanne (69)' })).reasons.find(r => r.key === 'location')
    expect(reason?.verdict).toBe('ok')
  })
  it('exclut sur mot-clé ou entreprise', () => {
    expect(scoreOffer(profile, offer({ title: 'Stage développeur React' })).excluded).toBe(true)
    expect(scoreOffer(profile, offer({ company: 'ARNAQUE CORP' })).excluded).toBe(true)
  })
  it('traite une information absente comme neutre et le dit', () => {
    const result = scoreOffer(profile, offer({ salaryMin: null, salaryMax: null }))
    expect(result.reasons.find(r => r.key === 'salary')?.verdict).toBe('unknown')
  })
  it('ignore les critères que le profil ne renseigne pas', () => {
    const bare = { ...profile, contractTypes: [], salaryMin: null, seniority: null }
    expect(scoreOffer(bare, offer({})).reasons.map(r => r.key)).not.toContain('contract')
  })
})
