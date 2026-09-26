import { extractText, getDocumentProxy } from 'unpdf'
import { CITY_NAMES } from '../shared/french-places.js'
import { containsTerm, normalize } from '../shared/text.js'
import { JOB_NOUNS, SKILLS } from './skills-dictionary.js'
import type { SeniorityWish } from './profile-store.js'

export interface CvSuggestions {
  targetTitles: string[]
  skills: string[]
  locations: string[]
  yearsOfExperience: number | null
  seniority: SeniorityWish | null
}

export async function pdfToText(file: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(file)
  const { text } = await extractText(pdf, { mergePages: true })
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const mentions = (rawText: string, normalizedText: string, term: string): number => {
  // Termes très courts : casse exacte exigée, sinon "C" reconnaîtrait "c'est"
  if (term.length <= 2)
    return (rawText.match(new RegExp(`(^|[^\\w+#'’])${escape(term)}(?![\\w+#'’])`, 'g')) ?? []).length
  return containsTerm(normalizedText, term) ? 1 : 0
}

function detectSkills(rawText: string): string[] {
  const text = normalize(rawText)
  return SKILLS.map(([label, ...aliases]) => ({
    label,
    hits: [label, ...aliases].reduce((n, term) => n + mentions(rawText, text, term), 0),
  }))
    .filter(s => s.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 25)
    .map(s => s.label)
}

const JOB_NOUN_PATTERN = new RegExp(`(^|[^a-z])(${JOB_NOUNS.map(escape).join('|')})([^a-z]|$)`)

// "Développeur Full-Stack – Acme (2020 – 2023)" → "Développeur Full-Stack"
function cleanTitleLine(line: string): string | undefined {
  const parts = line.split(/\s+[–—|@•·-]\s+|\s+(?:chez|at)\s+|\s*\(/i)
  const part = parts.find(p => JOB_NOUN_PATTERN.test(normalize(p).split(' ').slice(0, 2).join(' ')))
  const cleaned = part
    ?.replace(/\b(19|20)\d{2}\b.*$/, '')
    .replace(/[,:;]+$/, '')
    .trim()
  return cleaned && cleaned.length >= 4 && cleaned.length <= 60 ? cleaned : undefined
}

function detectTitles(text: string): string[] {
  const titles = new Map<string, string>()
  for (const line of text.split('\n').map(l => l.trim())) {
    if (line.length < 4 || line.length > 90 || /@|https?:|\d{2}[ .]?\d{2}[ .]?\d{2}[ .]?\d{2}/.test(line)) continue
    // Une phrase (point final, énumération) décrit une mission, pas un poste
    if (/\.$/.test(line) || (line.match(/,/g) ?? []).length >= 2) continue
    const title = cleanTitleLine(line)
    if (title && !titles.has(normalize(title))) titles.set(normalize(title), title)
    if (titles.size >= 4) break
  }
  return [...titles.values()]
}

const MONTH_YEAR = String.raw`(?:[a-zéû]{3,9}\.?\s+)?((?:19|20)\d{2})`
const PERIOD = new RegExp(
  `${MONTH_YEAR}\\s*(?:-|–|—|à|au|to)\\s*(?:${MONTH_YEAR}|(aujourd.hui|present|présent|actuel|now|ce jour|en cours))`,
  'gi',
)

// Somme des périodes d'expérience (fusionnées si elles se chevauchent), hors section Formation
function detectYears(text: string): number | null {
  const explicit = normalize(text).match(/(\d{1,2})\s*ans d.experience/)?.[1]
  if (explicit) return Number(explicit)
  const lower = text.toLowerCase()
  const educationAt = lower.search(/\n\s*(formations?|études|education|diplômes)\s*\n/)
  const experienceAt = lower.search(/exp[ée]riences?( professionnelles?)?\s*\n/)
  const scope = educationAt > experienceAt && experienceAt >= 0 ? text.slice(experienceAt, educationAt) : text
  const now = new Date().getFullYear()
  const ranges = [...scope.matchAll(PERIOD)]
    .map(m => [Number(m[1]), m[2] ? Number(m[2]) : now] as const)
    .filter(([start, end]) => start <= end && end <= now && start > now - 50)
    .sort((a, b) => a[0] - b[0])
  let total = 0
  let cursor = 0
  for (const [start, end] of ranges) {
    const from = Math.max(start, cursor)
    if (end > from) total += end - from
    cursor = Math.max(cursor, end)
  }
  return ranges.length ? total : null
}

const seniorityFor = (years: number | null): SeniorityWish | null =>
  years === null ? null : years < 2 ? 'junior' : years < 5 ? 'mid' : years < 10 ? 'senior' : 'lead'

// L'adresse est presque toujours dans l'en-tête du CV
function detectLocations(text: string): string[] {
  const header = normalize(text.split('\n').slice(0, 15).join(' '))
  return [...CITY_NAMES.entries()]
    .filter(([key]) => containsTerm(header, key))
    .map(([, name]) => name)
    .slice(0, 2)
}

export function analyzeCv(text: string): CvSuggestions {
  const yearsOfExperience = detectYears(text)
  return {
    targetTitles: detectTitles(text),
    skills: detectSkills(text),
    locations: detectLocations(text),
    yearsOfExperience,
    seniority: seniorityFor(yearsOfExperience),
  }
}
