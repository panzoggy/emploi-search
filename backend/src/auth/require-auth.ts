import type { NextFunction, Request, Response } from 'express'
import { readSessionCookie, writeSessionCookie } from './session-cookie.js'
import { userForSession } from './sessions.js'

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = readSessionCookie(req)
    const user = token ? await userForSession(token) : null
    if (!user) {
      res.status(401).json({ error: 'Connexion requise' })
      return
    }
    if (user.renewed && token) writeSessionCookie(req, res, token)
    req.userId = user.id
    req.username = user.username
    next()
  } catch (error) {
    next(error)
  }
}

declare global {
  namespace Express {
    interface Request {
      userId: string
      username: string
    }
  }
}
