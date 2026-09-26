import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { AppError, asyncHandler } from '../shared/errors.js'
import { errorMessage, logger } from '../shared/logger.js'
import { scheduleRescore } from '../matching/index.js'
import { analyzeCv, pdfToText } from './cv-analysis.js'
import { hasCvFile, readCvFile, readProfile, writeCv, writePreferences } from './profile-store.js'

export const profileRouter = Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const list = z.array(z.string().trim().min(1).max(80)).max(40)
const preferencesSchema = z.object({
  targetTitles: list.max(8),
  skills: list,
  locations: list.max(8),
  contractTypes: z.array(z.enum(['CDI', 'CDD', 'Intérim', 'Freelance', 'Stage', 'Alternance'])),
  remote: z.enum(['any', 'hybrid', 'full']),
  salaryMin: z.number().int().min(0).max(500_000).nullable(),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead']).nullable(),
  excludedKeywords: list,
  excludedCompanies: list,
})

const publicProfile = async (userId: string) => {
  const { cvText, ...profile } = await readProfile(userId)
  // hasCvFile faux pour un CV importé avant l'aperçu (seul le texte avait été gardé)
  return { ...profile, hasCv: Boolean(cvText), hasCvFile: await hasCvFile(userId), cvText: cvText ?? null }
}

profileRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await publicProfile(req.userId))
  }),
)

profileRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    await writePreferences(req.userId, preferencesSchema.parse(req.body))
    scheduleRescore(req.userId, 0)
    res.json(await publicProfile(req.userId))
  }),
)

// Le CV est lu, stocké en texte (il nourrit le matching) et renvoie des suggestions à valider
profileRouter.post(
  '/cv',
  upload.single('cv'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError(400, 'Aucun fichier reçu')
    // Le type annoncé par le navigateur ne prouve rien : on vérifie la signature du fichier
    if (!req.file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new AppError(415, 'Le CV doit être un PDF')
    let text: string
    try {
      text = await pdfToText(new Uint8Array(req.file.buffer))
    } catch (error) {
      logger.warn(`Lecture du CV impossible : ${errorMessage(error)}`)
      throw new AppError(422, 'Impossible de lire ce PDF')
    }
    if (text.length < 80) throw new AppError(422, 'Ce PDF ne contient presque pas de texte (CV scanné en image ?)')
    await writeCv(req.userId, { fileName: req.file.originalname, text, file: req.file.buffer })
    scheduleRescore(req.userId, 0)
    res.json({ profile: await publicProfile(req.userId), suggestions: analyzeCv(text) })
  }),
)

profileRouter.delete(
  '/cv',
  asyncHandler(async (req, res) => {
    await writeCv(req.userId, null)
    scheduleRescore(req.userId, 0)
    res.status(204).end()
  }),
)

// Aperçu : le PDF est servi tel quel, affichable dans un cadre de la page profil
profileRouter.get(
  '/cv',
  asyncHandler(async (req, res) => {
    const cv = await readCvFile(req.userId)
    if (!cv) throw new AppError(404, 'Aucun CV enregistré')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(cv.fileName)}`)
    // Le lecteur PDF du navigateur est bloqué par la politique de sécurité par défaut (object-src 'none')
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'")
    res.setHeader('Cache-Control', 'private, no-store')
    res.send(cv.file)
  }),
)
