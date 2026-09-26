import { contractFromDescription, detectRemote, detectSeniority, normalizeContract } from './offer-attributes.js'
import { employmentTypes, experienceText, htmlToText, type JobPostingLd } from './json-ld.js'
import { parseJsonLdSalary } from './salary.js'
import type { OfferDetails } from './types.js'

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  INTERN: 'stage',
  TEMPORARY: 'intérim',
  CONTRACTOR: 'freelance',
}

const parseDate = (value?: string): Date | undefined => {
  const date = value ? new Date(value) : undefined
  return date && !Number.isNaN(date.getTime()) ? date : undefined
}

// Transforme un JobPosting JSON-LD en détails exploitables, quel que soit le site
export function detailsFromPosting(posting: JobPostingLd, title: string): OfferDetails {
  const description = htmlToText(posting.description ?? '')
  const typeLabels = employmentTypes(posting).map(t => EMPLOYMENT_TYPE_LABELS[t.toUpperCase()] ?? '')
  return {
    description,
    company: posting.hiringOrganization?.name?.trim() || undefined,
    postedAt: parseDate(posting.datePosted),
    contractType: contractFromDescription(description) ?? normalizeContract(title, ...typeLabels),
    // HelloWork déclare TELECOMMUTE dès un jour de télétravail : c'est le texte qui dit s'il est complet
    remoteType: detectRemote(description) ?? (posting.jobLocationType === 'TELECOMMUTE' ? 'hybrid' : undefined),
    seniority: detectSeniority(title, `${description}\n${experienceText(posting)}`),
    ...parseJsonLdSalary(posting.baseSalary),
  }
}
