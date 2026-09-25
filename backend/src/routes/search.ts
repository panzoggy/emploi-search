import { Router } from 'express'
import { prisma } from '../index.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { searchSchema, paginationSchema } from '../validators/index.js'
import { scrapeAllSources } from '../services/scraper.js'

const router = Router()

// Store ongoing scraping tasks (in-memory, resets on restart — fine for personal use)
const runningSearches = new Map<string, { status: 'running' | 'done' | 'error'; error?: string }>()

// POST /api/search — launch search, return immediately
router.post('/', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const params = searchSchema.parse(req.body)
  console.log('[SEARCH] Starting search:', { userId, query: params.query, location: params.location })

  // Create the search record
  const search = await prisma.search.create({
    data: {
      userId,
      query: params.query,
      location: params.location,
      filters: JSON.stringify({
        contractTypes: params.contractTypes,
        remoteOnly: params.remoteOnly,
        salaryMin: params.salaryMin,
        salaryMax: params.salaryMax,
        experienceLevel: params.experienceLevel,
        sources: params.sources,
      }),
    },
  })

  // Mark as running
  runningSearches.set(search.id, { status: 'running' })

  // Launch scraping in background (don't await)
  const scrapingOptions = {
    contractTypes: params.contractTypes,
    remoteOnly: params.remoteOnly,
    salaryMin: params.salaryMin,
    salaryMax: params.salaryMax,
    experienceLevel: params.experienceLevel,
    sources: params.sources,
    maxPages: 3,
  }

  scrapeAllSources(params.query, params.location, scrapingOptions)
    .then(async (results) => {
      console.log('[SEARCH] Scraping done:', results.map(r => ({ source: r.source, count: r.jobs.length, error: r.error })))
      let totalSaved = 0

      for (const result of results) {
        const logData = {
          source: result.source,
          query: params.query,
          location: params.location,
          jobsFound: result.jobs.length,
          finishedAt: new Date(),
        }

        if (result.jobs.length > 0) {
          // Save jobs, skip duplicates on url or externalId+source
          for (const job of result.jobs) {
            try {
              await prisma.job.upsert({
                where: { externalId_source: { externalId: job.externalId, source: job.source } },
                update: { searchId: search.id, title: job.title, company: job.company, location: job.location, description: job.description, url: job.url, salaryMin: job.salaryMin, salaryMax: job.salaryMax, contractType: job.contractType, remoteType: job.remoteType, postedAt: job.postedAt },
                create: { ...job, searchId: search.id },
              })
              totalSaved++
            } catch (e) {
              // url unique constraint — job already exists with different externalId, skip
            }
          }
          await prisma.scrapingLog.create({ data: { ...logData, status: 'COMPLETED' } })
        } else if (result.error) {
          await prisma.scrapingLog.create({ data: { ...logData, status: 'FAILED', error: result.error } })
        } else {
          await prisma.scrapingLog.create({ data: { ...logData, status: 'COMPLETED' } })
        }
      }

      console.log(`[SEARCH] Saved ${totalSaved} jobs for search ${search.id}`)
      runningSearches.set(search.id, { status: 'done' })
      // Clean up after 10 minutes
      setTimeout(() => runningSearches.delete(search.id), 10 * 60 * 1000)
    })
    .catch((err) => {
      console.error('[SEARCH] Scraping failed:', err)
      runningSearches.set(search.id, { status: 'error', error: err.message })
    })

  // Respond immediately with searchId
  res.json({
    search: { ...search, totalJobs: 0, status: 'running' },
    message: 'Recherche lancée en arrière-plan',
  })
}))

// GET /api/search/:id/status — poll scraping status
router.get('/:id/status', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const search = await prisma.search.findFirst({ where: { id: req.params.id, userId } })
  if (!search) throw new AppError(404, 'Search not found')

  const task = runningSearches.get(search.id)
  const jobCount = await prisma.job.count({ where: { searchId: search.id } })

  res.json({
    searchId: search.id,
    status: task?.status || 'done',
    error: task?.error,
    jobsFound: jobCount,
  })
}))

// GET /api/search/history
router.get('/history', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const params = paginationSchema.parse(req.query)

  const [searches, total] = await Promise.all([
    prisma.search.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: {
        _count: { select: { results: true } },
        results: {
          take: 5,
          orderBy: { postedAt: 'desc' },
          include: {
            views: { where: { userId }, select: { viewedAt: true } },
            rejections: { where: { userId }, select: { rejectedAt: true } },
          },
        },
      },
    }),
    prisma.search.count({ where: { userId } }),
  ])

  res.json({
    searches: searches.map(s => ({
      ...s,
      results: s.results.map(job => ({
        ...job,
        viewed: job.views.length > 0,
        rejected: job.rejections.length > 0,
      })),
    })),
    pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) },
  })
}))

// GET /api/search/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const search = await prisma.search.findFirst({
    where: { id: req.params.id, userId },
    include: {
      results: {
        orderBy: { postedAt: 'desc' },
        include: {
          views: { where: { userId }, select: { viewedAt: true } },
          rejections: { where: { userId }, select: { rejectedAt: true, reason: true } },
        },
      },
    },
  })

  if (!search) throw new AppError(404, 'Search not found')

  res.json({
    ...search,
    results: search.results.map(job => ({
      ...job,
      viewed: job.views.length > 0,
      viewedAt: job.views[0]?.viewedAt,
      rejected: job.rejections.length > 0,
      rejectedAt: job.rejections[0]?.rejectedAt,
      rejectionReason: job.rejections[0]?.reason,
    })),
  })
}))

// DELETE /api/search/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  await prisma.search.deleteMany({ where: { id: req.params.id, userId } })
  res.json({ success: true })
}))

export default router
