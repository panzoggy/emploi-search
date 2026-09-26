import { CITY_DEPARTMENTS } from '../shared/french-places.js'
import { containsTerm, normalize } from '../shared/text.js'

const REGIONS: Record<string, string[]> = {
  'ile-de-france': ['75', '77', '78', '91', '92', '93', '94', '95'],
  idf: ['75', '77', '78', '91', '92', '93', '94', '95'],
}

const REMOTE_WORDS = /^(teletravail|remote|full remote|a distance|100 ?% teletravail)$/

export const isRemoteWish = (place: string): boolean => REMOTE_WORDS.test(normalize(place))

const departmentsOf = (place: string): string[] => {
  const key = normalize(place).replace(/\s+/g, ' ')
  if (/^\d{2}$|^2[ab]$/.test(key)) return [key.toUpperCase()]
  const department = CITY_DEPARTMENTS.get(key)
  return REGIONS[key] ?? (department ? [department] : [])
}

// "69330 Meyzieu", "Lyon 3e - 69", "Villeurbanne (69)"
const jobDepartment = (jobLocation: string): string | undefined => {
  const text = normalize(jobLocation)
  const code = text.match(/\b(\d{2})\d{3}\b/)?.[1] ?? text.match(/[-(]\s*(\d{2}|2[ab])\s*\)?\s*$/)?.[1]
  if (code) return code.toUpperCase()
  const city = [...CITY_DEPARTMENTS.keys()].find(c => containsTerm(text, c))
  return city ? CITY_DEPARTMENTS.get(city) : undefined
}

export type PlaceMatch = { level: 'city' | 'department'; place: string } | undefined

export function matchPlace(jobLocation: string, wishedPlaces: string[]): PlaceMatch {
  const text = normalize(jobLocation)
  const places = wishedPlaces.filter(p => !isRemoteWish(p))
  const city = places.find(p => containsTerm(text, p))
  if (city) return { level: 'city', place: city }
  const department = jobDepartment(jobLocation)
  const sameDepartment = department ? places.find(p => departmentsOf(p).includes(department)) : undefined
  return sameDepartment ? { level: 'department', place: sameDepartment } : undefined
}
