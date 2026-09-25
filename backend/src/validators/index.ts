import { z } from 'zod'

export const searchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(200),
  location: z.string().min(1, 'Location is required').max(100),
  contractTypes: z.array(z.string()).optional(),
  remoteOnly: z.boolean().optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead']).optional(),
  sources: z.array(z.enum(['INDEED', 'HELLOWORK', 'LINKEDIN'])).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
})

export const jobActionSchema = z.object({
  jobId: z.string().cuid(),
  action: z.enum(['view', 'reject']),
  reason: z.string().max(500).optional(),
})

export const preferencesSchema = z.object({
  keywords: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  contractTypes: z.array(z.string()).optional(),
  remoteOnly: z.boolean().optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead']).optional(),
})

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})