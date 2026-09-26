export type RemotePreference = 'any' | 'hybrid' | 'full'
export type Seniority = 'junior' | 'mid' | 'senior' | 'lead'

export const CONTRACT_TYPES = ['CDI', 'CDD', 'Intérim', 'Freelance', 'Stage', 'Alternance'] as const
export type ContractType = (typeof CONTRACT_TYPES)[number]

export interface ProfilePreferences {
  targetTitles: string[]
  skills: string[]
  locations: string[]
  contractTypes: ContractType[]
  remote: RemotePreference
  salaryMin: number | null
  seniority: Seniority | null
  excludedKeywords: string[]
  excludedCompanies: string[]
}

export interface Profile extends ProfilePreferences {
  hasCv: boolean
  cvFileName: string | null
  cvUpdatedAt: string | null
  hasCvFile: boolean
  cvText: string | null
}

export interface CvSuggestions {
  targetTitles: string[]
  skills: string[]
  locations: string[]
  yearsOfExperience: number | null
  seniority: Seniority | null
}

export const SENIORITY_VALUES: Seniority[] = ['junior', 'mid', 'senior', 'lead']

export const SENIORITY_LABELS: Record<Seniority, string> = {
  junior: 'Junior',
  mid: 'Confirmé',
  senior: 'Senior',
  lead: 'Lead',
}

export const toPreferences = (p: Profile): ProfilePreferences => ({
  targetTitles: p.targetTitles,
  skills: p.skills,
  locations: p.locations,
  contractTypes: p.contractTypes,
  remote: p.remote,
  salaryMin: p.salaryMin,
  seniority: p.seniority,
  excludedKeywords: p.excludedKeywords,
  excludedCompanies: p.excludedCompanies,
})
