import { Router, Request, Response } from 'express'
import { prisma } from '../index.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { preferencesSchema } from '../validators/index.js'

const router = Router()

router.get('/profile', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
      _count: {
        select: { searches: true, jobViews: true, jobRejections: true },
      },
    },
  })
  
  if (!user) throw new AppError(404, 'User not found')
  
  res.json(user)
}))

router.get('/preferences', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  
  let preferences = await prisma.userPreferences.findUnique({ where: { userId } })
  
  if (!preferences) {
    preferences = await prisma.userPreferences.create({
      data: { userId },
    })
  }
  
  res.json(preferences)
}))

router.put('/preferences', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const data = preferencesSchema.parse(req.body)
  
  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
  
  res.json(preferences)
}))

router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  
  const [totalViews, totalRejections, viewsThisWeek, rejectionsThisWeek, topCompanies, topLocations] = await Promise.all([
    prisma.jobView.count({ where: { userId } }),
    prisma.jobRejection.count({ where: { userId } }),
    prisma.jobView.count({
      where: {
        userId,
        viewedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.jobRejection.count({
      where: {
        userId,
        rejectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.jobView.groupBy({
      by: ['jobId'],
      where: { userId },
      _count: true,
      orderBy: { _count: { jobId: 'desc' } },
      take: 10,
    }),
    prisma.jobView.groupBy({
      by: ['jobId'],
      where: { userId },
      _count: true,
      orderBy: { _count: { jobId: 'desc' } },
      take: 10,
    }),
  ])
  
  const companyStats = await prisma.job.findMany({
    where: { id: { in: topCompanies.map(c => c.jobId) } },
    select: { company: true },
  })
  
  const locationStats = await prisma.job.findMany({
    where: { id: { in: topLocations.map(l => l.jobId) } },
    select: { location: true },
  })
  
  res.json({
    totalViews,
    totalRejections,
    viewsThisWeek,
    rejectionsThisWeek,
    topCompanies: companyStats.reduce((acc, job) => {
      acc[job.company] = (acc[job.company] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    topLocations: locationStats.reduce((acc, job) => {
      acc[job.location] = (acc[job.location] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  })
}))

export default router