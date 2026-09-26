import { differenceInDays, differenceInHours, formatDistanceToNowStrict } from 'date-fns'
import { fr } from 'date-fns/locale'

const parse = (value?: string | null): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function relativeDate(value?: string | null): string | null {
  const date = parse(value)
  if (!date) return null
  if (Date.now() - date.getTime() < 3_600_000) return "à l'instant"
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: fr })
}

// Âge court pour les colonnes : "3 h", "2 j", "5 sem"
export function compactAge(value?: string | null): string {
  const date = parse(value)
  if (!date) return '—'
  const hours = differenceInHours(new Date(), date)
  if (hours < 24) return `${Math.max(1, hours)} h`
  const days = differenceInDays(new Date(), date)
  return days < 21 ? `${days} j` : `${Math.round(days / 7)} sem`
}

const k = (n: number) => `${Math.round(n / 1000)} k€`

export function salaryRange(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null
  if (min && max && Math.abs(max - min) >= 1000) return `${Math.round(min / 1000)}–${k(max)}`
  return k(max ?? min ?? 0)
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count > 1 ? many : one}`
}
