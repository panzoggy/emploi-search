import { Router } from 'express'
import { z } from 'zod'
import type { Search } from '@prisma/client'
import { prisma } from '../shared/db.js'
import { AppError, asyncHandler } from '../shared/errors.js'
import { readProfile } from '../profile/index.js'
import { isRemoteWish } from '../matching/locations.js'
import { enqueueSearch } from './search-runner.js'

export const searchesRouter = Router()

const launchSchema = z.union([
  z.object({ query: z.string().trim().min(2).max(120), location: z.string().trim().min(2).max(80) }),
  z.object({ fromProfile: z.literal(true) }),
])

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

const toDto = (search: Search) => ({ ...search, progress: JSON.parse(search.progress) as unknown, userId: undefined })

// "Pour mon profil" : chaque métier visé × chaque lieu souhaité (plafonné pour rester raisonnable)
async function profileQueries(userId: string): Promise<{ query: string; location: string }[]> {
  const profile = await readProfile(userId)
  if (profile.targetTitles.length === 0) throw new AppError(400, 'Indique au moins un métier visé dans ton profil')
  const places = profile.locations.filter(p => !isRemoteWish(p)).slice(0, 2)
  return profile.targetTitles
    .slice(0, 3)
    .flatMap(query => (places.length ? places : ['France']).map(location => ({ query, location })))
}

searchesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = launchSchema.parse(req.body)
    const queries = 'fromProfile' in body ? await profileQueries(req.userId) : [body]
    const ids: string[] = []
    for (const q of queries) ids.push(await enqueueSearch(req.userId, q.query, q.location))
    res.status(202).json({ searchIds: ids })
  }),
)

searchesRouter.get(
  '/active',
  asyncHandler(async (req, res) => {
    const searches = await prisma.search.findMany({
      where: { userId: req.userId, status: { in: ['queued', 'running'] } },
      orderBy: { createdAt: 'asc' },
    })
    res.json(searches.map(toDto))
  }),
)

searchesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit } = pageSchema.parse(req.query)
    const [searches, total] = await Promise.all([
      prisma.search.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.search.count({ where: { userId: req.userId } }),
    ])
    res.json({ searches: searches.map(toDto), total, page, limit })
  }),
)

searchesRouter.post(
  '/:id/rerun',
  asyncHandler(async (req, res) => {
    const search = await prisma.search.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!search) throw new AppError(404, 'Recherche introuvable')
    res.status(202).json({ searchIds: [await enqueueSearch(req.userId, search.query, search.location)] })
  }),
)

searchesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { count } = await prisma.search.deleteMany({
      where: { id: req.params.id, userId: req.userId, status: { notIn: ['running'] } },
    })
    if (count === 0) throw new AppError(409, 'Recherche introuvable ou en cours')
    res.status(204).end()
  }),
)
