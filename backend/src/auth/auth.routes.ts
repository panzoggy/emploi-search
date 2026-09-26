import { timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../shared/db.js'
import { clientIp } from '../shared/client-ip.js'
import { AppError, asyncHandler } from '../shared/errors.js'
import { logger } from '../shared/logger.js'
import { hashPassword, verifyPassword } from './password.js'
import { requireAuth } from './require-auth.js'
import { clearSessionCookie, readSessionCookie, writeSessionCookie } from './session-cookie.js'
import { createSession, deleteSession } from './sessions.js'

export const authRouter = Router()

// Contre la devinette de mots de passe : 20 tentatives par quart d'heure et par adresse
const attempts = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  keyGenerator: clientIp,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives, réessaie dans un quart d'heure" },
})

const credentials = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,32}$/, '3 à 32 caractères : lettres, chiffres, point, tiret'),
  password: z.string().min(8, '8 caractères minimum').max(128),
})

const signupSchema = credentials.extend({ signupCode: z.string().optional() })

// Si SIGNUP_CODE est défini, il faut ce code pour créer un compte (instance ouverte sur Internet)
function checkSignupCode(given: string | undefined): void {
  const expected = process.env.SIGNUP_CODE
  if (!expected) return
  const a = Buffer.from(given ?? '')
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new AppError(403, "Code d'inscription incorrect")
}

authRouter.get('/config', (_req, res) => {
  res.json({ signupCodeRequired: Boolean(process.env.SIGNUP_CODE) })
})

authRouter.post(
  '/register',
  attempts,
  asyncHandler(async (req, res) => {
    const { username, password, signupCode } = signupSchema.parse(req.body)
    checkSignupCode(signupCode)
    if (await prisma.user.findUnique({ where: { username } })) throw new AppError(409, 'Ce nom est déjà pris')
    const user = await prisma.user.create({ data: { username, passwordHash: await hashPassword(password) } })
    writeSessionCookie(req, res, await createSession(user.id))
    logger.info(`Nouveau compte : ${username}`)
    res.status(201).json({ username })
  }),
)

// Empreinte factice : un nom inconnu coûte autant de temps qu'un mauvais mot de passe
const DUMMY_HASH = hashPassword('mot-de-passe-factice')

authRouter.post(
  '/login',
  attempts,
  asyncHandler(async (req, res) => {
    const { username, password } = credentials.parse(req.body)
    const user = await prisma.user.findUnique({ where: { username } })
    const valid = await verifyPassword(password, user?.passwordHash ?? (await DUMMY_HASH))
    if (!user?.passwordHash || !valid) throw new AppError(401, 'Identifiant ou mot de passe incorrect')
    writeSessionCookie(req, res, await createSession(user.id))
    res.json({ username: user.username })
  }),
)

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = readSessionCookie(req)
    if (token) await deleteSession(token)
    clearSessionCookie(res)
    res.status(204).end()
  }),
)

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ username: req.username })
})
