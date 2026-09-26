import { Router } from 'express'
import { z } from 'zod'
import { AppError, asyncHandler } from '../shared/errors.js'
import { scheduleRescore } from '../matching/index.js'
import { feedFiltersSchema } from './feed-filters.js'
import { clearStatus, countByView, getOffer, listFeed, setStatus, STATUSES, VIEWS } from './offers.service.js'

export const offersRouter = Router()

const feedSchema = z
  .object({
    view: z.enum(VIEWS).default('new'),
    sort: z.enum(['score', 'date']).default('score'),
    // Décalage plutôt que numéro de page : trier une offre ne doit pas décaler les suivantes
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  })
  .merge(feedFiltersSchema)

const statusSchema = z.object({ status: z.enum(STATUSES), reason: z.string().trim().max(300).optional() })

offersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await listFeed(req.userId, feedSchema.parse(req.query)))
  }),
)

offersRouter.get(
  '/counts',
  asyncHandler(async (req, res) => {
    res.json(await countByView(req.userId))
  }),
)

offersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const offer = await getOffer(req.userId, req.params.id)
    if (!offer) throw new AppError(404, 'Offre introuvable')
    res.json(offer)
  }),
)

offersRouter.put(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status, reason } = statusSchema.parse(req.body)
    if (!(await setStatus(req.userId, req.params.id, status, reason))) throw new AppError(404, 'Offre introuvable')
    // Favoris, intérêts et rejets nourrissent l'apprentissage du score
    if (status !== 'SEEN') scheduleRescore(req.userId)
    res.status(204).end()
  }),
)

offersRouter.delete(
  '/:id/status',
  asyncHandler(async (req, res) => {
    await clearStatus(req.userId, req.params.id)
    scheduleRescore(req.userId)
    res.status(204).end()
  }),
)
