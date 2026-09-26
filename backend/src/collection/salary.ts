// Tout est ramené en brut annuel pour pouvoir comparer
const ANNUAL_FACTOR = { year: 1, month: 12, day: 218, hour: 1607 } as const
type Period = keyof typeof ANNUAL_FACTOR

const isPlausible = (annual: number): boolean => annual >= 5_000 && annual <= 400_000

const detectPeriod = (text: string, amount: number): Period => {
  if (/heure|horaire|hour|\/ ?h\b/i.test(text)) return 'hour'
  if (/jour|journ|day|tjm/i.test(text)) return 'day'
  if (/mois|mensuel|month/i.test(text)) return 'month'
  if (/\ban\b|annuel|year|\/ ?an/i.test(text)) return 'year'
  if (amount < 100) return 'hour'
  return amount < 10_000 ? 'month' : 'year'
}

export interface SalaryRange {
  salaryMin?: number
  salaryMax?: number
}

export function parseSalaryText(raw?: string | null): SalaryRange {
  if (!raw || !/\d/.test(raw)) return {}
  const text = raw.replace(/[  ]/g, ' ')
  const amounts = [...text.matchAll(/(\d{1,3}(?:[ .]\d{3})+|\d+(?:,\d+)?)\s*(k)?/gi)]
    .map(([, num, k]) => Number(num.replace(/[ .]/g, '').replace(',', '.')) * (k ? 1000 : 1))
    .filter(n => n >= 7)
  if (amounts.length === 0) return {}
  const [low, high = low] = amounts
  const factor = ANNUAL_FACTOR[detectPeriod(text, Math.max(low, high))]
  const [min, max] = [Math.round(Math.min(low, high) * factor), Math.round(Math.max(low, high) * factor)]
  return isPlausible(min) && isPlausible(max) ? { salaryMin: min, salaryMax: max } : {}
}

const UNIT_TO_PERIOD: Record<string, Period> = { YEAR: 'year', MONTH: 'month', DAY: 'day', HOUR: 'hour' }

// baseSalary du JSON-LD schema.org
export function parseJsonLdSalary(baseSalary: unknown): SalaryRange {
  if (!baseSalary || typeof baseSalary !== 'object') return {}
  const value = (baseSalary as { value?: Record<string, unknown> }).value
  if (!value) return {}
  const period = UNIT_TO_PERIOD[String(value.unitText ?? '').toUpperCase()] ?? 'year'
  const min = Number(value.minValue ?? value.value)
  const max = Number(value.maxValue ?? value.value)
  if (!Number.isFinite(min) || min <= 0) return {}
  const factor = ANNUAL_FACTOR[period]
  const range = {
    salaryMin: Math.round(min * factor),
    salaryMax: Math.round((Number.isFinite(max) && max > 0 ? max : min) * factor),
  }
  return isPlausible(range.salaryMin) && isPlausible(range.salaryMax) ? range : {}
}
