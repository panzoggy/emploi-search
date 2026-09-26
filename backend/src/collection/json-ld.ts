import * as cheerio from 'cheerio'

// Les trois sites publient l'offre au format schema.org/JobPosting pour Google Jobs :
// c'est la donnée la plus fiable de la page, bien plus stable que le HTML.
export interface JobPostingLd {
  title?: string
  description?: string
  datePosted?: string
  employmentType?: string | string[]
  baseSalary?: unknown
  experienceRequirements?: unknown
  jobLocationType?: string
  hiringOrganization?: { name?: string }
}

const findJobPosting = (node: unknown): JobPostingLd | undefined => {
  if (Array.isArray(node)) return node.map(findJobPosting).find(Boolean)
  if (!node || typeof node !== 'object') return undefined
  const record = node as Record<string, unknown>
  if (record['@type'] === 'JobPosting') return record as JobPostingLd
  return findJobPosting(record['@graph'])
}

export function extractJobPosting(html: string): JobPostingLd | undefined {
  const $ = cheerio.load(html)
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try {
      const posting = findJobPosting(JSON.parse($(script).text()))
      if (posting) return posting
    } catch {
      // Bloc JSON-LD mal formé : on passe au suivant
    }
  }
  return undefined
}

export function htmlToText(html: string): string {
  const decoded = /&lt;\w/.test(html) ? cheerio.load(html).text() : html
  const $ = cheerio.load(decoded)
  $('br').replaceWith('\n')
  $('li').prepend('• ')
  $('p, li, div, h1, h2, h3, h4, h5, h6, tr').append('\n')
  return $.root()
    .text()
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const employmentTypes = (posting: JobPostingLd): string[] => [posting.employmentType ?? []].flat().map(String)

export const experienceText = (posting: JobPostingLd): string => {
  const req = posting.experienceRequirements
  if (!req) return ''
  if (typeof req === 'string') return req
  const months = Number((req as { monthsOfExperience?: unknown }).monthsOfExperience)
  return Number.isFinite(months) && months > 0 ? `${Math.round(months / 12)} ans d'expérience` : ''
}
