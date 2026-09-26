import type { Prisma } from '@prisma/client'
import { prisma } from '../shared/db.js'
import { isSealed, isSealedText, seal, sealText, unseal, unsealText } from '../shared/sealed-data.js'
import { parseList, toJsonList } from '../shared/json-list.js'

export type RemotePreference = 'any' | 'hybrid' | 'full'
export type SeniorityWish = 'junior' | 'mid' | 'senior' | 'lead'

export interface ProfileData {
  targetTitles: string[]
  skills: string[]
  locations: string[]
  contractTypes: string[]
  remote: RemotePreference
  salaryMin: number | null
  seniority: SeniorityWish | null
  excludedKeywords: string[]
  excludedCompanies: string[]
  cvFileName: string | null
  cvText: string | null
  cvUpdatedAt: Date | null
}

const LIST_FIELDS = [
  'targetTitles',
  'skills',
  'locations',
  'contractTypes',
  'excludedKeywords',
  'excludedCompanies',
] as const

const isRemote = (v: string): v is RemotePreference => ['any', 'hybrid', 'full'].includes(v)
const isSeniority = (v: string | null): v is SeniorityWish =>
  v !== null && ['junior', 'mid', 'senior', 'lead'].includes(v)

// Tout sauf le PDF, lourd et inutile au matching
const PROFILE_FIELDS = {
  targetTitles: true,
  skills: true,
  locations: true,
  contractTypes: true,
  remote: true,
  salaryMin: true,
  seniority: true,
  excludedKeywords: true,
  excludedCompanies: true,
  cvFileName: true,
  cvText: true,
  cvUpdatedAt: true,
} satisfies Prisma.ProfileSelect

export async function readProfile(userId: string): Promise<ProfileData> {
  const row = await prisma.profile.upsert({ where: { userId }, update: {}, create: { userId }, select: PROFILE_FIELDS })
  return {
    targetTitles: parseList(row.targetTitles),
    skills: parseList(row.skills),
    locations: parseList(row.locations),
    contractTypes: parseList(row.contractTypes),
    remote: isRemote(row.remote) ? row.remote : 'any',
    salaryMin: row.salaryMin,
    seniority: isSeniority(row.seniority) ? row.seniority : null,
    excludedKeywords: parseList(row.excludedKeywords),
    excludedCompanies: parseList(row.excludedCompanies),
    cvFileName: row.cvFileName,
    cvText: row.cvText === null ? null : unsealText(row.cvText, userId),
    cvUpdatedAt: row.cvUpdatedAt,
  }
}

export type ProfilePreferences = Omit<ProfileData, 'cvFileName' | 'cvText' | 'cvUpdatedAt'>

export async function writePreferences(userId: string, prefs: ProfilePreferences): Promise<void> {
  const lists = Object.fromEntries(LIST_FIELDS.map(field => [field, toJsonList(prefs[field])]))
  const data = { ...lists, remote: prefs.remote, salaryMin: prefs.salaryMin, seniority: prefs.seniority }
  await prisma.profile.upsert({ where: { userId }, update: data, create: { userId, ...data } })
}

export async function writeCv(
  userId: string,
  cv: { fileName: string; text: string; file: Buffer } | null,
): Promise<void> {
  const data = {
    cvFileName: cv?.fileName ?? null,
    // Le CV contient des données personnelles : chiffré au repos
    cvText: cv ? sealText(cv.text, userId) : null,
    cvFile: cv ? seal(cv.file, userId) : null,
    cvUpdatedAt: cv ? new Date() : null,
  }
  await prisma.profile.upsert({ where: { userId }, update: data, create: { userId, ...data } })
}

// Le PDF n'est lu qu'à la demande (aperçu) : il n'encombre pas les lectures du profil
export async function readCvFile(userId: string): Promise<{ fileName: string; file: Buffer } | null> {
  const row = await prisma.profile.findUnique({ where: { userId }, select: { cvFileName: true, cvFile: true } })
  return row?.cvFile ? { fileName: row.cvFileName ?? 'cv.pdf', file: unseal(row.cvFile, userId) } : null
}

export async function hasCvFile(userId: string): Promise<boolean> {
  return (await prisma.profile.count({ where: { userId, cvFile: { not: null } } })) > 0
}

// Au démarrage : chiffre les CV enregistrés avant l'arrivée du chiffrement
export async function sealLegacyCvs(): Promise<number> {
  const rows = await prisma.profile.findMany({
    where: { OR: [{ cvText: { not: null } }, { cvFile: { not: null } }] },
    select: { userId: true, cvText: true, cvFile: true },
  })
  const legacy = rows.filter(r => (r.cvText && !isSealedText(r.cvText)) || (r.cvFile && !isSealed(r.cvFile)))
  for (const row of legacy) {
    await prisma.profile.update({
      where: { userId: row.userId },
      data: {
        cvText: row.cvText && !isSealedText(row.cvText) ? sealText(row.cvText, row.userId) : undefined,
        cvFile: row.cvFile && !isSealed(row.cvFile) ? seal(row.cvFile, row.userId) : undefined,
      },
    })
  }
  return legacy.length
}
