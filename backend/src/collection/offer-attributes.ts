import { normalize } from '../shared/text.js'
import type { RemoteType, Seniority } from './types.js'

// Chaque site écrit le type de contrat à sa façon : on ramène tout à une liste courte
const CONTRACT_PATTERNS: [RegExp, string][] = [
  [/\b(alternance|alternant|apprenti|apprentissage|contrat pro|professionnalisation)/, 'Alternance'],
  [/\b(stage|stagiaire|internship|intern)\b/, 'Stage'],
  [/\b(interim|interimaire|temporary)\b/, 'Intérim'],
  [/\b(freelance|independant|portage|contractor|mission)\b/, 'Freelance'],
  [/\bcdd\b|duree determinee/, 'CDD'],
  [/\bcdi\b|duree indeterminee|permanent/, 'CDI'],
]

export function normalizeContract(...candidates: (string | null | undefined)[]): string | undefined {
  for (const candidate of candidates) {
    if (!candidate) continue
    const text = normalize(candidate)
    const match = CONTRACT_PATTERNS.find(([pattern]) => pattern.test(text))
    if (match) return match[1]
  }
  return undefined
}

// "Type d'emploi : CDI, Temps plein" : ligne présente dans la plupart des descriptions Indeed/HelloWork
export function contractFromDescription(description: string): string | undefined {
  const line = description.match(/(type (?:d[e' ]+)?(?:emploi|contrat)|contrat)\s*:?\s*([^\n]{2,60})/i)?.[2]
  return normalizeContract(line)
}

const FULL = '(100 ?%|full|complet|total|integral)'
const REMOTE = '(teletravail|remote)'
const FULL_REMOTE = new RegExp(`${FULL}\\W{0,3}(en )?${REMOTE}|${REMOTE}\\W{0,3}${FULL}|full remote`)

export function detectRemote(...texts: (string | null | undefined)[]): RemoteType | undefined {
  const text = normalize(texts.filter(Boolean).join(' '))
  if (!text || /(pas de|sans|aucun) (teletravail|remote)/.test(text)) return undefined
  if (FULL_REMOTE.test(text)) {
    return 'full'
  }
  return /teletravail|remote|hybride|home office/.test(text) ? 'hybrid' : undefined
}

const TITLE_SENIORITY: [RegExp, Seniority][] = [
  [/\b(stage|stagiaire|intern|internship)\b/, 'intern'],
  [/\b(alternance|alternant|apprenti|apprentissage)\b/, 'apprentice'],
  [/\b(junior|jr|debutant|entry level|jeune diplome)\b/, 'junior'],
  [/\b(lead|principal|head of|directeur|directrice|director|chief)\b/, 'lead'],
  [/\b(senior|sr|expert)\b/, 'senior'],
  [/\b(confirme|confirmee|experimente|experimentee)\b/, 'mid'],
]

export const seniorityFromYears = (years: number): Seniority =>
  years < 2 ? 'junior' : years < 5 ? 'mid' : years < 10 ? 'senior' : 'lead'

export function detectSeniority(title: string, description = ''): Seniority | undefined {
  const normalizedTitle = normalize(title)
  const fromTitle = TITLE_SENIORITY.find(([pattern]) => pattern.test(normalizedTitle))
  if (fromTitle) return fromTitle[1]
  const text = normalize(description)
  const years =
    text.match(/(\d{1,2})\s*(?:\+|a|-|ou plus)?\s*(?:\d{1,2}\s*)?ans?\s+(?:d |minimum d |mini d )?experience/)?.[1] ??
    text.match(/experience\s*(?:de|d au moins|minimum de|:)?\s*(\d{1,2})\s*ans/)?.[1] ??
    text.match(/(\d{1,2})\+?\s*years? of experience/)?.[1]
  if (years) return seniorityFromYears(Number(years))
  if (/\b(debutant(e)? accepte|premiere experience|jeune diplome)/.test(text)) return 'junior'
  return undefined
}
