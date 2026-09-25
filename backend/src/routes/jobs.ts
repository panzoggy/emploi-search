import { Router } from 'express'
import { prisma } from '../index.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { jobActionSchema, paginationSchema } from '../validators/index.js'
import { z } from 'zod'

const router = Router()

const filterSchema = paginationSchema.extend({
  source: z.enum(['INDEED', 'HELLOWORK', 'LINKEDIN']).optional(),
  viewed: z.enum(['all', 'viewed', 'unviewed']).default('unviewed'),
  rejected: z.enum(['all', 'rejected', 'not_rejected']).default('not_rejected'),
  searchId: z.string().cuid().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['postedAt', 'scrapedAt', 'title', 'company']).default('postedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const params = filterSchema.parse(req.query)
  
  const where: any = {}
  
  if (params.source) where.source = params.source
  if (params.company) where.company = { contains: params.company, mode: 'insensitive' }
  if (params.location) where.location = { contains: params.location, mode: 'insensitive' }
  if (params.searchId) where.searchId = params.searchId
  
  if (params.dateFrom || params.dateTo) {
    where.postedAt = {}
    if (params.dateFrom) where.postedAt.gte = new Date(params.dateFrom)
    if (params.dateTo) where.postedAt.lte = new Date(params.dateTo)
  }
  
  if (params.viewed === 'viewed') {
    where.views = { some: { userId } }
  } else if (params.viewed === 'unviewed') {
    where.views = { none: { userId } }
  }
  
  if (params.rejected === 'rejected') {
    where.rejections = { some: { userId } }
  } else if (params.rejected === 'not_rejected') {
    where.rejections = { none: { userId } }
  }
  
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { [params.sortBy]: params.sortOrder },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: {
        views: { where: { userId }, select: { viewedAt: true } },
        rejections: { where: { userId }, select: { rejectedAt: true, reason: true } },
        search: { select: { id: true, query: true, location: true } },
      },
    }),
    prisma.job.count({ where }),
  ])
  
  res.json({
    jobs: jobs.map(job => ({
      ...job,
      viewed: job.views.length > 0,
      viewedAt: job.views[0]?.viewedAt,
      rejected: job.rejections.length > 0,
      rejectedAt: job.rejections[0]?.rejectedAt,
      rejectionReason: job.rejections[0]?.reason,
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  })
}))

router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  
  const [total, viewed, rejected, unviewed, newToday] = await Promise.all([
    prisma.job.count(),
    prisma.jobView.count({ where: { userId } }),
    prisma.jobRejection.count({ where: { userId } }),
    prisma.job.count({
      where: { views: { none: { userId } }, rejections: { none: { userId } } }
    }),
    prisma.job.count({
      where: {
        scrapedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        views: { none: { userId } },
        rejections: { none: { userId } },
      },
    }),
  ])
  
  const bySource = await prisma.job.groupBy({
    by: ['source'],
    _count: true,
  })
  
  res.json({
    total,
    viewed,
    rejected,
    unviewed,
    newToday,
    bySource: bySource.map(s => ({ source: s.source, count: s._count })),
  })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      views: { where: { userId } },
      rejections: { where: { userId } },
      search: true,
    },
  })
  
  if (!job) throw new AppError(404, 'Job not found')
  
  res.json({
    ...job,
    viewed: job.views.length > 0,
    viewedAt: job.views[0]?.viewedAt,
    rejected: job.rejections.length > 0,
    rejectedAt: job.rejections[0]?.rejectedAt,
    rejectionReason: job.rejections[0]?.reason,
  })
}))

router.post('/action', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const { jobId, action, reason } = jobActionSchema.parse(req.body)
  
  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) throw new AppError(404, 'Job not found')
  
  if (action === 'view') {
    await prisma.jobView.upsert({
      where: { userId_jobId: { userId, jobId } },
      create: { userId, jobId },
      update: { viewedAt: new Date() },
    })
  } else if (action === 'reject') {
    await prisma.jobRejection.upsert({
      where: { userId_jobId: { userId, jobId } },
      create: { userId, jobId, reason },
      update: { reason, rejectedAt: new Date() },
    })
  }
  
  res.json({ success: true })
}))

router.delete('/:id/reject', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  await prisma.jobRejection.delete({
    where: { userId_jobId: { userId, jobId: req.params.id } },
  })
  res.json({ success: true })
}))

export default router