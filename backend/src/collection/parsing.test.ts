import { describe, expect, it } from 'vitest'
import { parseJsonLdSalary, parseSalaryText } from './salary.js'
import { contractFromDescription, detectRemote, detectSeniority, normalizeContract } from './offer-attributes.js'
import { extractJobPosting, htmlToText } from './json-ld.js'
import { detailsFromPosting } from './offer-details.js'

describe('parseSalaryText', () => {
  it('lit une fourchette annuelle avec espaces insécables', () => {
    expect(parseSalaryText('38 000 - 42 000 € / an')).toEqual({ salaryMin: 38000, salaryMax: 42000 })
  })
  it('annualise un salaire mensuel', () => {
    expect(parseSalaryText('De 2 000 € à 2 500 € par mois')).toEqual({ salaryMin: 24000, salaryMax: 30000 })
  })
  it('comprend les k€', () => {
    expect(parseSalaryText('45k€ - 55k€')).toEqual({ salaryMin: 45000, salaryMax: 55000 })
  })
  it('annualise un taux horaire', () => {
    expect(parseSalaryText("12,50 € de l'heure").salaryMin).toBe(Math.round(12.5 * 1607))
  })
  it('ignore les montants absurdes', () => {
    expect(parseSalaryText('Prime de 300 €')).toEqual({})
  })
  it('lit le baseSalary JSON-LD', () => {
    expect(parseJsonLdSalary({ value: { minValue: 2000, maxValue: 2400, unitText: 'MONTH' } })).toEqual({
      salaryMin: 24000,
      salaryMax: 28800,
    })
  })
})

describe('attributs des offres', () => {
  it('normalise les contrats', () => {
    expect(normalizeContract("Contrat d'apprentissage")).toBe('Alternance')
    expect(normalizeContract('CDI')).toBe('CDI')
    expect(normalizeContract('Temps plein')).toBeUndefined()
  })
  it('lit la ligne "Type d\'emploi" des descriptions', () => {
    expect(contractFromDescription("Salaire : 30k\nType d'emploi : CDD, Temps plein")).toBe('CDD')
  })
  it('distingue télétravail complet, partiel et absent', () => {
    expect(detectRemote('Poste en full remote')).toBe('full')
    expect(detectRemote('Télétravail partiel à 33520 Bruges')).toBe('hybrid')
    expect(detectRemote('Pas de télétravail possible')).toBeUndefined()
  })
  it("déduit le niveau de l'intitulé puis des années demandées", () => {
    expect(detectSeniority('Développeur Senior React')).toBe('senior')
    expect(detectSeniority('Stage - Assistant marketing')).toBe('intern')
    expect(detectSeniority('Comptable', "Vous justifiez de 3 ans d'expérience minimum")).toBe('mid')
    expect(detectSeniority('Comptable', 'Aucune précision')).toBeUndefined()
  })
})

describe('JSON-LD', () => {
  it('trouve le JobPosting, y compris dans un @graph', () => {
    const graph = { '@graph': [{ '@type': 'Organization' }, { '@type': 'JobPosting', title: 'X' }] }
    const html = `<script type="application/ld+json">${JSON.stringify(graph)}</script>`
    expect(extractJobPosting(html)?.title).toBe('X')
  })
  it('convertit la description HTML en texte lisible', () => {
    expect(htmlToText('<p>Missions</p><ul><li>Coder</li><li>Tester</li></ul>')).toBe('Missions\n• Coder\n• Tester')
  })
})

describe('detailsFromPosting', () => {
  it('ne prend pas TELECOMMUTE pour du télétravail complet', () => {
    const partial = detailsFromPosting(
      { jobLocationType: 'TELECOMMUTE', description: 'Télétravail : 1 jour par semaine' },
      'Dev',
    )
    expect(partial.remoteType).toBe('hybrid')
    expect(detailsFromPosting({ jobLocationType: 'TELECOMMUTE', description: 'Rien' }, 'Dev').remoteType).toBe('hybrid')
    expect(detailsFromPosting({ description: 'Poste en full remote' }, 'Dev').remoteType).toBe('full')
  })
})
