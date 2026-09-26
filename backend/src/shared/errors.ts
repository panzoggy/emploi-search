import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logger } from './logger.js'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

export const asyncHandler = (fn: AsyncRoute) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next)
}

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res
      .status(400)
      .json({ error: 'Données invalides', details: err.errors.map(e => `${e.path.join('.')} : ${e.message}`) })
    return
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    res.status(404).json({ error: 'Élément introuvable' })
    return
  }
  logger.error({ err, path: req.path }, 'Erreur non gérée')
  res.status(500).json({ error: 'Erreur interne du serveur' })
}
