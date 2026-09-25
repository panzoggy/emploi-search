import { Router, Request, Response } from 'express'
import { prisma } from '../index.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { paginationSchema } from '../validators/index.js'

const router = Router()

router.get('/logs', asyncHandler(async (req, res) => {
  const params = paginationSchema.parse(req.query)
  
  const [logs, total] = await Promise.all([
    prisma.scrapingLog.findMany({
      orderBy: { startedAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.scrapingLog.count(),
  ])
  
  res.json({
    logs,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  })
}))

router.get('/stats', asyncHandler(async (req, res) => {
  const [bySource, byStatus, recent] = await Promise.all([
    prisma.scrapingLog.groupBy({
      by: ['source'],
      _count: true,
      _sum: { jobsFound: true },
    }),
    prisma.scrapingLog.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.scrapingLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    }),
  ])
  
  res.json({
    bySource: bySource.map(s => ({
      source: s.source,
      runs: s._count,
      totalJobs: s._sum.jobsFound || 0,
    })),
    byStatus: byStatus.map(s => ({
      status: s.status,
      count: s._count,
    })),
    recent,
  })
}))

router.post('/trigger', asyncHandler(async (req, res) => {
  const { query, location, sources } = req.body
  
  if (!query || !location) {
    throw new AppError(400, 'Query and location are required')
  }
  
  const log = await prisma.scrapingLog.create({
    data: {
      source: sources?.[0] || 'INDEED',
      query,
      location,
      status: 'PENDING',
      jobsFound: 0,
    },
  })
  
  res.json({ logId: log.id, message: 'Scraping triggered' })
}))

export default router