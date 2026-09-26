import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { prisma } from './shared/db.js'
import { logger } from './shared/logger.js'
import { errorHandler } from './shared/errors.js'
import { clientIp } from './shared/client-ip.js'
import { noStore, sameOriginOnly } from './shared/request-guards.js'
import { authRouter, requireAuth } from './auth/index.js'
import { offersRouter } from './offers/offers.routes.js'
import { profileRouter } from './profile/profile.routes.js'
import { searchesRouter } from './collection/searches.routes.js'

async function health(_req: express.Request, res: express.Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok' })
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' })
  }
}

export function createApp(): express.Express {
  const app = express()
  app.set('trust proxy', 1)
  app.use(helmet())
  // Pas de CORS : l'interface est servie par la même adresse que l'API, aucun autre site ne doit la lire
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: req => req.url === '/api/health' || req.url?.includes('/active') === true },
    }),
  )
  app.use('/api/', noStore, sameOriginOnly)
  app.use(express.json({ limit: '200kb' }))
  // Le suivi des recherches interroge l'API toutes les 2 s : limite large, seulement contre les emballements
  app.use(
    '/api/',
    rateLimit({ windowMs: 60_000, limit: 600, keyGenerator: clientIp, standardHeaders: true, legacyHeaders: false }),
  )

  app.get('/api/health', health)

  app.use('/api/auth', authRouter)
  app.use('/api/offers', requireAuth, offersRouter)
  app.use('/api/searches', requireAuth, searchesRouter)
  app.use('/api/profile', requireAuth, profileRouter)
  app.use(errorHandler)
  return app
}
