import { Router } from 'express'
import { prisma } from '../index.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { searchSchema, paginationSchema } from '../validators/index.js'
import { scrapeAllSources } from '../services/scraper.js'

const router = Router()

router.post('/', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const params = searchSchema.parse(req.body)
  
  const search = await prisma.search.create({
    data: {
      userId,
      query: params.query,
      location: params.location,
      filters: {
        contractTypes: params.contractTypes,
        remoteOnly: params.remoteOnly,
        salaryMin: params.salaryMin,
        salaryMax: params.salaryMax,
        experienceLevel: params.experienceLevel,
        sources: params.sources,
      },
    },
  })
  
  const scrapingOptions = {
    contractTypes: params.contractTypes,
    remoteOnly: params.remoteOnly,
    salaryMin: params.salaryMin,
    salaryMax: params.salaryMax,
    experienceLevel: params.experienceLevel,
    sources: params.sources,
    maxPages: 3,
  }
  
  const results = await scrapeAllSources(params.query, params.location, scrapingOptions)
  
  let totalJobs = 0
  for (const result of results) {
    if (result.jobs.length > 0) {
      const saved = await prisma.job.createMany({
        data: result.jobs.map(job => ({
          ...job,
          searchId: search.id,
        })),
        skipDuplicates: true,
      })
      totalJobs += saved.count
      
      await prisma.scrapingLog.create({
        data: {
          source: result.source,
          query: params.query,
          location: params.location,
          status: 'COMPLETED',
          jobsFound: result.jobs.length,
        },
      })
    } else if (result.error) {
      await prisma.scrapingLog.create({
        data: {
          source: result.source,
          query: params.query,
          location: params.location,
          status: 'FAILED',
          jobsFound: 0,
          error: result.error,
        },
      })
    }
  }
  
  const jobs = await prisma.job.findMany({
    where: { searchId: search.id },
    orderBy: { postedAt: 'desc' },
    take: params.limit,
    include: {
      views: { where: { userId }, select: { viewedAt: true } },
      rejections: { where: { userId }, select: { rejectedAt: true, reason: true } },
    },
  })
  
  res.json({
    search: { ...search, totalJobs },
    jobs: jobs.map(job => ({
      ...job,
      viewed: job.views.length > 0,
      viewedAt: job.views[0]?.viewedAt,
      rejected: job.rejections.length > 0,
      rejectedAt: job.rejections[0]?.rejectedAt,
      rejectionReason: job.rejections[0]?.reason,
    })),
  })
}))

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
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  })
}))

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

router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  await prisma.search.deleteMany({
    where: { id: req.params.id, userId },
  })
  res.json({ success: true })
}))

export default router