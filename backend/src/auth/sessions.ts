import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '../shared/db.js'

const DAY_MS = 86_400_000
// Pas de déconnexion automatique : 400 jours (plafond des navigateurs pour un cookie),
// prolongés à chaque utilisation. Seul "Déconnexion" ferme une session.
export const SESSION_DAYS = 400
const RENEW_AFTER_MS = DAY_MS

const digest = (token: string): string => createHash('sha256').update(token).digest('hex')
const freshExpiry = () => new Date(Date.now() + SESSION_DAYS * DAY_MS)

// Le jeton ne vit que dans le cookie ; la base n'en garde que l'empreinte SHA-256
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await prisma.session.create({ data: { id: digest(token), userId, expiresAt: freshExpiry() } })
  return token
}

export interface SessionUser {
  id: string
  username: string
  // La session vient d'être prolongée : le cookie doit l'être aussi
  renewed: boolean
}

export async function userForSession(token: string): Promise<SessionUser | null> {
  const session = await prisma.session.findUnique({
    where: { id: digest(token) },
    include: { user: { select: { id: true, username: true } } },
  })
  if (!session || session.expiresAt.getTime() <= Date.now()) return null
  const renewed = freshExpiry().getTime() - session.expiresAt.getTime() > RENEW_AFTER_MS
  if (renewed) await prisma.session.update({ where: { id: session.id }, data: { expiresAt: freshExpiry() } })
  return { ...session.user, renewed }
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: digest(token) } })
}

export async function purgeExpiredSessions(): Promise<number> {
  return (await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })).count
}
